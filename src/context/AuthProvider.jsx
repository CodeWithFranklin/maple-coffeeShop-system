import { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { AuthContext } from "./AuthContext";
import { getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { migrateGuestCartToUser } from "../utils/migrateGuestCartToUser";

const syncUserProfile = async () => {
  const functions = getFunctions();
  const syncUserProfileFn = httpsCallable(functions, "syncUserProfile");

  await syncUserProfileFn({});
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [userInfoLoading, setUserInfoLoading] = useState(true);

  const migratingUidRef = useRef(null);
  const syncingUidRef = useRef(null);

  useEffect(() => {
    let unsubscribeAuth;
    let unsubscribeSnapshot;

    getRedirectResult(auth)
      .catch((error) => console.error("Redirect Error:", error.message))
      .finally(() => {
        unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setUserInfoLoading(true);

          unsubscribeSnapshot?.();

          if (currentUser) {
            unsubscribeSnapshot = onSnapshot(
              doc(db, "users", currentUser.uid),
              (snap) => {
                setUserInfo(snap.exists() ? snap.data() : null);
                setUserInfoLoading(false);
              },
              (error) => {
                console.error("Snapshot error:", error.message);
                setUserInfo(null);
                setUserInfoLoading(false);
              }
            );

            if (syncingUidRef.current !== currentUser.uid) {
              syncingUidRef.current = currentUser.uid;

              syncUserProfile()
                .catch((error) => {
                  console.error("Profile sync failed:", error);
                })
                .finally(() => {
                  syncingUidRef.current = null;
                });
            }

            if (migratingUidRef.current !== currentUser.uid) {
              migratingUidRef.current = currentUser.uid;

              migrateGuestCartToUser(currentUser.uid)
                .then((result) => {
                  if (result.migratedItems > 0) {
                    console.log(result.message);
                  }
                })
                .catch((error) => {
                  console.error("Guest cart migration failed:", error);
                })
                .finally(() => {
                  migratingUidRef.current = null;
                });
            }
          } else {
            setUserInfo(null);
            setUserInfoLoading(false);
            migratingUidRef.current = null;
            syncingUidRef.current = null;
          }
        });
      });

    return () => {
      unsubscribeAuth?.();
      unsubscribeSnapshot?.();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userInfo, userInfoLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
