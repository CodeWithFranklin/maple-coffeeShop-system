import { useEffect, useMemo } from "react";
import TimePicker from "../utils/TimePicker";
import { PaymentMethod } from "./PaymentOptions";

//  Shared LocationDropdown
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
      <label className="label">
        <span className="label-text font-bold text-gray-500">{label}</span>
      </label>

      <div
        tabIndex={disabled ? -1 : 0}
        role="button"
        className={`btn text-[16px] flex justify-between w-full border border-gray-200 bg-gray-50 hover:bg-gray-50 text-black rounded-2xl ${
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

//  PickupDetails
export const PickupDetails = ({ store, value, onChange, onPaymentSelect }) => {
  const isScheduled = value?.pickupType === "scheduled";

  return (
    <>
      <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500 bg-white rounded-4xl p-7 relative shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-lg">Pick-up Information</p>
            <p className="text-xs text-gray-400">
              {store?.name || "Selected store"} • {store?.city || "City"},{" "}
              {store?.state || "State"}
            </p>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() =>
                onChange({
                  pickupType: "asap",
                  scheduledTime: null,
                })
              }
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                !isScheduled
                  ? "bg-white shadow-sm text-green-700"
                  : "text-gray-500"
              }`}
            >
              ASAP
            </button>

            <button
              type="button"
              onClick={() =>
                onChange({
                  pickupType: "scheduled",
                  scheduledTime: value?.scheduledTime || null,
                })
              }
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isScheduled
                  ? "bg-white shadow-sm text-green-700"
                  : "text-gray-500"
              }`}
            >
              Schedule
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-dashed border-gray-100 pt-4 mt-2">
          <div className="flex items-center gap-x-3">
            <i className="bx bx-time-five text-xl text-green-600"></i>

            {isScheduled ? (
              <TimePicker
                timezone={store?.timezone || "Africa/Lagos"}
                openingHours={store?.openingHours}
                onChange={(time) =>
                  onChange({
                    pickupType: "scheduled",
                    scheduledTime: time,
                  })
                }
              />
            ) : (
              <p className="font-semibold text-sm text-gray-700">
                Ready in 10–20 minutes depending on traffic
              </p>
            )}
          </div>

          {isScheduled && (
            <div className="flex items-center gap-x-2 text-[10px] font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
              <i className="bx bx-info-circle"></i>
              Uses store local time
            </div>
          )}
        </div>

        {isScheduled && !value?.scheduledTime && (
          <p className="text-xs text-orange-500 font-semibold">
            Please select a pickup time.
          </p>
        )}
      </div>

      <PaymentMethod onSelect={onPaymentSelect} />
    </>
  );
};

//  DeliveryDetails
export const DeliveryDetails = ({
  store,
  value = {
    address: "",
    country: "",
    state: "",
    city: "",
    landmark: "",
    saveAsDefault: false,
  },
  onChange,
  onPaymentSelect,
  currencyCode = "USD",
  currencyLocale = "en-US",
}) => {
  const deliveryCountry = store?.delivery?.country || store?.country || "";
  const lockedState = store?.delivery?.state || store?.state || "";

  const cityOptions = useMemo(() => {
    return store?.delivery?.cities || [];
  }, [store?.delivery?.cities]);

  const estimatedDeliveryFee = Number(
    store?.delivery?.fees?.byCity?.[value.city] ??
      store?.delivery?.fees?.default ??
      0
  );

  const formatMoney = (amount) =>
    new Intl.NumberFormat(currencyLocale, {
      style: "currency",
      currency: currencyCode,
    }).format(Number(amount || 0));

  const updateField = (field, fieldValue) => {
    onChange?.({
      ...value,
      [field]: fieldValue,
    });
  };

  useEffect(() => {
    if (!lockedState) return;

    const cityStillAllowed = cityOptions.includes(value.city);

    const alreadySynced =
      value.country === deliveryCountry &&
      value.state === lockedState &&
      (!value.city || cityStillAllowed);

    if (alreadySynced) return;

    onChange?.({
      ...value,
      country: deliveryCountry,
      state: lockedState,
      city: cityStillAllowed ? value.city : "",
    });
  }, [lockedState, deliveryCountry, cityOptions, value, onChange]);

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 bg-white rounded-4xl p-7 shadow-sm">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-x-2">
              <i className="bx bxs-map text-green-600 text-xl"></i>
              <p className="font-bold text-lg">Delivery Address</p>
            </div>

            <span className="badge badge-success rounded-full font-bold">
              Local delivery
            </span>
          </div>

          <p className="text-xs text-gray-400">
            Delivery is available within {lockedState || "this store’s state"}.
            Select your city and enter your full address.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Street Address */}
          <div className="form-control w-full md:col-span-2">
            <label className="label">
              <span className="label-text font-bold text-gray-500">
                Street Address
              </span>
            </label>

            <input
              type="text"
              value={value.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="e.g. 123 Maple Street, GRA Phase 2"
              className="input input-bordered w-full rounded-2xl border-gray-200 focus:border-green-600 bg-gray-50"
            />
          </div>

          {/* Country — locked */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-bold text-gray-500">
                Country
              </span>
            </label>

            <input
              type="text"
              value={deliveryCountry}
              disabled
              className="input input-bordered w-full rounded-2xl border-gray-200 bg-gray-100 font-semibold cursor-not-allowed"
            />
          </div>

          {/* State — locked */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-bold text-gray-500">State</span>
            </label>

            <input
              type="text"
              value={lockedState}
              disabled
              className="input input-bordered w-full rounded-2xl border-gray-200 bg-gray-100 font-semibold cursor-not-allowed"
            />
          </div>

          {/* City */}
          <LocationDropdown
            label="City"
            value={value.city}
            placeholder="Select city"
            options={cityOptions}
            disabled={!lockedState || cityOptions.length === 0}
            onSelect={(city) =>
              onChange?.({
                ...value,
                country: deliveryCountry,
                state: lockedState,
                city,
              })
            }
          />

          {/* Landmark */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-bold text-gray-500">
                Closest Landmark
              </span>
            </label>

            <input
              type="text"
              value={value.landmark}
              onChange={(e) => updateField("landmark", e.target.value)}
              placeholder="e.g. Opposite Next Cash & Carry"
              className="input input-bordered w-full rounded-2xl border-gray-200 focus:border-green-600 bg-gray-50"
            />
          </div>

          {/* Delivery Fee */}
          {value.city && (
            <div className="md:col-span-2 rounded-2xl bg-gray-50 border border-gray-100 p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">Estimated delivery fee</p>
                <p className="text-xs text-gray-400">
                  Fee is based on your selected city.
                </p>
              </div>

              <p className="font-black text-green-700">
                {formatMoney(estimatedDeliveryFee)}
              </p>
            </div>
          )}

          {/* Save as default */}
          <label className="md:col-span-2 flex items-start gap-3 p-4 rounded-2xl bg-green-50 border border-green-100 cursor-pointer">
            <input
              type="checkbox"
              checked={value.saveAsDefault}
              onChange={(e) => updateField("saveAsDefault", e.target.checked)}
              className="checkbox checkbox-success mt-1"
            />

            <div>
              <p className="font-bold text-sm text-green-800">
                Save this as my default delivery address
              </p>
              <p className="text-xs text-green-700/70">
                We'll use this to prefill your delivery address next time.
              </p>
            </div>
          </label>
        </div>
      </div>

      <PaymentMethod onSelect={onPaymentSelect} />
    </>
  );
};
