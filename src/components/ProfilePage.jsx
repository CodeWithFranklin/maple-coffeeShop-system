import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useFormik } from "formik";
import { toast } from "sonner";
import { getFunctions, httpsCallable } from "firebase/functions";
import { updateEmail, updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "../firebase.js";
import { customAlert } from "../functions/customizeAlerts.js";
import { profileSchema } from "../functions/validationSchema.js";
import locations from "../data/locations.json";

const functions = getFunctions();

export default function Profile() {
  const { user, userInfo } = useAuth();

  const [imageLoading, setImageLoading] = useState(false);

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .slice(0, 2)
        .map((n) => n.charAt(0).toUpperCase())
        .join("")
    : user?.email?.charAt(0).toUpperCase();

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG and WebP images are supported");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }

    setImageLoading(true);
    try {
      const storageRef = ref(storage, `profileImages/${user.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      await updateProfile(auth.currentUser, { photoURL });

      const syncProfile = httpsCallable(functions, "syncUserProfile");
      await syncProfile({ photoURL });

      toast.success("Profile photo updated!");
    } catch (error) {
      toast.error(customAlert(error.message, error.code));
    } finally {
      setImageLoading(false);
      e.target.value = "";
    }
  };

  const runUpdates = async (values) => {
    const updates = [];

    if (values.name !== user.displayName) {
      updates.push(
        updateProfile(auth.currentUser, { displayName: values.name })
      );
    }

    if (values.email !== user.email) {
      updates.push(updateEmail(auth.currentUser, values.email));
    }

    const syncProfile = httpsCallable(functions, "syncUserProfile");
    updates.push(
      syncProfile({
        phone: values.phone,
        country: values.country,
        state: values.state,
        name: values.name,
      })
    );

    await Promise.all(updates);
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: user?.displayName || "",
      email: user?.email || "",
      phone: userInfo?.phone || "",
      country: userInfo?.country || "",
      state: userInfo?.state || "",
    },
    validationSchema: profileSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await runUpdates(values);
        toast.success("Profile updated successfully!");
      } catch (error) {
        toast.error(customAlert(error.message, error.code));
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen bg-gray-50/50 pt-28 pb-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-orange-500 rounded-3xl p-6 text-white shadow-lg shadow-orange-200">
            <div className="flex items-center gap-4 mb-4">
              <div
                className="radial-progress text-white"
                style={{ "--value": 70, "--size": "3rem" }}
                role="progressbar"
              >
                70%
              </div>
              <div>
                <h3 className="font-bold">Complete profile</h3>
                <p className="text-xs opacity-90">Unlock all Maple features</p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm w-full rounded-xl normal-case bg-white text-orange-500 border-none hover:bg-gray-100"
            >
              Verify Identity
            </button>
          </div>

          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
            <ul className="menu w-full gap-y-2">
              {[
                {
                  icon: "bx-user",
                  label: "Personal Information",
                  active: true,
                },
                { icon: "bx-lock-alt", label: "Password & Security" },
                { icon: "bx-credit-card", label: "Payment Methods" },
                { icon: "bx-share-alt", label: "Invite Friends" },
              ].map(({ icon, label, active }) => (
                <li key={label}>
                  <a
                    className={`rounded-xl py-3 ${
                      active
                        ? "bg-gray-100 text-black font-semibold"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <i className={`bx ${icon} text-xl`}></i>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-8 text-black">
            Personal Information
          </h2>

          {/* Avatar */}
          <div className="flex items-center gap-6 mb-10">
            <div className="relative">
              {/* Avatar */}
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className={`w-25 h-25 rounded-full object-cover border-2 border-gray-200 ${
                    imageLoading && "opacity-50"
                  }`}
                />
              ) : (
                <div
                  className={`w-24 h-24 rounded-full bg-gray-100 shadow flex items-center justify-center ${
                    imageLoading && "opacity-50"
                  }`}
                >
                  <span className="text-2xl font-bold text-black">
                    {initials}
                  </span>
                </div>
              )}

              {/* Loading spinner overlay */}
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="loading loading-spinner loading-md text-primary"></span>
                </div>
              )}

              {/* Hidden file input */}
              <input
                type="file"
                id="profileImage"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />

              {/* Pencil trigger */}
              <label
                htmlFor="profileImage"
                className={`absolute bottom-0 right-0 bg-white shadow-md rounded-full w-9 aspect-square border border-black flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors ${
                  imageLoading && "pointer-events-none opacity-50"
                }`}
              >
                <i className="bx bx-pencil text-sm"></i>
              </label>
            </div>

            <div>
              <h4 className="text-2xl font-extrabold text-black capitalize">
                {user?.displayName}
              </h4>
              <p className="text-sm text-gray-400">{user?.email}</p>
              {userInfo?.state && userInfo?.country && (
                <p className="text-sm text-gray-400 mt-1">
                  {userInfo.state}, {userInfo.country}
                </p>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={formik.handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-sm font-bold text-black">
                  Full Name
                </label>
                <label
                  className={`input w-full bg-gray-50 border-none rounded-xl ${
                    formik.errors.name &&
                    (formik.values.name || formik.touched.name) &&
                    "border border-red-500"
                  }`}
                >
                  <i className="bx bx-user opacity-50"></i>
                  <input
                    type="text"
                    placeholder="Full Name"
                    {...formik.getFieldProps("name")}
                  />
                </label>
                {formik.errors.name &&
                  (formik.values.name || formik.touched.name) && (
                    <p className="text-red-500 text-xs mt-1">
                      {formik.errors.name}
                    </p>
                  )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-sm font-bold text-black">
                  Email Address
                </label>
                <label
                  className={`input w-full bg-gray-50 border-none rounded-xl ${
                    formik.errors.email &&
                    (formik.values.email || formik.touched.email) &&
                    "border border-red-500"
                  }`}
                >
                  <i className="bx bx-envelope opacity-50"></i>
                  <input
                    type="email"
                    placeholder="Email"
                    {...formik.getFieldProps("email")}
                  />
                </label>
                {formik.errors.email &&
                  (formik.values.email || formik.touched.email) && (
                    <p className="text-red-500 text-xs mt-1">
                      {formik.errors.email}
                    </p>
                  )}
              </div>

              {/* Country */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-black">Country</label>
                <div className="dropdown dropdown-top w-full">
                  <div
                    tabIndex={0}
                    role="button"
                    className={`input flex items-center justify-between w-full bg-gray-50 border-none rounded-xl ${
                      formik.submitCount > 0 && !formik.values.country
                        ? "border border-red-500"
                        : ""
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
                            formik.setFieldValue("phone", "");
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
                  <p className="text-red-500 text-xs mt-1">
                    {formik.errors.country}
                  </p>
                )}
              </div>

              {/* State */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-black">State</label>
                <div
                  className={`dropdown dropdown-top w-full ${
                    !formik.values.country && "opacity-50"
                  }`}
                >
                  <div
                    tabIndex={formik.values.country ? 0 : -1}
                    role="button"
                    className={`input flex items-center justify-between w-full bg-gray-50 border-none rounded-xl ${
                      !formik.values.country
                        ? "cursor-not-allowed"
                        : "cursor-pointer"
                    } ${
                      formik.submitCount > 0 &&
                      formik.values.country &&
                      !formik.values.state
                        ? "border border-red-500"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <i className="bx bx-map opacity-50"></i>
                      <span
                        className={`truncate ${
                          !formik.values.state ? "text-gray-400" : "text-black"
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
                    <p className="text-red-500 text-xs mt-1">
                      {formik.errors.state}
                    </p>
                  )}
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-sm font-bold text-black">
                  Phone Number
                </label>
                <label
                  className={`input w-full bg-gray-50 border-none rounded-xl ${
                    !formik.values.country
                      ? "opacity-60 cursor-not-allowed"
                      : ""
                  } ${
                    formik.errors.phone &&
                    (formik.values.phone || formik.touched.phone)
                      ? "border border-red-500"
                      : ""
                  }`}
                >
                  <i className="bx bx-phone opacity-50"></i>
                  <input
                    type="tel"
                    disabled={!formik.values.country}
                    placeholder={
                      formik.values.country === "Nigeria"
                        ? "0801 234 5678"
                        : formik.values.country === "USA"
                        ? "(202) 555-0199"
                        : "Select country first"
                    }
                    {...formik.getFieldProps("phone")}
                  />
                </label>
                {formik.errors.phone &&
                  (formik.values.phone || formik.touched.phone) && (
                    <p className="text-red-500 text-xs mt-1">
                      {formik.errors.phone}
                    </p>
                  )}
              </div>

              {/* Submit */}
              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={
                    !formik.dirty || !formik.isValid || formik.isSubmitting
                  }
                  className="btn btn-primary w-full h-14 rounded-xl text-base font-bold normal-case"
                >
                  {formik.isSubmitting ? "Updating..." : "Update Profile"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
