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
      ? "bg-zinc-100 text-gray-800"
      : "bg-zinc-700 text-gray-200",
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
      ? "bg-zinc-200 text-zinc-800"
      : "bg-zinc-700 text-zinc-200",
  };
  
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2 py-0.5 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
