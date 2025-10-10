export default function Header() {
  return (
    <div className="flex justify-center pt-3">
      <div className="navbar bg-base-100 w-[85%]">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {" "}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />{" "}
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
            >
              <li>
                <a>Item 1</a>
              </li>
              <li>
                <a>Parent</a>
                <ul className="p-2">
                  <li>
                    <a>Submenu 1</a>
                  </li>
                  <li>
                    <a>Submenu 2</a>
                  </li>
                </ul>
              </li>
              <li>
                <a>Item 3</a>
              </li>
            </ul>
          </div>
          <ul className="menu menu-horizontal px-1">
            <li>
              <a className="font-bold">Home</a>
            </li>
            <li className="font-bold">
              <details>
                <summary>Services</summary>
                <ul className="p-2 min-w-40">
                  <li>
                    <a>Submenu 1</a>
                  </li>
                  <li>
                    <a>Submenu 2</a>
                  </li>
                </ul>
              </details>
            </li>
            <li>
              <a className="font-bold">About Us</a>
            </li>
            <li>
              <a className="font-bold">Contact</a>
            </li>
          </ul>
        </div>
        <div className="navbar-center hidden lg:flex">
          <a className="text-3xl font-extrabold flex items-center">
            Maple{" "}
            <img
              src="/images/bx-coffee-togo.svg"
              className="w-6 mt-[7px]"
              alt=""
            />
          </a>
        </div>
        <div className="navbar-end avatar-group">
          <a
            href=""
            className="avatar aspect-square border border-black w-11 flex justify-center items-center me-2"
          >
            <i className="bx bx-search"></i>
          </a>
          <a
            href=""
            className="avatar aspect-square border border-black w-11 flex justify-center items-center me-2"
          >
            <i className="bx bx-cart" style={{ fontWeight: "bod" }}></i>
          </a>
          <a
            href=""
            className="avatar aspect-square border border-black w-11 flex justify-center items-center"
          >
            <i className="bx bx-user"></i>
          </a>
        </div>
      </div>
    </div>
  );
}
