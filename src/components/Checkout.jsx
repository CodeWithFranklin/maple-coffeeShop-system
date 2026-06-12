import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { toast } from "sonner";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { PickupDetails, DeliveryDetails } from "./CheckoutPages";
import { checkoutContactSchema } from "../utils/validationSchema";

const formatMoney = (amount, currencyCode = "USD", locale = "en-US") => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(Number(amount || 0));
};

const getDeliveryFee = ({ store, deliveryDetails }) => {
  if (!deliveryDetails?.city) return 0;

  const cityFee = store?.delivery?.fees?.byCity?.[deliveryDetails.city];
  const defaultFee = store?.delivery?.fees?.default;

  return Number(cityFee ?? defaultFee ?? 0);
};

const isSavedAddressAllowedForStore = ({ address, store }) => {
  if (!address || !store) return false;

  const lockedState = store?.delivery?.state || store?.state;
  const allowedCities = store?.delivery?.cities || [];

  return address.state === lockedState && allowedCities.includes(address.city);
};

const getPaymentButtonText = ({ isPlacingOrder, paymentMethod }) => {
  if (isPlacingOrder) return "Initializing payment...";

  if (paymentMethod === "transfer") {
    return "Pay with Bank Transfer";
  }

  return "Pay with Card";
};

