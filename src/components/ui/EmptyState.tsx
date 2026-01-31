"use client";

import React from "react";
import { FaInbox } from "react-icons/fa";
import { useColorMode } from "@/context/ColorModeContext";

interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No data",
  message = "There's nothing here yet.",
  action,
  icon,
}) => {
  const { colorMode } = useColorMode();
  
  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-4">
        {icon || <FaInbox className={`h-12 w-12 ${
          colorMode === "light" ? "text-gray-400" : "text-gray-500"
        }`} />}
      </div>
      <h3 className={`text-lg font-medium mb-2 ${
        colorMode === "light" ? "text-gray-900" : "text-gray-100"
      }`}>{title}</h3>
      <p className={`mb-4 ${
        colorMode === "light" ? "text-gray-500" : "text-gray-400"
      }`}>{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
