export const getGuestCartKey = (storeId) => {
  return `cart_store_${storeId}`;
};

export const getStoreIdFromGuestCartKey = (key) => {
  return key.replace("cart_store_", "");
};

export const getGuestCart = (storeId) => {
  if (!storeId) return [];

  try {
    const savedCart = localStorage.getItem(getGuestCartKey(storeId));
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (error) {
    console.error("Failed to read guest cart:", error);
    return [];
  }
};

export const getAllGuestCarts = () => {
  const carts = [];

  Object.keys(localStorage).forEach((key) => {
    if (!key.startsWith("cart_store_")) return;

    try {
      const storeId = getStoreIdFromGuestCartKey(key);
      const items = JSON.parse(localStorage.getItem(key) || "[]");

      if (storeId && Array.isArray(items) && items.length > 0) {
        carts.push({
          storeId,
          items,
        });
      }
    } catch (error) {
      console.error(`Failed to read guest cart key "${key}":`, error);
    }
  });

  return carts;
};

export const saveGuestCart = (storeId, cartItems) => {
  if (!storeId) return;

  if (!cartItems || cartItems.length === 0) {
    localStorage.removeItem(getGuestCartKey(storeId));
  } else {
    localStorage.setItem(getGuestCartKey(storeId), JSON.stringify(cartItems));
  }

  window.dispatchEvent(new Event("maple-cart-updated"));
};

export const savePendingStore = (store) => {
  if (!store) return;

  localStorage.setItem("pending_store", JSON.stringify(store));
  localStorage.setItem("last_active_store_id", store.id);
};

export const clearGuestCart = (storeId) => {
  if (!storeId) return;

  localStorage.removeItem(getGuestCartKey(storeId));
  window.dispatchEvent(new Event("maple-cart-updated"));
};

export const clearAllGuestCartItems = () => {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("cart_store_")) {
      localStorage.removeItem(key);
    }
  });

  window.dispatchEvent(new Event("maple-cart-updated"));
};

export const hasGuestCartItems = () => {
  return getAllGuestCarts().length > 0;
};
