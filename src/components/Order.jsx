import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  setDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";

const formatMoney = (amount, currencyCode = "USD", locale = "en-US") => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(Number(amount || 0));
};

const buildCartSummary = ({ cart, menu }) => {
  const menuMap = new Map(menu.map((item) => [item.id, item]));

  const items = cart.map((cartItem) => {
    const menuItem = menuMap.get(cartItem.id);

    if (!menuItem) {
      return {
        ...cartItem,
        blocked: true,
        blockReason: "This item is no longer available at this store.",
      };
    }

    const stock = Number(menuItem.stock || 0);
    const quantity = Number(cartItem.quantity || 1);

    if (menuItem.available === false) {
      return {
        ...cartItem,
        ...menuItem,
        quantity,
        blocked: true,
        blockReason: "This item is currently unavailable.",
      };
    }

    if (stock <= 0) {
      return {
        ...cartItem,
        ...menuItem,
        quantity,
        blocked: true,
        blockReason: "This item is out of stock.",
      };
    }

    if (quantity > stock) {
      return {
        ...cartItem,
        ...menuItem,
        quantity,
        blocked: true,
        blockReason: `Only ${stock} unit(s) available. Reduce the quantity or remove it.`,
      };
    }

    return {
      ...cartItem,
      ...menuItem,
      quantity,
      blocked: false,
      blockReason: "",
    };
  });

  const validItems = items.filter((item) => !item.blocked);
  const blockedItems = items.filter((item) => item.blocked);

  const subtotal = validItems.reduce(
    (acc, item) => acc + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  const itemCount = items.reduce(
    (acc, item) => acc + Number(item.quantity || 0),
    0
  );

  return {
    items,
    validItems,
    blockedItems,
    subtotal,
    itemCount,
    canCheckout: validItems.length > 0 && blockedItems.length === 0,
  };
};

export default function Order() {
  const navigate = useNavigate();
  const location = useLocation();

  const store = location.state?.selectedStore;
  const initialSearch = location.state?.autoSearch || "";

  const { user } = useAuth();

  const storeCurrencyCode = store?.currency?.code || "USD";
  const storeCurrencyLocale = store?.currency?.locale || "en-US";

  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState([]);
  const [filteredMenu, setFilteredMenu] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const modalRef = useRef(null);

  const autoSearchValue = location.state?.autoSearch;
  const currentPath = location.pathname;

  const [cart, setCart] = useState(() => {
    if (!store?.id) return [];

    const saved = localStorage.getItem(`cart_store_${store.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const cartSummary = useMemo(() => {
    return buildCartSummary({
      cart,
      menu,
    });
  }, [cart, menu]);

  const categories = useMemo(() => {
    return ["All", ...new Set(menu.flatMap((item) => item.tags || []))];
  }, [menu]);

  const subTotal = cartSummary.subtotal;

  const openModal = useCallback((item) => {
    if (item.stock <= 0 || item.available === false) return;

    setQuantity(1);
    setActiveItem(item);

    if (modalRef.current) {
      modalRef.current.showModal();
    }
  }, []);

  const addToCart = useCallback(() => {
    if (!activeItem) return;

    if (activeItem.stock <= 0 || activeItem.available === false) {
      alert("This item is currently out of stock.");
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === activeItem.id);
      const existingQuantity = existingItem?.quantity || 0;
      const newQuantity = existingQuantity + quantity;

      if (newQuantity > activeItem.stock) {
        alert(`Only ${activeItem.stock} unit(s) available.`);
        return prevCart;
      }

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === activeItem.id
            ? {
                ...item,
                quantity: newQuantity,
                price: activeItem.price,
                stock: activeItem.stock,
                name: activeItem.name,
                img: activeItem.img,
                category: activeItem.category,
                tags: activeItem.tags,
                currency: {
                  code: storeCurrencyCode,
                  locale: storeCurrencyLocale,
                },
              }
            : item
        );
      }

      return [
        ...prevCart,
        {
          id: activeItem.id,
          productId: activeItem.productId,
          name: activeItem.name,
          img: activeItem.img,
          tags: activeItem.tags,
          category: activeItem.category,
          price: activeItem.price,
          stock: activeItem.stock,
          quantity,
          currency: {
            code: storeCurrencyCode,
            locale: storeCurrencyLocale,
          },
        },
      ];
    });

    if (modalRef.current) {
      modalRef.current.close();
    }
  }, [activeItem, quantity, storeCurrencyCode, storeCurrencyLocale]);

  const increaseQty = () => {
    if (!activeItem) return;

    setQuantity((prev) => {
      if (prev >= activeItem.stock) {
        alert(`Only ${activeItem.stock} unit(s) available.`);
        return prev;
      }

      return prev + 1;
    });
  };

  const decreaseQty = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleCategoryFilter = useCallback((tag) => {
    setSelectedCategory(tag);
    setSearchTerm("");
  }, []);

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateCartQuantity = (productId, amount) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== productId) return item;

        const menuItem = menu.find((product) => product.id === productId);

        if (!menuItem) {
          alert("This item is no longer available at this store.");
          return item;
        }

        if (menuItem.available === false || Number(menuItem.stock || 0) <= 0) {
          alert("This item is currently unavailable.");
          return item;
        }

        const stock = Number(menuItem.stock || 0);
        const newQty = Number(item.quantity || 1) + amount;

        if (newQty < 1) {
          return { ...item, quantity: 1 };
        }

        if (newQty > stock) {
          alert(`Only ${stock} unit(s) available.`);
          return item;
        }

        return {
          ...item,
          quantity: newQty,
          price: menuItem.price,
          stock: menuItem.stock,
          name: menuItem.name,
          img: menuItem.img,
          category: menuItem.category,
          tags: menuItem.tags,
          currency: {
            code: storeCurrencyCode,
            locale: storeCurrencyLocale,
          },
        };
      })
    );
  };

  useEffect(() => {
    const syncCartToDB = async () => {
      if (!user?.uid || !store?.id) return;

      try {
        const cartRef = doc(db, "users", user.uid, "carts", store.id);

        if (cart.length === 0) {
          await deleteDoc(cartRef);
          return;
        }

        await setDoc(
          cartRef,
          {
            storeId: store.id,
            storeName: store.name,
            currency: {
              code: storeCurrencyCode,
              locale: storeCurrencyLocale,
            },
            items: cart,
            lastUpdated: new Date().toISOString(),
            cartTotal: cartSummary.subtotal,
            hasBlockedItems: cartSummary.blockedItems.length > 0,
          },
          { merge: true }
        );
      } catch (err) {
        console.error("DB Sync Error:", err);
      }
    };

    syncCartToDB();
  }, [
    cart,
    cartSummary.subtotal,
    cartSummary.blockedItems.length,
    user?.uid,
    store?.id,
    store?.name,
    storeCurrencyCode,
    storeCurrencyLocale,
  ]);

  const handleCheckout = () => {
    if (!cartSummary.canCheckout) return;

    if (!user) {
      localStorage.setItem("last_active_store_id", store.id);
      localStorage.setItem("pending_store", JSON.stringify(store));
      navigate("/signup");
      return;
    }

    navigate("/checkout", {
      state: {
        total: cartSummary.subtotal,
        cartItems: cartSummary.validItems,
        selectedStore: store,
      },
    });
  };

  useEffect(() => {
    const fetchStoreMenu = async () => {
      if (!store?.id) return;

      setLoading(true);

      try {
        const productsQuery = query(
          collection(db, "products"),
          where("isActive", "==", true)
        );

        const inventoryRef = collection(db, "stores", store.id, "inventory");

        const [productsSnapshot, inventorySnapshot] = await Promise.all([
          getDocs(productsQuery),
          getDocs(inventoryRef),
        ]);

        const inventoryMap = new Map();

        inventorySnapshot.docs.forEach((docSnap) => {
          const inventoryData = docSnap.data();
          const productId = inventoryData.productId || docSnap.id;

          inventoryMap.set(productId, {
            id: docSnap.id,
            productId,
            ...inventoryData,
          });
        });

        const items = productsSnapshot.docs
          .filter((docSnap) => inventoryMap.has(docSnap.id))
          .map((docSnap) => {
            const productId = docSnap.id;
            const product = docSnap.data();
            const inventory = inventoryMap.get(productId);

            const price = Number(inventory?.price);
            const stock = Number(inventory?.stock || 0);
            const available = inventory?.available ?? stock > 0;

            if (!Number.isFinite(price) || price <= 0) {
              console.warn(
                `Inventory item "${productId}" in store "${store.id}" has no valid price.`
              );

              return null;
            }

            return {
              id: productId,
              productId,

              name: product.name || "",
              description: product.description || product.about || "",
              about: product.about || product.description || "",
              img: product.img || "",
              tags: product.tags || [],
              category: product.category || "",

              price,
              stock,
              available,
            };
          })
          .filter(Boolean);

        setMenu(items);
        setFilteredMenu(items);
      } catch (error) {
        console.error("Error fetching store menu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreMenu();
  }, [store?.id]);

  useEffect(() => {
    if (store?.id) {
      localStorage.setItem(`cart_store_${store.id}`, JSON.stringify(cart));
      localStorage.setItem("pending_store", JSON.stringify(store));
    }
  }, [cart, store]);

  useEffect(() => {
    const filtered = menu.filter((item) => {
      const categoryMatch =
        selectedCategory === "All" ||
        (item.tags && item.tags.includes(selectedCategory));

      const searchMatch = item.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      return categoryMatch && searchMatch;
    });

    setFilteredMenu(filtered);
  }, [searchTerm, menu, selectedCategory]);

  useEffect(() => {
    if (!loading && menu.length > 0 && autoSearchValue && modalRef.current) {
      const relayedItem = menu.find(
        (item) => item.name.toLowerCase() === autoSearchValue.toLowerCase()
      );

      if (relayedItem) {
        setSearchTerm(autoSearchValue);

        if (relayedItem.stock > 0 && relayedItem.available !== false) {
          openModal(relayedItem);
        }
      }

      navigate(currentPath, {
        replace: true,
        state: { ...location.state, autoSearch: undefined },
      });
    }
  }, [
    loading,
    menu,
    autoSearchValue,
    currentPath,
    navigate,
    openModal,
    location.state,
  ]);

  if (!store) return <Navigate to="/stores" replace />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <section className="min-h-screen flex flex-col">
      <div className="mx-18 mt-13">
        <h1 className="text-7xl font-extrabold mb-13 leading-[1.2]">
          {store.name}
        </h1>

        <div className="flex gap-x-3">
          <div className="lg:w-200">
            <div className="w-fit mb-19 mx-auto">
              <ul className="steps font-bold">
                <li className="step step-primary">Select store</li>
                <li className="step step-primary">Select Product</li>
                <li className="step">Purchase</li>
                <li className="step">Receive Product</li>
              </ul>
            </div>

            <div className="flex justify-between mb-7">
              <form className="filter flex flex-nowrap lg:w-110 overflow-x-scroll no-scrollbar gap-2">
                {categories.map((tag) => {
                  const isActive = !searchTerm && selectedCategory === tag;

                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleCategoryFilter(tag)}
                      className={`btn rounded-full h-9 transition-all ${
                        isActive
                          ? "btn-primary shadow-md scale-105"
                          : "bg-white/50 border-none hover:bg-white text-gray-500"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </form>

              <label className="input rounded-xl flex items-center gap-2">
                <i className="bx bx-search opacity-50"></i>
                <input
                  type="search"
                  placeholder="Search menu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-6">
              {filteredMenu.length === 0 ? (
                <div className="w-full border border-dashed border-gray-300 rounded-3xl p-8 text-center text-gray-400">
                  <p className="font-bold text-lg text-gray-500">
                    No menu item found.
                  </p>
                  <p className="text-sm mt-1">
                    Try searching for another item or category.
                  </p>
                </div>
              ) : (
                filteredMenu.map((item) => {
                  const isOutOfStock =
                    item.stock <= 0 || item.available === false;
                  const isLowStock = item.stock > 0 && item.stock <= 5;

                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col max-w-95 sm:p-6 p-5 rounded-3xl overflow-hidden shadow-sm ${
                        isOutOfStock ? "bg-gray-100 opacity-70" : "bg-blue-200"
                      }`}
                    >
                      <h3 className="text-3xl font-extrabold line-clamp-1 mb-2">
                        {item.name}
                      </h3>

                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="flex-1 flex flex-col gap-2">
                          <p className="font-black text-lime-600 text-3xl">
                            {formatMoney(
                              item.price,
                              storeCurrencyCode,
                              storeCurrencyLocale
                            )}
                          </p>

                          <div className="flex gap-2 flex-wrap min-h-[24px]">
                            {item.tags?.map((tag, tIndex) => (
                              <span
                                key={tIndex}
                                className="badge font-semibold text-[11px] px-2 py-1 rounded-full bg-white/50 border-0"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          {isOutOfStock ? (
                            <span className="badge badge-error w-fit">
                              Out of stock
                            </span>
                          ) : isLowStock ? (
                            <span className="badge badge-warning w-fit">
                              Only {item.stock} left
                            </span>
                          ) : (
                            <span className="badge badge-success w-fit">
                              {item.stock} available
                            </span>
                          )}

                          <p className="font-light text-sm line-clamp-2">
                            {item.description}
                          </p>

                          <div className="flex gap-2 items-center mt-2 w-fit">
                            <button
                              type="button"
                              disabled={isOutOfStock}
                              onClick={() => openModal(item)}
                              className="font-bold border-0 badge py-4 rounded-xl bg-lime-300 hover:bg-lime-400 transition-colors hover:cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isOutOfStock ? "Out of stock" : "Place order"}
                            </button>
                          </div>
                        </div>

                        <div className="w-33 h-33 md:w-37 md:h-37 flex-shrink-0 ml-auto">
                          <div className="w-full h-full aspect-square overflow-hidden rounded-full shadow-md">
                            <img
                              src={item.img}
                              className="w-full h-full object-cover"
                              alt={item.name}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="lg:w-100 mx-auto relative">
            <ul className="list bg-base-100 rounded-3xl shadow-md w-85 sticky top-29 mx-auto pb-4">
              <li className="p-4 pb-2 text-lg font-extrabold opacity-60 tracking-wide">
                Order Summary ({cartSummary.itemCount})
              </li>

              {cartSummary.blockedItems.length > 0 && (
                <li className="mx-4 mb-2 rounded-2xl bg-red-50 text-red-700 p-3 text-xs font-semibold">
                  Some items are no longer available. Please remove or update
                  them before checkout.
                </li>
              )}

              {cartSummary.items.length === 0 ? (
                <li className="p-2 text-center opacity-40 font-bold">
                  Your cart is empty
                </li>
              ) : (
                cartSummary.items.map((item) => (
                  <li
                    key={item.id}
                    className={`list-row flex items-center px-4 py-2 ${
                      item.blocked ? "opacity-60" : ""
                    }`}
                  >
                    <div className="avatar avatar-placeholder">
                      <div
                        className={`font-bold text-neutral-content w-10 rounded-full ${
                          item.blocked ? "bg-red-200" : "bg-red-100"
                        }`}
                      >
                        <span className="text-md text-error">
                          {item.quantity}x
                        </span>
                      </div>
                    </div>

                    <div className="w-60 px-2">
                      <div className="font-bold truncate">{item.name}</div>

                      <div className="text-xs uppercase font-semibold opacity-60 truncate">
                        {item.tags?.[0] || "Item"}
                      </div>

                      <div className="text-xs font-bold opacity-70">
                        {formatMoney(
                          Number(item.price || 0) * Number(item.quantity || 0),
                          storeCurrencyCode,
                          storeCurrencyLocale
                        )}
                      </div>

                      {item.blocked && (
                        <div className="text-[10px] font-bold text-red-600 mt-1 leading-tight">
                          {item.blockReason}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 font-bold">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.id, -1)}
                        disabled={item.blocked && item.blockReason !== ""}
                        className="btn btn-circle h-7 w-7 btn-ghost bg-lime-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <i className="bx bx-minus"></i>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.id, 1)}
                        disabled={item.blocked}
                        className="btn btn-circle h-7 w-7 btn-ghost bg-lime-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <i className="bx bx-plus"></i>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="btn btn-square btn-ghost text-error"
                    >
                      <svg width="18" height="18" fill="currentColor">
                        <path d="M6 7H5v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7H6zm10.618-3L15 2H9L7.382 4H3v2h18V4z"></path>
                      </svg>
                    </button>
                  </li>
                ))
              )}

              <li className="flex mx-5 mt-6 justify-between border-t border-gray-300 pt-4">
                <p className="text-lg">Total</p>
                <p className="font-bold text-lg">
                  {formatMoney(
                    subTotal,
                    storeCurrencyCode,
                    storeCurrencyLocale
                  )}
                </p>
              </li>

              {!cartSummary.canCheckout && cartSummary.items.length > 0 && (
                <li className="mx-5 mt-3 text-xs font-semibold text-red-600">
                  Remove unavailable items before checkout.
                </li>
              )}

              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={!cartSummary.canCheckout}
                  className="btn btn-primary my-4 rounded-full w-70 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Order
                </button>
              </div>
            </ul>
          </div>
        </div>
      </div>

      <dialog
        ref={modalRef}
        id="product_modal"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box p-0 overflow-hidden bg-transparent shadow-none w-fit">
          <div className="card bg-base-100 w-96 shadow-2xl border border-gray-100">
            <figure className="px-5 pt-5 relative">
              <form method="dialog">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-7 top-7 bg-white/80 hover:bg-white">
                  ✕
                </button>
              </form>

              <img
                src={activeItem?.img}
                alt={activeItem?.name}
                className="rounded-2xl h-64 w-full object-cover"
              />
            </figure>

            <div className="card-body items-center text-center">
              <h2 className="card-title text-3xl font-black">
                {activeItem?.name}
              </h2>

              <p className="text-gray-500 mb-2">{activeItem?.description}</p>

              <p className="text-sm font-bold text-gray-500 mb-4">
                {activeItem?.stock} unit(s) available
              </p>

              <div className="flex items-center gap-6 bg-gray-100 p-2 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={decreaseQty}
                  className="btn btn-circle btn-sm bg-white border-none shadow-sm hover:bg-gray-200"
                >
                  <i className="bx bx-minus text-lg"></i>
                </button>

                <span className="text-2xl font-bold w-8">{quantity}</span>

                <button
                  type="button"
                  onClick={increaseQty}
                  className="btn btn-circle btn-sm bg-lime-300 border-none shadow-sm hover:bg-lime-400"
                >
                  <i className="bx bx-plus text-lg"></i>
                </button>
              </div>

              <div className="card-actions w-full">
                <button
                  type="button"
                  onClick={addToCart}
                  className="btn btn-primary w-full rounded-xl text-lg flex justify-between px-8"
                >
                  <span>Add to Cart</span>
                  <span className="opacity-70">
                    {formatMoney(
                      Number(activeItem?.price || 0) * quantity,
                      storeCurrencyCode,
                      storeCurrencyLocale
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </section>
  );
}
