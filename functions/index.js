const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const functions = require("firebase-functions");

initializeApp();
const db = getFirestore();

// This runs automatically IN THE BACKGROUND when a user signs up
exports.createUserDocument = functions.auth.user().onCreate(async (user) => {
  try {
    const userRef = db.collection("users").doc(user.uid);

    // Map through the array safely to see what providers are attached
    const providers = user.providerData ?
      user.providerData.map((p) => p.providerId) :
      [];

    const mainProvider = providers.includes("google.com") ?
      "google" :
      "password";

    await userRef.set({
      uid: user.uid,
      email: user.email,
      name: user.displayName || "New User",
      role: 0, // 0 = standard user, 1 = admin
      createdAt: new Date().toISOString(),
      authMethod: mainProvider,
      allProviders: providers, // Storing the array for future debugging
    });

    console.log(`User document created for ${user.email} via ${mainProvider}`);
  } catch (error) {
    console.error("Error creating user document:", error);
  }
});
