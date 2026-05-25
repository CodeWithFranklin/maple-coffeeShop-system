/* eslint-env node */
/* global process, Buffer */

const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const { getAuth } = require("firebase-admin/auth");
const functions = require("firebase-functions/v1");
const https = require("https");
const http = require("http");
const crypto = require("crypto");

initializeApp();

const db = getFirestore();

// ─── Environment Helpers ──────────────────────────────────────────────────────
const getEnv = (key, fallback = null) => {
  const value = process.env[key];

  if (!value && fallback === null) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value || fallback;
};

const getPaystackSecretKey = () => getEnv("PAYSTACK_SECRET_KEY");
const getFrontendUrl = () => getEnv("FRONTEND_URL", "http://localhost:5173");

// ─── Core Utilities ───────────────────────────────────────────────────────────
const toMinorUnit = (amount) => {
  return Math.round(Number(amount || 0) * 100);
};

const generatePaymentReference = (orderId) => {
  return `MAPLE_${orderId}_${Date.now()}`;
};

const getDeliveryFee = ({ store, delivery }) => {
  if (!delivery?.city) return 0;

  const cityFee = store?.delivery?.fees?.byCity?.[delivery.city];
  const defaultFee = store?.delivery?.fees?.default;

  return Number(cityFee ?? defaultFee ?? 0);
};

const getCheckoutFingerprint = ({
  uid,
  storeId,
  orderType,
  paymentMethod,
  discountCode,
  items,
  contact,
  pickup,
  delivery,
}) => {
  const normalizedItems = [...items]
    .map((item) => ({
      productId: String(item.productId),
      quantity: Number(item.quantity || 0),
    }))
    .sort((a, b) => a.productId.localeCompare(b.productId));

  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        uid: String(uid),
        storeId: String(storeId),
        orderType,
        paymentMethod,
        discountCode: discountCode || null,
        contact: {
          email: contact?.email || "",
          phone: contact?.phone || "",
        },
        pickup:
          orderType === "pickup"
            ? {
                pickupType: pickup?.pickupType || "asap",
                scheduledTime: pickup?.scheduledTime || null,
              }
            : null,
        delivery:
          orderType === "delivery"
            ? {
                address: delivery?.address || "",
                country: delivery?.country || "",
                state: delivery?.state || "",
                city: delivery?.city || "",
                landmark: delivery?.landmark || "",
              }
            : null,
        items: normalizedItems,
      })
    )
    .digest("hex");
};

// ─── Paystack API Wrapper ─────────────────────────────────────────────────────
const callPaystack = ({ endpoint, method = "POST", body }) => {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: "api.paystack.co",
      path: endpoint,
      method,
      headers: {
        Authorization: `Bearer ${getPaystackSecretKey()}`,
        "Content-Type": "application/json",
        ...(payload && { "Content-Length": Buffer.byteLength(payload) }),
      },
    };

    const req = https.request(options, (res) => {
      let responseBody = "";

      res.on("data", (chunk) => {
        responseBody += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(responseBody);

          if (!parsed.status || res.statusCode >= 400) {
            reject(
              new Error(
                parsed.message ||
                  `Paystack request failed with HTTP ${res.statusCode}`
              )
            );
            return;
          }

          resolve(parsed.data);
        } catch (error) {
          reject(
            new Error(
              `Failed to parse Paystack response. HTTP ${res.statusCode}`
            )
          );
        }
      });
    });

    req.on("error", reject);

    req.setTimeout(15000, () => {
      req.destroy(new Error("Paystack request timed out."));
    });

    if (payload) req.write(payload);

    req.end();
  });
};

// ─── Image Hosting Utilities ──────────────────────────────────────────────────
const getExtensionFromContentType = (contentType = "") => {
  const lowerType = String(contentType).toLowerCase();

  if (lowerType.includes("png")) return "png";
  if (lowerType.includes("webp")) return "webp";
  if (lowerType.includes("gif")) return "gif";

  return "jpg";
};

