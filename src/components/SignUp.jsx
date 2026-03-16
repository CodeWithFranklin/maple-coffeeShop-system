import React, { useState } from "react";
import { useFormik } from "formik";
import { useNavigate, Link } from "react-router-dom"; // 1. Import useNavigate
import { auth } from "../firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { signUpSchema } from "../functions/validationSchema.js";

export default function SignUp() {
  const googleProvider = new GoogleAuthProvider();
  const navigate = useNavigate(); // 2. Initialize the hook

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

const handlePostAuthRedirect = () => {
  const storeId = localStorage.getItem("last_active_store_id");
  const savedStore = localStorage.getItem("pending_store");

  // Look for the specific cart belonging to that store
  const savedCart = localStorage.getItem(`cart_store_${storeId}`);

  if (savedCart && savedStore) {
    navigate("/order", { state: { selectedStore: JSON.parse(savedStore) } });
  } else {
    navigate("/");
  }
};
  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: signUpSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      try {
        // Create the Auth User
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );

        // Update profile for Cloud Function
        await updateProfile(userCredential.user, {
          displayName: values.name,
        });

        console.log("Signup Success!");

handlePostAuthRedirect();
      } catch (error) {
        const message =
          error.code === "auth/email-already-in-use"
            ? "This email is already in use."
            : error.message;
        setStatus(message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleGoogleAuth = async (e) => {
    e.preventDefault();
    try {
      await signInWithPopup(auth, googleProvider);
      // 4. Redirect after Google Login too
      navigate("/");
    } catch (error) {
      console.error("Google Auth Error:", error.message);
    }
  };

  return (
    <section className="min-h-full flex justify-center">
      <div className="flex flex-row w-full max-w-7xl p-8">
        <div className="hidden lg:flex flex-7">
          <img
            src="/images/login.svg"
            alt="login"
            className="h-115 fixed mt-8"
          />
        </div>
        <div className="flex-6">
          <div className="flex flex-col mx-auto w-100 rounded-3xl bg-white p-7 mt-9">
            <div className="text-center mb-5">
              <p className="text-2xl font-bold">Create your account</p>
              <p className="text-gray-600 mb-2">
                Hey there, create a café one account to complete your order.
                It's quick and easy!
              </p>
              <p>
                Already have an account?{" "}
                <Link
                  to={"/signIn"}
                  className="text-primary font-semibold text-md "
                >
                  Login
                </Link>{" "}
              </p>
            </div>

            <form
              className="flex w-full max-w-md flex-col"
              onSubmit={formik.handleSubmit}
            >
              {/* NAME INPUT */}
              <label
                className={`input validator mb-3 w-full ${
                  formik.touched.name && formik.errors.name
                    ? "border-red-500"
                    : ""
                }`}
              >
                <i className="bx bx-user opacity-50"></i>
                <input
                  type="text"
                  placeholder="Username"
                  {...formik.getFieldProps("name")}
                />
              </label>
              {formik.touched.name && formik.errors.name && (
                <div className="text-red-500 text-xs mb-2">
                  {formik.errors.name}
                </div>
              )}

              {/* EMAIL INPUT */}
              <label
                className={`input validator mb-3 w-full ${
                  formik.touched.email && formik.errors.email
                    ? "border-red-500"
                    : ""
                }`}
              >
                <i className="bx bx-envelope opacity-50"></i>
                <input
                  type="email"
                  placeholder="mail@site.com"
                  {...formik.getFieldProps("email")}
                />
              </label>
              {formik.touched.email && formik.errors.email && (
                <div className="text-red-500 text-xs mb-2">
                  {formik.errors.email}
                </div>
              )}

              {/* PASSWORD INPUT */}
              <label
                className={`input validator mb-3 w-full relative ${
                  formik.touched.password && formik.errors.password
                    ? "border-red-500"
                    : ""
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
              {formik.touched.password && formik.errors.password && (
                <div className="text-red-500 text-xs mb-2">
                  {formik.errors.password}
                </div>
              )}

              {/* CONFIRM PASSWORD INPUT */}
              <label
                className={`input validator mb-3 w-full relative ${
                  formik.touched.confirmPassword &&
                  formik.errors.confirmPassword
                    ? "border-red-500"
                    : ""
                }`}
              >
                <i className="bx bx-lock-alt opacity-50"></i>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  {...formik.getFieldProps("confirmPassword")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <i
                    className={`bx ${
                      showConfirmPassword ? "bx-show" : "bx-hide"
                    } opacity-50 text-xl`}
                  ></i>
                </button>
              </label>
              {formik.touched.confirmPassword &&
                formik.errors.confirmPassword && (
                  <div className="text-red-500 text-xs mb-2">
                    {formik.errors.confirmPassword}
                  </div>
                )}

              {formik.status && (
                <div className="text-red-600 font-bold mb-3">
                  {formik.status}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary mt-4"
                disabled={formik.isSubmitting}
              >
                {formik.isSubmitting ? "Processing..." : "Sign Up"}
              </button>

              <div className="divider text-gray-600">or</div>

              <button
                type="button"
                className="btn btn-outline"
                onClick={handleGoogleAuth}
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
