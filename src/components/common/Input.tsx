import React from "react";
import { useColorMode } from "@/context/ColorModeContext";

interface InputProps {
  label?: string;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
  error?: string;
}

const Input: React.FC<InputProps> = ({
  type,
  label,
  name,
  onChange,
  placeholder,
  value,
  required = false,
  error,
}) => {
  const { colorMode } = useColorMode();
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className={`block mb-2 text-sm font-semibold capitalize transition-colors ${
            colorMode === "light" ? "text-gray-700" : "text-gray-300"
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        id={name}
        onChange={onChange}
        value={value}
        required={required}
        className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
          error
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : colorMode === "light"
            ? "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
            : "bg-gray-800 border-gray-600 focus:border-purple-500 focus:ring-purple-500 text-white"
        } placeholder:${colorMode === "light" ? "text-gray-400" : "text-gray-500"}`}
        placeholder={placeholder}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
};

export default Input;
