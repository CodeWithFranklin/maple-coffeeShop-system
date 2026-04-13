export default function BrewingLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-100">
      <span className="loading loading-spinner loading-lg text-primary"></span>
      <p className="mt-4 font-bold text-xl animate-pulse">
        Brewing your experience...
      </p>
    </div>
  );
}
