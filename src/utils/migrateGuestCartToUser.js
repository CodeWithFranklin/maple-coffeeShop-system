import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { clearAllGuestCartItems, getAllGuestCarts } from "./guestCartStorage";
import { mergeCartItems } from "./cartUtils";

export const migrateGuestCartToUser = async (uid) => {
  if (!uid) {
    return {
      success: false,
      migratedStores: 0,
      migratedItems: 0,
      message: "No user ID provided.",
    };
  }

  const guestCarts = getAllGuestCarts();

  if (guestCarts.length === 0) {
    return {
      success: true,
      migratedStores: 0,
      migratedItems: 0,
      message: "No guest cart to migrate.",
    };
  }

  let migratedStores = 0;
  let migratedItems = 0;

  for (const guestCart of guestCarts) {
    const { storeId, items: guestItems } = guestCart;

    if (!storeId || !Array.isArray(guestItems) || guestItems.length === 0) {
      continue;
    }

    const cartRef = doc(db, "users", uid, "carts", storeId);
    const cartSnap = await getDoc(cartRef);
    const existingCart = cartSnap.exists() ? cartSnap.data() : null;
    const existingItems = existingCart?.items || [];

    const storeRef = doc(db, "stores", storeId);
    const storeSnap = await getDoc(storeRef);
    const store = storeSnap.exists()
      ? {
          id: storeSnap.id,
          ...storeSnap.data(),
        }
      : null;

    const mergedItems = mergeCartItems({
      existingItems,
      guestItems,
    });

    if (mergedItems.length === 0) continue;

    await setDoc(
      cartRef,
      {
        storeId,
        storeName:
          store?.name ||
          existingCart?.storeName ||
          guestItems?.[0]?.storeName ||
          "Store",
        currency: store?.currency ||
          existingCart?.currency ||
          guestItems?.[0]?.currency || {
            code: "USD",
            locale: "en-US",
          },
        items: mergedItems,
        status: "active",
        lastUpdated: serverTimestamp(),
        migratedFromGuestCart: true,
      },
      { merge: true }
    );

    migratedStores += 1;
    migratedItems += guestItems.reduce((total, item) => {
      return total + Number(item.quantity || 1);
    }, 0);
  }

  clearAllGuestCartItems();

  return {
    success: true,
    migratedStores,
    migratedItems,
    message:
      migratedItems > 0
        ? "Guest cart moved to user account."
        : "No guest cart items migrated.",
  };
};
