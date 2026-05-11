import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  collectionGroup,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";
import useEmblaCarousel from "embla-carousel-react";
import { usePrevNextButtons } from "./hooks/usePrevNextButtons";
import { NextButton, PrevButton } from "./embela/EmblaCarouselArrowButtons";
import { useAuth } from "../hooks/useAuth.jsx";
import { toast } from "sonner";

const POPULAR_STORE_LIMIT = 6;
const STORE_FETCH_LIMIT = 50;
const DEBOUNCE_MS = 300;
const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

// Helpers 
const createSlug = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const getTodayHours = (openingHours) => {
  const today = DAYS[new Date().getDay()];
  return openingHours?.[today] || null;
};

const sortByRating = (stores) =>
  [...stores].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));

// Data Fetchers 
const fetchPopularStores = async (validStoreIds = null) => {
  const storesSnapshot = await getDocs(
    query(
      collection(db, "stores"),
      where("isActive", "==", true),
      limit(STORE_FETCH_LIMIT)
    )
  );

  let stores = storesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  if (validStoreIds) {
    stores = stores.filter((store) => validStoreIds.has(store.id));
  }

  return sortByRating(stores).slice(0, POPULAR_STORE_LIMIT);
};

const fetchStoresByLocation = async ({
  country,
  state,
  city,
  validStoreIds,
}) => {
  // Build conditions in the same order as composite index:
  // country → state → city → isActive
  const conditions = [
    where("country", "==", country),
    where("isActive", "==", true),
  ];

  if (state) conditions.push(where("state", "==", state));
  if (city) conditions.push(where("city", "==", city));

  const storesSnapshot = await getDocs(
    query(collection(db, "stores"), ...conditions)
  );

  let stores = storesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  if (validStoreIds) {
    stores = stores.filter((store) => validStoreIds.has(store.id));
  }

  return sortByRating(stores);
};

const fetchValidStoreIds = async (productId) => {
  const inventorySnapshot = await getDocs(
    query(
      collectionGroup(db, "inventory"),
      where("productId", "==", productId),
      where("available", "==", true)
    )
  );

  return new Set(
    inventorySnapshot.docs
      .map((doc) => doc.ref.parent.parent?.id)
      .filter(Boolean)
  );
};

