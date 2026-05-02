import { useState, useEffect, useContext } from "react";
import { useFormik } from "formik";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebase.js";
import { signInWithEmailAndPassword } from "firebase/auth";
import { handleGoogleAuth } from "../functions/authHelpers.js";
import { signInSchema } from "../functions/validationSchema.js";
import { toast } from "sonner";
import { customAlert } from "../functions/customizeAlerts.js";
import { AuthContext } from "../context/AuthContext.jsx";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { user, userInfoLoading } = useContext(AuthContext);

  const redirectToRelevantPage = () => {
    const storeId = localStorage.getItem("last_active_store_id");
    const savedStore = localStorage.getItem("pending_store");
    const savedCart = localStorage.getItem(`cart_store_${storeId}`);

    if (savedCart && savedStore) {
      navigate(
        "/order",
        { state: { selectedStore: JSON.parse(savedStore) } },
        { replace: true }
      );
    } else {
      navigate("/", { replace: true });
    }
  };

  // Redirect already-authenticated users away from auth pages
  useEffect(() => {
    if (user && !userInfoLoading) {
      redirectToRelevantPage();
    }
  }, [user, userInfoLoading]);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: signInSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast.success("Welcome Back!");
        redirectToRelevantPage();
      } catch (error) {
        toast.error(customAlert(error.message, error.code));
      } finally {
        setSubmitting(false);
      }
    },
  });

  const onGoogleClick = (e) => {
    e.preventDefault();
    handleGoogleAuth((errorMessage) => {
      toast.error(customAlert(errorMessage));
    });
  };

  return (
    <section className="min-h-full flex justify-center">
      <div className="flex flex-row w-full max-w-7xl p-8">
        {/* Left Side Image */}
        <div className="hidden lg:flex flex-7">
          <img
            src="/images/login.svg"
            alt="login"
            className="h-115 fixed mt-8"
          />
        </div>

        {/* Right Side Form */}
        <div className="flex-6">
          <div className="flex flex-col mx-auto w-100 rounded-4xl bg-white p-7 mt-9">
            <div className="text-center mb-5">
              <p className="text-2xl font-bold">Welcome Back👋 </p>
              <p className="text-gray-600 mb-2 mt-1">
                Hello there! we've missed you, log in to your account and
                continue your journey with us.
              </p>
              <p>
                Don't have an account?{" "}
                <Link
                  to={"/signUp"}
                  className="text-primary font-semibold text-md"
                >
                  Create one
                </Link>{" "}
              </p>
            </div>

            <form
              className="flex w-full max-w-md flex-col"
              onSubmit={formik.handleSubmit}
            >
              {/* EMAIL */}
              <div className="flex flex-col mb-3">
                <label
                  className={`input w-full ${
                    formik.errors.email &&
                    (formik.values.email || formik.touched.email) &&
                    "border-red-500"
                  }`}
                >
                  <i className="bx bx-envelope opacity-50"></i>
                  <input
                    type="email"
                    placeholder="mail@site.com"
                    {...formik.getFieldProps("email")}
                  />
                </label>
                {formik.errors.email &&
                  (formik.values.email || formik.touched.email) && (
                    <div className="text-red-500 text-[13px] leading-tight text-xs mt-1">
                      {formik.errors.email}
                    </div>
                  )}
              </div>
              {/* PASSWORD */}
              <div className="flex flex-col mb-4">
                <label
                  className={`input w-full relative ${
                    formik.errors.password &&
                    (formik.values.password || formik.touched.password) &&
                    "border-red-500"
                  }`}
                >
                  <i className="bx bx-lock-alt opacity-50"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    {...formik.getFieldProps("password")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i
                      className={`bx ${
                        showPassword ? "bx-show" : "bx-hide"
                      } opacity-50 text-xl`}
                    ></i>
                  </button>
                </label>
                {formik.errors.password &&
                  (formik.values.password || formik.touched.password) && (
                    <div className="text-red-500 text-[13px] leading-tight text-xs mt-1">
                      {formik.errors.password}
                    </div>
                  )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  !formik.isValid || !formik.dirty || formik.isSubmitting
                }
              >
                {formik.isSubmitting ? "Checking..." : "Log In"}
              </button>
              <div className="divider text-gray-600">or</div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={onGoogleClick}
              >
                <img src="images/google-icon.svg" alt="" className="w-4" />
                Continue with Google
              </button>
            </form>

            <p className="text-sm text-center text-gray-600 mt-5">
              By continuing, you agree to our{" "}
              <a
                href=""
                className="text-primary underline text-md font-semibold"
              >
                Terms of Use{" "}
              </a>
              and{" "}
              <a
                href=""
                className="text-primary underline text-md font-semibold"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
