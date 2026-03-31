import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import useEmblaCarousel from "embla-carousel-react";
import { usePrevNextButtons } from "./hooks/usePrevNextButtons";
import { NextButton, PrevButton } from "./embela/EmblaCarouselArrowButtons";


export default function Store() {
  const [dbLocations, setDbLocations] = useState([]); // Will hold "cities"
  const [dbStores, setDbStores] = useState([]); // Will hold "stores"
  const [loading, setLoading] = useState(true); // Essential for UX

  const [selected, setSelected] = useState("Select Location");
  const [searchTerm, setSearchTerm] = useState("");
  const [previewStore, setPreviewStore] = useState(null);

  const handleSelect = (label) => {
    setSelected(label);
    setSearchTerm(""); // Clear search after selection
    document.activeElement.blur();
  };
  // Change 'locatedStores' to 'dbStores'
  const filteredStores = dbStores.filter((store) => {
    if (selected === "Select Location") return true;
    return store.address.toLowerCase().includes(selected.toLowerCase());
  });

  // Change 'locations' to 'dbLocations'
  const searchedLocations = dbLocations.filter((loc) =>
    loc.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  const slides = [1, 2, 3, 4, 5];

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Cities/Locations
        const citiesSnapshot = await getDocs(collection(db, "cities"));
        const citiesData = citiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDbLocations(citiesData);

        // 2. Fetch All Stores
        const storesSnapshot = await getDocs(collection(db, "stores"));
        const storesData = storesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDbStores(storesData);
      } catch (error) {
        console.error("Error fetching store data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="loading loading-spinner loading-lg text-lime-400"></span>
        <p className="ml-4 font-bold">Finding stores near you...</p>
      </div>
    );
  }
  return (
    <section className="min-h-screen flex flex-col">
      <div className="mx-18 mt-13">
        <h1 className="text-7xl font-extrabold mb-13 leading-[1.2]">
          Discover wonderful maple stores near{" "}
          <span className="text-lime-300">you!</span>
        </h1>
        <div className="flex gap-x-3">
          <div className="lg:w-200">
            <div className="mb-6 w-fit mx-auto">
              <ul className="steps font-bold ">
                <li className="step step-primary">Select store</li>
                <li className="step">Select Product</li>
                <li className="step">Purchase</li>
                <li className="step">Receive Product</li>
              </ul>
            </div>
            <h3 className="font-semibold mb-1">
              <i className="bx bxs-map"></i> Location
            </h3>
            <div className="dropdown group mb-10">
              {/* The Trigger Button */}
              <div
                tabIndex={0}
                role="button"
                className="btn m-1 text-[16px] flex justify-between w-fit border-0 bg-white border-gray-300 hover:bg-gray-50 text-black"
              >
                {selected}

                {/* The Chevron Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 transition-transform duration-300 group-focus-within:rotate-180"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </div>

              {/* The Menu Content */}
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-64 border border-base-200"
              >
                <div className="px-2 py-2">
                  <label className="input input-sm border-gray-200 flex items-center gap-2">
                    <i className="bx bx-search opacity-50"></i>
                    <input
                      type="text"
                      className="grow"
                      placeholder="Search location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </label>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {searchedLocations.length > 0 ? (
                    searchedLocations.map((location) => (
                      <li key={location.id}>
                        <a onClick={() => handleSelect(location.label)}>
                          {location.label}
                        </a>
                      </li>
                    ))
                  ) : (
                    <li className="disabled p-2 text-xs text-gray-400">
                      No locations found
                    </li>
                  )}
                </div>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3">Stores in {selected}</h4>
              {filteredStores.map((store) => (
                <div
                  key={store.id}
                  className="flex items-center justify-between border-1 border-gray-400 min-h-22 w-full rounded-full px-5 py-3 mb-5"
                >
                  <div className="min-w-40 max-w-75 flex h-fit gap-x-1">
                    <div className="avatar avatar-placeholder">
                      <div className="bg-neutral text-neutral-content w-10 h-10 rounded-full">
                        <span>SY</span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <p className="font-bold">{store.name}</p>
                      <p>{store.address}</p>
                    </div>
                  </div>
                  <div className="flex gap-x-2">
                    {/* UPDATED: Click handler sets this store as the preview */}
                    <button
                      onClick={() => setPreviewStore(store)}
                      className="btn h-9 border-0 rounded-3xl border-1 border-gray-400"
                    >
                      Preview Store
                    </button>
                    <NavLink
                      to="/order"
                      state={{ selectedStore: store }}
                      className="btn h-9 border-0 rounded-3xl border-1 border-gray-400"
                    >
                      Order Here
                    </NavLink>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:w-100 mx-auto">
            {/* THE STICKY WRAPPER: This stays still on the page */}
            <div className="card bg-base-100 w-80 shadow-sm sticky top-10 self-start translate-y-20 translate-x-10 h-fit">
              {/* THE VIEWPORT: The Embla Ref goes on the figure (the window) */}
              <figure
                className="relative overflow-hidden rounded-t-2xl h-60"
                ref={emblaRef}
              >
                {/* THE CONTAINER: This is the long strip of images */}
                <div className="flex w-full h-full">
                  {slides.map((id) => (
                    <div key={id} className="flex-[0_0_100%] min-w-0 h-full">
                      <img
                        src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"
                        className="w-full h-full object-cover"
                        alt={`Slide ${id}`}
                      />
                    </div>
                  ))}
                </div>

                {/* THE BUTTONS: Positioned absolute over the image */}
                <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                  <div className="pointer-events-auto">
                    <PrevButton
                      onClick={onPrevButtonClick}
                      disabled={prevBtnDisabled}
                      className="touch-manipulation btn aspect-square w-10 px-0 flex justify-center items-center rounded-full cursor-pointer shadow opacity-70"
                    />
                  </div>
                  <div className="pointer-events-auto">
                    <NextButton
                      onClick={onNextButtonClick}
                      disabled={nextBtnDisabled}
                      className="touch-manipulation btn aspect-square w-10 px-0 flex justify-center items-center rounded-full cursor-pointer shadow opacity-70"
                    />
                  </div>
                </div>
              </figure>

              {/* THE STATIC CONTENT: This never moves */}
              <div className="card-body">
                {/* DYNAMIC CONTENT: Using data from the clicked store */}
                <h2 className="card-title">{previewStore?.name}</h2>
                <p className="text-sm text-gray-500">{previewStore?.address}</p>
                <p>
                  Experience the finest maple blends at our {previewStore?.name}{" "}
                  location. Great for study sessions or quick coffee runs.
                </p>

                <div className="card-actions justify-end mt-4">
                  {/* Option to clear preview */}
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => setPreviewStore(null)}
                  >
                    Close Preview
                  </button>
                  <button className="btn btn-primary">Buy Now</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
