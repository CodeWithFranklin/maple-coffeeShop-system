import { useState } from "react";
import { PickupDetails, DeliveryDetails } from "./CheckoutPages";

export default function Checkout() {
  const [orderType, setOrderType] = useState("pickup");

  const detailsMap = {
    pickup: <PickupDetails />,
    delivery: <DeliveryDetails />,
  };

  return (
    <section className="min-h-screen bg-gray-50/50">
      <div className="w-[90%] max-w-7xl mx-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Checkout Logic */}
        <div className="lg:col-span-8 space-y-8">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-x-1">
              <button className="btn btn-soft shadow-none w-8 h-8 rounded-full group">
                <i className="bx bx-chevron-left bx-sm group-hover:-translate-x-1 transition-transform"></i>
              </button>
              Checkout
            </h2>

            {/* Selection Container */}
            <div className="flex flex-col md:flex-row gap-6 mt-6">
              {/* Option: Pickup */}
              <button
                onClick={() => setOrderType("pickup")}
                className={`flex-1 flex items-center gap-x-4 p-5 rounded-full cursor-pointer transition-all text-left ${
                  orderType === "pickup"
                    ? "bg-green-50 border border-green-600 ring-2 ring-green-100"
                    : "bg-white border border-black shadow-sm grayscale hover:grayscale-0"
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                    orderType === "pickup" ? "bg-green-700" : "bg-gray-800"
                  }`}
                >
                  <i className="bx bxs-store text-white text-2xl"></i>
                </div>
                <div>
                  <p
                    className={`font-bold ${
                      orderType === "pickup" ? "text-green-800" : "text-black"
                    }`}
                  >
                    Pick-up
                  </p>
                  <p className="text-xs opacity-70 leading-tight">
                    From our store branch
                  </p>
                </div>
              </button>
              <div className="my-auto">OR</div>
              {/* Option: Delivery */}
              <button
                onClick={() => setOrderType("delivery")}
                className={`flex-1 flex items-center gap-x-4 p-5 rounded-full cursor-pointer border-1 transition-all text-left ${
                  orderType === "delivery"
                    ? "bg-green-50 border-green-600 ring-4 ring-green-100"
                    : "bg-white border-transparent shadow-sm grayscale hover:grayscale-0"
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                    orderType === "delivery" ? "bg-green-700" : "bg-gray-800"
                  }`}
                >
                  <i className="bx bxs-truck text-white text-2xl"></i>
                </div>
                <div>
                  <p
                    className={`font-bold ${
                      orderType === "delivery" ? "text-green-800" : "text-black"
                    }`}
                  >
                    Delivery
                  </p>
                  <p className="text-xs opacity-70 leading-tight">
                    Straight to your doorstep
                  </p>
                </div>
              </button>
            </div>

            {/* 3. Dynamic "Details" Section */}
            <div className="min-h-[200px] pt-10 ms-5">
              <div className="space-y-6">
                {/* 1. Contact Info Card */}
                <div className="space-y-3 animate-in fade-in slide-in-from-left-4 duration-300 mb-10">
                  <div className="flex justify-between">
                    <p className="font-bold text-lg">Contact Information</p>
                    <p className="rounded-3xl group underline text-error cursor-pointer font-semibold">
                      Edit Info
                      <i className="ms-1 bx bxs-pencil bx-xs group-hover:-translate-x-1 transition-transform"></i>
                    </p>
                  </div>
                  <div className="flex items-center px-7 gap-x-6 bg-white h-20 rounded-4xl shadow-sm">
                    <div className="avatar avatar-placeholder bg-black w-11 aspect-square rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs">
                      JD
                    </div>
                    <div className="text-sm">
                      <p>
                        <span className="font-semibold text-gray-500">
                          Full Name:
                        </span>{" "}
                        John Doe
                      </p>
                    </div>
                    <div className="text-sm">
                      <p>
                        <span className="font-semibold text-gray-500">
                          Email:
                        </span>{" "}
                        Doe34@gmail.com
                      </p>
                    </div>
                    <div className="text-sm">
                      <p>
                        <span className="font-semibold text-gray-500">
                          Phone:
                        </span>{" "}
                        08165438276
                      </p>
                    </div>
                  </div>
                </div>
                {detailsMap[orderType]}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 sticky top-8">
            <h3 className="font-bold text-xl mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₦4,500</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-3 mt-3">
                <span>Total</span>
                <span className="text-green-700 text-">₦4,500</span>
              </div>
              <button className="btn btn-neutral w-65 mt-6 rounded-2xl h-10 rounded-full text-sm font-bold">
                Pay Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
