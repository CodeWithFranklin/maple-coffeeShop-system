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

  const { phone, country, state, name, email } = data;
  const { uid, token } = context.auth;

  if (!phone || !country || !state) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Phone, country, and state are required."
    );
  }

  try {
    const userRef = db.collection("users").doc(uid);
    const snapshot = await userRef.get();

    if (!snapshot.exists) {
      await userRef.set(
        buildBaseUserDoc({
          uid,
          email: email || token.email,
          name: name || token.name,
          authMethod: "google",
          providers: ["google.com"],
        }),
        { merge: true }
      );
    }

    await userRef.set({ phone, country, state }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error("Error in completeUserProfile:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to update profile."
    );
  }
});