const downloadImageBuffer = (sourceUrl, redirectCount = 0) => {
  return new Promise((resolve, reject) => {
    if (!sourceUrl) {
      reject(new Error("No source URL provided."));
      return;
    }

    if (redirectCount > 5) {
      reject(new Error("Too many redirects."));
      return;
    }

    const client = sourceUrl.toLowerCase().startsWith("https") ? https : http;

    const req = client.get(sourceUrl, (response) => {
      const { statusCode } = response;

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

      const contentLength = parseInt(
        response.headers["content-length"] || "0",
        10
      );

      if (contentLength > 10 * 1024 * 1024) {
        response.resume();
        reject(new Error("Image size exceeds maximum allowed limit."));
        return;
      }

      const contentType = response.headers["content-type"] || "image/jpeg";
      const chunks = [];
      let totalDownloadedBytes = 0;

      response.on("data", (chunk) => {
        totalDownloadedBytes += chunk.length;

        if (totalDownloadedBytes > 10 * 1024 * 1024) {
          req.destroy(
            new Error("Stream terminated: image payload size limit exceeded.")
          );
          return;
        }

        chunks.push(chunk);
      });

      response.on("end", () => {
        resolve({
          buffer: Buffer.concat(chunks),
          contentType,
        });
      });

      response.on("error", reject);
    });

    req.on("error", reject);

    req.setTimeout(15000, () => {
      req.destroy(new Error("Image download timed out."));
    });
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
    console.error("Failed to re-host Google photo:", error.message);
    return null;
  }
};

// ─── Identity Formatting ──────────────────────────────────────────────────────
const normalizeProvider = (providerId) => {
  if (providerId === "google.com") return "google";
  if (providerId === "password") return "email and password";

  return String(providerId);
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

// ─── Order Fulfillment Engine ─────────────────────────────────────────────────
const confirmPaidOrder = async ({
  reference,
  amount,
  currency,
  channel = null,
  gatewayResponse = null,
}) => {
  const ordersSnapshot = await db
    .collection("orders")
    .where("payment.reference", "==", reference)
    .limit(1)
    .get();

  if (ordersSnapshot.empty) {
    throw new Error(`No order found for reference ${reference}`);
  }

  const orderDoc = ordersSnapshot.docs[0];
  const orderRef = orderDoc.ref;

  let finalStatus = "success";

  await db.runTransaction(async (transaction) => {
    const orderSnap = await transaction.get(orderRef);

    if (!orderSnap.exists) {
      throw new Error("Order not found during transaction.");
    }

    const order = orderSnap.data();

    if (order.payment?.status === "paid") {
      finalStatus =
        order.status === "needs_refund" ? "needs_refund" : "already_paid";
      return;
    }

    const expectedAmount = toMinorUnit(order.total);

    if (
      Number(amount) !== expectedAmount ||
      currency !== order.currency?.code
    ) {
      transaction.update(orderRef, {
        status: "payment_mismatch",
        payment: {
          ...order.payment,
          status: "mismatch",
          actualPaidAmount: amount,
          expectedAmount,
          paidAt: FieldValue.serverTimestamp(),
          channel,
          gatewayResponse,
        },
        updatedAt: FieldValue.serverTimestamp(),
      });

      finalStatus = "mismatch";
      return;
    }

    const inventoryRefs = (order.items || []).map((item) =>
      db
        .collection("stores")
        .doc(String(order.storeId))
        .collection("inventory")
        .doc(String(item.productId))
    );

    const inventorySnaps = [];

    for (const inventoryRef of inventoryRefs) {
      inventorySnaps.push(await transaction.get(inventoryRef));
    }

    let inventoryFailed = false;
    let failReason = "";

    for (let i = 0; i < inventorySnaps.length; i++) {
      const inventorySnap = inventorySnaps[i];
      const item = order.items[i];

      if (!inventorySnap.exists) {
        inventoryFailed = true;
        failReason = `${item.name || "Item"} is no longer available.`;
        break;
      }

      const stock = Number(inventorySnap.data().stock || 0);
      const quantity = Number(item.quantity || 0);

      if (stock < quantity) {
        inventoryFailed = true;
        failReason = `Not enough stock remaining for ${item.name || "Item"}.`;
        break;
      }
    }

    if (inventoryFailed) {
      transaction.update(orderRef, {
        status: "needs_refund",
        systemNotes: `Inventory failed after payment: ${failReason}`,
        payment: {
          ...order.payment,
          status: "paid",
          paidAt: FieldValue.serverTimestamp(),
          channel,
          gatewayResponse,
        },
        updatedAt: FieldValue.serverTimestamp(),
      });

      finalStatus = "needs_refund";
      return;
    }

    for (let i = 0; i < inventoryRefs.length; i++) {
      const inventory = inventorySnaps[i].data();
      const stock = Number(inventory.stock || 0);
      const quantity = Number(order.items[i].quantity || 0);

      transaction.update(inventoryRefs[i], {
        stock: Math.max(stock - quantity, 0),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.update(orderRef, {
      status: "confirmed",
      payment: {
        ...order.payment,
        status: "paid",
        paidAt: FieldValue.serverTimestamp(),
        channel,
        gatewayResponse,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    const cartRef = db
      .collection("users")
      .doc(String(order.userId))
      .collection("carts")
      .doc(String(order.storeId));

    transaction.delete(cartRef);
  });

  return {
    orderId: orderDoc.id,
    finalStatus,
  };
};

// ─── Authentication Triggers ──────────────────────────────────────────────────
exports.createUserDocument = functions.auth.user().onCreate(async (user) => {
  try {
    const providers = user.providerData?.map((p) => p.providerId) ?? [];
    const authMethod = getAuthMethod(providers);
    const isGoogleUser = providers.includes("google.com");

    const photoURL =
      isGoogleUser && user.photoURL
        ? await reHostGooglePhoto(user.photoURL, user.uid)
        : null;

    await db
      .collection("users")
      .doc(String(user.uid))
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


// ─── User Profile Sync ────────────────────────────────────────────────────────
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
  } = data || {};

  const { uid, token } = context.auth;

  try {
    const authUser = await getAuth().getUser(uid);

    const providers =
      authUser.providerData?.map((provider) => provider.providerId) || [];

    const authMethod = getAuthMethod(providers);

    const name = data?.name || authUser.displayName || token.name || "New User";
    const email = authUser.email || token.email || "";

    if (phone && !/^\+?[0-9\s\-()]{10,15}$/.test(phone)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid phone number format."
      );
    }

    const shouldUseAuthEmailAsContact = useAuthEmailAsContact !== false;

    const finalContactEmail = shouldUseAuthEmailAsContact
      ? email
      : contactEmail;

    if (!shouldUseAuthEmailAsContact && !finalContactEmail) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Contact email is required."
      );
    }

    const userRef = db.collection("users").doc(String(uid));
    const snapshot = await userRef.get();

    const safePhotoURL =
      photoURL !== undefined &&
      photoURL !== null &&
      !photoURL.includes("googleusercontent.com")
        ? photoURL
        : undefined;

    let finalData = {
      ...(data?.name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(country !== undefined && { country }),
      ...(state !== undefined && { state }),
      ...(safePhotoURL !== undefined && { photoURL: safePhotoURL }),

      authMethod,
      allProviders: providers.map(normalizeProvider),

      contactEmail: finalContactEmail,
      useAuthEmailAsContact: shouldUseAuthEmailAsContact,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!snapshot.exists) {
      finalData = {
        ...buildBaseUserDoc({
          uid,
          email,
          name,
          photoURL: null,
          authMethod,
          providers,
        }),
        ...finalData,
      };
    }

    await userRef.set(finalData, { merge: true });

    return {
      success: true,
      authMethod,
      providers,
      allProviders: providers.map(normalizeProvider),
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    console.error("Error in syncUserProfile:", error);

    throw new functions.https.HttpsError(
      "internal",
      "Failed to sync profile data."
    );
  }
});

// ─── Checkout Order Creation ─────────────────────────────────────────────────
exports.createCheckoutOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to checkout."
    );
  }

  const uid = context.auth.uid;

  const {
    storeId,
    orderType,
    contact,
    pickup,
    delivery,
    paymentMethod,
    items,
    discountCode,
  } = data || {};

  if (!storeId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Store ID is required."
    );
  }

  if (!["pickup", "delivery"].includes(orderType)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid order type."
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Cart items are required."
    );
  }

  if (!contact?.fullName || !contact?.email || !contact?.phone) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Contact information is required."
    );
  }

  if (!["card", "transfer"].includes(paymentMethod)) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Unsupported payment method."
    );
  }

  try {
    const cleanedItems = items.map((item) => ({
      productId: String(item.productId || item.id),
      quantity: Number(item.quantity || 0),
    }));

    if (
      cleanedItems.some(
        (item) =>
          !item.productId ||
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0
      )
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid cart item data."
      );
    }

    const checkoutFingerprint = getCheckoutFingerprint({
      uid,
      storeId,
      orderType,
      paymentMethod,
      discountCode,
      items: cleanedItems,
      contact,
      pickup,
      delivery,
    });

    const sessionRef = db
      .collection("checkoutSessions")
      .doc(checkoutFingerprint);

    const sessionSnap = await sessionRef.get();

    if (sessionSnap.exists) {
      const session = sessionSnap.data();

      if (
        Number(session.expiresAt || 0) > Date.now() &&
        session.authorizationUrl &&
        session.orderId
      ) {
        const existingOrderSnap = await db
          .collection("orders")
          .doc(String(session.orderId))
          .get();

        const existingOrder = existingOrderSnap.exists
          ? existingOrderSnap.data()
          : null;

        const canReuseSession =
          existingOrder &&
          existingOrder.userId === uid &&
          existingOrder.storeId === storeId &&
          existingOrder.status === "pending_payment" &&
          existingOrder.payment?.status === "initialized";

        if (canReuseSession) {
          return {
            success: true,
            orderId: session.orderId,
            reference: session.reference,
            authorizationUrl: session.authorizationUrl,
            reused: true,
          };
        }
      }
    }

    const storeSnap = await db.collection("stores").doc(String(storeId)).get();

    if (!storeSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Store not found.");
    }

    const store = {
      id: storeSnap.id,
      ...storeSnap.data(),
    };

    if (store.isActive === false) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "This store is currently unavailable."
      );
    }

    const currencyCode = store?.currency?.code || "NGN";
    const currencyLocale = store?.currency?.locale || "en-NG";

    if (currencyCode !== "NGN") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Online payment is available for NGN stores only."
      );
    }

    if (orderType === "delivery") {
      if (!delivery?.address || !delivery?.state || !delivery?.city) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Delivery address, state, and city are required."
        );
      }

      const lockedState = store?.delivery?.state || store?.state;
      const allowedCities = store?.delivery?.cities || [];

      if (
        delivery.state !== lockedState ||
        !allowedCities.includes(delivery.city)
      ) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "This delivery location is not available for the selected store."
        );
      }
    }

    if (
      orderType === "pickup" &&
      pickup?.pickupType === "scheduled" &&
      !pickup?.scheduledTime
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Scheduled pickup time is required."
      );
    }

    const [inventorySnaps, productSnaps] = await Promise.all([
      Promise.all(
        cleanedItems.map((item) =>
          db
            .collection("stores")
            .doc(String(storeId))
            .collection("inventory")
            .doc(item.productId)
            .get()
        )
      ),
      Promise.all(
        cleanedItems.map((item) =>
          db.collection("products").doc(item.productId).get()
        )
      ),
    ]);

    const inventoryItems = [];
    let subtotal = 0;

    for (let i = 0; i < cleanedItems.length; i++) {
      const item = cleanedItems[i];
      const inventorySnap = inventorySnaps[i];
      const productSnap = productSnaps[i];

      if (!inventorySnap.exists) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "One or more items are no longer available."
        );
      }

      const inventory = {
        id: inventorySnap.id,
        ...inventorySnap.data(),
      };

      const product = productSnap.exists ? productSnap.data() : {};
      const productName = inventory.name || product.name || "Item";
      const stock = Number(inventory.stock || 0);
      const available = inventory.available ?? stock > 0;
      const price = Number(inventory.price || 0);

      if (inventory.isActive === false || !available || stock <= 0) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          `${productName} is currently unavailable.`
        );
      }

      if (item.quantity > stock) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          `${productName} has only ${stock} unit(s) available.`
        );
      }

      if (!Number.isFinite(price) || price <= 0) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          `${productName} has an invalid price.`
        );
      }

      const lineTotal = price * item.quantity;
      subtotal += lineTotal;

      inventoryItems.push({
        productId: item.productId,
        name: productName,
        img: inventory.img || product.img || "",
        category: inventory.category || product.category || "",
        tags: inventory.tags || product.tags || [],
        price,
        quantity: item.quantity,
        lineTotal,
      });
    }

    const deliveryFee =
      orderType === "delivery" ? getDeliveryFee({ store, delivery }) : 0;

    const discountTotal = 0;
    const total = Math.max(subtotal - discountTotal + deliveryFee, 0);

    if (total <= 0) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Order total must be greater than zero."
      );
    }
    const minimumPaymentAmount = paymentMethod === "transfer" ? 100 : 50;

    if (total < minimumPaymentAmount) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        `Minimum amount for ${
          paymentMethod === "transfer" ? "bank transfer" : "card payment"
        } is ₦${minimumPaymentAmount}.`
      );
    }

    const orderRef = db.collection("orders").doc();
    const reference = generatePaymentReference(orderRef.id);

    const orderPayload = {
      userId: uid,
      storeId,
      storeName: store.name || "",
      orderType,
      status: "pending_payment",

      contact: {
        fullName: contact.fullName,
        email: contact.email,
        phone: contact.phone,
      },

      pickup:
        orderType === "pickup"
          ? {
              pickupType: pickup?.pickupType || "asap",
              scheduledTime: pickup?.scheduledTime || null,
            }
          : null,

      delivery:
        orderType === "delivery"
          ? {
              address: delivery.address,
              country:
                delivery.country ||
                store?.delivery?.country ||
                store?.country ||
                "",
              state: delivery.state,
              city: delivery.city,
              landmark: delivery.landmark || "",
            }
          : null,

      items: inventoryItems,
      subtotal,
      discountCode: discountCode || null,
      discount: null,
      discountTotal,
      deliveryFee,
      total,

      currency: {
        code: currencyCode,
        locale: currencyLocale,
      },

      payment: {
        provider: "paystack",
        method: paymentMethod,
        status: "pending",
        reference,
        authorizationUrl: null,
        accessCode: null,
        paidAt: null,
      },

      reservation: {
        status: "none",
        reservedAt: null,
        expiresAt: null,
      },

      checkoutFingerprint,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const paystackChannels =
      paymentMethod === "transfer" ? ["bank_transfer"] : ["card"];

    await orderRef.set(orderPayload);

    try {
      const paystackData = await callPaystack({
        endpoint: "/transaction/initialize",
        body: {
          email: contact.email,
          amount: toMinorUnit(total),
          currency: currencyCode,
          reference,
          channels: paystackChannels,
          callback_url: `${getFrontendUrl()}/payment/callback`,
          metadata: {
            orderId: orderRef.id,
            storeId,
            userId: uid,
            paymentMethod,
          },
        },
      });

      await orderRef.set(
        {
          payment: {
            ...orderPayload.payment,
            status: "initialized",
            authorizationUrl: paystackData.authorization_url,
            accessCode: paystackData.access_code,
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      await sessionRef.set({
        uid,
        storeId,
        orderId: orderRef.id,
        reference,
        authorizationUrl: paystackData.authorization_url,
        expiresAt: Date.now() + 2 * 60 * 1000,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        orderId: orderRef.id,
        reference,
        authorizationUrl: paystackData.authorization_url,
      };
    } catch (error) {
      await orderRef.set(
        {
          status: "payment_initialization_failed",
          payment: {
            ...orderPayload.payment,
            status: "initialization_failed",
            errorMessage: error.message,
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.error("Paystack initialization failed:", error.message);

      throw new functions.https.HttpsError(
        "internal",
        "Could not initialize payment. Please try again."
      );
    }
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    console.error("createCheckoutOrder exception:", error);

    throw new functions.https.HttpsError(
      "internal",
      "Could not initialize payment. Please try again."
    );
  }
});

// ─── Paystack Webhook Handler ─────────────────────────────────────────────────
exports.paystackWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const signature = req.headers["x-paystack-signature"];

  if (!signature) {
    res.status(401).send("Missing Paystack signature.");
    return;
  }

  const rawBody = req.rawBody;

  if (!rawBody) {
    console.error("Webhook rawBody is missing.");
    res.status(500).send("Webhook configuration error.");
    return;
  }

  const hash = crypto
    .createHmac("sha512", getPaystackSecretKey())
    .update(rawBody)
    .digest("hex");

  if (hash !== signature) {
    console.error("Webhook signature mismatch.");
    res.status(401).send("Unauthorized Signature.");
    return;
  }

  const event = req.body;

  if (!event || event.event !== "charge.success") {
    res.status(200).send("Ignored event type.");
    return;
  }

  res.status(200).send("OK");

  const { reference, amount, currency, channel, gateway_response } = event.data;

  confirmPaidOrder({
    reference,
    amount,
    currency,
    channel,
    gatewayResponse: gateway_response,
  })
    .then((result) => {
      if (
        result.finalStatus === "needs_refund" ||
        result.finalStatus === "mismatch"
      ) {
        console.warn(
          `Processed order ${result.orderId} with status: ${result.finalStatus}`
        );
        return;
      }

      console.log(`Webhook confirmed order ${result.orderId}.`);
    })
    .catch((error) => {
      console.error("Webhook fulfillment error:", error.message);
    });
});

// ─── Manual Verification Request Fallback ────────────────────────────────────
exports.verifyPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in."
    );
  }

  const { reference } = data || {};

  if (!reference) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Payment reference is required."
    );
  }

  const ordersSnapshot = await db
    .collection("orders")
    .where("payment.reference", "==", reference)
    .limit(1)
    .get();

  if (ordersSnapshot.empty) {
    throw new functions.https.HttpsError("not-found", "Order not found.");
  }

  const orderDoc = ordersSnapshot.docs[0];
  const order = orderDoc.data();

  if (order.userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You cannot verify this order."
    );
  }

  if (order.payment?.status === "paid") {
    return {
      success: true,
      orderId: orderDoc.id,
      alreadyVerified: true,
    };
  }

  try {
    const paymentData = await callPaystack({
      endpoint: `/transaction/verify/${encodeURIComponent(reference)}`,
      method: "GET",
    });

    if (paymentData.status !== "success") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Payment validation indicates transaction is not successful."
      );
    }

    const result = await confirmPaidOrder({
      reference,
      amount: paymentData.amount,
      currency: paymentData.currency,
      channel: paymentData.channel || null,
      gatewayResponse: paymentData.gateway_response || null,
    });

    return {
      success: true,
      orderId: result.orderId,
      status: result.finalStatus,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    console.error("verifyPayment operation exception:", error.message);

    throw new functions.https.HttpsError(
      "internal",
      error.message || "Could not verify transaction."
    );
  }
});

// ─── Cleanup Expired Checkout Sessions ────────────────────────────────────────
exports.cleanupExpiredCheckoutSessions = functions.pubsub
  .schedule("every 30 minutes")
  .onRun(async () => {
    const expiredSnap = await db
      .collection("checkoutSessions")
      .where("expiresAt", "<", Date.now())
      .limit(100)
      .get();

    if (expiredSnap.empty) {
      console.log("No expired checkout sessions to clean.");
      return null;
    }

    const batch = db.batch();

    expiredSnap.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    await batch.commit();

    console.log(
      `Cleaned up ${expiredSnap.docs.length} expired checkout sessions.`
    );

    return null;
  });
