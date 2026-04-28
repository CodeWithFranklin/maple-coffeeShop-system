import { useState, useEffect, useContext } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { AuthContext } from "../context/AuthContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebase.js";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { handleGoogleAuth } from "../functions/authHelpers.js";
import { useFormik } from "formik";
import { signUpSchema } from "../functions/validationSchema.js";
import locations from "../data/locations.json";
import { toast } from "sonner";
import { customAlert } from "../functions/customizeAlerts.js";

const functions = getFunctions();

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const { user, userInfoLoading } = useContext(AuthContext);

  const redirectToRelevantPage = () => {
    const storeId = localStorage.getItem("last_active_store_id");
    const savedStore = localStorage.getItem("pending_store");
    const savedCart = localStorage.getItem(`cart_store_${storeId}`);

    if (savedCart && savedStore) {
      navigate("/order", { state: { selectedStore: JSON.parse(savedStore) } });
    } else {
      navigate("/");
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
      name: "",
      email: "",
      phone: "",
      country: "",
      state: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: signUpSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );

        await updateProfile(userCredential.user, {
          displayName: values.name,
        });

        const completeProfile = httpsCallable(functions, "completeUserProfile");
        await completeProfile({
          phone: values.phone,
          country: values.country,
          state: values.state,
        });
        toast.success("Account created!");
        redirectToRelevantPage();
      } catch (error) {
        toast.error(customAlert(error.message));
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
        <div className="hidden lg:flex flex-7">
          <img
            src="/images/login.svg"
            alt="login"
            className="h-115 fixed mt-8"
          />
        </div>
        <div className="flex-6 relative">
          <div className="flex flex-col mx-auto w-110 rounded-4xl bg-white p-7 mt-9">
            <div className="text-center mb-5">
              <p className="text-2xl font-bold">Create your Account</p>
              <p className="text-gray-600 mb-2 mt-1">
                Hey there! Join us today and start enjoying seamless ordering
                and exclusive deals.
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
              <div className="flex flex-col mb-3">
                <label
                  pattern="[A-Za-z][A-Za-z0-9\-]*"
                  className={`input w-full ${
                    formik.errors.name &&
                    (formik.values.name || formik.touched.name) &&
                    "border-red-500"
                  }`}
                >
                  <i className="bx bx-user opacity-50"></i>
                  <input
                    type="text"
                    placeholder="Username"
                    {...formik.getFieldProps("name")}
                  />
                </label>
                {formik.errors.name &&
                  (formik.values.name || formik.touched.name) && (
                    <div className="text-red-500 text-[13px] leading-tight text-xs mt-1">
                      {formik.errors.name}
                    </div>
                  )}
              </div>
              {/* EMAIL INPUT */}
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
              <div className="flex flex-row gap-3 w-full mb-3">
                {/* COUNTRY SELECTOR CONTAINER */}
                <div className="flex-1 flex flex-col gap-1">
                  <div className="dropdown dropdown-top w-full">
                    <div
                      tabIndex={0}
                      role="button"
                      className={`input flex items-center justify-between w-full border ${
                        formik.submitCount > 0 &&
                        !formik.values.country &&
                        "border-red-500"
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <i className="bx bx-world opacity-50"></i>
                        <span
                          className={`truncate ${
                            !formik.values.country
                              ? "text-gray-400"
                              : "text-black"
                          }`}
                        >
                          {formik.values.country || "Select a country"}
                        </span>
                      </div>
                      <i className="bx bx-chevron-down transition-transform duration-300 text-xl opacity-50 [.dropdown:focus-within_&]:rotate-180"></i>
                    </div>

                    <ul
                      tabIndex={0}
                      className="dropdown-content menu bg-base-100 rounded-box z-[10] mb-2 w-full p-2 shadow-2xl border border-gray-100"
                    >
                      {Object.keys(locations).map((c) => (
                        <li key={c}>
                          <button
                            type="button"
                            className="py-3"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              formik.setFieldValue("country", c);
                              formik.setFieldValue("state", "");
                              document.activeElement.blur();
                            }}
                          >
                            {c}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {formik.submitCount > 0 && !formik.values.country && (
                    <p className="text-red-500 text-[12px] px-1">
                      {formik.errors.country}
                    </p>
                  )}
                </div>

                {/* STATE SELECTOR CONTAINER */}
                <div className="flex-1 flex flex-col gap-1">
                  <div
                    className={`dropdown dropdown-top w-full ${
                      !formik.values.country && "opacity-50"
                    }`}
                  >
                    <div
                      tabIndex={formik.values.country ? 0 : -1}
                      className={`input flex items-center justify-between w-full border ${
                        !formik.values.country
                          ? "bg-gray-100 cursor-not-allowed"
                          : "cursor-pointer"
                      } ${
                        formik.submitCount > 0 &&
                        formik.values.country &&
                        !formik.values.state &&
                        "border-red-500"
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <i className="bx bx-map opacity-50"></i>
                        <span
                          className={`truncate ${
                            !formik.values.state
                              ? "text-gray-400"
                              : "text-black"
                          }`}
                        >
                          {formik.values.state || "Select a state"}
                        </span>
                      </div>
                      <i
                        className={`bx bx-chevron-down transition-transform duration-300 text-xl opacity-50 ${
                          formik.values.country &&
                          "[.dropdown:focus-within_&]:rotate-180"
                        }`}
                      ></i>
                    </div>

                    {formik.values.country && (
                      <ul
                        tabIndex={0}
                        className="dropdown-content menu bg-base-100 rounded-box z-[9] mb-2 w-full p-2 shadow-2xl max-h-60 overflow-y-auto block border border-gray-100"
                      >
                        {(locations[formik.values.country] || []).map((s) => (
                          <li key={s}>
                            <button
                              type="button"
                              className="py-2 text-sm"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                formik.setFieldValue("state", s);
                                document.activeElement.blur();
                              }}
                            >
                              {s}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {formik.submitCount > 0 &&
                    formik.values.country &&
                    !formik.values.state && (
                      <p className="text-red-500 text-[12px] px-1">
                        {formik.errors.state}
                      </p>
                    )}
                </div>
              </div>
              {/* PHONE NUMBER INPUT */}
              <div className="flex flex-col mb-3">
                <label
                  className={`input w-full ${
                    formik.errors.phone &&
                    (formik.values.phone || formik.touched.phone) &&
                    "border-red-500"
                  }`}
                >
                  <i className="bx bx-phone opacity-50"></i>
                  <input
                    type="tel"
                    placeholder={
                      formik.values.country === "Nigeria"
                        ? "08012345678"
                        : formik.values.country === "USA"
                        ? "2025551234"
                        : "Phone number"
                    }
                    {...formik.getFieldProps("phone")}
                  />
                </label>
                {formik.errors.phone &&
                  (formik.values.phone || formik.touched.phone) && (
                    <div className="text-red-500 text-[13px] leading-tight text-xs mt-1">
                      {formik.errors.phone}
                    </div>
                  )}
              </div>

              {/* PASSWORD INPUT */}
              <div className="flex flex-col mb-3">
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
              {/* CONFIRM PASSWORD INPUT */}
              <div className="flex flex-col mb-3">
                <label
                  className={`input w-full relative ${
                    formik.errors.confirmPassword &&
                    (formik.values.confirmPassword ||
                      formik.touched.confirmPassword) &&
                    "border-red-500"
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
                {formik.errors.confirmPassword &&
                  (formik.values.confirmPassword ||
                    formik.touched.confirmPassword) && (
                    <div className="text-red-500 text-[13px] leading-tight text-xs mt-1">
                      {formik.errors.confirmPassword}
                    </div>
                  )}
              </div>

              <button
                type="submit"
                className="btn btn-primary mt-4"
                disabled={
                  !formik.isValid || !formik.dirty || formik.isSubmitting
                }
              >
                {formik.isSubmitting ? "Creating your account " : "Sign Up"}
              </button>
              <div className="divider text-gray-600">or</div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={onGoogleClick}
              >
                <img
                  src="images/google-icon.svg"
                  alt="google icon"
                  className="w-4"
                />
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
                Privacy Policy.
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
