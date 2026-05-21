import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { toast } from "sonner";
import { functions } from "../firebase";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasVerifiedRef = useRef(false);

  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    const verifyPayment = async () => {
      if (hasVerifiedRef.current) return;

      hasVerifiedRef.current = true;

      const reference = searchParams.get("reference");

      if (!reference) {
        setStatus("failed");
        toast.error("Payment reference is missing.");
        return;
      }

      try {
        const verifyPaymentFunction = httpsCallable(functions, "verifyPayment");
        const result = await verifyPaymentFunction({ reference });

        const data = result.data;

        if (!data?.success || !data?.orderId) {
          throw new Error("Payment verification failed.");
        }

        setStatus("success");
        toast.success("Payment verified successfully.");

        navigate("/orders", {
          replace: true,
          state: {
            paymentSuccess: true,
            recentOrderId: data.orderId,
          },
        });
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("failed");
        toast.error(
          error?.message || "Could not verify payment. Please contact support."
        );
      }
    };

    verifyPayment();
  }, [navigate, searchParams]);

  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 text-center max-w-md w-[90%]">
        {status === "verifying" && (
          <>
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <h1 className="text-2xl font-black mt-5">Verifying payment</h1>
            <p className="text-gray-500 mt-2">
              Please wait while we confirm your payment.
            </p>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center">
              <i className="bx bx-x text-3xl text-red-600"></i>
            </div>

            <h1 className="text-2xl font-black mt-5">
              Payment verification failed
            </h1>

            <p className="text-gray-500 mt-2">
              We could not confirm this payment. Please check your orders or try
              again.
            </p>

            <button
              type="button"
              onClick={() => navigate("/cart")}
              className="btn btn-primary rounded-full mt-6 px-8"
            >
              Back to Cart
            </button>
          </>
        )}
      </div>
    </section>
  );
}
