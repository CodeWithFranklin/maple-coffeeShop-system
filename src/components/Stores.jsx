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

const createSlug = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

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
  const { userInfo } = useAuth();

  const relaySearch = location.state?.autoSearch || "";

  const [dbLocations, setDbLocations] = useState([]);
  const [dbStores, setDbStores] = useState([]);

  const [locationsLoading, setLocationsLoading] = useState(true);
  const [storesLoading, setStoresLoading] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const [hasPrefilledLocation, setHasPrefilledLocation] = useState(false);
  const [previewStore, setPreviewStore] = useState(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  const fetchMixedStores = async () => {
    const nigeriaQuery = query(
      collection(db, "stores"),
      where("country", "==", "Nigeria"),
      where("isActive", "==", true),
      limit(3)
    );

    const usaQuery = query(
      collection(db, "stores"),
      where("country", "==", "USA"),
      where("isActive", "==", true),
      limit(3)
    );

    const [nigeriaSnapshot, usaSnapshot] = await Promise.all([
      getDocs(nigeriaQuery),
      getDocs(usaQuery),
    ]);

    const nigeriaStores = nigeriaSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const usaStores = usaSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return [...nigeriaStores, ...usaStores];
  };

  useEffect(() => {
    const fetchLocations = async () => {
      setLocationsLoading(true);

      try {
        const citiesSnapshot = await getDocs(collection(db, "cities"));

        const citiesData = citiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setDbLocations(citiesData);
      } catch (error) {
        console.error("Error fetching locations:", error);
      } finally {
        setLocationsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    if (!hasPrefilledLocation && userInfo?.country && userInfo?.state) {
      setSelectedCountry(userInfo.country);
      setSelectedState(userInfo.state);

      if (userInfo.city) {
        setSelectedCity(userInfo.city);
      }

      setHasPrefilledLocation(true);
    }
  }, [userInfo, hasPrefilledLocation]);

  const countryOptions = useMemo(() => {
    return [
      ...new Set(
        dbLocations.map((location) => location.country).filter(Boolean)
      ),
    ].sort();
  }, [dbLocations]);

  const stateOptions = useMemo(() => {
    if (!selectedCountry) return [];

    return [
      ...new Set(
        dbLocations
          .filter((location) => location.country === selectedCountry)
          .map((location) => location.state)
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
            (location) =>
              location.country === selectedCountry &&
              location.state === selectedState
          )
          .map((location) => location.name || location.city)
          .filter(Boolean)
      ),
    ].sort();
  }, [dbLocations, selectedCountry, selectedState]);

  useEffect(() => {
    const fetchStores = async () => {
      setStoresLoading(true);

      try {
        let storesData = [];

        if (selectedCountry && selectedState) {
          const storeConditions = [
            where("country", "==", selectedCountry),
            where("state", "==", selectedState),
            where("isActive", "==", true),
          ];

          if (selectedCity) {
            storeConditions.push(where("city", "==", selectedCity));
          }

          const storesQuery = query(
            collection(db, "stores"),
            ...storeConditions
          );

          const storesSnapshot = await getDocs(storesQuery);

          storesData = storesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
        } else {
          storesData = await fetchMixedStores();
        }

        if (relaySearch) {
          const productId = createSlug(relaySearch);

          const inventoryQuery = query(
            collectionGroup(db, "inventory"),
            where("productId", "==", productId),
            where("available", "==", true)
          );

          const inventorySnapshot = await getDocs(inventoryQuery);

          const validStoreIds = new Set(
            inventorySnapshot.docs
              .map((doc) => doc.ref.parent.parent?.id)
              .filter(Boolean)
          );

          storesData = storesData.filter((store) =>
            validStoreIds.has(store.id)
          );
        }

        setDbStores(storesData);

        setPreviewStore((currentPreview) => {
          if (!currentPreview) return null;

          const previewStillExists = storesData.some(
            (store) => store.id === currentPreview.id
          );

          return previewStillExists ? currentPreview : null;
        });
      } catch (error) {
        console.error("Error fetching stores:", error);
      } finally {
        setStoresLoading(false);
      }
    };

    fetchStores();
  }, [selectedCountry, selectedState, selectedCity, relaySearch]);

  const locationTitle = useMemo(() => {
    if (!selectedCountry || !selectedState) {
      return "Popular Maple stores";
    }

    if (selectedCity) {
      return `Stores in ${selectedCity}, ${selectedState}, ${selectedCountry}`;
    }

    return `Stores in ${selectedState}, ${selectedCountry}`;
  }, [selectedCountry, selectedState, selectedCity]);

  const previewImages =
    previewStore?.images?.length > 0
      ? previewStore.images
      : [
          previewStore?.img ||
            "https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp",
        ];

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

              {!selectedCountry || !selectedState ? (
                <p className="text-xs text-gray-400 mt-2">
                  Showing popular Maple stores from different locations. Select
                  your country, state, and city to find stores closer to you.
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
                  <p className="text-sm mt-1">
                    Try selecting another city, state, or country.
                  </p>
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
                    Experience the finest Maple blends at our{" "}
                    {previewStore.name} location. Great for study sessions or
                    quick coffee runs.
                  </p>

                  <div className="text-xs text-gray-400 mt-2">
                    <p>
                      Opens:{" "}
                      {previewStore.openingHours?.monday?.open || "08:00"}
                    </p>
                    <p>
                      Closes:{" "}
                      {previewStore.openingHours?.monday?.close || "20:00"}
                    </p>
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
