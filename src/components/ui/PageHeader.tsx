"use client";

import React from "react";
import { useColorMode } from "@/context/ColorModeContext";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  leading?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, leading, className = "" }) => {
  const { colorMode } = useColorMode();

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6 ${className}`}
    >
      <div className="flex items-center gap-4 min-w-0">
        {leading}
        <div className="min-w-0">
          <h1 className="text-2xl xs:text-3xl md:text-4xl font-bold truncate">{title}</h1>
          {subtitle && (
            <p
              className={`text-xs xs:text-sm mt-1 ${
                colorMode === "light" ? "text-gray-600" : "text-gray-400"
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
    </div>
  );
};

export default PageHeader;
