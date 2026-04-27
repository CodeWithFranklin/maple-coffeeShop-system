
const firebaseErrors = {
  "auth/network-request-failed": "Please check your internet connection.",
  "auth/email-already-in-use": "This email is already in use.",
  "auth/invalid-email": "Invalid email address.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/weak-password": "Password is too weak.",
  "auth/internal-error": "Please check your internet connection.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/cancelled-popup-request": "Sign in was cancelled.",
  "auth/popup-closed-by-user": "Sign in was cancelled.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/operation-not-allowed": "This sign in method is not enabled.",
  "auth/requires-recent-login": "Please sign in again to continue.",
};

export const customAlert = (errorMessage) => {
  const match = errorMessage?.match(/auth\/[a-z-]+/);
  if (match) {
    return (
      firebaseErrors[match[0]] ?? "Something went wrong. Please try again."
    );
  }
  return "Something went wrong. Please try again.";
};
