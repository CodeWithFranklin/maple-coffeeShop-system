const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const functions = require("firebase-functions/v1");
const https = require("https");
const crypto = require("crypto");

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

const getAuthMethod = (providers = []) => {
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
  contactEmail: email || "",
  useAuthEmailAsContact: true,
});

const getExtensionFromContentType = (contentType = "") => {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
};

const downloadImageBuffer = (sourceUrl, redirectCount = 0) => {
  return new Promise((resolve, reject) => {
    if (!sourceUrl) {
      reject(new Error("No source URL provided."));
      return;
    }

    if (redirectCount > 5) {
      reject(new Error("Too many redirects while downloading image."));
      return;
    }

    const request = https.get(sourceUrl, (response) => {
      const statusCode = response.statusCode || 0;

      if (
        [301, 302, 303, 307, 308].includes(statusCode) &&
        response.headers.location
      ) {
        response.resume();

        const nextUrl = new URL(
          response.headers.location,
          sourceUrl
        ).toString();

        downloadImageBuffer(nextUrl, redirectCount + 1)
          .then(resolve)
          .catch(reject);

        return;
      }

      if (statusCode !== 200) {
        response.resume();
        reject(new Error(`Failed to download image. HTTP ${statusCode}`));
        return;
      }

      const contentType = response.headers["content-type"] || "image/jpeg";
      const chunks = [];

      response.on("data", (chunk) => {
        chunks.push(chunk);
      });

      response.on("end", () => {
        resolve({
          buffer: Buffer.concat(chunks),
          contentType,
        });
      });
    });

    request.setTimeout(15000, () => {
      request.destroy(new Error("Image download timed out."));
    });

    request.on("error", reject);
  });
};

const reHostGooglePhoto = async (sourceUrl, uid) => {
  try {
    if (!sourceUrl || !uid) return null;

    const bucket = getStorage().bucket();

    const { buffer, contentType } = await downloadImageBuffer(sourceUrl);
    const extension = getExtensionFromContentType(contentType);
    const destPath = `profileImages/${uid}/google-profile.${extension}`;
    const file = bucket.file(destPath);

    const downloadToken =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : crypto.randomBytes(32).toString("hex");

    await file.save(buffer, {
      resumable: false,
      metadata: {
        contentType,
        cacheControl: "public, max-age=31536000",
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    return `https://firebasestorage.googleapis.com/v0/b/${
      bucket.name
    }/o/${encodeURIComponent(destPath)}?alt=media&token=${downloadToken}`;
  } catch (error) {
    console.error("Failed to re-host Google photo:", error);
    return null;
  }
};

exports.createUserDocument = functions.auth.user().onCreate(async (user) => {
  try {
    const providers =
      user.providerData?.map((provider) => provider.providerId) ?? [];
    const authMethod = getAuthMethod(providers);
    const isGoogleUser = providers.includes("google.com");

    let photoURL = null;

    if (isGoogleUser && user.photoURL) {
      photoURL = await reHostGooglePhoto(user.photoURL, user.uid);
    }

    await db
      .collection("users")
      .doc(user.uid)
      .set(
        buildBaseUserDoc({
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photoURL,
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

    let safePhotoURL;

    if (
      photoURL !== undefined &&
      photoURL !== null &&
      !photoURL.includes("googleusercontent.com")
    ) {
      safePhotoURL = photoURL;
    }

    let finalData = {
      ...(data.name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(country !== undefined && { country }),
      ...(state !== undefined && { state }),
      ...(safePhotoURL !== undefined && { photoURL: safePhotoURL }),
      contactEmail: finalContactEmail,
      useAuthEmailAsContact: shouldUseAuthEmailAsContact,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!snapshot.exists) {
      const baseDoc = buildBaseUserDoc({
        uid,
        email,
        name,
        photoURL: null,
        authMethod: getAuthMethod(providers),
        providers,
      });

      finalData = {
        ...baseDoc,
        ...finalData,
      };
    }

    await userRef.set(finalData, { merge: true });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error in syncUserProfile:", error);

    throw new functions.https.HttpsError(
      "internal",
      "Failed to sync profile data."
    );
  }
});
