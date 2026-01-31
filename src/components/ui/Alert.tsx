"use client";

import React from "react";
import { FaInfoCircle, FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useColorMode } from "@/context/ColorModeContext";

interface AlertProps {
  children: React.ReactNode;
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  children,
  variant = "info",
  title,
  className = "",
}) => {
  const { colorMode } = useColorMode();
  
  const variantClasses = {
    info: colorMode === "light"
      ? "bg-blue-50 border-blue-200 text-blue-800"
      : "bg-purple-900/20 border-purple-700/50 text-purple-300",
    success: colorMode === "light"
      ? "bg-green-50 border-green-200 text-green-800"
      : "bg-green-900/20 border-green-700/50 text-green-300",
    warning: colorMode === "light"
      ? "bg-yellow-50 border-yellow-200 text-yellow-800"
      : "bg-yellow-900/20 border-yellow-700/50 text-yellow-300",
    error: colorMode === "light"
      ? "bg-red-50 border-red-200 text-red-800"
      : "bg-red-900/20 border-red-700/50 text-red-300",
  };

  const icons = {
    info: FaInfoCircle,
    success: FaCheckCircle,
    warning: FaExclamationTriangle,
    error: FaTimesCircle,
  };

  const Icon = icons[variant];

  return (
    <div
      className={`border rounded-lg p-4 ${variantClasses[variant]} ${className}`}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">{title}</h3>
          )}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Alert;
