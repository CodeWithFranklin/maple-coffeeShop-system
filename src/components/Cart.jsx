import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";

//  Helpers 
const formatMoney = (amount, currencyCode = "USD", locale = "en-US") =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(Number(amount || 0));

const getProductId = (item) => item.productId || item.id;

const buildCartSummary = ({ cartItems, inventoryItems }) => {
  const inventoryMap = new Map(
    inventoryItems.map((item) => [item.productId || item.id, item])
  );

  const items = cartItems.map((cartItem) => {
    const productId = getProductId(cartItem);
    const inventoryItem = inventoryMap.get(productId);
    const quantity = Number(cartItem.quantity || 1);

    if (!inventoryItem) {
      return {
        ...cartItem,
        id: productId,
        productId,
        name: cartItem.name || "Item",
        img: cartItem.img || "",
        price: Number(cartItem.price || 0),
        quantity,
        blocked: true,
        blockReason: "This item is no longer available at this store.",
      };
    }

    const stock = Number(inventoryItem.stock || 0);
    const available = inventoryItem.available ?? stock > 0;

    const currentItem = {
      ...cartItem,
      ...inventoryItem,
      id: productId,
      productId,
      quantity,
      price: Number(inventoryItem.price || 0),
      lineTotal: Number(inventoryItem.price || 0) * quantity,
    };

    if (inventoryItem.isActive === false) {
      return {
        ...currentItem,
        blocked: true,
        blockReason: "This item is no longer active at this store.",
      };
    }

    if (!available) {
      return {
        ...currentItem,
        blocked: true,
        blockReason: "This item is currently unavailable.",
      };
    }

    if (stock <= 0) {
      return {
        ...currentItem,
        blocked: true,
        blockReason: "This item is out of stock.",
      };
    }

    if (quantity > stock) {
      return {
        ...currentItem,
        blocked: true,
        blockReason: `Only ${stock} unit(s) available. Reduce the quantity or remove it.`,
      };
    }

    return {
      ...currentItem,
      blocked: false,
      blockReason: "",
    };
  });

  const validItems = items.filter((item) => !item.blocked);
  const blockedItems = items.filter((item) => item.blocked);

  const subtotal = validItems.reduce((acc, item) => {
    return acc + Number(item.price || 0) * Number(item.quantity || 0);
  }, 0);

  const itemCount = items.reduce((acc, item) => {
    return acc + Number(item.quantity || 0);
  }, 0);

  return {
    items,
    validItems,
    blockedItems,
    subtotal,
    itemCount,
    canCheckout: validItems.length > 0 && blockedItems.length === 0,
  };
};

