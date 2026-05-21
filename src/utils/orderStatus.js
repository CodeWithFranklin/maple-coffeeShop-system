export const formatMoney = (amount, currencyCode = "NGN", locale = "en-NG") => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(Number(amount || 0));
};

export const formatOrderDate = (timestamp, locale = "en-NG") => {
  if (!timestamp) return "Not available";

  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const formatDateInputValue = (date) => {
  if (!date) return "";

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDateInputAsLocalDate = (dateValue) => {
  if (!dateValue) return null;

  const [year, month, day] = dateValue.split("-").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
};

export const getStartOfDay = (dateValue) => {
  const date = parseDateInputAsLocalDate(dateValue);

  if (!date) return null;

  date.setHours(0, 0, 0, 0);

  return date;
};

export const getEndOfDay = (dateValue) => {
  const date = parseDateInputAsLocalDate(dateValue);

  if (!date) return null;

  date.setHours(23, 59, 59, 999);

  return date;
};

export const isTimestampWithinDateRange = (timestamp, fromDate, toDate) => {
  if (!timestamp) return false;

  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const from = fromDate ? getStartOfDay(fromDate) : null;
  const to = toDate ? getEndOfDay(toDate) : null;

  if (from && date < from) return false;
  if (to && date > to) return false;

  return true;
};

export const getOrderStatusLabel = (status) => {
  const labels = {
    pending_payment: "Awaiting payment",
    payment_initialization_failed: "Payment failed",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    needs_refund: "Needs refund",
    payment_mismatch: "Payment issue",
  };

  return labels[status] || "Unknown";
};

export const getPaymentStatusLabel = (status) => {
  const labels = {
    pending: "Pending",
    initialized: "Initialized",
    paid: "Paid",
    mismatch: "Payment mismatch",
    initialization_failed: "Initialization failed",
  };

  return labels[status] || "Unknown";
};

export const getOrderStatusClass = (status) => {
  const classes = {
    pending_payment: "badge-warning",
    payment_initialization_failed: "badge-error",
    confirmed: "badge-success",
    completed: "badge-success",
    cancelled: "badge-neutral",
    needs_refund: "badge-warning",
    payment_mismatch: "badge-error",
  };

  return classes[status] || "badge-neutral";
};

export const getPaymentStatusClass = (status) => {
  const classes = {
    pending: "badge-warning",
    initialized: "badge-info",
    paid: "badge-success",
    mismatch: "badge-error",
    initialization_failed: "badge-error",
  };

  return classes[status] || "badge-neutral";
};

export const getOrderItemCount = (items = []) => {
  return items.reduce((total, item) => {
    return total + Number(item.quantity || 0);
  }, 0);
};
