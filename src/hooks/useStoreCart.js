import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  buildCartItem,
  buildCartSummary,
  getProductId,
} from "../utils/cartUtils";
import { getGuestCart, saveGuestCart } from "../utils/guestCartStorage";

export function useStoreCart({ user, store, inventoryItems }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartActionLoading, setCartActionLoading] = useState(false);

  const storeId = store?.id;

  const currency = useMemo(
    () => ({
      code: store?.currency?.code || "USD",
      locale: store?.currency?.locale || "en-US",
    }),
    [store?.currency?.code, store?.currency?.locale]
  );

  useEffect(() => {
    const loadCart = async () => {
      if (!storeId) {
        setCartItems([]);
        setCartLoading(false);
        return;
      }

      setCartLoading(true);

      try {
        if (user?.uid) {
          const cartRef = doc(db, "users", user.uid, "carts", storeId);
          const cartSnap = await getDoc(cartRef);

          setCartItems(cartSnap.exists() ? cartSnap.data()?.items || [] : []);
          return;
        }

        setCartItems(getGuestCart(storeId));
      } catch (error) {
        console.error("Failed to load cart:", error);
        setCartItems([]);
      } finally {
        setCartLoading(false);
      }
    };

    loadCart();
  }, [user?.uid, storeId]);

  const persistCart = useCallback(
    async (nextItems) => {
      if (!storeId) return;

      if (user?.uid) {
        const cartRef = doc(db, "users", user.uid, "carts", storeId);

        if (nextItems.length === 0) {
          await deleteDoc(cartRef);
          return;
        }

        await setDoc(
          cartRef,
          {
            storeId,
            storeName: store?.name || "",
            currency,
            items: nextItems,
            status: "active",
            lastUpdated: serverTimestamp(),
          },
          { merge: true }
        );

        return;
      }

      saveGuestCart(storeId, nextItems);
    },
    [currency, store?.name, storeId, user?.uid]
  );

  const updateCart = useCallback(
    async (updater) => {
      const previousItems = cartItems;
      const nextItems =
        typeof updater === "function" ? updater(previousItems) : updater;

      setCartItems(nextItems);
      setCartActionLoading(true);

      try {
        await persistCart(nextItems);

        return {
          success: true,
          message: "Cart updated.",
        };
      } catch (error) {
        console.error("Failed to persist cart:", error);
        setCartItems(previousItems);

        return {
          success: false,
          message: "Failed to update cart. Please try again.",
        };
      } finally {
        setCartActionLoading(false);
      }
    },
    [cartItems, persistCart]
  );

  const addToCart = useCallback(
    async ({ item, quantity = 1 }) => {
      if (!item) {
        return {
          success: false,
          message: "No item selected.",
        };
      }

      const stock = Number(item.stock || 0);
      const available = item.available ?? stock > 0;

      if (!available || stock <= 0) {
        return {
          success: false,
          message: "This item is currently out of stock.",
        };
      }

      let validationResult = {
        success: true,
        message: "Item added to cart.",
      };

      const updateResult = await updateCart((previousItems) => {
        const existingItem = previousItems.find((cartItem) => {
          return getProductId(cartItem) === getProductId(item);
        });

        const existingQuantity = Number(existingItem?.quantity || 0);
        const nextQuantity = existingQuantity + Number(quantity || 1);

        if (nextQuantity > stock) {
          validationResult = {
            success: false,
            message: `Only ${stock} unit(s) available.`,
          };

          return previousItems;
        }

        if (existingItem) {
          return previousItems.map((cartItem) =>
            getProductId(cartItem) === getProductId(item)
              ? buildCartItem({
                  item,
                  quantity: nextQuantity,
                  currency,
                })
              : cartItem
          );
        }

        return [
          ...previousItems,
          buildCartItem({
            item,
            quantity,
            currency,
          }),
        ];
      });

      if (!updateResult.success) return updateResult;
      if (!validationResult.success) return validationResult;

      return {
        success: true,
        message: "Item added to cart.",
      };
    },
    [currency, updateCart]
  );

  const removeFromCart = useCallback(
    async (productId) => {
      return updateCart((previousItems) => {
        return previousItems.filter((item) => getProductId(item) !== productId);
      });
    },
    [updateCart]
  );

  const updateCartQuantity = useCallback(
    async ({ productId, amount }) => {
      const inventoryItem = inventoryItems.find((item) => {
        return getProductId(item) === productId;
      });

      if (!inventoryItem) {
        return {
          success: false,
          message: "This item is no longer available at this store.",
        };
      }

      const stock = Number(inventoryItem.stock || 0);
      const available = inventoryItem.available ?? stock > 0;

      if (!available || stock <= 0) {
        return {
          success: false,
          message: "This item is currently unavailable.",
        };
      }

      let validationResult = {
        success: true,
        message: "Cart updated.",
      };

      const updateResult = await updateCart((previousItems) => {
        return previousItems.map((item) => {
          if (getProductId(item) !== productId) return item;

          const nextQuantity = Number(item.quantity || 1) + Number(amount || 0);

          if (nextQuantity < 1) {
            return {
              ...item,
              quantity: 1,
            };
          }

          if (nextQuantity > stock) {
            validationResult = {
              success: false,
              message: `Only ${stock} unit(s) available.`,
            };

            return item;
          }

          return buildCartItem({
            item: inventoryItem,
            quantity: nextQuantity,
            currency,
          });
        });
      });

      if (!updateResult.success) return updateResult;
      if (!validationResult.success) return validationResult;

      return {
        success: true,
        message: "Cart updated.",
      };
    },
    [currency, inventoryItems, updateCart]
  );

  const clearCart = useCallback(async () => {
    return updateCart([]);
  }, [updateCart]);

  const cartSummary = useMemo(() => {
    return buildCartSummary({
      cartItems,
      inventoryItems,
    });
  }, [cartItems, inventoryItems]);

  return {
    cartItems,
    cartSummary,
    cartLoading,
    cartActionLoading,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
  };
}
