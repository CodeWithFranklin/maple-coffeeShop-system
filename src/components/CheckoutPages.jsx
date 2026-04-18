import { useState } from "react";
import TimePicker from "../functions/TimePicker";
import { PaymentMethod } from "./PaymentOptions";

export const PickupDetails = () => {
  // Logic: Default to ASAP (null time)
  const [isScheduled, setIsScheduled] = useState(false);

  return (
    <>
     

      {/* 2. Pickup Info & Time Logic */}
      <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500 bg-white rounded-4xl p-7 relative shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-lg">Pick-up Information</p>
            <p className="text-xs text-gray-400">
              Maple Haven • Rivers State, Port Harcourt
            </p>
          </div>

          {/* ASAP / Schedule Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button
              onClick={() => setIsScheduled(false)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                !isScheduled
                  ? "bg-white shadow-sm text-green-700"
                  : "text-gray-500"
              }`}
            >
              ASAP
            </button>
            <button
              onClick={() => setIsScheduled(true)}
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
                label=""
                onChange={(val) => console.log("Scheduled for:", val)}
              />
            ) : (
              <p className="font-semibold text-sm text-gray-700">
                Ready in 5 - 10 minutes
              </p>
            )}
          </div>

          {isScheduled && (
            <div className="flex items-center gap-x-2 text-[10px] font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
              <i className="bx bx-info-circle"></i>
              WE OPEN 9AM - 6PM
            </div>
          )}
        </div>
      </div>

      {/* 3. Payment Method */}
      <PaymentMethod
        onSelect={(method) => console.log("Selected Method:", method)}
      />
    </>
  );
};
export const DeliveryDetails = () => (
  <>
    {/* Delivery Information Card */}
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 bg-white rounded-4xl p-7 shadow-sm">
      <div className="flex items-center gap-x-2 mb-2">
        <i className="bx bxs-map text-green-600 text-xl"></i>
        <p className="font-bold text-lg">Delivery Address</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Address - Span 2 columns */}
        <div className="form-control w-full md:col-span-2">
          <label className="label">
            <span className="label-text font-bold text-gray-500">
              Street Address
            </span>
          </label>
          <input
            type="text"
            placeholder="e.g. 123 Maple Street, GRA Phase 2"
            className="input input-bordered w-full rounded-2xl border-gray-200 focus:border-green-600 bg-gray-50"
          />
        </div>

        {/* Landmark */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-bold text-gray-500">
              Closest Landmark
            </span>
          </label>
          <input
            type="text"
            placeholder="e.g. Opposite Next Cash & Carry"
            className="input input-bordered w-full rounded-2xl border-gray-200 focus:border-green-600 bg-gray-50"
          />
        </div>

        {/* City/State - Keeping it simple or as a select */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-bold text-gray-500">
              City / State
            </span>
          </label>
          <input
            type="text"
            disabled
            value="Port Harcourt, Rivers"
            className="input input-bordered w-full rounded-2xl border-gray-200 bg-gray-100 font-semibold cursor-not-allowed"
          />
        </div>

        {/* Delivery Note */}
        <div className="form-control w-full md:col-span-2">
          <label className="label">
            <span className="label-text font-bold text-gray-500">
              Rider Note (Optional)
            </span>
          </label>
          <textarea
            className="textarea textarea-bordered h-24 rounded-2xl border-gray-200 focus:border-green-600 bg-gray-50"
            placeholder="e.g. Call me when you get to the gate, or leave it with the security."
          ></textarea>
        </div>
      </div>
    </div>

    {/* Payment Section */}
    <PaymentMethod
      onSelect={(method) => console.log("Delivery Payment:", method)}
    />
  </>
);