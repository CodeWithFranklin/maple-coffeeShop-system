import { useState, useEffect } from "react";
import { getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [userInfoLoading, setUserInfoLoading] = useState(true);

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
          } else {
            setUserInfo(null);
            setUserInfoLoading(false);
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
