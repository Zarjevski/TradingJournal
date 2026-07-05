"use client";

interface TjLogoProps {
  colorMode: string;
  className?: string;
}

const TjLogo = ({ colorMode, className = "" }: TjLogoProps) => {
  return (
    <div
      className={`flex aspect-square h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold tracking-tighter text-white ${
        colorMode === "light" ? "bg-zinc-800" : "bg-zinc-600"
      } ${className}`}
      aria-hidden
    >
      TD
    </div>
  );
};

export default TjLogo;
