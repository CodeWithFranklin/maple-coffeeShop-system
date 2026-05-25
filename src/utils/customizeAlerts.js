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

const contextErrors = {
  updatePassword: {
    "auth/invalid-credential": "Your current password is incorrect.",
    "auth/wrong-password": "Your current password is incorrect.",
    "auth/weak-password": "Your new password is too weak.",
    "auth/requires-recent-login":
      "Please sign in again before changing your password.",
    "auth/too-many-requests":
      "Too many password attempts. Please try again later.",
  },

  signIn: {
    "auth/invalid-credential": "Invalid email or password.",
    "auth/wrong-password": "Invalid email or password.",
    "auth/user-not-found": "Invalid email or password.",
  },

  forgotPassword: {
    "auth/user-not-found": "No account found with this email.",
    "auth/invalid-email": "Enter a valid email address.",
  },
};

export const customAlert = (errorMessage, errorCode, context) => {
  const code = errorCode || errorMessage?.match(/auth\/[a-z-]+/)?.[0] || null;

  if (!code) {
    return "Something went wrong. Please try again.";
  }

  if (context && contextErrors[context]?.[code]) {
    return contextErrors[context][code];
  }

  return firebaseErrors[code] ?? "Something went wrong. Please try again.";
};
