import TimeInput from "../functions/TimePicker";
import { PaymentMethod } from "./PaymentOptions";
export const PickupDetails = () => (
  <section>
    <div className="space-y-3 animate-in fade-in slide-in-from-left-4 duration-300 mb-10">
      <div className="flex justify-between">
        <p className="font-bold text-lg">Contact Information</p>
        <p className=" rounded-3xl group underline text-error cursor-pointer font-semibold">
          Edit Info
          <i className="ms-1 bx bxs-pencil bx-xs group-hover:-translate-x-1 transition-transform"></i>
        </p>
      </div>
      <div className="p-4 flex flex-col gap-y-3 border-2 border-dashed rounded-2xl border-green-200 bg-green-50">
        <div>
          <p>
            <span className="font-semibold">Full Name:</span>{" "}
            <span className="">John Doe</span>
          </p>{" "}
        </div>
        <div>
          <p>
            <span className="font-semibold">Email Address:</span>{" "}
            <span className="">Doe34@gmail.com</span>
          </p>{" "}
        </div>{" "}
        <div>
          <p>
            <span className="font-semibold">Phone Number:</span>{" "}
            <span className="">08165438276</span>
          </p>{" "}
        </div>{" "}
      </div>
    </div>

    <div className="space-y-3 animate-in fade-in slide-in-from-left-4 duration-300">
      <p className="font-bold text-lg">Pick-up Information</p>
      <div className="flex items-center justify-between border-1 border-gray-400 min-h-22 w-full rounded-full px-5 py-3 mb-5">
        <div className="min-w-40 max-w-75 flex h-fit gap-x-1">
          <div className="avatar avatar-placeholder">
            <div className="bg-neutral text-neutral-content w-10 h-10 rounded-full">
              <span>SY</span>
            </div>
          </div>
          <div className="text-sm">
            <p className="font-bold">Maple Haven</p>
            <p>Rivers State, Port Harcourt</p>
          </div>
        </div>
        <div className="flex gap-x-2">
          <button className="btn h-9 border-0 rounded-3xl border-1 border-gray-400">
            Change Location
          </button>
        </div>
      </div>
    </div>
    <div>
      <p className="font-bold">Pick-Up Time</p>
      <div
        role="alert"
        className="alert alert-vertical sm:alert-horizontal w-fit h-fit shadow-none border-0 mb-2 gap-x-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-warning h-5 w-5 shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <p className="mb-1 font-semibold">we are open from 9am to 6pm</p>
      </div>
      <TimeInput
        label="Select Pickup Time"
        onChange={(val) => console.log("Selected Time:", val)}
      />{" "}
    </div>

    <PaymentMethod onSelect={(method) => console.log("Payment via:", method)} />
  </section>
);

export const DeliveryDetails = () => (
  <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
    <p className="font-bold text-lg">Delivery Address</p>
    <input
      type="text"
      placeholder="Enter your specific home or office address"
      className="input input-bordered w-full rounded-2xl border-gray-300 focus:border-green-600"
    />
  </div>
);
