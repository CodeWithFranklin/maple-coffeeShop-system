import { NavLink } from "react-router-dom";

export default function Header() {
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
                <a>Home</a>
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

            {/* THE FIXED DROPDOWN */}
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

                {/* THE GHOST WRAPPER */}
                <div className="dropdown-content z-[1] pt-4 w-full top-[25px] right-2 bg-transparent">
                  {/* THE ACTUAL VISIBLE CONTENT */}
                  <ul
                    className="menu p-2 shadow bg-base-100 rounded-box min-w-45 mx-0 
               border-l-0 before:hidden border-none"
                  >
                    {/* Added 'border-l-0' and 'before:hidden' to kill the gray line */}
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
          <a className="text-3xl font-extrabold flex items-center">
            Maple{" "}
            <img
              src="/images/bx-coffee-togo.svg"
              className="w-6 lg:mt-[7px]"
              alt="logo"
            />
          </a>
        </div>

        <div className="navbar-end avatar-group">
          <a
            href=""
            className="avatar aspect-square border border-black w-11 hidden lg:flex justify-center items-center me-2"
          >
            <i className="bx bx-search"></i>
          </a>
          <NavLink
            to="/cart"
            className="avatar aspect-square border border-black w-11 hidden lg:flex justify-center items-center me-2"
          >
            <i className="bx bx-cart"></i>
          </NavLink>
          <NavLink
            to="/signUp"
            className="avatar aspect-square border border-black w-11 flex justify-center items-center"
          >
            <i className="bx bx-user"></i>
          </NavLink>
        </div>
      </nav>
    </header>
  );
}
