import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase.js";
import { signOut } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";

const getGuestCartCount = () => {
  let count = 0;

  Object.keys(localStorage).forEach((key) => {
    if (!key.startsWith("cart_store_")) return;

    try {
      const cartItems = JSON.parse(localStorage.getItem(key) || "[]");

      count += cartItems.reduce((total, item) => {
        return total + Number(item.quantity || 0);
      }, 0);
    } catch (error) {
      console.error("Could not read local cart:", error);
    }
  });

  return count;
};

export default function Header() {
  const [signingOut, setSigningOut] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const { user, userInfo, userInfoLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid) {
      const updateGuestCartCount = () => {
        setCartCount(getGuestCartCount());
      };

      updateGuestCartCount();

      window.addEventListener("storage", updateGuestCartCount);
      window.addEventListener("maple-cart-updated", updateGuestCartCount);

      return () => {
        window.removeEventListener("storage", updateGuestCartCount);
        window.removeEventListener("maple-cart-updated", updateGuestCartCount);
      };
    }

    const cartsRef = collection(db, "users", user.uid, "carts");

    const unsubscribe = onSnapshot(cartsRef, (snapshot) => {
      const totalItems = snapshot.docs.reduce((total, cartDoc) => {
        const items = cartDoc.data()?.items || [];

        const cartTotal = items.reduce((sum, item) => {
          return sum + Number(item.quantity || 0);
        }, 0);

        return total + cartTotal;
      }, 0);

      setCartCount(totalItems);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleSignOut = async () => {
    if (!window.navigator.onLine) {
      toast.error("Internet connection required to sign out.");
      return;
    }

    setSigningOut(true);

    try {
      await signOut(auth);
      localStorage.clear();

      navigate("/signIn", { replace: true });

      toast.success("You have been signed out.");
    } catch (error) {
      toast.error("sign-out failed.");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="flex justify-center pt-3 mb-20">
      <nav className="navbar max-w-screen-xl w-[95%] lg:w-[90%] mx-auto px-4 sm:px-6 lg:px-8 bg-white/30 backdrop-blur-lg rounded-3xl py-3 pe-5 fixed z-10">
        <div className="navbar-start">
          {/* Mobile Dropdown */}
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </div>

            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
            >
              <li>
                <NavLink to="/">Home</NavLink>
              </li>

              <li>
                <a>Services</a>
                <ul className="p-2">
                  <li>
                    <a>Book a Space</a>
                  </li>
                  <li>
                    <NavLink to="/stores">Our Store</NavLink>
                  </li>
                  <li>
                    <NavLink to="/cart">Cart</NavLink>
                  </li>
                </ul>
              </li>

              <li>
                <a>Contact</a>
              </li>
            </ul>
          </div>

          {/* Desktop Menu */}
          <ul className="menu menu-horizontal hidden lg:flex px-1">
            <li>
              <NavLink to="/" className="font-bold">
                Home
              </NavLink>
            </li>

            <li className="font-bold btn-ghost rounded-lg list-none">
              <div className="dropdown dropdown-hover group h-[34px] flex items-center">
                <div
                  tabIndex={0}
                  role="button"
                  className="flex items-center gap-1 mx-1 cursor-pointer"
                >
                  Services
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m19.5 8.25-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </div>

                <div className="dropdown-content z-[1] pt-4 w-full top-[25px] right-2 bg-transparent">
                  <ul className="menu p-2 shadow bg-base-100 rounded-box min-w-45 mx-0 border-none before:hidden">
                    <li>
                      <a>Book a space</a>
                    </li>
                    <li>
                      <NavLink to="/stores">Our Store</NavLink>
                    </li>
                  </ul>
                </div>
              </div>
            </li>

            <li>
              <a className="font-bold">Contact</a>
            </li>
          </ul>
        </div>

        <div className="navbar-center flex">
          <NavLink to="/" className="text-3xl font-extrabold flex items-center">
            Maple{" "}
            <img
              src="/images/bx-coffee-togo.svg"
              className="w-6 lg:mt-[7px]"
              alt="logo"
            />
          </NavLink>
        </div>

        <div className="navbar-end flex items-center gap-2">
          {/* Search and Cart Icons */}
          <button className="avatar aspect-square border rounded-full border-black w-11 hidden lg:flex justify-center items-center">
            <i className="bx bx-search"></i>
          </button>

          {/* Cart Dropdown */}
          <div className="dropdown dropdown-end hidden lg:block">
            <div
              tabIndex={0}
              role="button"
              className="avatar aspect-square border rounded-full border-black w-11 flex justify-center items-center relative cursor-pointer"
              aria-label={`Cart with ${cartCount} item(s)`}
            >
              <i className="bx bx-cart"></i>

              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-error text-white text-[11px] font-black flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </div>

            <div
              tabIndex={0}
              className="card card-compact dropdown-content bg-base-100 z-[50] mt-4 w-64 shadow-xl"
            >
              <div className="card-body">
                <span className="text-lg font-bold">
                  {cartCount} {cartCount === 1 ? "Item" : "Items"}
                </span>

                <span className="text-sm text-gray-500">
                  {cartCount > 0
                    ? "You have items waiting in your cart."
                    : "Your cart is currently empty."}
                </span>

                <div className="card-actions mt-3">
                  <NavLink to="/cart" className="btn btn-primary btn-block">
                    View cart
                  </NavLink>
                </div>
              </div>
            </div>
          </div>

          {userInfoLoading ? (
            <div className="flex items-center justify-center w-11 h-11">
              <span className="loading loading-spinner loading-sm opacity-30"></span>
            </div>
          ) : !user ? (
            <div className="flex gap-2 ms-2">
              <NavLink
                to="/signin"
                className="btn btn-ghost btn-sm rounded-xl font-bold"
              >
                Login
              </NavLink>

              <NavLink
                to="/signup"
                className="btn btn-primary btn-sm rounded-xl font-bold px-5"
              >
                Sign Up
              </NavLink>
            </div>
          ) : (
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="avatar aspect-square rounded-full border border-black w-11 flex justify-center items-center cursor-pointer"
              >
                <i className="bx bx-user text-xl"></i>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box z-[1] w-85 p-0 pb-5 shadow mt-4"
              >
                <NavLink
                  to="/account"
                  className="flex items-center gap-x-2 group hover:bg-base-200/50 px-4 py-3 rounded-lg transition-colors"
                >
                  <div className="avatar placeholder">
                    <div className="bg-black text-white rounded-full w-12 aspect-square text-center">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt="Profile"
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="text-sm font-bold my-3">
                          {user.displayName
                            ? user.displayName
                                .split(" ")
                                .slice(0, 2)
                                .map((n) => n.charAt(0).toUpperCase())
                                .join("")
                            : user.email.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-left cursor-pointer">
                    <p className="text-[17px] font-semibold capitalize text-black group-hover:underline">
                      {user?.displayName}
                    </p>
                    <p className="font-medium text-[13px] text-gray-500 group-hover:underline">
                      {user?.email}
                    </p>
                    <p className="font-medium capitalize text-sm text-black group-hover:underline">
                      {userInfo?.state &&
                        userInfo?.country &&
                        `${userInfo.state}, ${userInfo.country}`}
                    </p>
                  </div>

                  <i className="bx bx-pencil bx-xs ms-auto"></i>
                </NavLink>

                <hr className="opacity-10" />

                <ul className="flex flex-col gap-y-2 mt-2 font-semibold px-2">
                  <li>
                    <a>
                      <i className="bx bx-xs bx-package"></i>
                      Orders
                    </a>
                  </li>

                  
                  <li>
                    <a>
                      <i className="bx bx-xs bx-calendar-check"></i>
                      Bookings
                    </a>
                  </li>

                  <li>
                    <a>
                      <i className="bx bx-xs bx-book-bookmark"></i>
                      Library
                    </a>
                  </li>

                  <li>
                    <a>
                      <i className="bx bx-xs bx-help-circle"></i>
                      Help Center
                    </a>
                  </li>

                  <li>
                    <a>
                      <i className="bx bx-xs bx-cog"></i>
                      Account Settings
                    </a>
                  </li>

                  <li>
                    <button
                      onClick={handleSignOut}
                      className="text-error font-bold hover:bg-error/10"
                      disabled={signingOut}
                    >
                      <i className="bx bx-xs bx-log-out"></i>{" "}
                      {signingOut ? "Signing Out..." : "Sign Out"}
                    </button>
                  </li>
                </ul>
              </ul>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
