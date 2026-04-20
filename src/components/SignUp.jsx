import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { useFormik } from "formik";
import { signUpSchema } from "../functions/validationSchema.js";

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const googleProvider = new GoogleAuthProvider();
  const navigate = useNavigate();

  const handlePostAuthRedirect = () => {
    const storeId = localStorage.getItem("last_active_store_id");
    const savedStore = localStorage.getItem("pending_store");
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
      phone: "",
      country: "",
      state: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: signUpSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );

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
  const nigerianStates = [
    "Abia",
    "Adamawa",
    "Akwa Ibom",
    "Anambra",
    "Bauchi",
    "Bayelsa",
    "Benue",
    "Borno",
    "Cross River",
    "Delta",
    "Ebonyi",
    "Edo",
    "Ekiti",
    "Enugu",
    "FCT",
    "Gombe",
    "Imo",
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Kogi",
    "Kwara",
    "Lagos",
    "Nasarawa",
    "Niger",
    "Ogun",
    "Ondo",
    "Osun",
    "Oyo",
    "Plateau",
    "Rivers",
    "Sokoto",
    "Taraba",
    "Yobe",
    "Zamfara",
  ];

  const usStates = [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
  ];

  const handleGoogleAuth = async (e) => {
    e.preventDefault();
    try {
      await signInWithPopup(auth, googleProvider);

      handlePostAuthRedirect();
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
              <label
                pattern="[A-Za-z][A-Za-z0-9\-]*"
                className={`input mb-3 w-full ${
                  formik.touched.name && formik.errors.name && "border-red-500"
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
                <div className="text-red-500 text-[13px] leading-tight text-xs mb-2">
                  {formik.errors.name}
                </div>
              )}

              {/* EMAIL INPUT */}
              <label
                className={`input mb-3 w-full ${
                  formik.touched.email &&
                  formik.errors.email &&
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
              {formik.touched.email && formik.errors.email && (
                <div className="text-red-500 text-[13px] leading-tight text-xs mb-2">
                  {formik.errors.email}
                </div>
              )}

              {/* PHONE NUMBER INPUT */}
              <label
                className={`input mb-3 w-full ${
                  formik.touched.phone &&
                  formik.errors.phone &&
                  "border-red-500"
                }`}
              >
                <i className="bx bx-phone opacity-50"></i>
                <input
                  type="tel"
                  placeholder="08165438276"
                  {...formik.getFieldProps("phone")}
                />
              </label>
              {formik.touched.phone && formik.errors.phone && (
                <div className="text-red-500 text-[13px] leading-tight text-xs mb-2">
                  {formik.errors.phone}
                </div>
              )}
              <div className="flex flex-row gap-3 w-full mb-3">
                {/* COUNTRY SELECTOR */}
                <div className="dropdown dropdown-top flex-1">
                  <div
                    tabIndex={0}
                    role="button"
                    onBlur={() => formik.setFieldTouched("country", true)}
                    className={`input flex items-center justify-between w-full border ${
                      formik.touched.country &&
                      formik.errors.country &&
                      "border-red-500"
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <i className="bx bx-world opacity-50"></i>
                      <span
                        className={`truncate ${
                          formik.values.country ? "text-black" : "text-gray-400"
                        }`}
                      >
                        {formik.values.country || "Country"}
                      </span>
                    </div>
                    <i className="bx bx-chevron-down transition-transform duration-300 text-xl opacity-50 [.dropdown:focus-within_&]:rotate-180"></i>
                  </div>

                  <ul
                    tabIndex={0}
                    className="dropdown-content menu bg-base-100 rounded-box z-[10] mb-2 w-full p-2 shadow-2xl border border-gray-100"
                  >
                    <li>
                      <button
                        type="button"
                        className="py-3"
                        onClick={() => {
                          formik.setFieldValue("country", "Nigeria");
                          formik.setFieldValue("state", "");
                          document.activeElement.blur();
                        }}
                      >
                        Nigeria
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="py-3"
                        onClick={() => {
                          formik.setFieldValue("country", "USA");
                          formik.setFieldValue("state", "");
                          document.activeElement.blur();
                        }}
                      >
                        USA
                      </button>
                    </li>
                  </ul>
                </div>

                {/* STATE SELECTOR */}
                <div
                  className={`dropdown dropdown-top flex-1 ${
                    !formik.values.country ? "opacity-50" : ""
                  }`}
                >
                  <div
                    tabIndex={formik.values.country ? 0 : -1}
                    role="button"
                    onBlur={() => formik.setFieldTouched("state", true)}
                    className={`input flex items-center justify-between w-full border ${
                      !formik.values.country
                        ? "cursor-not-allowed bg-gray-50 border-gray-300"
                        : "cursor-pointer"
                    } ${
                      formik.touched.state &&
                      formik.errors.state &&
                      "border-red-500"
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <i className="bx bx-map opacity-50"></i>
                      <span
                        className={`truncate ${
                          formik.values.state ? "text-black" : "text-gray-400"
                        }`}
                      >
                        {formik.values.state || "State"}
                      </span>
                    </div>

                    <i
                      className={`bx bx-chevron-down transition-transform duration-300 text-xl opacity-50 ${
                        formik.values.country
                          ? "[.dropdown:focus-within_&]:rotate-180"
                          : "rotate-0"
                      }`}
                    ></i>
                  </div>

                  {formik.values.country && (
                    <ul
                      tabIndex={0}
                      className="dropdown-content menu bg-base-100 rounded-box z-[9] mb-2 w-full p-2 shadow-2xl max-h-60 overflow-y-auto block no-scrollbar border border-gray-100"
                    >
                      {(formik.values.country === "Nigeria"
                        ? nigerianStates
                        : usStates
                      ).map((s) => (
                        <li key={s}>
                          <button
                            type="button"
                            className="py-2 text-sm"
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
              </div>

              <div className="flex flex-row gap-3 w-full mb-3 px-1">
                {/* Country Error Space */}
                <div className="flex-1">
                  {formik.touched.country && formik.errors.country && (
                    <p className="text-red-500 text-[13px] leading-tight">
                      {formik.errors.country}
                    </p>
                  )}
                </div>

                {/* State Error Space */}
                <div className="flex-1">
                  {formik.values.country &&
                    formik.touched.state &&
                    formik.errors.state && (
                      <p className="text-red-500 text-[13px] leading-tight ">
                        {formik.errors.state}
                      </p>
                    )}
                </div>
              </div>

              {/* PASSWORD INPUT */}
              <label
                className={`input mb-3 w-full relative ${
                  formik.touched.password &&
                  formik.errors.password &&
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
              {formik.touched.password && formik.errors.password && (
                <div className="text-red-500 text-[13px] leading-tight text-xs mb-2">
                  {formik.errors.password}
                </div>
              )}

              {/* CONFIRM PASSWORD INPUT */}
              <label
                className={`input mb-3 w-full relative ${
                  formik.touched.confirmPassword &&
                  formik.errors.confirmPassword &&
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
              {formik.touched.confirmPassword &&
                formik.errors.confirmPassword && (
                  <div className="text-red-500 text-[13px] leading-tight text-xs mb-2">
                    {formik.errors.confirmPassword}
                  </div>
                )}

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
                onClick={handleGoogleAuth}
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
