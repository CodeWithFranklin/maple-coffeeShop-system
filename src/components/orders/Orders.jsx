import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "../../firebase";
import { useAuth } from "../../hooks/useAuth";
import {
  formatDateInputValue,
  formatMoney,
  formatOrderDate,
  getOrderItemCount,
  getOrderStatusClass,
  getOrderStatusLabel,
  getPaymentStatusClass,
  getPaymentStatusLabel,
  isTimestampWithinDateRange,
} from "../../utils/orderStatus";

const getDefaultDateRange = () => {
  const today = new Date();
  const previousWeek = new Date();

  previousWeek.setDate(today.getDate() - 7);

  return {
    from: formatDateInputValue(previousWeek),
    to: formatDateInputValue(today),
  };
};

export default function Orders() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const recentOrderId = location.state?.recentOrderId || null;
  const paymentSuccess = location.state?.paymentSuccess || false;

  const defaultDateRange = useMemo(() => getDefaultDateRange(), []);
  const [fromDate, setFromDate] = useState(defaultDateRange.from);
  const [toDate, setToDate] = useState(defaultDateRange.to);

  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (paymentSuccess) {
      toast.success("Payment successful. Your order has been confirmed.");

      navigate(location.pathname, {
        replace: true,
        state: {
          recentOrderId,
        },
      });
    }
  }, [paymentSuccess, recentOrderId, navigate, location.pathname]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
       const ordersQuery = query(
         collection(db, "orders"),
         where("userId", "==", user.uid),
         where("status", "in", [
           "confirmed",
           "completed",
           "needs_refund",
           "payment_mismatch",
         ]),
         orderBy("createdAt", "desc")
       );

        const snap = await getDocs(ordersQuery);

        const nextOrders = snap.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }))
          .filter((order) =>
            isTimestampWithinDateRange(order.createdAt, fromDate, toDate)
          );

        setOrders(nextOrders);
      } catch (fetchError) {
        console.error("Error fetching orders:", fetchError);
        setError("Could not load your orders. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user?.uid, fromDate, toDate]);

  const recentOrder = useMemo(() => {
    if (!orders.length) return null;

    if (recentOrderId) {
      return orders.find((order) => order.id === recentOrderId) || orders[0];
    }

    return orders[0];
  }, [orders, recentOrderId]);

  const previousOrders = useMemo(() => {
    if (!recentOrder) return orders;

    return orders.filter((order) => order.id !== recentOrder.id);
  }, [orders, recentOrder]);

  return (
    <section className="min-h-screen">
      <div className="w-[90%] max-w-6xl mx-auto py-8">
        <div className="flex items-center gap-x-3 gap-y-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-soft shadow-none w-9 h-9 rounded-full group"
          >
            <i className="bx bx-chevron-left bx-sm group-hover:-translate-x-1 transition-transform"></i>
          </button>

          <div>
            <h1 className="text-2xl font-black">Orders</h1>
            <p className="text-sm text-gray-500">
              View your recent and previous orders.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col md:flex-row gap-4 md:items-end">
          <div>
            <label className="text-sm text-gray-500 block mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="input input-bordered rounded-xl w-full md:w-44"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 block mb-2">End Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="input input-bordered rounded-xl w-full md:w-44"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
            className="btn btn-ghost rounded-xl"
          >
            Clear filter
          </button>
        </div>

        <div className="mt-7 flex items-center gap-x-3">
          <button
            type="button"
            onClick={() => setActiveTab("bookings")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              activeTab === "bookings"
                ? "bg-red-50 text-red-500"
                : "text-black hover:bg-gray-100"
            }`}
          >
            Bookings
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              activeTab === "orders"
                ? "bg-red-50 text-red-500"
                : "text-black hover:bg-gray-100"
            }`}
          >
            Orders
          </button>
        </div>

        {activeTab === "bookings" && (
          <div className="mt-20 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-50 mx-auto flex items-center justify-center">
              <i className="bx bx-calendar text-4xl text-gray-300"></i>
            </div>
            <h2 className="font-black text-lg mt-5">No bookings</h2>
            <p className="text-gray-500 text-sm">
              You do not have any bookings yet.
            </p>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="mt-8">
            {loading && (
              <div className="text-center py-20">
                <span className="loading loading-spinner loading-lg"></span>
                <p className="mt-4 text-gray-500">Loading your orders...</p>
              </div>
            )}

            {!loading && error && (
              <div className="alert alert-error rounded-3xl">
                <i className="bx bx-error-circle text-xl"></i>
                <span>{error}</span>
              </div>
            )}

            {!loading && !error && orders.length === 0 && (
              <div className="mt-20 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-50 mx-auto flex items-center justify-center">
                  <i className="bx bx-receipt text-4xl text-gray-300"></i>
                </div>
                <h2 className="font-black text-lg mt-5">No orders</h2>
                <p className="text-gray-500 text-sm">
                  You do not have any orders for this date range.
                </p>
              </div>
            )}

            {!loading && !error && recentOrder && (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-black text-lg">
                      {recentOrderId ? "Recent Order" : "Latest Order"}
                    </h2>

                    <Link
                      to={`/orders/${recentOrder.id}`}
                      className="text-sm font-bold text-green-700 hover:underline"
                    >
                      View details
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-10">
                    <OrderCard order={recentOrder} highlighted />
                  </div>
                </div>

                {previousOrders.length > 0 && (
                  <div>
                    <h2 className="font-black text-lg mb-4">Order History</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-10">
                      {previousOrders.map((order) => (
                        <OrderCard key={order.id} order={order} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function OrderCard({ order, highlighted = false }) {
  const currencyCode = order?.currency?.code || "NGN";
  const currencyLocale = order?.currency?.locale || "en-NG";
  const itemCount = getOrderItemCount(order.items);

  return (
    <Link
      to={`/orders/${order.id}`}
      className={`card bg-base-100 w-full max-w-[320px] shadow-sm border overflow-hidden transition hover:-translate-y-1 hover:shadow-md ${
        highlighted ? "border-green-200 bg-green-50/70" : "border-gray-100"
      }`}
    >
      <figure className="h-48 bg-gray-100">
        {order.items?.[0]?.img ? (
          <img
            src={order.items[0].img}
            alt={order.items[0].name || "Order item"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <i className="bx bx-shopping-bag text-5xl text-gray-400"></i>
          </div>
        )}
      </figure>

      <div className="card-body p-4">
        <div>
          <h2 className="card-title font-black text-base leading-tight">
            {order.items?.[0]?.name || "Item"}
            <span className="badge badge-neutral badge-sm ml-2">
              x{order.items?.[0]?.quantity || 1}
            </span>
          </h2>

          {order.items?.length > 1 && (
            <p className="text-xs text-gray-400 mt-1">
              + {order.items.length - 1} more item
              {order.items.length - 1 === 1 ? "" : "s"}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span
            className={`badge badge-sm ${getOrderStatusClass(order.status)}`}
          >
            {getOrderStatusLabel(order.status)}
          </span>

          <span
            className={`badge badge-sm ${getPaymentStatusClass(
              order.payment?.status
            )}`}
          >
            {getPaymentStatusLabel(order.payment?.status)}
          </span>
        </div>

        <p className="font-black text-xl text-green-700 mt-2">
          {formatMoney(order.total, currencyCode, currencyLocale)}
        </p>

        <p className="text-sm text-gray-500">
          <i className="bx bx-store mr-1"></i>
          {order.storeName || "Store"}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 mt-1">
          <span>
            <i className="bx bx-package mr-1"></i>
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </span>

          <span>
            <i className="bx bx-shopping-bag mr-1"></i>
            {order.orderType === "delivery" ? "Delivery" : "Pickup"}
          </span>
        </div>

        <p className="text-xs text-gray-400 mt-1">
          <i className="bx bx-calendar mr-1"></i>
          {formatOrderDate(order.createdAt, currencyLocale)}
        </p>

        <div className="card-actions justify-end mt-3">
          <span className="btn btn-sm btn-primary rounded-full">
            View details
            <i className="bx bx-chevron-right text-lg"></i>
          </span>
        </div>
      </div>
    </Link>
  );
}
