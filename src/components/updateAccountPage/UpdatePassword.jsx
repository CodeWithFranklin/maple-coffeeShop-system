import { useState } from "react";
import { useFormik } from "formik";
import { toast } from "sonner";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "../../firebase.js";
import { customAlert } from "../../functions/customizeAlerts.js";
import {
    passwordChangeSchema
    
} from "../../functions/validationSchema.js";
 
export default function UpdatePassword({ user }) {
  const isGoogleUser = user?.providerData?.some(
    (p) => p.providerId === "google.com"
  );

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const formik = useFormik({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: passwordChangeSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
       
        const credential = EmailAuthProvider.credential(
          user.email,
          values.currentPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);

        await updatePassword(auth.currentUser, values.newPassword);

        toast.success("Password updated successfully!");
        resetForm();
      } catch (error) {
        toast.error(customAlert(error.message, error.code));
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (isGoogleUser) {
    return (
      <div className="lg:col-span-8 bg-white rounded-3xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold mb-8 text-black">
          Password & Security
        </h2>
        <div className="bg-gray-50 rounded-2xl p-6 flex items-start gap-4">
          <i className="bx bxl-google text-3xl text-gray-400 mt-1"></i>
          <div>
            <p className="font-semibold text-black">Google Account</p>
            <p className="text-sm text-gray-400 mt-1">
              Your account is managed by Google. To change your password, visit
              your Google account settings.
            </p>
            <a
              href="https://myaccount.google.com/security"
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm btn-outline rounded-xl mt-4 normal-case"
            >
              Manage Google Account
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-8 bg-white rounded-3xl p-8 shadow-sm">
      <h2 className="text-2xl font-bold mb-8 text-black">
        Password & Security
      </h2>

      <form onSubmit={formik.handleSubmit}>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-black">
              Current Password
            </label>
            <label
              className={`input w-full bg-gray-50 border-none rounded-xl relative flex items-center ${
                formik.errors.currentPassword && formik.touched.currentPassword
                  ? "border border-red-500"
                  : ""
              }`}
            >
              <i className="bx bx-lock-alt opacity-50 mr-2"></i>
              <input
                type={showCurrent ? "text" : "password"}
                className="grow bg-transparent outline-none"
                placeholder="Current password"
                {...formik.getFieldProps("currentPassword")}
              />
              <button
                type="button"
                className="p-2"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                <i
                  className={`bx ${
                    showCurrent ? "bx-show" : "bx-hide"
                  } opacity-50 text-xl`}
                ></i>
              </button>
            </label>
            {formik.errors.currentPassword &&
              formik.touched.currentPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {formik.errors.currentPassword}
                </p>
              )}
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-black">New Password</label>
            <label
              className={`input w-full bg-gray-50 border-none rounded-xl relative flex items-center ${
                formik.errors.newPassword && formik.touched.newPassword
                  ? "border border-red-500"
                  : ""
              }`}
            >
              <i className="bx bx-lock-alt opacity-50 mr-2"></i>
              <input
                type={showNew ? "text" : "password"}
                className="grow bg-transparent outline-none"
                placeholder="New password"
                {...formik.getFieldProps("newPassword")}
              />
              <button
                type="button"
                className="p-2"
                onClick={() => setShowNew(!showNew)}
              >
                <i
                  className={`bx ${
                    showNew ? "bx-show" : "bx-hide"
                  } opacity-50 text-xl`}
                ></i>
              </button>
            </label>
            {formik.errors.newPassword && formik.touched.newPassword && (
              <p className="text-red-500 text-xs mt-1">
                {formik.errors.newPassword}
              </p>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-black">
              Confirm New Password
            </label>
            <label
              className={`input w-full bg-gray-50 border-none rounded-xl relative flex items-center ${
                formik.errors.confirmPassword && formik.touched.confirmPassword
                  ? "border border-red-500"
                  : ""
              }`}
            >
              <i className="bx bx-lock-alt opacity-50 mr-2"></i>
              <input
                type={showConfirm ? "text" : "password"}
                className="grow bg-transparent outline-none"
                placeholder="Confirm new password"
                {...formik.getFieldProps("confirmPassword")}
              />
              <button
                type="button"
                className="p-2"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                <i
                  className={`bx ${
                    showConfirm ? "bx-show" : "bx-hide"
                  } opacity-50 text-xl`}
                ></i>
              </button>
            </label>
            {formik.errors.confirmPassword &&
              formik.touched.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {formik.errors.confirmPassword}
                </p>
              )}
          </div>

          <button
            type="submit"
            disabled={!formik.dirty || !formik.isValid || formik.isSubmitting}
            className="btn btn-primary w-full h-14 rounded-xl text-base font-bold normal-case mt-2"
          >
            {formik.isSubmitting ? (
              <span className="loading loading-spinner"></span>
            ) : (
              "Update Password"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