// Main Component 
export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [storeCarts, setStoreCarts] = useState([]);
  const [updatingItems, setUpdatingItems] = useState(new Set());

  //  Fetch Carts 
  useEffect(() => {
    const fetchUserCarts = async () => {
      if (!user?.uid) return;

      setLoading(true);

      try {
        const cartsSnapshot = await getDocs(
          collection(db, "users", user.uid, "carts")
        );

        if (cartsSnapshot.empty) {
          setStoreCarts([]);
          return;
        }

        const storeIds = cartsSnapshot.docs.map((cartDoc) => {
          return cartDoc.data().storeId || cartDoc.id;
        });

        const storeSnaps = await Promise.all(
          storeIds.map((storeId) => getDoc(doc(db, "stores", storeId)))
        );

        const storeMap = new Map(
          storeSnaps
            .filter((storeSnap) => storeSnap.exists())
            .map((storeSnap) => [
              storeSnap.id,
              {
                id: storeSnap.id,
                ...storeSnap.data(),
              },
            ])
        );

        const cartGroups = await Promise.all(
          cartsSnapshot.docs.map(async (cartDoc) => {
            const cartData = cartDoc.data();
            const storeId = cartData.storeId || cartDoc.id;
            const cartItems = cartData.items || [];

            const store = storeMap.get(storeId) || {
              id: storeId,
              name: cartData.storeName || "Store",
              currency: cartData.currency || {
                code: "USD",
                locale: "en-US",
              },
            };

            const productIds = cartItems.map(getProductId).filter(Boolean);

            let inventoryItems = [];

            if (productIds.length > 0) {
              const chunks = [];

              for (let i = 0; i < productIds.length; i += 30) {
                chunks.push(productIds.slice(i, i + 30));
              }

              const inventorySnaps = await Promise.all(
                chunks.map((chunk) =>
                  getDocs(
                    query(
                      collection(db, "stores", storeId, "inventory"),
                      where(documentId(), "in", chunk)
                    )
                  )
                )
              );

              inventoryItems = inventorySnaps
                .flatMap((snap) => snap.docs)
                .map((inventoryDoc) => ({
                  id: inventoryDoc.id,
                  productId: inventoryDoc.id,
                  ...inventoryDoc.data(),
                }));
            }

            return {
              storeId,
              store,
              cartItems,
              inventoryItems,
            };
          })
        );

        setStoreCarts(cartGroups.filter((cart) => cart.cartItems.length > 0));
      } catch (error) {
        console.error("Error loading carts:", error);
        toast.error("Failed to load your cart. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserCarts();
  }, [user?.uid]);

  //  Derived Data 
  const cartGroups = useMemo(() => {
    return storeCarts.map((group) => {
      const summary = buildCartSummary({
        cartItems: group.cartItems,
        inventoryItems: group.inventoryItems,
      });

      return {
        ...group,
        summary,
      };
    });
  }, [storeCarts]);

  const totalsByCurrency = useMemo(() => {
    return cartGroups.reduce((acc, group) => {
      const currencyCode = group.store?.currency?.code || "USD";
      const currencyLocale = group.store?.currency?.locale || "en-US";

      if (!acc[currencyCode]) {
        acc[currencyCode] = {
          currencyCode,
          currencyLocale,
          total: 0,
        };
      }

      acc[currencyCode].total += Number(group.summary.subtotal || 0);

      return acc;
    }, {});
  }, [cartGroups]);

  const totalItems = useMemo(() => {
    return cartGroups.reduce((acc, group) => {
      return acc + Number(group.summary.itemCount || 0);
    }, 0);
  }, [cartGroups]);

  //  Persist Cart 
  const persistCart = useCallback(
    async ({ storeId, nextItems }) => {
      if (!user?.uid) return;

      const cartRef = doc(db, "users", user.uid, "carts", storeId);

      if (nextItems.length === 0) {
        await deleteDoc(cartRef);
        return;
      }

      const group = storeCarts.find((cart) => cart.storeId === storeId);
      const store = group?.store;

      await setDoc(
        cartRef,
        {
          storeId,
          storeName: store?.name || "",
          currency: {
            code: store?.currency?.code || "USD",
            locale: store?.currency?.locale || "en-US",
          },
          items: nextItems,
          status: "active",
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );
    },
    [user?.uid, storeCarts]
  );

  //  Update Quantity 
  const updateCartQuantity = useCallback(
    async ({ storeId, productId, amount }) => {
      const itemKey = `${storeId}:${productId}`;

      if (updatingItems.has(itemKey)) return;

      const group = storeCarts.find((cart) => cart.storeId === storeId);
      if (!group) return;

      const inventoryItem = group.inventoryItems.find((item) => {
        return (item.productId || item.id) === productId;
      });

      if (!inventoryItem) {
        toast.error("This item is no longer available at this store.");
        return;
      }

      const stock = Number(inventoryItem.stock || 0);
      let blocked = false;

      const nextItems = group.cartItems.map((item) => {
        if (getProductId(item) !== productId) return item;

        const currentQuantity = Number(item.quantity || 1);
        const nextQuantity = currentQuantity + amount;

        if (nextQuantity < 1) {
          return {
            ...item,
            quantity: 1,
          };
        }

        if (nextQuantity > stock) {
          blocked = true;
          return item;
        }

        return {
          ...item,
          quantity: nextQuantity,
        };
      });

      if (blocked) {
        toast.error(`Only ${stock} unit(s) available.`);
        return;
      }

      const previousCarts = storeCarts;

      setStoreCarts((current) =>
        current.map((cart) =>
          cart.storeId === storeId
            ? {
                ...cart,
                cartItems: nextItems,
              }
            : cart
        )
      );

      setUpdatingItems((previous) => {
        const next = new Set(previous);
        next.add(itemKey);
        return next;
      });

      try {
        await persistCart({
          storeId,
          nextItems,
        });
      } catch (error) {
        setStoreCarts(previousCarts);
        toast.error("Failed to update quantity. Please try again.");
        console.error(error);
      } finally {
        setUpdatingItems((previous) => {
          const next = new Set(previous);
          next.delete(itemKey);
          return next;
        });
      }
    },
    [storeCarts, updatingItems, persistCart]
  );

  //  Remove Item 
  const removeFromCart = useCallback(
    async ({ storeId, productId }) => {
      const group = storeCarts.find((cart) => cart.storeId === storeId);
      if (!group) return;

      const nextItems = group.cartItems.filter((item) => {
        return getProductId(item) !== productId;
      });

      const previousCarts = storeCarts;

      setStoreCarts((current) =>
        current
          .map((cart) =>
            cart.storeId === storeId
              ? {
                  ...cart,
                  cartItems: nextItems,
                }
              : cart
          )
          .filter((cart) => cart.cartItems.length > 0)
      );

      try {
        await persistCart({
          storeId,
          nextItems,
        });
      } catch (error) {
        setStoreCarts(previousCarts);
        toast.error("Failed to remove item. Please try again.");
        console.error(error);
      }
    },
    [storeCarts, persistCart]
  );

  //  Clear Store Cart 
  const clearStoreCart = useCallback(
    (storeId) => {
      toast("Clear this store cart?", {
        action: {
          label: "Clear",
          onClick: async () => {
            const previousCarts = storeCarts;

            setStoreCarts((current) =>
              current.filter((cart) => cart.storeId !== storeId)
            );

            try {
              if (user?.uid) {
                await deleteDoc(doc(db, "users", user.uid, "carts", storeId));
              }
            } catch (error) {
              setStoreCarts(previousCarts);
              toast.error("Failed to clear cart. Please try again.");
              console.error(error);
            }
          },
        },
        cancel: {
          label: "Cancel",
          onClick: () => {},
        },
      });
    },
    [storeCarts, user?.uid]
  );

  //  Checkout 
  const handleCheckout = useCallback(
    (group) => {
      if (!group.summary.canCheckout) return;

      navigate("/checkout", {
        state: {
          selectedStore: group.store,
          cartItems: group.summary.validItems,
          total: group.summary.subtotal,
        },
      });
    },
    [navigate]
  );

  const handleContinueShopping = useCallback(
    (store) => {
      navigate("/order", {
        state: {
          selectedStore: store,
        },
      });
    },
    [navigate]
  );

  //  Guards 
  if (!user) return <Navigate to="/signin" replace />;

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </section>
    );
  }

  //  Render 
  return (
    <section className="min-h-screen bg-gray-50/50">
      <div className="w-[90%] max-w-6xl mx-auto py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl md:text-6xl font-black mt-1">
              Your Cart
            </h1>

            <p className="text-gray-500 mt-3 max-w-2xl">
              These are the items you added but have not checked out yet. Each
              store must be checked out separately.
            </p>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-5 min-w-56">
            <p className="text-xs font-bold text-gray-400 uppercase">
              Active items
            </p>

            <p className="text-3xl font-black">{totalItems}</p>

            <p className="text-xs text-gray-400 mt-1">
              Across {cartGroups.length} store(s)
            </p>
          </div>
        </div>

        {/* Empty State */}
        {cartGroups.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-[32px] p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-lime-100 mx-auto flex items-center justify-center">
              <i className="bx bx-cart text-3xl text-lime-700"></i>
            </div>

            <h2 className="text-2xl font-black mt-5">Your cart is empty</h2>

            <p className="text-gray-400 mt-2">
              Visit a Maple store and add items to your order tray.
            </p>

            <button
              type="button"
              onClick={() => navigate("/stores")}
              className="btn btn-primary rounded-full mt-6 px-8"
            >
              Find Stores
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Cart Groups */}
            <div className="lg:col-span-8 space-y-6">
              {cartGroups.map((group) => {
                const currencyCode = group.store?.currency?.code || "USD";
                const currencyLocale = group.store?.currency?.locale || "en-US";

                return (
                  <div
                    key={group.storeId}
                    className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden"
                  >
                    {/* Store Header */}
                    <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-black">
                          {group.store?.name || group.storeId}
                        </h2>

                        <p className="text-sm text-gray-400">
                          {group.store?.city && group.store?.state
                            ? `${group.store.city}, ${group.store.state}`
                            : "Store cart"}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleContinueShopping(group.store)}
                          className="btn btn-soft rounded-full"
                        >
                          Add More
                        </button>

                        <button
                          type="button"
                          onClick={() => clearStoreCart(group.storeId)}
                          className="btn btn-ghost text-error rounded-full"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Blocked Items Warning */}
                    {group.summary.blockedItems.length > 0 && (
                      <div className="mx-6 mt-5 rounded-2xl bg-red-50 text-red-700 p-4 text-sm font-semibold">
                        Some items are no longer available. Remove or update
                        them before checkout.
                      </div>
                    )}

                    {/* Items */}
                    <div className="divide-y divide-gray-100">
                      {group.summary.items.map((item) => {
                        const itemKey = `${group.storeId}:${
                          item.productId || item.id
                        }`;
                        const isUpdating = updatingItems.has(itemKey);

                        return (
                          <div
                            key={item.productId || item.id}
                            className={`p-6 flex gap-4 items-center transition-opacity ${
                              item.blocked || isUpdating ? "opacity-70" : ""
                            }`}
                          >
                            {/* Image */}
                            <div className="w-20 h-20 rounded-3xl overflow-hidden bg-gray-100 shrink-0">
                              {item.img ? (
                                <img
                                  src={item.img}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <i className="bx bx-image text-2xl text-gray-300"></i>
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-lg truncate">
                                {item.name}
                              </p>

                              <p className="text-xs uppercase font-bold text-gray-400 truncate">
                                {item.tags?.[0] || item.category || "Item"}
                              </p>

                              <p className="text-sm font-bold text-green-700 mt-1">
                                {formatMoney(
                                  Number(item.price || 0),
                                  currencyCode,
                                  currencyLocale
                                )}{" "}
                                each
                              </p>

                              {item.blocked && (
                                <p className="text-xs font-bold text-red-600 mt-2">
                                  {item.blockReason}
                                </p>
                              )}
                            </div>

                            {/* Quantity + Remove */}
                            <div className="flex flex-col items-end gap-3">
                              <p className="font-black">
                                {formatMoney(
                                  Number(item.price || 0) *
                                    Number(item.quantity || 0),
                                  currencyCode,
                                  currencyLocale
                                )}
                              </p>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateCartQuantity({
                                      storeId: group.storeId,
                                      productId: item.productId || item.id,
                                      amount: -1,
                                    })
                                  }
                                  disabled={item.blocked || isUpdating}
                                  className="btn btn-circle btn-sm bg-lime-100 border-0 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {isUpdating ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                  ) : (
                                    <i className="bx bx-minus"></i>
                                  )}
                                </button>

                                <span className="font-black w-6 text-center">
                                  {item.quantity}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    updateCartQuantity({
                                      storeId: group.storeId,
                                      productId: item.productId || item.id,
                                      amount: 1,
                                    })
                                  }
                                  disabled={item.blocked || isUpdating}
                                  className="btn btn-circle btn-sm bg-lime-100 border-0 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {isUpdating ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                  ) : (
                                    <i className="bx bx-plus"></i>
                                  )}
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeFromCart({
                                    storeId: group.storeId,
                                    productId: item.productId || item.id,
                                  })
                                }
                                disabled={isUpdating}
                                className="btn btn-ghost btn-xs text-error rounded-full disabled:opacity-40"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Store Footer */}
                    <div className="p-6 bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-400 font-bold">
                          Store subtotal
                        </p>

                        <p className="text-2xl font-black">
                          {formatMoney(
                            group.summary.subtotal,
                            currencyCode,
                            currencyLocale
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCheckout(group)}
                        disabled={!group.summary.canCheckout}
                        className="btn btn-primary rounded-full px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Checkout {group.store?.name || "Store"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Sidebar */}
            <aside className="lg:col-span-4">
              <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 sticky top-28">
                <h3 className="font-black text-xl">Cart Summary</h3>

                <div className="mt-5 space-y-3">
                  <div className="flex justify-between text-gray-500">
                    <span>Stores</span>

                    <span className="font-bold text-black">
                      {cartGroups.length}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-500">
                    <span>Items</span>

                    <span className="font-bold text-black">{totalItems}</span>
                  </div>

                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <p className="text-xs text-gray-400 font-bold uppercase">
                      Total by currency
                    </p>

                    <div className="space-y-3 mt-3">
                      {Object.values(totalsByCurrency).map((currencyTotal) => (
                        <div
                          key={currencyTotal.currencyCode}
                          className="flex items-center justify-between gap-4"
                        >
                          <p className="text-sm font-bold text-gray-500">
                            {currencyTotal.currencyCode} stores
                          </p>

                          <p className="text-xl font-black">
                            {formatMoney(
                              currencyTotal.total,
                              currencyTotal.currencyCode,
                              currencyTotal.currencyLocale
                            )}
                          </p>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-gray-400 mt-3">
                      Stores using different currencies are grouped separately.
                      Checkout still happens one store at a time.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/stores")}
                    className="btn btn-neutral rounded-full w-full mt-5"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
