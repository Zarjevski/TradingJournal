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
      colorMode === "light" ? "bg-white border-zinc-200" : "bg-zinc-900 border-zinc-800"
    } rounded-xl shadow-sm border ${className}`}>
      {title && (
        <div className={`px-6 py-4 border-b ${
          colorMode === "light" ? "border-gray-200" : "border-zinc-700"
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
            ? "border-gray-200 bg-zinc-50"
            : "border-zinc-700 bg-zinc-800/50"
        }`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
