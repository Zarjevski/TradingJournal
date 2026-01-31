"use client";

import React from "react";
import { useColorMode } from "@/context/ColorModeContext";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  className = "",
}) => {
  const { colorMode } = useColorMode();
  
  const variantClasses = {
    default: colorMode === "light"
      ? "bg-gray-100 text-gray-800"
      : "bg-gray-700 text-gray-200",
    success: colorMode === "light"
      ? "bg-green-100 text-green-800"
      : "bg-green-900 text-green-200",
    warning: colorMode === "light"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-yellow-900 text-yellow-200",
    danger: colorMode === "light"
      ? "bg-red-100 text-red-800"
      : "bg-red-900 text-red-200",
    info: colorMode === "light"
      ? "bg-blue-100 text-blue-800"
      : "bg-purple-900/30 text-purple-300",
  };
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };
  
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
