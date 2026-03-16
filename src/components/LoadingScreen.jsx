export default function LoadingScreen() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-purple-50 gap-4">
      {/* DaisyUI Spinner */}
      <span className="loading loading-spinner loading-lg text-purple-600"></span>
      <p className="text-purple-900 font-bold animate-pulse text-xl">
        Maple is brewing...
      </p>
    </div>
  );
}
