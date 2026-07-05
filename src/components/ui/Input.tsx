"use client";

import React from "react";
import { useColorMode } from "@/context/ColorModeContext";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  className = "",
  id,
  ...props
}) => {
  const { colorMode } = useColorMode();
  const generatedId = React.useId();
  const inputId = id || generatedId;
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className={`block text-sm font-medium ${
          colorMode === "light" ? "text-gray-700" : "text-gray-300"
        } mb-1`}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
          colorMode === "light"
            ? "focus:ring-zinc-500 focus:border-zinc-500 bg-white text-gray-900"
            : "focus:ring-zinc-400 focus:border-zinc-400 bg-zinc-800 text-gray-100"
        } ${
          error ? "border-red-500" : colorMode === "light" ? "border-gray-300" : "border-zinc-600"
        } ${className}`}
        {...props}
      />
      {error && (
        <p className={`mt-1 text-sm ${
          colorMode === "light" ? "text-red-600" : "text-red-400"
        }`}>{error}</p>
      )}
    </div>
  );
};

export default Input;
