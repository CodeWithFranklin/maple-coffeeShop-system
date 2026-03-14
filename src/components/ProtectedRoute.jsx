import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined); // undefined means "still checking"

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // While Firebase is checking the session, show a loading state
  // This prevents the "flash" where it looks like you're logged out for a second
  if (user === undefined) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // If no user is found, redirect to Sign In
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // If user exists, show the protected content (children)
  return children;
}
