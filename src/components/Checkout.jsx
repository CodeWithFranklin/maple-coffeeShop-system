import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { useFormik } from "formik";
import { toast } from "sonner";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
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

const getDeliveryCategory = (cartItems) => {
  if (cartItems.some((item) => item.category === "food")) return "food";
  if (cartItems.some((item) => item.category === "book")) return "book";
  if (cartItems.some((item) => item.category === "drink")) return "drink";

  return "default";
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

    return cartItems.reduce(
      (acc, item) => acc + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
  }, [cartItems, passedTotal]);

  const deliveryFee = useMemo(() => {
    if (orderType !== "delivery") return 0;

    return getDeliveryFee({
      store,
      deliveryDetails,
    });
  }, [orderType, store, deliveryDetails]);

  const total = useMemo(() => {
    return subtotal + deliveryFee;
  }, [subtotal, deliveryFee]);

  const deliveryCategory = useMemo(() => {
    return getDeliveryCategory(cartItems);
  }, [cartItems]);

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
      toast.error("Could not save your address. Order will still be placed.");
    }
  }, [user?.uid, deliveryDetails, store]);

  const handlePayNow = useCallback(async () => {
    if (!user?.uid) {
      toast.error("Please sign in to place your order.");
      return;
    }

    const errors = await contactFormik.validateForm();

    contactFormik.setTouched({
      fullName: true,
      contactEmail: true,
      phone: true,
    });

    if (Object.keys(errors).length > 0) return;

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

    if (!paymentMethod) {
      toast.error("Please select a payment method.");
      return;
    }

    setIsPlacingOrder(true);

    try {
      if (orderType === "delivery" && deliveryDetails.saveAsDefault) {
        await saveDefaultDeliveryAddress();
      }

      const orderPayload = {
        userId: user.uid,

        storeId: store.id,
        storeName: store.name,

        orderType,
        deliveryCategory: orderType === "delivery" ? deliveryCategory : null,

        status: "pending",

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
          name: item.name,
          img: item.img || "",
          category: item.category || "",
          tags: item.tags || [],
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 0),
          lineTotal: Number(item.price || 0) * Number(item.quantity || 0),
        })),

        subtotal,
        deliveryFee,
        total,

        currency: {
          code: storeCurrencyCode,
          locale: storeCurrencyLocale,
        },

        payment: {
          method: paymentMethod,
          status: "pending",
          provider: paymentMethod === "card" ? "paystack" : null,
          reference: null,
          paidAt: null,
        },

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const orderRef = await addDoc(collection(db, "orders"), orderPayload);

      toast.success("Order placed successfully!");

      navigate(`/orders/${orderRef.id}`, {
        replace: true,
      });
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Could not place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  }, [
    user,
    contactFormik,
    orderType,
    pickupDetails,
    deliveryDetails,
    paymentMethod,
    cartItems,
    store,
    subtotal,
    deliveryFee,
    total,
    deliveryCategory,
    storeCurrencyCode,
    storeCurrencyLocale,
    saveDefaultDeliveryAddress,
    navigate,
  ]);

  if (!store || cartItems.length === 0) {
    return <Navigate to="/stores" replace />;
  }

  return (
    <section className="min-h-screen bg-gray-50/50">
      <div className="w-[90%] max-w-7xl mx-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-x-1">
              <button
                type="button"
                onClick={handleBackToStore}
                className="btn btn-soft shadow-none w-8 h-8 rounded-full group"
              >
                <i className="bx bx-chevron-left bx-sm group-hover:-translate-x-1 transition-transform"></i>
              </button>
              Checkout
            </h2>

            <div className="flex flex-col md:flex-row gap-6 mt-6">
              <button
                type="button"
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
                    <p className="font-bold text-lg">Contact Information</p>
                    <p className="text-xs text-gray-400">
                      We'll use this contact info for this order only. Your
                      login email will not change.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { name: "fullName", label: "Full Name", type: "text" },
                      {
                        name: "contactEmail",
                        label: "Contact Email",
                        type: "email",
                      },
                      { name: "phone", label: "Phone", type: "tel" },
                    ].map(({ name, label, type }) => (
                      <div key={name}>
                        <label className="text-xs font-semibold text-gray-500">
                          {label}
                        </label>

                        <input
                          name={name}
                          type={type}
                          value={contactFormik.values[name]}
                          onChange={contactFormik.handleChange}
                          onBlur={contactFormik.handleBlur}
                          className={`input input-bordered w-full rounded-2xl mt-1 ${
                            contactFormik.touched[name] &&
                            contactFormik.errors[name]
                              ? "border-red-500"
                              : ""
                          }`}
                        />

                        {contactFormik.touched[name] &&
                          contactFormik.errors[name] && (
                            <p className="text-red-500 text-xs mt-1">
                              {contactFormik.errors[name]}
                            </p>
                          )}
                      </div>
                    ))}
                  </div>
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
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 sticky top-8">
            <h3 className="font-bold text-xl mb-4">Order Summary</h3>

            <div className="space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start text-sm text-gray-600"
                >
                  <div>
                    <p className="font-semibold text-black">{item.name}</p>
                    <p className="text-xs">Qty: {item.quantity}</p>
                  </div>

                  <span>
                    {formatMoney(
                      Number(item.price || 0) * Number(item.quantity || 0),
                      storeCurrencyCode,
                      storeCurrencyLocale
                    )}
                  </span>
                </div>
              ))}

              <div className="flex justify-between text-gray-600 border-t pt-3 mt-3">
                <span>Subtotal</span>
                <span>
                  {formatMoney(
                    subtotal,
                    storeCurrencyCode,
                    storeCurrencyLocale
                  )}
                </span>
              </div>

              {orderType === "delivery" && (
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>
                    {deliveryDetails.city
                      ? formatMoney(
                          deliveryFee,
                          storeCurrencyCode,
                          storeCurrencyLocale
                        )
                      : "Select city"}
                  </span>
                </div>
              )}

              <div className="flex justify-between font-bold text-lg border-t pt-3 mt-3">
                <span>Total</span>
                <span className="text-green-700">
                  {formatMoney(total, storeCurrencyCode, storeCurrencyLocale)}
                </span>
              </div>

              <button
                type="button"
                onClick={handlePayNow}
                disabled={isPlacingOrder}
                className="btn btn-neutral w-full mt-6 rounded-full h-10 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlacingOrder ? "Placing order..." : "Pay Now"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
