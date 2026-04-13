export default function LoadingData({ userInfoLoaded, skeltonFallback, children }) {
  if (!userInfoLoaded) {
    return <>{skeltonFallback}</>;
  }
  return <>{children}</>;
}
