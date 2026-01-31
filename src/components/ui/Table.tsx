"use client";

import React from "react";
import { useColorMode } from "@/context/ColorModeContext";

interface TableProps {
  children?: React.ReactNode;
  headers?: string[]; // Optional for backward compatibility
  className?: string;
}

interface TableSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const Thead: React.FC<TableSectionProps> = ({ children, className = "" }) => (
  <thead className={className}>{children}</thead>
);

export const Tbody: React.FC<TableSectionProps> = ({ children, className = "" }) => (
  <tbody className={className}>{children}</tbody>
);

export const Tr: React.FC<TableSectionProps & React.HTMLAttributes<HTMLTableRowElement>> = ({ children, className = "", ...props }) => (
  <tr className={className} {...props}>{children}</tr>
);

interface ThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

export const Th: React.FC<ThProps> = ({ children, className = "", ...props }) => {
  const { colorMode } = useColorMode();
  return (
    <th
      scope="col"
      className={`px-6 py-3 text-left text-xs font-medium ${
        colorMode === "light" ? "text-gray-500" : "text-gray-400"
      } uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </th>
  );
};

interface TdProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

export const Td: React.FC<TdProps> = ({ children, className = "", ...props }) => {
  const { colorMode } = useColorMode();
  return (
    <td
      className={`px-6 py-4 whitespace-nowrap text-sm ${
        colorMode === "light" ? "text-gray-900" : "text-gray-100"
      } ${className}`}
      {...props}
    >
      {children}
    </td>
  );
};

const Table: React.FC<TableProps> = ({ children, headers, className = "" }) => {
  const { colorMode } = useColorMode();
  
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y ${
        colorMode === "light" ? "divide-gray-200" : "divide-gray-700"
      } ${className}`}>
        {headers ? (
          <>
            <thead className={colorMode === "light" ? "bg-gray-50" : "bg-gray-800"}>
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className={`px-6 py-3 text-left text-xs font-medium ${
                      colorMode === "light" ? "text-gray-500" : "text-gray-400"
                    } uppercase tracking-wider`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`${
              colorMode === "light" ? "bg-white divide-gray-200" : "bg-gray-800 divide-gray-700"
            } divide-y`}>
              {children}
            </tbody>
          </>
        ) : (
          children
        )}
      </table>
    </div>
  );
};

export default Table;
