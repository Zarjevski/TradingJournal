"use client";

import React from "react";
import { useColorMode } from "@/context/ColorModeContext";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  footer?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  title,
  footer,
}) => {
  const { colorMode } = useColorMode();
  
  return (
    <div className={`${
      colorMode === "light" ? "bg-white border-gray-200" : "bg-gray-800 border-gray-700"
    } rounded-lg shadow-md border ${className}`}>
      {title && (
        <div className={`px-6 py-4 border-b ${
          colorMode === "light" ? "border-gray-200" : "border-gray-700"
        }`}>
          <h3 className={`text-lg font-semibold ${
            colorMode === "light" ? "text-gray-900" : "text-gray-100"
          }`}>{title}</h3>
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
      {footer && (
        <div className={`px-6 py-4 border-t ${
          colorMode === "light" 
            ? "border-gray-200 bg-gray-50" 
            : "border-gray-700 bg-gray-700/50"
        }`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
