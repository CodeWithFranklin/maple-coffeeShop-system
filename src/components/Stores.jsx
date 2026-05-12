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
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezonePlugin from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);
dayjs.extend(customParseFormat);

const POPULAR_STORE_LIMIT = 6;

const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const DEFAULT_OPENING_HOURS = {
  monday: { open: "08:00", close: "18:00", closed: false },
  tuesday: { open: "08:00", close: "18:00", closed: false },
  wednesday: { open: "08:00", close: "18:00", closed: false },
  thursday: { open: "08:00", close: "18:00", closed: false },
  friday: { open: "08:00", close: "18:00", closed: false },
  saturday: { open: "08:00", close: "18:00", closed: false },
  sunday: { open: "08:00", close: "18:00", closed: false },
};

const createSlug = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const sortByRating = (stores) =>
  [...stores].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));

const getTodayHours = (store) => {
  const timezone = store?.timezone || "Africa/Lagos";
  const openingHours = store?.openingHours || DEFAULT_OPENING_HOURS;

  const storeNow = dayjs().tz(timezone);
  const today = DAYS[storeNow.day()];

  return openingHours?.[today] || null;
};

const getStoreOpenStatus = (store) => {
  const timezone = store?.timezone || "Africa/Lagos";
  const openingHours = store?.openingHours || DEFAULT_OPENING_HOURS;

  const storeNow = dayjs().tz(timezone);
  const today = DAYS[storeNow.day()];
  const todayHours = openingHours?.[today];

  if (!todayHours || todayHours.closed) {
    return {
      isOpen: false,
      label: "Closed",
      message: "Pickup is currently unavailable. This store is closed.",
      todayHours,
      timezone,
    };
  }

  if (!todayHours.open || !todayHours.close) {
    return {
      isOpen: false,
      label: "Closed",
      message: "Pickup is currently unavailable. This store is closed.",
      todayHours,
      timezone,
    };
  }

  const storeDate = storeNow.format("YYYY-MM-DD");

  const openTime = dayjs.tz(
    `${storeDate} ${todayHours.open}`,
    "YYYY-MM-DD HH:mm",
    timezone
  );

  const closeTime = dayjs.tz(
    `${storeDate} ${todayHours.close}`,
    "YYYY-MM-DD HH:mm",
    timezone
  );

  const isOpen =
    storeNow.isSame(openTime) ||
    (storeNow.isAfter(openTime) && storeNow.isBefore(closeTime));

  return {
    isOpen,
    label: isOpen ? "Open" : "Closed",
    message: isOpen
      ? "This store is open."
      : "Pickup is currently unavailable. This store is closed.",
    todayHours,
    timezone,
  };
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
      .map((docSnap) => docSnap.ref.parent.parent?.id)
      .filter(Boolean)
  );
};

const fetchPopularStores = async (validStoreIds = null) => {
  const storesSnapshot = await getDocs(
    query(collection(db, "stores"), limit(POPULAR_STORE_LIMIT))
  );

  let stores = storesSnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  stores = stores.filter((store) => store.isActive !== false);

  if (validStoreIds) {
    stores = stores.filter((store) => validStoreIds.has(store.id));
  }

  return sortByRating(stores);
};

const fetchStoresByLocation = async ({
  country,
  state,
  city,
  validStoreIds,
}) => {
  const conditions = [
    where("country", "==", country),
    where("isActive", "==", true),
  ];

  if (state) {
    conditions.push(where("state", "==", state));
  }

  if (city) {
    conditions.push(where("city", "==", city));
  }

  const storesSnapshot = await getDocs(
    query(collection(db, "stores"), ...conditions)
  );

  let stores = storesSnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  if (validStoreIds) {
    stores = stores.filter((store) => validStoreIds.has(store.id));
  }

  return sortByRating(stores);
};

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

