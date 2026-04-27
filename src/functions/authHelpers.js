import { signInWithPopup, signInWithRedirect } from "firebase/auth";
import { auth, googleProvider } from "../firebase.js";

export const handleGoogleAuth = (onError) => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    signInWithRedirect(auth, googleProvider);
    return;
  }

  signInWithPopup(auth, googleProvider)
    .then((result) => result.user)
    .catch((error) => {
      if (error.code === "auth/popup-blocked") {
        signInWithRedirect(auth, googleProvider);
      } else {
        onError(error.message);
      }
    });
};
