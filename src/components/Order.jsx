import { useLocation, Navigate } from "react-router-dom";
import { useState } from "react";
import { menuList } from "./ListItems";

export default function Order() {
  const location = useLocation();
  const store = location.state?.selectedStore;

  // Redirect if someone tries to access /order without picking a store
  if (!store) return <Navigate to="/store" replace />;

  // LOGIC: Filter menu items that are available at THIS store's ID
  const storeSpecificMenu = menuList.filter((item) =>
    item.availableAt.includes(store.id)
  );

  const [filteredMenu, setFilteredMenu] = useState(storeSpecificMenu);
  const [searchTerm, setSearchTerm] = useState("");

  // Handle category filtering (e.g., Cafe, Green)
  const handleCategoryFilter = (tag) => {
    if (tag === "All") {
      setFilteredMenu(storeSpecificMenu);
    } else {
      const filtered = storeSpecificMenu.filter((item) =>
        item.tags.includes(tag)
      );
      setFilteredMenu(filtered);
    }
  };
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
                              onClick={() =>
                                document
                                  .getElementById("my_modal_3")
                                  .showModal()
                              }
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
            <ul className="list bg-base-100 rounded-3xl shadow-md w-85 sticky top-29 mx-auto">
              <li className="p-4 pb-2 text-lg font-extrabold opacity-60 tracking-wide">
                Order Summary{" "}
              </li>

              <li className="list-row flex items-center">
                <div className="avatar avatar-placeholder">
                  <div className="bg-red-100 font-bold text-neutral-content w-10 rounded-full">
                    <span className="text-md text-error">2x</span>
                  </div>
                </div>
                <div className="w-60">
                  <div className="font-bold">Ellie Beilish</div>
                  <div className="text-xs uppercase font-semibold opacity-60">
                    Bears of a fever
                  </div>
                </div>
                <div className="flex items-center gap-2 font-bold">
                  <button className="btn btn-circle h-8 w-8 btn-ghost bg-lime-200">
                    <i className="bx bx-minus"></i>
                  </button>
                  <button className="btn btn-circle h-8 w-8 btn-ghost bg-lime-200">
                    <i className="bx bx-plus"></i>
                  </button>
                </div>
                <button className="btn btn-square btn-ghost">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    style={{ fill: "rgba(0, 0, 0, 1);transform: ;msFilter:;" }}
                  >
                    <path d="M6 7H5v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7H6zm10.618-3L15 2H9L7.382 4H3v2h18V4z"></path>
                  </svg>
                </button>
              </li>

              <li className="list-row flex items-center">
                <div className="avatar avatar-placeholder">
                  <div className="bg-red-100 font-bold text-neutral-content w-10 rounded-full">
                    <span className="text-md text-error">2x</span>
                  </div>
                </div>
                <div className="w-60">
                  <div className="font-bold">Ellie Beilish</div>
                  <div className="text-xs uppercase font-semibold opacity-60">
                    Bears of a fever
                  </div>
                </div>
                <div className="flex items-center gap-2 font-bold">
                  <button className="btn btn-circle h-8 w-8 btn-ghost bg-lime-200">
                    <i className="bx bx-minus"></i>
                  </button>
                  <button className="btn btn-circle h-8 w-8 btn-ghost bg-lime-200">
                    <i className="bx bx-plus"></i>
                  </button>
                </div>
                <button className="btn btn-square btn-ghost">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    style={{ fill: "rgba(0, 0, 0, 1);transform: ;msFilter:;" }}
                  >
                    <path d="M6 7H5v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7H6zm10.618-3L15 2H9L7.382 4H3v2h18V4z"></path>
                  </svg>
                </button>
              </li>

              <li className="flex mx-5 my-4 justify-between">
                <p className="text-lg">Sub Total</p>
                <p className="font-semibold text-lg my-auto w-fit">$400</p>
              </li>
              <li className="flex mx-5 text-lg font-bold justify-between">
                <p>Total</p>
                <p className="font-bold text-lg my-auto w-fit">$400</p>
              </li>
              <button className="btn my-4 rounded-full w-70 mx-auto">
                Order
              </button>
            </ul>
          </div>
        </div>
      </div>
      {/* You can open the modal using document.getElementById('ID').showModal() method */}
      <dialog id="my_modal_3" className="modal">
        <div className="modal-box">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          <h3 className="font-bold text-lg">Hello!</h3>
          <p className="py-4">Press ESC key or click on ✕ button to close</p>
        </div>
      </dialog>
    </section>
  );
}
