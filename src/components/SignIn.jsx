import React, { useState } from "react";
import { useFormik } from "formik";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebase.js";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { signInSchema } from "../functions/validationSchema.js";

export default function Login() {
  const googleProvider = new GoogleAuthProvider();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // RECOVERY LOGIC HELPER
  const handleAuthRedirect = () => {
    const pendingStoreId = localStorage.getItem("last_active_store_id");
    const pendingStoreData = localStorage.getItem("pending_store");

    if (pendingStoreId && pendingStoreData) {
      localStorage.removeItem("last_active_store_id");
      
      navigate("/order", { 
        state: { selectedStore: JSON.parse(pendingStoreData) } 
      });
    } else {
      navigate("/");
    }
  };

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: signInSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      try {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        console.log("Login Success!");
        handleAuthRedirect(); 
      } catch (error) {
        const message =
          error.code === "auth/invalid-credential"
            ? "Invalid email or password."
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
      handleAuthRedirect(); 
    } catch (error) {
      console.error("Google Auth Error:", error.message);
    }
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
          <div className="flex flex-col mx-auto w-100 rounded-3xl bg-white p-7 mt-9">
            <div className="text-center mb-5">
              <p className="text-2xl font-bold">Welcome Back</p>
              <p className="text-gray-600 mb-2">
                Hey there, log in to your café one account to continue your
                journey.
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
                {formik.isSubmitting ? "Checking..." : "Log In"}
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
