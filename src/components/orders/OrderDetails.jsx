import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../hooks/useAuth";
import {
  formatMoney,
  formatOrderDate,
  getOrderStatusClass,
  getOrderStatusLabel,
  getPaymentStatusClass,
  getPaymentStatusLabel,
} from "../../utils/orderStatus";

export default function OrderDetails() {
  const { user } = useAuth();
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [pageState, setPageState] = useState("loading");

  useEffect(() => {
    const fetchOrder = async () => {
      if (!user?.uid || !orderId) return;

      setPageState("loading");

      try {
        const orderSnap = await getDoc(doc(db, "orders", orderId));

        if (!orderSnap.exists()) {
          setPageState("not-found");
          return;
        }

        const orderData = {
          id: orderSnap.id,
          ...orderSnap.data(),
        };

        if (orderData.userId !== user.uid) {
          setPageState("not-allowed");
          return;
        }

        setOrder(orderData);
        setPageState("ready");
      } catch (error) {
        console.error("Error fetching order:", error);
        setPageState("not-found");
      }
    };

    fetchOrder();
  }, [user?.uid, orderId]);

  if (pageState === "loading") {
    return (
      <section className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-gray-500">Loading order...</p>
        </div>
      </section>
    );
  }

  if (pageState === "not-allowed") {
    return (
      <section className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-[32px] p-8 text-center max-w-md w-[90%]">
          <i className="bx bx-lock-alt text-5xl text-gray-300"></i>
          <h1 className="font-black text-2xl mt-4">Access denied</h1>
          <p className="text-gray-500 mt-2">You cannot view this order.</p>
          <Link to="/orders" className="btn btn-neutral rounded-full mt-6">
            Back to Orders
          </Link>
        </div>
      </section>
    );
  }

  if (pageState === "not-found" || !order) {
    return (
      <section className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-[32px] p-8 text-center max-w-md w-[90%]">
          <i className="bx bx-receipt text-5xl text-gray-300"></i>
          <h1 className="font-black text-2xl mt-4">Order not found</h1>
          <p className="text-gray-500 mt-2">
            This order does not exist or has been removed.
          </p>
          <Link to="/orders" className="btn btn-neutral rounded-full mt-6">
            Back to Orders
          </Link>
        </div>
      </section>
    );
  }

  const currencyCode = order?.currency?.code || "NGN";
  const currencyLocale = order?.currency?.locale || "en-NG";

  return (
    <section className="min-h-screen bg-gray-50">
      <div className="w-[90%] max-w-5xl mx-auto py-8">
        <div className="flex items-center gap-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-soft shadow-none w-9 h-9 rounded-full group"
          >
            <i className="bx bx-chevron-left bx-sm group-hover:-translate-x-1 transition-transform"></i>
          </button>

          <div>
            <h1 className="text-2xl font-black">Order Details</h1>
            <p className="text-sm text-gray-500">Order ID: {order.id}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="font-black text-xl">
                    {order.storeName || "Store"}
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Created: {formatOrderDate(order.createdAt, currencyLocale)}
                  </p>

                  {order.payment?.paidAt && (
                    <p className="text-sm text-gray-500 mt-1">
                      Paid:{" "}
                      {formatOrderDate(order.payment.paidAt, currencyLocale)}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`badge ${getOrderStatusClass(order.status)}`}
                  >
                    {getOrderStatusLabel(order.status)}
                  </span>

                  <span
                    className={`badge ${getPaymentStatusClass(
                      order.payment?.status
                    )}`}
                  >
                    {getPaymentStatusLabel(order.payment?.status)}
                  </span>
                </div>
              </div>

              {order.status === "needs_refund" && (
                <div className="alert alert-warning rounded-3xl mt-5">
                  <i className="bx bx-error-circle text-xl"></i>
                  <span>
                    Payment was received, but there was an inventory issue.
                    Support will review this order.
                  </span>
                </div>
              )}

              {order.status === "payment_mismatch" && (
                <div className="alert alert-error rounded-3xl mt-5">
                  <i className="bx bx-error-circle text-xl"></i>
                  <span>
                    There is a payment amount issue with this order. Please
                    contact support.
                  </span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
              <h2 className="font-black text-lg mb-5">Items</h2>

              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between gap-4 border-b border-gray-100 last:border-0 pb-4 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-3xl bg-gray-100 overflow-hidden shrink-0">
                        {item.img ? (
                          <img
                            src={item.img}
                            alt={item.name || "Order item"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <i className="bx bx-shopping-bag text-3xl text-gray-400"></i>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="font-bold">{item.name || "Item"}</p>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>

                    <p className="font-bold">
                      {formatMoney(
                        item.lineTotal,
                        currencyCode,
                        currencyLocale
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
              <h2 className="font-black text-lg mb-5">
                {order.orderType === "delivery"
                  ? "Delivery Details"
                  : "Pickup Details"}
              </h2>

              {order.orderType === "delivery" ? (
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-bold text-black">Address:</span>{" "}
                    {order.delivery?.address || "N/A"}
                  </p>
                  <p>
                    <span className="font-bold text-black">City:</span>{" "}
                    {order.delivery?.city || "N/A"}
                  </p>
                  <p>
                    <span className="font-bold text-black">State:</span>{" "}
                    {order.delivery?.state || "N/A"}
                  </p>
                  <p>
                    <span className="font-bold text-black">Landmark:</span>{" "}
                    {order.delivery?.landmark || "N/A"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-bold text-black">Pickup type:</span>{" "}
                    {order.pickup?.pickupType === "scheduled"
                      ? "Scheduled"
                      : "ASAP"}
                  </p>

                  {order.pickup?.scheduledTime ? (
                    <p>
                      <span className="font-bold text-black">
                        Scheduled time:
                      </span>{" "}
                      {order.pickup.scheduledTime}
                    </p>
                  ) : (
                    <p>
                      <span className="font-bold text-black">Ready time:</span>{" "}
                      Usually ready in 10–20 minutes depending on traffic.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 sticky top-8">
              <h2 className="font-black text-lg mb-5">Payment Summary</h2>

              <div className="space-y-3 text-sm">
                <SummaryRow
                  label="Subtotal"
                  value={formatMoney(
                    order.subtotal,
                    currencyCode,
                    currencyLocale
                  )}
                />

                <SummaryRow
                  label="Discount"
                  value={`-${formatMoney(
                    order.discountTotal,
                    currencyCode,
                    currencyLocale
                  )}`}
                />

                {order.orderType === "delivery" && (
                  <SummaryRow
                    label="Delivery fee"
                    value={formatMoney(
                      order.deliveryFee,
                      currencyCode,
                      currencyLocale
                    )}
                  />
                )}

                <div className="border-t border-gray-100 pt-3 mt-3">
                  <SummaryRow
                    label="Total"
                    value={formatMoney(
                      order.total,
                      currencyCode,
                      currencyLocale
                    )}
                    strong
                  />
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-gray-100 space-y-2 text-xs text-gray-500">
                <p>
                  <span className="font-bold text-black">Provider:</span>{" "}
                  {order.payment?.provider || "N/A"}
                </p>
                <p>
                  <span className="font-bold text-black">Method:</span>{" "}
                  {order.payment?.method || "N/A"}
                </p>
                <p className="break-all">
                  <span className="font-bold text-black">Reference:</span>{" "}
                  {order.payment?.reference || "N/A"}
                </p>
                <p>
                  <span className="font-bold text-black">Gateway:</span>{" "}
                  {order.payment?.gatewayResponse || "N/A"}
                </p>
              </div>

              <Link
                to="/orders"
                className="btn btn-neutral w-full rounded-full mt-6"
              >
                Back to Orders
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <div
      className={`flex items-center justify-between ${
        strong ? "font-black text-lg" : "text-gray-600"
      }`}
    >
      <span>{label}</span>
      <span className={strong ? "text-green-700" : "text-black"}>{value}</span>
    </div>
  );
}
