interface LogoProps {
  width: number;
  height: number;
  colorMode: string;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ width, height, colorMode, className = "" }) => {
  // Font size as a percentage of this box's own rendered width (via a CSS
  // container query unit), preserving each caller's original width/height
  // proportions while letting the text actually shrink with its container
  // instead of staying pinned at a fixed pixel size (which overflowed on
  // narrow viewports like the login page).
  const fontSizeCqw = (height * 0.32 * 100) / width;

  return (
    <div
      style={{ containerType: "inline-size" }}
      className={`flex items-center justify-start w-full ${className}`.trim()}
    >
      <span
        style={{ fontSize: `${fontSizeCqw}cqw` }}
        className={`font-extrabold tracking-tight leading-none whitespace-nowrap ${
          colorMode === "light" ? "text-zinc-900" : "text-zinc-50"
        }`}
      >
        Trade
        <span className={colorMode === "light" ? "text-zinc-500" : "text-zinc-400"}>
          Diary
        </span>
      </span>
    </div>
  );
};

export default Logo;
