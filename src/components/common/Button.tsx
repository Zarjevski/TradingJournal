import React from "react";
import { useColorMode } from "@/context/ColorModeContext";
import { motion as m } from "framer-motion";
import { IconType } from "react-icons";

interface ButtonProps {
  width?: string;
  text: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  icon?: IconType;
  className?: string;
  /** When true, only the icon is shown (text used for aria-label). Requires icon. */
  iconOnly?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  text,
  width = "w-auto",
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
  icon: Icon,
  className = "",
  iconOnly = false,
}) => {
  const { colorMode } = useColorMode();

  const getVariantStyles = () => {
    if (variant === "danger") {
      return colorMode === "light"
        ? "bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
        : "bg-red-700 text-white hover:bg-red-600 active:bg-red-800";
    }
    if (variant === "secondary") {
      return colorMode === "light"
        ? "bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400"
        : "bg-gray-700 text-white hover:bg-gray-600 active:bg-gray-500";
    }
    // primary: blue (light), purple (dark)
    return colorMode === "light"
      ? "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent"
      : "bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 shadow-md hover:shadow-lg focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent";
  };

  return (
    <m.button
      type={type}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${getVariantStyles()} ${width} ${className} rounded-lg capitalize font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
        iconOnly ? "p-2.5 min-h-[44px] min-w-[44px]" : "px-4 py-3 min-h-[44px]"
      }`}
      onClick={onClick}
      disabled={disabled}
      aria-label={iconOnly ? text : undefined}
    >
      {Icon && <Icon className={iconOnly ? "w-5 h-5" : "text-sm"} />}
      {!iconOnly && text}
    </m.button>
  );
};

export default Button;
