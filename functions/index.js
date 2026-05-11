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

const buildBaseUserDoc = ({
  uid,
  email,
  name,
  photoURL,
  authMethod,
  providers,
}) => ({
  uid,
  email: email || "",
  name: name || "New User",
  photoURL: photoURL || null,
  role: 0,
  createdAt: FieldValue.serverTimestamp(),
  authMethod,
  allProviders: providers.map(normalizeProvider),

  // Contact email defaults
  contactEmail: email || "",
  useAuthEmailAsContact: true,
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

  const {
    phone,
    country,
    state,
    photoURL,
    contactEmail,
    useAuthEmailAsContact,
  } = data;

  const { uid, token } = context.auth;

  const name = data.name || token.name || "New User";
  const email = token.email || "";

  const provider = token.firebase?.sign_in_provider || "unknown";

  const providers = token.firebase?.identities
    ? Object.keys(token.firebase.identities)
    : [provider];

  if (phone && !/^\+?[0-9\s\-()]{10,15}$/.test(phone)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid phone number."
    );
  }

  // Default to auth email unless the frontend explicitly says false
  const shouldUseAuthEmailAsContact = useAuthEmailAsContact !== false;

  let finalContactEmail;

  if (shouldUseAuthEmailAsContact) {
    finalContactEmail = email;
  } else {
    if (!contactEmail) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Contact email is required."
      );
    }

    finalContactEmail = contactEmail;
  }

  try {
    const userRef = db.collection("users").doc(uid);
    const snapshot = await userRef.get();

    let finalData = {
      ...(data.name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(country !== undefined && { country }),
      ...(state !== undefined && { state }),
      ...(photoURL !== undefined && { photoURL }),

      contactEmail: finalContactEmail,
      useAuthEmailAsContact: shouldUseAuthEmailAsContact,

      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!snapshot.exists) {
      const baseDoc = buildBaseUserDoc({
        uid,
        email,
        name,
        photoURL,
        authMethod: getAuthMethod(providers),
        providers,
      });

      finalData = {
        ...baseDoc,
        ...finalData,
      };
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