//  LocationDropdown 
function LocationDropdown({
  label,
  value,
  placeholder,
  options,
  disabled = false,
  onSelect,
}) {
  return (
    <div className={`dropdown group w-full ${disabled ? "opacity-50" : ""}`}>
      <h3 className="font-semibold mb-1 text-sm">
        <i className="bx bxs-map"></i> {label}
      </h3>
      <div
        tabIndex={disabled ? -1 : 0}
        role="button"
        className={`btn m-1 text-[16px] flex justify-between w-full border-0 bg-white border-gray-300 hover:bg-gray-50 text-black ${
          disabled ? "cursor-not-allowed" : ""
        }`}
      >
        <span className={!value ? "text-gray-400" : ""}>
          {value || placeholder}
        </span>
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
      {!disabled && (
        <ul
          tabIndex={0}
          className="dropdown-content z-[20] menu p-2 shadow bg-base-100 rounded-box w-full border border-base-200 max-h-60 overflow-y-auto"
        >
          {options.length > 0 ? (
            options.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onSelect(option);
                    document.activeElement.blur();
                  }}
                >
                  {option}
                </button>
              </li>
            ))
          ) : (
            <li className="disabled p-2 text-xs text-gray-400">
              No options found
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

// Main Component 
export default function Stores() {
  const location = useLocation();
  const { userInfo } = useAuth();

  const relaySearch = location.state?.autoSearch || "";
  const relayProductId = location.state?.productId || "";

  // State
  const [dbLocations, setDbLocations] = useState([]);
  const [dbStores, setDbStores] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [storesLoading, setStoresLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [profileLocationChecked, setProfileLocationChecked] = useState(false);
  const [previewStore, setPreviewStore] = useState(null);

  //  Carousel 
  // Reinitialize carousel when previewStore changes
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, []);

  useEffect(() => {
    if (emblaApi) emblaApi.reInit();
  }, [emblaApi, previewStore]);

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  // Fetch Locations 
  useEffect(() => {
    const fetchLocations = async () => {
      setLocationsLoading(true);
      try {
        const citiesSnapshot = await getDocs(collection(db, "cities"));
        setDbLocations(
          citiesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (error) {
        toast.error("Failed to load locations. Please refresh.");
        console.error(error);
      } finally {
        setLocationsLoading(false);
      }
    };
    fetchLocations();
  }, []);

  //  Prefill from User Profile 
  useEffect(() => {
    if (profileLocationChecked) return;

    // Wait for userInfo to resolve — null means not logged in, undefined means still loading
    if (userInfo === undefined) return;

    if (userInfo?.country && userInfo?.state) {
      setSelectedCountry(userInfo.country);
      setSelectedState(userInfo.state);
    }

    setProfileLocationChecked(true);
  }, [userInfo, profileLocationChecked]);

  //  Derived Options 
  const countryOptions = useMemo(
    () =>
      [...new Set(dbLocations.map((l) => l.country).filter(Boolean))].sort(),
    [dbLocations]
  );

  const stateOptions = useMemo(() => {
    if (!selectedCountry) return [];
    return [
      ...new Set(
        dbLocations
          .filter((l) => l.country === selectedCountry)
          .map((l) => l.state)
          .filter(Boolean)
      ),
    ].sort();
  }, [dbLocations, selectedCountry]);

  const cityOptions = useMemo(() => {
    if (!selectedCountry || !selectedState) return [];
    return [
      ...new Set(
        dbLocations
          .filter(
            (l) => l.country === selectedCountry && l.state === selectedState
          )
          .map((l) => l.city)
          .filter(Boolean)
      ),
    ].sort();
  }, [dbLocations, selectedCountry, selectedState]);

  // Fetch Stores 
  useEffect(() => {
    // Wait for profile location check before fetching
    // so we don't fetch popular stores then immediately refetch with user location
    if (!profileLocationChecked) return;

    const timeoutId = setTimeout(async () => {
      setStoresLoading(true);
      try {
        let validStoreIds = null;

        if (relaySearch) {
          const productId = relayProductId || createSlug(relaySearch);
          validStoreIds = await fetchValidStoreIds(productId);

          // If relay search returns no matching stores, show empty state early
          if (validStoreIds.size === 0) {
            setDbStores([]);
            setPreviewStore(null);
            return;
          }
        }

        let storesData = [];

        if (selectedCountry) {
          storesData = await fetchStoresByLocation({
            country: selectedCountry,
            state: selectedState,
            city: selectedCity,
            validStoreIds,
          });
        } else {
          storesData = await fetchPopularStores(validStoreIds);
        }

        setDbStores(storesData);
        setPreviewStore((current) => {
          if (!current) return null;
          return storesData.some((s) => s.id === current.id) ? current : null;
        });
      } catch (error) {
        toast.error("Failed to load stores. Please try again.");
        console.error(error);
      } finally {
        setStoresLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [
    selectedCountry,
    selectedState,
    selectedCity,
    relaySearch,
    relayProductId,
    profileLocationChecked,
  ]);

  // Derived UI 
  const locationTitle = useMemo(() => {
    if (!selectedCountry) return "Popular Maple stores";
    if (selectedCity)
      return `Stores in ${selectedCity}, ${selectedState}, ${selectedCountry}`;
    if (selectedState) return `Stores in ${selectedState}, ${selectedCountry}`;
    return `Stores in ${selectedCountry}`;
  }, [selectedCountry, selectedState, selectedCity]);

  const previewImages =
    previewStore?.images?.length > 0
      ? previewStore.images
      : [
          previewStore?.img ||
            "https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp",
        ];

  const todayHours = previewStore
    ? getTodayHours(previewStore.openingHours)
    : null;
 
  if (locationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="loading loading-spinner loading-lg text-lime-400"></span>
        <p className="ml-4 font-bold">Loading locations...</p>
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
              <ul className="steps font-bold">
                <li className="step step-primary">Select store</li>
                <li className="step">Select Product</li>
                <li className="step">Purchase</li>
                <li className="step">Receive Product</li>
              </ul>
            </div>

            <div className="mb-8">
              <h3 className="font-semibold mb-3">
                <i className="bx bxs-map"></i> Location
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <LocationDropdown
                  label="Country"
                  value={selectedCountry}
                  placeholder="Select country"
                  options={countryOptions}
                  onSelect={(country) => {
                    setSelectedCountry(country);
                    setSelectedState("");
                    setSelectedCity("");
                    setPreviewStore(null);
                  }}
                />
                <LocationDropdown
                  label="State"
                  value={selectedState}
                  placeholder="Select state"
                  options={stateOptions}
                  disabled={!selectedCountry}
                  onSelect={(state) => {
                    setSelectedState(state);
                    setSelectedCity("");
                    setPreviewStore(null);
                  }}
                />
                <LocationDropdown
                  label="City"
                  value={selectedCity || "All cities"}
                  placeholder="All cities"
                  options={["All cities", ...cityOptions]}
                  disabled={!selectedCountry || !selectedState}
                  onSelect={(city) => {
                    setSelectedCity(city === "All cities" ? "" : city);
                    setPreviewStore(null);
                  }}
                />
              </div>

              {/* Location hint */}
              {!selectedCountry ? (
                <p className="text-xs text-gray-400 mt-2">
                  Showing top-rated Maple stores. Select your country, state,
                  and city to find stores closer to you.
                </p>
              ) : !selectedState ? (
                <p className="text-xs text-gray-400 mt-2">
                  Showing top-rated Maple stores in {selectedCountry}. Select a
                  state and city to narrow your search.
                </p>
              ) : userInfo?.country && userInfo?.state ? (
                <p className="text-xs text-gray-400 mt-2">
                  Using your saved profile location. You can change it above.
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-2">
                  Showing stores based on your selected location. Set your
                  location in your profile for faster results next time.
                </p>
              )}

              {/* Relay search notice */}
              {relaySearch && (
                <p className="text-xs text-gray-400 mt-1">
                  Showing stores that have{" "}
                  <span className="font-semibold text-black">
                    {relaySearch}
                  </span>{" "}
                  available.
                </p>
              )}
            </div>

            {/* Store List */}
            <div>
              <h4 className="font-bold mb-3">{locationTitle}</h4>

              {storesLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <span className="loading loading-spinner loading-md text-lime-400"></span>
                  <p className="ml-3 font-semibold">Finding stores...</p>
                </div>
              ) : dbStores.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-3xl p-8 text-center text-gray-400">
                  <p className="font-bold text-lg text-gray-500">
                    No stores found.
                  </p>
                  {relaySearch && selectedState ? (
                    <p className="text-sm mt-1">
                      No store with{" "}
                      <span className="font-semibold text-gray-600">
                        {relaySearch}
                      </span>{" "}
                      could be found in {selectedState}. Try changing your
                      location.
                    </p>
                  ) : relaySearch ? (
                    <p className="text-sm mt-1">
                      No store with{" "}
                      <span className="font-semibold text-gray-600">
                        {relaySearch}
                      </span>{" "}
                      is currently available. Try changing your location.
                    </p>
                  ) : (
                    <p className="text-sm mt-1">
                      Try selecting another city, state, or country.
                    </p>
                  )}
                </div>
              ) : (
                dbStores.map((store) => (
                  <div
                    key={store.id}
                    className="flex items-center justify-between border border-gray-400 min-h-22 w-full rounded-full px-5 py-3 mb-5"
                  >
                    <div className="min-w-40 max-w-75 flex h-fit gap-x-3 items-center">
                      <div className="avatar">
                        <div className="bg-neutral text-neutral-content w-10 h-10 rounded-full overflow-hidden">
                          {store.img ? (
                            <img
                              src={store.img}
                              alt={store.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="flex items-center justify-center h-full">
                              {store.name?.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm">
                        <p className="font-bold">{store.name}</p>
                        <p>{store.address}</p>
                        <p className="text-xs text-gray-400">
                          ⭐ {store.rating || 0} ·{" "}
                          {store.reviewCount || store.ratingCount || 0} reviews
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-x-2">
                      <button
                        onClick={() => setPreviewStore(store)}
                        className="btn h-9 border-0 rounded-3xl border border-gray-400"
                      >
                        Preview Store
                      </button>
                      <NavLink
                        to="/order"
                        state={{
                          selectedStore: store,
                          autoSearch: relaySearch,
                        }}
                        className="btn h-9 border-0 rounded-3xl border border-gray-400"
                      >
                        Order Here
                      </NavLink>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:w-100 mx-auto">
            {previewStore ? (
              <div className="card bg-base-100 w-80 shadow-sm sticky rounded-t-2xl rounded-b-none top-10 self-start translate-y-20 translate-x-10 h-fit">
                <figure
                  className="relative overflow-hidden rounded-t-2xl h-60"
                  ref={emblaRef}
                >
                  <div className="flex w-full h-full">
                    {previewImages.map((img, index) => (
                      <div
                        key={`${img}-${index}`}
                        className="flex-[0_0_100%] min-w-0 h-full"
                      >
                        <img
                          src={img}
                          className="w-full h-full object-cover"
                          alt={`${previewStore.name} preview ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>

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

                <div className="card-body">
                  <h2 className="card-title">{previewStore.name}</h2>
                  <p className="text-sm text-gray-500">
                    {previewStore.address}
                  </p>
                  <p>
                    {previewStore.description ||
                      `Experience the finest Maple blends at our ${previewStore.name} location.`}
                  </p>
                  <p className="text-xs text-gray-400">
                    ⭐ {previewStore.rating || 0} ·{" "}
                    {previewStore.reviewCount || previewStore.ratingCount || 0}{" "}
                    reviews
                  </p>

                  {/* Today's hours */}
                  <div className="text-xs text-gray-400 mt-2">
                    {todayHours ? (
                      <>
                        <p>Opens: {todayHours.open}</p>
                        <p>Closes: {todayHours.close}</p>
                      </>
                    ) : (
                      <p>Hours not available</p>
                    )}
                  </div>

                  <div className="card-actions justify-end mt-4">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setPreviewStore(null)}
                    >
                      Close Preview
                    </button>
                    <NavLink
                      to="/order"
                      state={{
                        selectedStore: previewStore,
                        autoSearch: relaySearch,
                      }}
                      className="btn h-9 border-0 rounded-3xl border border-gray-400"
                    >
                      Order Here
                    </NavLink>
                  </div>
                </div>
              </div>
            ) : (
              <div className="sticky top-10 self-start translate-y-20 translate-x-10 min-h-25">
                <p className="text-gray-400 text-4xl relative font-extrabold text-center mt-20">
                  Select a store to preview details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
