import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { useStoreCart } from "../hooks/useStoreCart";
import { formatMoney } from "../utils/cartUtils";
import { savePendingStore } from "../utils/guestCartStorage";

export default function Order() {
  const navigate = useNavigate();
  const location = useLocation();
  const modalRef = useRef(null);

  const store = location.state?.selectedStore;
  const initialSearch = location.state?.autoSearch || "";
  const autoSearchValue = location.state?.autoSearch;
  const currentPath = location.pathname;

  const { user } = useAuth();

  const storeCurrencyCode = store?.currency?.code || "USD";
  const storeCurrencyLocale = store?.currency?.locale || "en-US";

  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const {
    cartSummary,
    cartLoading,
    cartActionLoading,
    addToCart,
    removeFromCart,
    updateCartQuantity,
  } = useStoreCart({
    user,
    store,
    inventoryItems: menu,
  });

  const categories = useMemo(() => {
    return ["All", ...new Set(menu.flatMap((item) => item.tags || []))];
  }, [menu]);

  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      const categoryMatch =
        selectedCategory === "All" ||
        (item.tags && item.tags.includes(selectedCategory));

      const searchMatch = item.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      return categoryMatch && searchMatch;
    });
  }, [menu, searchTerm, selectedCategory]);

  const openModal = useCallback((item) => {
    if (item.stock <= 0 || item.available === false) return;

    setQuantity(1);
    setActiveItem(item);

    modalRef.current?.showModal();
  }, []);

  const closeModal = useCallback(() => {
    modalRef.current?.close();
  }, []);

  const handleAddToCart = useCallback(async () => {
    if (!activeItem) return;

    const result = await addToCart({
      item: activeItem,
      quantity,
    });

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success("Item added to cart.");
    closeModal();
  }, [activeItem, addToCart, closeModal, quantity]);

  const increaseQty = useCallback(() => {
    if (!activeItem) return;

    setQuantity((previousQuantity) => {
      if (previousQuantity >= Number(activeItem.stock || 0)) {
        toast.error(`Only ${activeItem.stock} unit(s) available.`);
        return previousQuantity;
      }

      return previousQuantity + 1;
    });
  }, [activeItem]);

  const decreaseQty = useCallback(() => {
    setQuantity((previousQuantity) => {
      return previousQuantity > 1 ? previousQuantity - 1 : 1;
    });
  }, []);

  const handleCategoryFilter = useCallback((tag) => {
    setSelectedCategory(tag);
    setSearchTerm("");
  }, []);

  const handleRemoveFromCart = useCallback(
    async (productId) => {
      const result = await removeFromCart(productId);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success("Item removed from cart.");
    },
    [removeFromCart]
  );

  const handleUpdateCartQuantity = useCallback(
    async (productId, amount) => {
      const result = await updateCartQuantity({
        productId,
        amount,
      });

      if (!result.success) {
        toast.error(result.message);
      }
    },
    [updateCartQuantity]
  );

  const handleCheckout = useCallback(() => {
    if (!cartSummary.canCheckout) return;

    if (!user) {
      savePendingStore(store);

      navigate("/signin", {
        state: {
          authNotice:
            "Please sign in or create an account before checking out.",
        },
      });

      return;
    }

    navigate("/checkout", {
      state: {
        total: cartSummary.subtotal,
        cartItems: cartSummary.validItems,
        selectedStore: store,
      },
    });
  }, [cartSummary, navigate, store, user]);

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
              name: inventory.name || product.name || "",
              description:
                inventory.description ||
                product.description ||
                product.about ||
                "",
              about:
                inventory.about ||
                inventory.description ||
                product.about ||
                product.description ||
                "",
              img: inventory.img || product.img || "",
              tags: inventory.tags || product.tags || [],
              category: inventory.category || product.category || "",
              price,
              stock,
              available,
              isActive: inventory.isActive ?? true,
            };
          })
          .filter(Boolean);

        setMenu(items);
      } catch (error) {
        console.error("Error fetching store menu:", error);
        toast.error("Failed to load store menu. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchStoreMenu();
  }, [store?.id]);

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
        state: {
          ...location.state,
          autoSearch: undefined,
        },
      });
    }
  }, [
    autoSearchValue,
    currentPath,
    loading,
    location.state,
    menu,
    navigate,
    openModal,
  ]);

  if (!store) return <Navigate to="/stores" replace />;

  if (loading || cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <section className="min-h-screen flex flex-col">
      <div className="mx-18 mt-13">
        <div
          onClick={() => navigate("/stores")}
          className="group flex w-fit items-center font-bold cursor-pointer"
        >
          <button
            type="button"
            className="btn btn-soft shadow-none w-8 h-8 me-2 rounded-full"
          >
            <i className="bx bx-chevron-left bx-sm transition-transform group-hover:-translate-x-1"></i>
          </button>

          <span className="border-b border-dashed">Back to stores</span>
        </div>

        <h1 className="text-7xl font-extrabold mb-10 mt-6 leading-[1.2]">
          {store.name}
        </h1>
        <div className="flex gap-x-3">
          <div className="lg:w-200">
            <div className="w-fit mb-19 mx-aut">
              <ul className="steps font-bold">
                <li className="step step-success">Select store</li>
                <li className="step step-success">Select Product</li>
                <li className="step">Purchase</li>
                <li className="step">Receive Product</li>
              </ul>
            </div>

            <div className="flex justify-between mb-7">
              <form className="filter flex flex-nowrap lg:w-110 overflow-x-scroll no-scrollbar gap-2  ps-1">
                {categories.map((tag) => {
                  const isActive = !searchTerm && selectedCategory === tag;

                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleCategoryFilter(tag)}
                      className={`btn rounded-full h-9 transition-all ${
                        isActive
                          ? "btn-neutral text-neutral-content"
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
                  onChange={(event) => setSearchTerm(event.target.value)}
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
                        isOutOfStock
                          ? "bg-gray-100 opacity-70"
                          : "bg-primary text-white"
                      }`}
                    >
                      <h3 className="text-3xl font-extrabold line-clamp-1 mb-2">
                        {item.name}
                      </h3>

                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="flex-1 flex flex-col gap-2">
                          <p className="font-black text- text-3xl text-primary-content">
                            {formatMoney(
                              item.price,
                              storeCurrencyCode,
                              storeCurrencyLocale
                            )}
                          </p>

                          {isOutOfStock ? (
                            <span className="w-fit text-error w-fit">
                              <i class="bx bx-info-circle"></i> Out of stock
                            </span>
                          ) : isLowStock ? (
                            <span className="w-fit text-accent font-bold">
                              <i class="bx bx-info-circle"></i> {item.stock}{" "}
                              available
                            </span>
                          ) : (
                            <span className="w-fit text-accent font-bold">
                              <i class="bx bx-info-circle"></i> {item.stock}{" "}
                              available
                            </span>
                          )}

                          <p className="text-sm line-clamp-2">
                            {item.description}
                          </p>

                          <div className="flex gap-2 items-center mt-2 w-fit">
                            <button
                              type="button"
                              disabled={isOutOfStock}
                              onClick={() => openModal(item)}
                              className="font-bold border-0 rounded-xl h-7 btn btn-secondary transition-colors hover:cursor-point text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

          <div className="lg:w-100 relative pt-35">
            <ul className="list ms-auto pt-5 bg-base-100 rounded-3xl shadow-md w-90 sticky top-29 pb-4">
              <li className="mx-5 text-lg font-extrabold tracking-wide">
                Order Summary
              </li>
              <li className="mx-5 mb-2 mt-1 font-bold tracking-wide">
                Items: {cartSummary.itemCount}
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
                    key={item.productId || item.id}
                    className={`list-row flex items-center gap-x-1 py-2 after:hidden before:hidden ${
                      item.blocked ? "opacity-60 " : ""
                    }`}
                  >
                    <div className="avatar avatar-placeholder text-md ">
                      <div
                        className={`font-bold w-10 rounded-full bg-neutral text-primary-content`}
                      >
                        <span>{item.quantity}x</span>
                      </div>
                    </div>

                    <div className="w-60 px-2">
                      <div className="font-bold truncate max-w-35 text-wrap">
                        {item.name}
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
                        onClick={() =>
                          handleUpdateCartQuantity(
                            item.productId || item.id,
                            -1
                          )
                        }
                        disabled={
                          cartActionLoading ||
                          (item.blocked && item.blockReason !== "")
                        }
                        className="btn btn-circle h-7 w-7 bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <i className="bx bx-minus"></i>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateCartQuantity(item.productId || item.id, 1)
                        }
                        disabled={cartActionLoading || item.blocked}
                        className="btn btn-circle h-7 w-7 bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <i className="bx bx-plus"></i>
                      </button>
                    </div>

                    <p
                      onClick={() =>
                        handleRemoveFromCart(item.productId || item.id)
                      }
                      disabled={cartActionLoading}
                      className="ms-1 me-1 text-error disabled:opacity-40 cursor-pointer"
                    >
                      <svg width="18" height="18" fill="currentColor">
                        <path d="M6 7H5v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7H6zm10.618-3L15 2H9L7.382 4H3v2h18V4z"></path>
                      </svg>
                    </p>
                  </li>
                ))
              )}
              <li className="flex mx-5 mt-3 justify-between border-t border-gray-300 pt-4">
                <p className="text-[16px]">Sub total</p>
                <p className="text-[16px]">
                  {formatMoney(
                    cartSummary.subtotal,
                    storeCurrencyCode,
                    storeCurrencyLocale
                  )}
                </p>
              </li>
              <li className="flex mx-5 mt-2 justify-between">
                <p className="text-[16px] font-bold">Total</p>
                <p className="text-[16px] font-bold">
                  {formatMoney(
                    cartSummary.subtotal,
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
                  disabled={!cartSummary.canCheckout || cartActionLoading}
                  className="btn btn-neutral my-4 rounded-full w-70 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Order
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
                  onClick={handleAddToCart}
                  disabled={cartActionLoading}
                  className="btn btn-primary w-full rounded-xl text-lg flex justify-between px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{cartActionLoading ? "Adding..." : "Add to Cart"}</span>
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
