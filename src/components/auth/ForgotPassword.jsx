import { useState } from "react";
import { Link } from "react-router-dom";
import { useFormik } from "formik";
import {
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
} from "firebase/auth";
import { toast } from "sonner";
import { auth } from "../../firebase.js";
import { customAlert } from "../../utils/customizeAlerts.js";
import { resetPasswordSchema } from "../../utils/validationSchema.js";
import { handleGoogleAuth } from "../../utils/authHelpers.js";

export default function ForgotPassword() {
  const [isSending, setIsSending] = useState(false);
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: resetPasswordSchema,
    onSubmit: async (values, { resetForm }) => {
      const email = values.email.trim().toLowerCase();

      setIsSending(true);
      setIsGoogleAccount(false);

      try {
        const signInMethods = await fetchSignInMethodsForEmail(auth, email);

        const isGoogleOnly =
          signInMethods.includes("google.com") &&
          !signInMethods.includes("password");

        if (isGoogleOnly) {
          setIsGoogleAccount(true);

          toast.info(
            "This account uses Google sign-in. Please continue with Google instead."
          );

          return;
        }

        await sendPasswordResetEmail(auth, email);

        toast.success("Password reset link sent. Please check your email.");
        resetForm();
      } catch (error) {
        console.error("Password reset error:", error);

        toast.error(customAlert(error.message, error.code));
      } finally {
        setIsSending(false);
      }
    },
  });

  const onGoogleClick = (event) => {
    event.preventDefault();

    handleGoogleAuth((errorMessage) => {
      toast.error(customAlert(errorMessage));
    });
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-sm p-6 md:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-black">Forgot Password</h1>

          <p className="text-sm text-gray-500 mt-2">
            Enter your email address and we’ll send you a password reset link if
            your account uses email and password.
          </p>

          <p className="text-xs text-gray-400 mt-2">
            If you signed up with Google, use Continue with Google instead.
          </p>
        </div>

        <form onSubmit={formik.handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-sm text-gray-600 block mb-2">
              Email Address
            </label>

            <label
              className={`input input-bordered w-full ${
                formik.errors.email &&
                (formik.values.email || formik.touched.email)
                  ? "border-red-500"
                  : ""
              }`}
            >
              <i className="bx bx-envelope opacity-50"></i>

              <input
                type="email"
                name="email"
                placeholder="your-email@gmail.com"
                value={formik.values.email}
                onChange={(event) => {
                  setIsGoogleAccount(false);
                  formik.handleChange(event);
                }}
                onBlur={formik.handleBlur}
              />
            </label>

            {formik.errors.email &&
              (formik.values.email || formik.touched.email) && (
                <p className="text-red-500 text-xs mt-1">
                  {formik.errors.email}
                </p>
              )}
          </div>

          {isGoogleAccount && (
            <div className="rounded-2xl bg-green-50 border border-green-100 p-4">
              <p className="text-sm font-semibold text-green-800">
                This account uses Google sign-in.
              </p>

              <p className="text-xs text-green-700 mt-1">
                Please continue with Google instead of resetting a password.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSending || !formik.isValid || !formik.dirty}
            className="btn btn-neutral w-full rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Checking account...
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>

          {isGoogleAccount && (
            <button
              type="button"
              onClick={onGoogleClick}
              className="btn btn-outline w-full rounded-xl"
            >
              <img src="/images/google-icon.svg" alt="" className="w-4" />
              Continue with Google
            </button>
          )}
        </form>

        <div className="text-center mt-6">
          <Link
            to="/signin"
            className="text-sm text-primary font-semibold hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </section>
  );
}
