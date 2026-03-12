import React, { useState } from "react";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom"; // 1. Import useNavigate
import { auth } from "../firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { signUpSchema } from "./functions/validationSchema";

export default function SignUp() {
  const googleProvider = new GoogleAuthProvider();
  const navigate = useNavigate(); // 2. Initialize the hook

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

        // 3. Send user to homepage
        navigate("/");
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
    <section className="min-h-screen flex justify-center">
      <div className="flex flex-row w-full max-w-6xl p-8">
        <div className="hidden lg:flex flex-1"></div>
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-5xl mb-5 font-bold">
            Get a cup of coffee for us, create your account
          </p>

          <form
            className="flex w-full max-w-md flex-col"
            onSubmit={formik.handleSubmit}
          >
            {/* NAME INPUT */}
            <label
              className={`input validator mb-1 w-full ${
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
              <div className="text-red-500 text-xs mb-3">
                {formik.errors.name}
              </div>
            )}

            {/* EMAIL INPUT */}
            <label
              className={`input validator mb-1 w-full ${
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
              <div className="text-red-500 text-xs mb-3">
                {formik.errors.email}
              </div>
            )}

            {/* PASSWORD INPUT */}
            <label
              className={`input validator mb-1 w-full relative ${
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
              <div className="text-red-500 text-xs mb-3">
                {formik.errors.password}
              </div>
            )}

            {/* CONFIRM PASSWORD INPUT */}
            <label
              className={`input validator mb-1 w-full relative ${
                formik.touched.confirmPassword && formik.errors.confirmPassword
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
                <div className="text-red-500 text-xs mb-3">
                  {formik.errors.confirmPassword}
                </div>
              )}

            {formik.status && (
              <div className="text-red-600 font-bold mb-3">{formik.status}</div>
            )}

            <button
              type="submit"
              className="btn btn-primary mt-4"
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? "Processing..." : "Sign Up"}
            </button>

            <div className="divider">OR</div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={handleGoogleAuth}
            >
              <i className="bx bxl-google mr-2"></i>
              Continue with Google
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
