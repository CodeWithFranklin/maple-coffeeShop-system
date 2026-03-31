import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useState, useEffect } from "react";

export default function Order() {
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState([]); // This holds the "Master List" from DB for this store
  const [filteredMenu, setFilteredMenu] = useState([]); // This holds what is actually displayed (after search/filter)
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const store = location.state?.selectedStore;

  const [activeItem, setActiveItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [cart, setCart] = useState(() => {
    if (!store?.id) return [];
    const saved = localStorage.getItem(`cart_store_${store.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Store Menu from Firestore
  useEffect(() => {
    const fetchStoreMenu = async () => {
      if (!store?.id) return;

      setLoading(true);
      try {
       const q = query(
         collection(db, "products"),
         where("availableAt", "array-contains", store.id)
       );

        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMenu(items);
        setFilteredMenu(items); // Initialize filtered menu with full store menu
      } catch (error) {
        console.error("Error fetching menu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreMenu();
  }, [store]);

  // 3. LocalStorage Sync
  useEffect(() => {
    if (store?.id) {
      localStorage.setItem(`cart_store_${store.id}`, JSON.stringify(cart));
      localStorage.setItem("pending_store", JSON.stringify(store));
    }
  }, [cart, store]);

  // 4. Handle Search (Real-time filtering)
  useEffect(() => {
    const results = menu.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMenu(results);
  }, [searchTerm, menu]);

  if (!store) {
    return <Navigate to="/store" replace />;
  }

  // --- Handlers ---

  const handleCategoryFilter = (tag) => {
    if (tag === "All") {
      setFilteredMenu(menu);
    } else {
      const filtered = menu.filter((item) => item.tags.includes(tag));
      setFilteredMenu(filtered);
    }
  };

  // --- Modal Quantity Helpers ---
  // These stay OUTSIDE addToCart so the Plus/Minus buttons can reach them
  const increaseQty = () => setQuantity((prev) => prev + 1);
  const decreaseQty = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  // --- Cart Actions ---
  const addToCart = () => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === activeItem.id);

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === activeItem.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...activeItem, quantity: quantity }];
    });

    document.getElementById("product_modal").close();
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const updateCartQuantity = (productId, amount) => {
    setCart(
      cart.map((item) => {
        if (item.id === productId) {
          const newQty = item.quantity + amount;
          return { ...item, quantity: newQty > 0 ? newQty : 1 };
        }
        return item;
      })
    );
  };

  const handleCheckout = () => {
    if (!user) {
      localStorage.setItem("last_active_store_id", store.id);
      localStorage.setItem("pending_store", JSON.stringify(store));
      navigate("/signup");
    } else {
      console.log("Processing order...", cart);
    }
  };

  const openModal = (item) => {
    setQuantity(1);
    setActiveItem(item);
    document.getElementById("product_modal").showModal();
  };

  const subTotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

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
          <span className="text-lime-300">yo</span>
        </h1>
        <div className="flex gap-x-3">
          <div className="lg:w-200">
            <div className="mb- w-fit mb-19 mx-auto">
              <ul className="steps font-bold ">
                <li className="step step-primary">Select store</li>
                <li className="step step-primary">Select Product</li>
                <li className="step">Purchase</li>
                <li className="step">Receive Product</li>
              </ul>
            </div>
            <div className="flex justify-between mb-7">
              <form className="filter flex flex-nowrap lg:w-110 overflow-x-scroll no-scrollbar gap-2">
                <button
                  type="button"
                  onClick={() => handleCategoryFilter("All")}
                  className="btn btn-square h-9"
                >
                  All
                </button>
                {/* Dynamically create category buttons from tags */}
                {["Cafe", "Hot", "Green"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleCategoryFilter(tag)}
                    className="btn rounded-full h-9"
                  >
                    {tag}
                  </button>
                ))}
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
            <p className="w-fit font-bold ms-5 mb-5 ">
              Available at {store.name}
            </p>
            <div>
              <div className="flex flex-wrap lg:justify-center gap-6">
                {filteredMenu
                  .filter((item) =>
                    item.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((menu, index) => (
                    <div
                      key={index}
                      className="flex flex-col max-w-95 sm:p-6 p-5 rounded-3xl bg-blue-200 overflow-hidden shadow-sm"
                    >
                      {/* Title */}
                      <h3 className="text-3xl font-extrabold line-clamp-1 mb-2">
                        {menu.name}
                      </h3>

                      {/* Content Split: Left (Text) and Right (Circle) */}
                      <div className="flex items-center gap-2 overflow-hidden">
                        {/* Text Side */}
                        <div className="flex-1 flex flex-col gap-2">
                          <p className="font-black text-lime-600 text-3xl">
                            {menu.price}$
                          </p>

                          {/* Tags */}
                          <div className="flex gap-2 flex-wrap min-h-[24px]">
                            {menu.tags.map((tag, tIndex) => (
                              <span
                                key={tIndex}
                                className="badge font-semibold text-[11px] px-2 py-1 rounded-full bg-white/50 border-0"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          {/* Description */}
                          <p
                            className="font-light text-sm line-clamp-2"
                            title={menu.about}
                          >
                            {menu.about}
                          </p>

                          {/* Action Buttons */}
                          <div className="flex gap-2 items-center mt-2 w-fit">
                            <button
                              onClick={() => openModal(menu)}
                              className="font-bold border-0 badge py-4 rounded-xl bg-lime-300 hover:bg-lime-400 transition-colors hover:cursor-pointer text-sm"
                            >
                              Place order
                            </button>
                            <button
                              className="px-2 py-2 flex items-center rounded-full bg-white/40 hover:bg-white/60  hover:cursor-pointer tooltip tooltip-top"
                              data-tip="view menu"
                            >
                              <i className="bx bxs-food-menu text-lg"></i>
                            </button>
                          </div>
                        </div>

                        {/* Image Side (The Circle) */}
                        <div className="w-33 h-33 md:w-37 md:h-37 flex-shrink-0 ml-auto">
                          <div className="w-full h-full aspect-square overflow-hidden rounded-full shadow-md">
                            <img
                              src={menu.img}
                              className="w-full h-full object-cover"
                              alt={menu.name}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <div className="lg:w-100 mx-auto relative">
            <ul className="list bg-base-100 rounded-3xl shadow-md w-85 sticky top-29 mx-auto pb-4">
              <li className="p-4 pb-2 text-lg font-extrabold opacity-60 tracking-wide">
                Order Summary ({cart.length})
              </li>

              {cart.length === 0 ? (
                <li className="p-2 text-center opacity-40 font-bold">
                  Your cart is empty
                </li>
              ) : (
                cart.map((item) => (
                  <li
                    key={item.id}
                    className="list-row flex items-center px-4 py-2"
                  >
                    <div className="avatar avatar-placeholder">
                      <div className="bg-red-100 font-bold text-neutral-content w-10 rounded-full">
                        <span className="text-md text-error">
                          {item.quantity}x
                        </span>
                      </div>
                    </div>

                    <div className="w-60 px-2">
                      <div className="font-bold truncate">{item.name}</div>
                      <div className="text-xs uppercase font-semibold opacity-60 truncate">
                        {item.tags[0] || "Beverage"}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 font-bold">
                      <button
                        onClick={() => updateCartQuantity(item.id, -1)}
                        className="btn btn-circle h-7 w-7 btn-ghost bg-lime-200"
                      >
                        <i className="bx bx-minus"></i>
                      </button>
                      <button
                        onClick={() => updateCartQuantity(item.id, 1)}
                        className="btn btn-circle h-7 w-7 btn-ghost bg-lime-200"
                      >
                        <i className="bx bx-plus"></i>
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="btn btn-square btn-ghost text-error"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M6 7H5v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7H6zm10.618-3L15 2H9L7.382 4H3v2h18V4z"></path>
                      </svg>
                    </button>
                  </li>
                ))
              )}

              {/* Totals Section */}
              <li className="flex mx-5 mt-6 justify-between border-t border-gray-300 pt-4">
                <p className="text-lg">Sub Total</p>
                <p className="font-semibold text-lg my-auto w-fit">
                  ${subTotal.toFixed(2)}
                </p>
              </li>
              <li className="flex mx-5 text-lg font-bold justify-between">
                <p>Total</p>
                <p className="font-bold text-lg my-auto w-fit">
                  ${subTotal.toFixed(2)}
                </p>
              </li>

              <div className="flex justify-center mt-4">
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="btn btn-primary my-4 rounded-full w-70 mx-auto"
                >
                  Order
                </button>
              </div>
            </ul>
          </div>
        </div>
      </div>

      {/* PRODUCT MODAL */}
      <dialog id="product_modal" className="modal modal-bottom sm:modal-middle">
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
              <p className="text-gray-500 mb-4">{activeItem?.about}</p>

              {/* QUANTITY REGULATOR */}
              <div className="flex items-center gap-6 bg-gray-100 p-2 rounded-2xl mb-6">
                <button
                  onClick={decreaseQty}
                  className="btn btn-circle btn-sm bg-white border-none shadow-sm hover:bg-gray-200"
                >
                  <i className="bx bx-minus text-lg"></i>
                </button>

                <span className="text-2xl font-bold w-8">{quantity}</span>

                <button
                  onClick={increaseQty}
                  className="btn btn-circle btn-sm bg-lime-300 border-none shadow-sm hover:bg-lime-400"
                >
                  <i className="bx bx-plus text-lg"></i>
                </button>
              </div>

              <div className="card-actions w-full">
                <button
                  onClick={addToCart}
                  className="btn btn-primary w-full rounded-xl text-lg flex justify-between px-8"
                >
                  <span>Add to Cart</span>
                  <span className="opacity-70">
                    ${(activeItem?.price * quantity).toFixed(2)}
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