export default function Checkout() {
  const { user, userInfo } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const store = location.state?.selectedStore;
  const passedTotal = location.state?.total || 0;

  const cartItems = useMemo(() => {
    return location.state?.cartItems || [];
  }, [location.state?.cartItems]);

  const storeCurrencyCode = store?.currency?.code || "USD";
  const storeCurrencyLocale = store?.currency?.locale || "en-US";

  const [orderType, setOrderType] = useState("pickup");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [pickupDetails, setPickupDetails] = useState({
    pickupType: "asap",
    scheduledTime: null,
  });

  const [deliveryDetails, setDeliveryDetails] = useState({
    address: "",
    country: store?.delivery?.country || store?.country || "",
    state: "",
    city: "",
    landmark: "",
    saveAsDefault: false,
  });

  const [paymentMethod, setPaymentMethod] = useState("card");

  const createCheckoutOrder = useMemo(() => {
    return httpsCallable(functions, "createCheckoutOrder");
  }, []);

  const contactFormik = useFormik({
    initialValues: {
      fullName: userInfo?.name || user?.displayName || "",
      contactEmail: userInfo?.contactEmail || user?.email || "",
      phone: userInfo?.phone || user?.phoneNumber || "",
    },
    enableReinitialize: true,
    validationSchema: checkoutContactSchema,
    onSubmit: () => {},
  });

  const subtotal = useMemo(() => {
    if (passedTotal) return passedTotal;

    return cartItems.reduce((acc, item) => {
      return acc + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0);
  }, [cartItems, passedTotal]);

  const deliveryFee = useMemo(() => {
    if (orderType !== "delivery") return 0;

    return getDeliveryFee({
      store,
      deliveryDetails,
    });
  }, [orderType, store, deliveryDetails]);

  const discountTotal = 0;

  const total = useMemo(() => {
    return Math.max(subtotal - discountTotal + deliveryFee, 0);
  }, [subtotal, deliveryFee]);

  useEffect(() => {
    const fetchDefaultAddress = async () => {
      if (!user?.uid || !store) return;

      try {
        const addressSnap = await getDoc(
          doc(db, "users", user.uid, "addresses", "default")
        );

        if (!addressSnap.exists()) return;

        const savedAddress = addressSnap.data();

        const addressIsAllowed = isSavedAddressAllowedForStore({
          address: savedAddress,
          store,
        });

        setDeliveryDetails((current) => ({
          ...current,
          address: savedAddress.address || "",
          country:
            savedAddress.country ||
            store?.delivery?.country ||
            store?.country ||
            "",
          state: addressIsAllowed
            ? savedAddress.state || ""
            : store?.delivery?.state || store?.state || "",
          city: addressIsAllowed ? savedAddress.city || "" : "",
          landmark: savedAddress.landmark || "",
          saveAsDefault: false,
        }));
      } catch (error) {
        console.error("Error loading default address:", error);
      }
    };

    fetchDefaultAddress();
  }, [user?.uid, store]);

  const handleBackToStore = useCallback(() => {
    navigate("/order", {
      state: {
        selectedStore: store,
      },
    });
  }, [navigate, store]);

  const saveDefaultDeliveryAddress = useCallback(async () => {
    if (!user?.uid) return;

    try {
      await setDoc(
        doc(db, "users", user.uid, "addresses", "default"),
        {
          label: "Default",
          address: deliveryDetails.address.trim(),
          country:
            deliveryDetails.country ||
            store?.delivery?.country ||
            store?.country ||
            "",
          state: deliveryDetails.state,
          city: deliveryDetails.city,
          landmark: deliveryDetails.landmark.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Could not save your address. Payment will still continue.");
    }
  }, [user?.uid, deliveryDetails, store]);

  const handlePayNow = useCallback(async () => {
    if (!user?.uid) {
      toast.error("Please sign in to place your order.");
      return;
    }

    if (!store?.id) {
      toast.error("Store information is missing. Please select a store again.");
      return;
    }

    if (!cartItems.length) {
      toast.error("Your cart is empty.");
      return;
    }

    const errors = await contactFormik.validateForm();

    contactFormik.setTouched({
      fullName: true,
      contactEmail: true,
      phone: true,
    });

    if (Object.keys(errors).length > 0) {
      toast.error("Please recheck your contact information.");

      return;
    }

    if (orderType === "pickup") {
      if (
        pickupDetails.pickupType === "scheduled" &&
        !pickupDetails.scheduledTime
      ) {
        toast.error("Please select a pickup time.");
        return;
      }
    }

    if (orderType === "delivery") {
      if (!deliveryDetails.address.trim()) {
        toast.error("Please enter your delivery address.");
        return;
      }

      if (!deliveryDetails.state) {
        toast.error("Please select a delivery state.");
        return;
      }

      if (!deliveryDetails.city) {
        toast.error("Please select a delivery city.");
        return;
      }

      if (!deliveryDetails.landmark.trim()) {
        toast.error("Please enter the closest landmark.");
        return;
      }
    }

    if (!["card", "transfer"].includes(paymentMethod)) {
      toast.error("Please select a valid payment method.");
      return;
    }
    if (paymentMethod === "transfer" && total < 100) {
      toast.error(
        "Bank transfer is only available for orders of ₦100 and above, please choose another payment method"
      );
      return;
    }
    setIsPlacingOrder(true);

    try {
      if (orderType === "delivery" && deliveryDetails.saveAsDefault) {
        await saveDefaultDeliveryAddress();
      }

      const result = await createCheckoutOrder({
        storeId: store.id,
        orderType,

        contact: {
          fullName: contactFormik.values.fullName,
          email: contactFormik.values.contactEmail,
          phone: contactFormik.values.phone,
        },

        pickup:
          orderType === "pickup"
            ? {
                pickupType: pickupDetails.pickupType,
                scheduledTime: pickupDetails.scheduledTime,
              }
            : null,

        delivery:
          orderType === "delivery"
            ? {
                address: deliveryDetails.address.trim(),
                country:
                  deliveryDetails.country ||
                  store?.delivery?.country ||
                  store?.country ||
                  "",
                state: deliveryDetails.state,
                city: deliveryDetails.city,
                landmark: deliveryDetails.landmark.trim(),
              }
            : null,

        items: cartItems.map((item) => ({
          productId: item.productId || item.id,
          quantity: Number(item.quantity || 0),
        })),

        paymentMethod,
        discountCode: null,
      });

      const response = result.data;

      if (!response?.authorizationUrl) {
        throw new Error("Payment initialization failed.");
      }

      window.location.href = response.authorizationUrl;
    } catch (error) {
      console.error("Error initializing payment:", error);

      toast.error(
        error?.message || "Could not initialize payment. Please try again."
      );
    } finally {
      setIsPlacingOrder(false);
    }
  }, [
    user?.uid,
    store,
    cartItems,
    contactFormik,
    orderType,
    pickupDetails,
    deliveryDetails,
    paymentMethod,
    saveDefaultDeliveryAddress,
    createCheckoutOrder,
  ]);

  if (!store || cartItems.length === 0) {
    return <Navigate to="/stores" replace />;
  }

  return (
    <section>
      <div className="w-[90%] max-w-7xl mx-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <div>
            <div className="group flex w-fit mb-10 items-center font-bold cursor-pointer">
              <div onClick={handleBackToStore}>
                <button
                  type="button"
                  className="btn btn-soft shadow-none w-8 h-8 me-2 rounded-full"
                >
                  <i className="bx bx-chevron-left bx-sm transition-transform group-hover:-translate-x-1"></i>
                </button>

                <span className="border-b border-dashed">Back to order</span>
              </div>
            </div>
            <h3 className="text-4xl font-bold">Checkout</h3>

            <div className="flex flex-col md:flex-row gap-6 mt-6">
              <button
                type="button"
                onClick={() => setOrderType("pickup")}
                className={`flex-1 flex items-center gap-x-4 p-5 rounded-full cursor-pointer transition-all text-left ${
                  orderType === "pickup"
                    ? "bg-green-50 border border-green-600 ring-2 ring-green-100"
                    : "bg-white shadow-sm grayscale hover:grayscale-0"
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

              <button
                type="button"
                onClick={() => setOrderType("delivery")}
                disabled={!store?.delivery?.cities?.length}
                className={`flex-1 flex items-center gap-x-4 p-5 rounded-full cursor-pointer border-1 transition-all text-left ${
                  orderType === "delivery"
                    ? "bg-green-50 border-green-600 ring-4 ring-green-100"
                    : "bg-white border-transparent shadow-sm grayscale hover:grayscale-0"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
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
                    {store?.delivery?.cities?.length
                      ? "Straight to your doorstep"
                      : "Not available at this store"}
                  </p>
                </div>
              </button>
            </div>

            <div className="min-h-[200px] pt-10 ms-5">
              <div className="space-y-6">
                <div className="space-y-3 animate-in fade-in slide-in-from-left-4 duration-300 mb-10 bg-white rounded-4xl p-7 shadow-sm">
                  <div>
                    <p className="font-bold text-xl">Contact Information</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="text-sm font-semibold text-gray-500">
                        Full Name
                      </label>

                      <input
                        name="fullName"
                        type="text"
                        value={contactFormik.values.fullName}
                        onChange={contactFormik.handleChange}
                        onBlur={contactFormik.handleBlur}
                        className={`input input-bordered w-full rounded-2xl bg-white mt-1 ${
                          contactFormik.touched.fullName &&
                          contactFormik.errors.fullName
                            ? "border-red-500"
                            : ""
                        }`}
                      />

                      {contactFormik.touched.fullName &&
                        contactFormik.errors.fullName && (
                          <p className="text-red-500 text-xs mt-1">
                            {contactFormik.errors.fullName}
                          </p>
                        )}
                    </div>

                    {/* Contact Email */}
                    <div>
                      <label className="text-sm font-semibold text-gray-500">
                        Contact Email
                      </label>

                      <input
                        name="contactEmail"
                        type="email"
                        value={contactFormik.values.contactEmail}
                        onChange={contactFormik.handleChange}
                        onBlur={contactFormik.handleBlur}
                        className={`input input-bordered w-full rounded-2xl bg-white mt-1 ${
                          contactFormik.touched.contactEmail &&
                          contactFormik.errors.contactEmail
                            ? "border-red-500"
                            : ""
                        }`}
                      />

                      {contactFormik.touched.contactEmail &&
                        contactFormik.errors.contactEmail && (
                          <p className="text-red-500 text-xs mt-1">
                            {contactFormik.errors.contactEmail}
                          </p>
                        )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="text-sm font-semibold text-gray-500">
                        Phone
                      </label>

                      <input
                        name="phone"
                        type="tel"
                        value={contactFormik.values.phone}
                        onChange={contactFormik.handleChange}
                        onBlur={contactFormik.handleBlur}
                        className={`input input-bordered w-full rounded-2xl bg-white mt-1 ${
                          contactFormik.touched.phone &&
                          contactFormik.errors.phone
                            ? "border-red-500"
                            : ""
                        }`}
                      />

                      {contactFormik.touched.phone &&
                        contactFormik.errors.phone && (
                          <p className="text-red-500 text-xs mt-1">
                            {contactFormik.errors.phone}
                          </p>
                        )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">
                    <i className="bx bxs-info-circle bx-xs text-info"></i> For
                    better service please use your whatsapp number{" "}
                  </p>
                </div>

                {orderType === "pickup" ? (
                  <PickupDetails
                    store={store}
                    value={pickupDetails}
                    onChange={setPickupDetails}
                    onPaymentSelect={setPaymentMethod}
                  />
                ) : (
                  <DeliveryDetails
                    user={user}
                    store={store}
                    value={deliveryDetails}
                    onChange={setDeliveryDetails}
                    onPaymentSelect={setPaymentMethod}
                    currencyCode={storeCurrencyCode}
                    currencyLocale={storeCurrencyLocale}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <ul className="list bg-base-100 rounded-3xl shadow-md w-90 sticky top-25 py-5 ms-auto px-5">
            <li className=" text-lg font-extrabold tracking-wide mb-4">
              Order Summary
            </li>

            {/* Cart Items Loop */}
            {cartItems.map((item) => (
              <li
                key={item.productId || item.id}
                className="list-row flex items-center gap-x-1 py-2 after:hidden before:hidden -mx-4"
              >
                {/* Rounded Quantity Avatar */}
                <div className="avatar avatar-placeholder text-md flex-shrink-0">
                  <div className="font-bold w-10 rounded-full bg-neutral text-primary-content flex items-center justify-center">
                    <span>{item.quantity}x</span>
                  </div>
                </div>

                {/* Item Metadata Details Block */}
                <div className="w-60 px-2 flex-1 min-w-0">
                  <div className="font-bold truncate max-w-35 text-wrap text-black">
                    {item.name}
                  </div>

                  <div className="text-xs font-bold opacity-70 mt-0.5">
                    {formatMoney(
                      Number(item.price || 0) * Number(item.quantity || 0),
                      storeCurrencyCode,
                      storeCurrencyLocale
                    )}
                  </div>
                </div>
              </li>
            ))}

            {/* Financial Metrics Section Break */}
            <li className="flex mt-3 justify-between border-t border-gray-300 pt-4 text-[16px]">
              <p className="text-gray-600">Subtotal</p>
              <p className="font-semibold">
                {formatMoney(subtotal, storeCurrencyCode, storeCurrencyLocale)}
              </p>
            </li>

            {/* Conditional Delivery Fee Element */}
            {orderType === "delivery" && (
              <li className="flex mt-2 justify-between text-[16px]">
                <p className="text-gray-600">Delivery Fee</p>
                <p className="font-semibold">
                  {deliveryDetails.city
                    ? formatMoney(
                        deliveryFee,
                        storeCurrencyCode,
                        storeCurrencyLocale
                      )
                    : "Select city"}
                </p>
              </li>
            )}

            {/* Grand Total Row */}
            <li className="flex mt-2 justify-between border-t border-gray-200 pt-3">
              <p className="text-[16px] font-bold">Total</p>
              <p className="text-[16px] font-bold text-green-700">
                {formatMoney(total, storeCurrencyCode, storeCurrencyLocale)}
              </p>
            </li>

            {/* Action Container Control Block */}
            <div className="flex flex-col items-center justify-center mt-4 px-5">
              <button
                type="button"
                onClick={handlePayNow}
                disabled={isPlacingOrder}
                className="btn btn-neutral my-2 rounded-full w-full mx-auto text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed h-10"
              >
                {getPaymentButtonText({
                  isPlacingOrder,
                  paymentMethod,
                })}
              </button>

              {paymentMethod === "transfer" && (
                <p className="text-xs text-gray-400 text-center mt-1 max-w-[90%] leading-tight">
                  You will be redirected to Paystack to complete the bank
                  transfer.
                </p>
              )}
            </div>
          </ul>
        </div>
      </div>
    </section>
  );
}
