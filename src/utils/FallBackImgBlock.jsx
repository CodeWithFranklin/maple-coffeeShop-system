import { useMemo } from "react";

const getInitials = (text = "", fallback = "ST") => {
  const initials = text
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return initials || fallback;
};

export default function FallbackImageBlock({
  text = "",
  fallback = "ST",
  textSize = "text-4xl",
  className = "",
}) {
  const initials = useMemo(() => {
    return getInitials(text, fallback);
  }, [text, fallback]);

  return (
    <div
      className={`w-full h-full bg-neutral flex items-center justify-center select-none ${className}`}
    >
      <span className={`text-white font-black tracking-wider ${textSize}`}>
        {initials}
      </span>
    </div>
  );
}
