import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { auth } from "../firebase.js";
import { signOut } from "firebase/auth";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";

export default function Header() {
  const [signingOut, setSigningOut] = useState(false);
  const { user, userInfo, userInfoLoading } = useAuth();
  const navigate = useNavigate();

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
                    <NavLink to="/store">Our Store</NavLink>
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
                      <NavLink to="/store">Our Store</NavLink>
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
          <NavLink
            to="/order"
            className="avatar aspect-square border rounded-full border-black w-11 hidden lg:flex justify-center items-center"
          >
            <i className="bx bx-cart"></i>
          </NavLink>
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
                className="dropdown-content menu bg-base-100 rounded-box z-[1] w-85 p-2 pb-4 shadow mt-4"
              >
                <li className="menu-title flex flex-row items-center gap-x-2 text-black">
                  {user.photoURL ? (
                    <img
                      className="aspect-square w-12 h-12 rounded-full border-2 border-gray-300 object-cover"
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                    />
                  ) : (
                    <div className="aspect-square w-12 h-12 rounded-full bg-neutral text-neutral-content border-2 border-gray-300 flex items-center justify-center">
                      <span className="text-sm font-bold">
                        {user.displayName
                          ? user.displayName
                              .split(" ")
                              .slice(0, 2)
                              .map((n) => n.charAt(0).toUpperCase())
                              .join("")
                          : user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-[17px] font-semibold">
                      {user.displayName}
                    </p>
                    <p className="font-medium text-[13px] text-gray-500">
                      {user.email}
                    </p>
                    <p className="font-medium">
                      {userInfo?.state &&
                        userInfo?.country &&
                        `${userInfo.state}, ${userInfo.country}`}
                    </p>
                  </div>
                  <p className="ms-4 ms-auto me-3">
                    <i className="bx bx-pencil bx-xs"></i>
                  </p>
                </li>
                <hr className="opacity-10" />

                <ul className="flex flex-col gap-y-2 mt-2 font-semibold">
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
                  </li>{" "}
                  <li>
                    <button
                      onClick={handleSignOut}
                      className="text-error font-bold hover:bg-error/10"
                      disabled={signingOut}
                    >
                      <i className="bx bx-xs bx-log-out"></i> Sign Out
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
