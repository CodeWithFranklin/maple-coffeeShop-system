const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const functions = require("firebase-functions/v1");

initializeApp();
const db = getFirestore();

const normalizeProvider = (providerId) => {
  switch (providerId) {
    case "google.com": return "google";
    case "password": return "email and password";
    default: return providerId;
  }
};

const getAuthMethod = (providers) => {
  if (providers.includes("google.com")) return "google";
  return "email and password";
};

const buildBaseUserDoc = ({ uid, email, name, photoURL, authMethod, providers }) => ({
  uid,
  email,
  name: name || "New User",
  photoURL: photoURL || null,
  role: 0,
  createdAt: FieldValue.serverTimestamp(),
  authMethod,
  allProviders: providers.map(normalizeProvider),
});

const validateProfileFields = ({ phone, country, state, name }, functions) => {
  const isProfileUpdate = phone || country || state || name;

  if (isProfileUpdate) {
    if (!phone || !country || !state || !name) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "All profile fields are required."
      );
    }
    if (!/^\+?[0-9\s\-()]{10,15}$/.test(phone)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid phone number."
      );
    }
  }
};


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
          photoURL: user.photoURL,
          authMethod,
          providers,
        }),
        { merge: true }
      );
  } catch (error) {
    console.error("Error in createUserDocument:", error);
  }
});


exports.syncUserProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in."
    );
  }

  const { phone, country, state, photoURL } = data;
  const { uid, token } = context.auth;
  const name = data.name || token.name || "New User";
  const email = token.email;

  validateProfileFields({ phone, country, state, name: data.name }, functions);

  try {
    const userRef = db.collection("users").doc(uid);
    const snapshot = await userRef.get();

    let finalData = {
      ...(data.name && { name }),
      ...(phone && { phone }),
      ...(country && { country }),
      ...(state && { state }),
      ...(photoURL && { photoURL }),
    };

    if (!snapshot.exists) {
      const baseDoc = buildBaseUserDoc({
        uid,
        email,
        name,
        photoURL,
        authMethod: "google",
        providers: ["google.com"],
      });
      finalData = { ...baseDoc, ...finalData };
    }

    await userRef.set(finalData, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error in syncUserProfile:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to sync profile data."
    );
  }
});