import { useState } from "react";
import { useAuth } from "../../hooks/useAuth.jsx";
import UpdateProfile from "./UpdateProfile.jsx";
import UpdatePassword from "./UpdatePassword.jsx";

export default function Account() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("personal");

  return (
    <div className="min-h-screen bg-gray-50/50 pt-10 pb-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* SIDEBAR */}
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
              <li>
                <button
                  type="button"
                  onClick={() => setActiveSection("personal")}
                  className={`rounded-xl py-3 w-full text-left flex items-center gap-3 ${
                    activeSection === "personal"
                      ? "bg-gray-100 text-black font-semibold"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <i className="bx bx-user text-xl"></i>
                  Personal Information
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() => setActiveSection("password")}
                  className={`rounded-xl py-3 w-full text-left flex items-center gap-3 ${
                    activeSection === "password"
                      ? "bg-gray-100 text-black font-semibold"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <i className="bx bx-lock-alt text-xl"></i>
                  Password & Security
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() => setActiveSection("payments")}
                  className={`rounded-xl py-3 w-full text-left flex items-center gap-3 ${
                    activeSection === "payments"
                      ? "bg-gray-100 text-black font-semibold"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <i className="bx bx-credit-card text-xl"></i>
                  Payment Methods
                </button>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() => setActiveSection("invite")}
                  className={`rounded-xl py-3 w-full text-left flex items-center gap-3 ${
                    activeSection === "invite"
                      ? "bg-gray-100 text-black font-semibold"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <i className="bx bx-share-alt text-xl"></i>
                  Invite Friends
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* DYNAMIC CONTENT AREA */}
        {activeSection === "personal" && <UpdateProfile />}

        {activeSection === "password" && <UpdatePassword user={user} />}

        {activeSection === "payments" && (
          <div className="lg:col-span-8 bg-white rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-8 text-black">
              Payment Methods
            </h2>
            <p className="text-gray-500 italic">No payment methods found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