export default function Stores() {
  const location = useLocation();

  const { userInfo, userInfoLoading } = useAuth();

  const relaySearch = location.state?.autoSearch || "";
  const relayProductId = location.state?.productId || "";

  const [dbLocations, setDbLocations] = useState([]);
  const [dbStores, setDbStores] = useState([]);

  const [locationsLoading, setLocationsLoading] = useState(true);
  const [storesLoading, setStoresLoading] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const [profileLocationChecked, setProfileLocationChecked] = useState(false);
  const [previewStore, setPreviewStore] = useState(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  useEffect(() => {
    if (emblaApi) emblaApi.reInit();
  }, [emblaApi, previewStore]);

  useEffect(() => {
    const fetchLocations = async () => {
      setLocationsLoading(true);

      try {
        const citiesSnapshot = await getDocs(collection(db, "cities"));

        setDbLocations(
          citiesSnapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }))
        );
      } catch (error) {
        toast.error("Error fetching locations");
        console.error(error);
      } finally {
        setLocationsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    if (profileLocationChecked) return;

    if (userInfoLoading) return;

    if (userInfo?.country) {
      setSelectedCountry(userInfo.country);
    }

    setSelectedState("");
    setSelectedCity("");

    setProfileLocationChecked(true);
  }, [userInfo, userInfoLoading, profileLocationChecked]);

  const countryOptions = useMemo(() => {
    return [
      ...new Set(
        dbLocations.map((locationItem) => locationItem.country).filter(Boolean)
      ),
    ].sort();
  }, [dbLocations]);

  const stateOptions = useMemo(() => {
    if (!selectedCountry) return [];

    return [
      ...new Set(
        dbLocations
          .filter((locationItem) => locationItem.country === selectedCountry)
          .map((locationItem) => locationItem.state)
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
            (locationItem) =>
              locationItem.country === selectedCountry &&
              locationItem.state === selectedState
          )
          .map((locationItem) => locationItem.city || locationItem.name)
          .filter(Boolean)
      ),
    ].sort();
  }, [dbLocations, selectedCountry, selectedState]);

  useEffect(() => {
    if (!profileLocationChecked) return;

    const timeoutId = setTimeout(() => {
      const fetchStores = async () => {
        setStoresLoading(true);

        try {
          let validStoreIds = null;

          if (relaySearch) {
            const productId = relayProductId || createSlug(relaySearch);
            validStoreIds = await fetchValidStoreIds(productId);

            if (validStoreIds.size === 0) {
              setDbStores([]);
              setPreviewStore(null);
              return;
            }
          }

          const storesData = selectedCountry
            ? await fetchStoresByLocation({
                country: selectedCountry,
                state: selectedState,
                city: selectedCity,
                validStoreIds,
              })
            : await fetchPopularStores(validStoreIds);

          setDbStores(storesData);

          setPreviewStore((currentPreview) => {
            if (!currentPreview) return null;

            const previewStillExists = storesData.some(
              (store) => store.id === currentPreview.id
            );

            return previewStillExists ? currentPreview : null;
          });
        } catch (error) {
          toast.error("Error fetching stores");
          console.error(error);
        } finally {
          setStoresLoading(false);
        }
      };

      fetchStores();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    selectedCountry,
    selectedState,
    selectedCity,
    relaySearch,
    relayProductId,
    profileLocationChecked,
  ]);

  const storesWithStatus = useMemo(() => {
    return dbStores.map((store) => ({
      ...store,
      openStatus: getStoreOpenStatus(store),
    }));
  }, [dbStores]);

  const allSelectedNigeriaStoresClosed =
    selectedCountry === "Nigeria" &&
    storesWithStatus.length > 0 &&
    storesWithStatus.every((store) => !store.openStatus.isOpen);

  const locationTitle = useMemo(() => {
    if (!selectedCountry) return "Popular Maple stores";

    if (selectedCity) {
      return `Stores in ${selectedCity}, ${selectedState}, ${selectedCountry}`;
    }

    if (selectedState) {
      return `Stores in ${selectedState}, ${selectedCountry}`;
    }

    return `Maple stores in ${selectedCountry}`;
  }, [selectedCountry, selectedState, selectedCity]);

  const previewStatus = previewStore ? getStoreOpenStatus(previewStore) : null;
  const previewTodayHours = previewStore ? getTodayHours(previewStore) : null;

  const previewImages =
    previewStore?.images?.length > 0
      ? previewStore.images
      : [
          previewStore?.img ||
            "https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp",
        ];

  const showClosedStoreToast = () => {
    toast.error("Pickup is currently unavailable. This store is closed.");
  };

  if (locationsLoading || !profileLocationChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="loading loading-spinner loading-lg text-lime-400"></span>
        <p className="ml-4 font-bold">Loading stores...</p>
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
                  value={selectedCity}
                  placeholder="All cities"
                  options={["All cities", ...cityOptions]}
                  disabled={!selectedCountry || !selectedState}
                  onSelect={(city) => {
                    setSelectedCity(city === "All cities" ? "" : city);
                    setPreviewStore(null);
                  }}
                />
              </div>

              {!selectedCountry ? (
                <p className="text-xs text-gray-400 mt-2">
                  Showing top-rated Maple stores. Select a country to find
                  stores closer to you.
                </p>
              ) : !selectedState ? (
                <p className="text-xs text-gray-400 mt-2">
                  Showing Maple stores in {selectedCountry}. Select a state if
                  you want to narrow your search.
                </p>
              ) : !selectedCity ? (
                <p className="text-xs text-gray-400 mt-2">
                  Showing Maple stores in {selectedState}, {selectedCountry}.
                  Select a city to narrow your search further.
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-2">
                  Showing Maple stores in {selectedCity}, {selectedState},{" "}
                  {selectedCountry}.
                </p>
              )}

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

            <div>
              <h4 className="font-bold mb-3">{locationTitle}</h4>

              {allSelectedNigeriaStoresClosed && (
                <div className="mb-5 rounded-3xl border border-orange-200 bg-orange-50 p-5">
                  <div className="flex items-start gap-3">
                    <i className="bx bx-time-five text-2xl text-orange-600"></i>

                    <div>
                      <p className="font-bold text-orange-700">
                        All Nigerian Maple stores are closed for the day.
                      </p>
                      <p className="text-sm text-orange-600 mt-1">
                        Pickup is available from 8:00 AM to 6:00 PM local store
                        time.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {storesLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <span className="loading loading-spinner loading-md text-lime-400"></span>
                  <p className="ml-3 font-semibold">Finding stores...</p>
                </div>
              ) : storesWithStatus.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-3xl p-8 text-center text-gray-400">
                  <p className="font-bold text-lg text-gray-500">
                    No stores found.
                  </p>

                  {relaySearch ? (
                    <p className="text-sm mt-1">
                      No store with{" "}
                      <span className="font-semibold text-gray-600">
                        {relaySearch}
                      </span>{" "}
                      is currently available in this location.
                    </p>
                  ) : (
                    <p className="text-sm mt-1">
                      Try selecting another country, state, or city.
                    </p>
                  )}
                </div>
              ) : (
                storesWithStatus.map((store) => {
                  const storeIsOpen = store.openStatus.isOpen;
                  const todayHours = store.openStatus.todayHours;

                  return (
                    <div
                      key={store.id}
                      className={`flex items-center justify-between border min-h-22 w-full rounded-full px-5 py-3 mb-5 transition-all ${
                        storeIsOpen
                          ? "border-gray-400 bg-white"
                          : "border-gray-200 bg-gray-50 opacity-90"
                      }`}
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold">{store.name}</p>

                            {storeIsOpen ? (
                              <span className="badge badge-success rounded-full text-[10px]">
                                Open
                              </span>
                            ) : (
                              <span className="badge badge-error rounded-full text-[10px]">
                                Closed
                              </span>
                            )}
                          </div>

                          <p>{store.address}</p>

                          <p className="text-xs text-gray-400">
                            ⭐ {store.rating || 0} ·{" "}
                            {store.reviewCount || store.ratingCount || 0}{" "}
                            reviews
                          </p>

                          <p className="text-xs text-gray-400">
                            Today: {todayHours?.open || "08:00"} -{" "}
                            {todayHours?.close || "18:00"} ·{" "}
                            {store.timezone || "Africa/Lagos"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-x-2">
                        <button
                          type="button"
                          onClick={() => setPreviewStore(store)}
                          className="btn h-9 border-0 rounded-3xl border border-gray-400"
                        >
                          Preview Store
                        </button>

                        {storeIsOpen ? (
                          <NavLink
                            to="/order"
                            state={{
                              selectedStore: store,
                              autoSearch: relaySearch,
                              productId: relayProductId,
                            }}
                            className="btn h-9 border-0 rounded-3xl border border-gray-400"
                          >
                            Order Here
                          </NavLink>
                        ) : (
                          <button
                            type="button"
                            onClick={showClosedStoreToast}
                            className="btn h-9 border-0 rounded-3xl bg-gray-200 text-gray-500 hover:bg-gray-200 cursor-not-allowed"
                          >
                            Closed
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="card-title">{previewStore.name}</h2>

                    {previewStatus?.isOpen ? (
                      <span className="badge badge-success rounded-full">
                        Open
                      </span>
                    ) : (
                      <span className="badge badge-error rounded-full">
                        Closed
                      </span>
                    )}
                  </div>

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

                  <div className="text-xs text-gray-400 mt-2">
                    <p>Opens: {previewTodayHours?.open || "08:00"}</p>
                    <p>Closes: {previewTodayHours?.close || "18:00"}</p>
                    <p>Timezone: {previewStore.timezone || "Africa/Lagos"}</p>
                  </div>

                  <div className="card-actions justify-end mt-4">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setPreviewStore(null)}
                    >
                      Close Preview
                    </button>

                    {previewStatus?.isOpen ? (
                      <NavLink
                        to="/order"
                        state={{
                          selectedStore: previewStore,
                          autoSearch: relaySearch,
                          productId: relayProductId,
                        }}
                        className="btn h-9 border-0 rounded-3xl border border-gray-400"
                      >
                        Order Here
                      </NavLink>
                    ) : (
                      <button
                        type="button"
                        onClick={showClosedStoreToast}
                        className="btn h-9 border-0 rounded-3xl bg-gray-200 text-gray-500 hover:bg-gray-200 cursor-not-allowed"
                      >
                        Closed
                      </button>
                    )}
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
