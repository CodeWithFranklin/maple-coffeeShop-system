const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const functions = require("firebase-functions/v1");

initializeApp();
const db = getFirestore();

const normalizeProvider = (providerId) => {
  switch (providerId) {
    case "google.com":
      return "google";
    case "password":
      return "email and password";
    default:
      return providerId;
  }
};

const getAuthMethod = (providers) => {
  if (providers.includes("google.com")) return "google";
  return "email and password";
};

const buildBaseUserDoc = ({ uid, email, name, authMethod, providers }) => ({
  uid,
  email,
  name: name || "New User",
  role: 0,
  createdAt: FieldValue.serverTimestamp(),
  authMethod,
  allProviders: providers.map(normalizeProvider),
});

exports.createUserDocument = functions.auth.user().onCreate(async (user) => {
  try {
    const providers = user.providerData?.map((p) => p.providerId) ?? [];
    const authMethod = getAuthMethod(providers);

    await db
      .collection("users")
      .doc(user.uid)
      .set(
        buildBaseUserDoc({
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          authMethod,
          providers,
        }),
        { merge: true }
      );
  } catch (error) {
    console.error("Error in createUserDocument:", error);
  }
});

exports.completeUserProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in."
    );
  }
  const phone = data.phone;
  const country = data.country;
  const state = data.state;

  const { uid, token } = context.auth;
  const name = data.name || token.name || "New User";
  const email = token.email;

  if (!phone || !country || !state) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields (phone, country, or state)."
    );
  }

if (!/^\+?[0-9\s\-()]{7,15}$/.test(phone)) {
  throw new functions.https.HttpsError(
    "invalid-argument",
    "Invalid phone number."
  );
}

  try {
    const userRef = db.collection("users").doc(uid);
    const snapshot = await userRef.get();

    let finalData = { name, phone, country, state };   

    if (!snapshot.exists) {
      const baseDoc = buildBaseUserDoc({
        uid,
        email,
        name,
        authMethod: "google",
        providers: ["google.com"],
      });

      finalData = { ...baseDoc, ...finalData };
    }

    await userRef.set(finalData, { merge: true });

    return { success: true };
  } catch (error) {
    console.error("Error in completeUserProfile:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to sync profile data to the database."
    );
  }
});
