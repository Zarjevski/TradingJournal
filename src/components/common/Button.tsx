import React from "react";
import { useColorMode } from "@chakra-ui/react";
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
    // primary
    return colorMode === "light"
      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 shadow-md hover:shadow-lg"
      : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 shadow-md hover:shadow-lg";
  };

  return (
    <m.button
      type={type}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${getVariantStyles()} ${width} ${className} rounded-lg px-4 py-2 capitalize font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
      onClick={onClick}
      disabled={disabled}
    >
      {Icon && <Icon className="text-sm" />}
      {text}
    </m.button>
  );
};

export default Button;
