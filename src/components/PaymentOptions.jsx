import React, { useState, useEffect } from "react";

export const PaymentMethod = ({ onSelect }) => {
  const [selected, setSelected] = useState("card");

  useEffect(() => {
    if (onSelect) onSelect(selected);
  }, [selected, onSelect]);

  return (
    
    <div className="mt-10 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white  rounded-4xl p-7">
      <p className="font-bold text-lg">Payment Method</p>
      <div className="flex">
        <div className="flex  gap-4">
          {/* Debit Card Option */}
          <button
            onClick={() => setSelected("card")}
            className={`flex-1 flex items-center gap-x-4 p-4 rounded-3xl border-2 transition-all text-left ${
              selected === "card"
                ? "bg-green-50 border-green-600 ring-4 ring-green-100"
                : "bg-white border-gray-100 hover:border-gray-300"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                selected === "card"
                  ? "bg-green-700 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <i className="bx bx-credit-card text-2xl"></i>
            </div>
            <div className="overflow-hidden">
              <p
                className={`font-bold text-sm ${
                  selected === "card" ? "text-green-800" : "text-black"
                }`}
              >
                Debit Card
              </p>
              <p className="text-[10px] text-gray-500 truncate">
                Pay with Mastercard or Visa
              </p>
            </div>
          </button>

          {/* Bank Transfer Option */}
          <button
            onClick={() => setSelected("transfer")}
            className={`flex-1 flex items-center gap-x-4 p-4 rounded-3xl border-2 transition-all text-left ${
              selected === "transfer"
                ? "bg-green-50 border-green-600 ring-4 ring-green-100"
                : "bg-white border-gray-100 hover:border-gray-300"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                selected === "transfer"
                  ? "bg-green-700 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <i className="bx bx-transfer-alt text-2xl"></i>
            </div>
            <div className="overflow-hidden">
              <p
                className={`font-bold text-sm ${
                  selected === "transfer" ? "text-green-800" : "text-black"
                }`}
              >
                Bank Transfer
              </p>
              <p className="text-[10px] text-gray-500 truncate">
                Instant bank transfer
              </p>
            </div>
          </button>
        </div>
      </div>
      <div></div>
    </div>
  );
};
