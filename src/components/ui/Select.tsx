"use client";

import React from "react";
import { useColorMode } from "@/context/ColorModeContext";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: Array<{ value: string; label: string }>;
  children?: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  children,
  className = "",
  id,
  ...props
}) => {
  const { colorMode } = useColorMode();
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className={`block text-sm font-medium mb-1 ${
          error 
            ? colorMode === "light" ? "text-red-700" : "text-red-400"
            : colorMode === "light" ? "text-gray-700" : "text-gray-300"
        }`}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
          colorMode === "light"
            ? "focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            : "focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-gray-100"
        } ${
          error ? "border-red-500" : colorMode === "light" ? "border-gray-300" : "border-gray-600"
        } ${className}`}
        {...props}
      >
        {options
          ? options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          : children}
      </select>
      {error && (
        <p className={`mt-1 text-sm ${
          colorMode === "light" ? "text-red-600" : "text-red-400"
        }`}>{error}</p>
      )}
    </div>
  );
};

export default Select;
