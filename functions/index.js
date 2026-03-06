const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
// Explicitly use the v1 SDK to match your existing code style
const functions = require("firebase-functions/v1");

initializeApp();
const db = getFirestore();

exports.createUserDocument = functions.auth.user().onCreate(async (user) => {
  try {
    const userRef = db.collection("users").doc(user.uid);

    const providers = user.providerData
      ? user.providerData.map((p) => p.providerId)
      : [];

    const mainProvider = providers.includes("google.com")
      ? "google"
      : "password";

    await userRef.set({
      uid: user.uid,
      email: user.email,
      name: user.displayName || "New User",
      role: 0,
      createdAt: new Date().toISOString(),
      authMethod: mainProvider,
      allProviders: providers,
    });

    console.log(`Successfully created Firestore doc for: ${user.email}`);
  } catch (error) {
    console.error("Error in createUserDocument:", error);
  }
});
