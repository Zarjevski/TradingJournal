import Image from "next/image";
import LogoWhite from "../../assets/logo-white.png";
import LogoBlack from "../../assets/logo-black.png";

interface LogoProps {
  width: number;
  height: number;
  colorMode: string;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ width, height, colorMode, className = "" }) => {
  return (
    <Image
      src={colorMode === "light" ? LogoBlack : LogoWhite}
      width={width}
      height={height}
      alt="logo"
      className={`cursor-pointer ${className}`.trim()}
    />
  );
};

export default Logo;
