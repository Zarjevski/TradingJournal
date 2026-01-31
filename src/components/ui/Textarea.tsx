"use client";

import React from "react";
import { useColorMode } from "@/context/ColorModeContext";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className = "",
  id,
  ...props
}) => {
  const { colorMode } = useColorMode();
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className={`block text-sm font-medium ${
          colorMode === "light" ? "text-gray-700" : "text-gray-300"
        } mb-1`}>
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
          colorMode === "light" 
            ? "focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900" 
            : "focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-gray-100"
        } ${
          error ? "border-red-500" : colorMode === "light" ? "border-gray-300" : "border-gray-600"
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

export default Textarea;
