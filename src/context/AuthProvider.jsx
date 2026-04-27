import { useState, useEffect } from "react";
import { getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userInfoLoading, setUserInfoLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;
    const initAuth = async () => {
      try {
        await getRedirectResult(auth);
      } catch (error) {
        console.error("Redirect Error:", error.message);
      }

      unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setUserInfoLoading(false);
      });
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userInfoLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
