import React from "react";
import { useColorMode } from "@/context/ColorModeContext";
import { motion } from "framer-motion";

interface RadioOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface RadioGroupProps {
  label: string;
  options: RadioOption[];
  value?: string;
  onChange: (value: string) => void;
  orientation?: "horizontal" | "vertical";
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  options,
  value,
  onChange,
  orientation = "horizontal",
}) => {
  const { colorMode } = useColorMode();

  return (
    <div className="w-full">
      <label
        className={`block mb-2 text-sm font-semibold capitalize ${
          colorMode === "light" ? "text-gray-700" : "text-gray-300"
        }`}
      >
        {label}
      </label>
      <div
        className={`flex gap-2 ${
          orientation === "vertical" ? "flex-col" : "flex-row"
        }`}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <motion.button
              key={option.value}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange(option.value)}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                isSelected
                  ? colorMode === "light"
                    ? "bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-200"
                    : "bg-purple-900/30 border-purple-500 text-purple-300 ring-2 ring-purple-700"
                  : colorMode === "light"
                  ? "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                  : "bg-gray-700/50 border-gray-600 text-gray-300 hover:border-gray-500"
              }`}
            >
              {option.icon && <span>{option.icon}</span>}
              <span className="font-medium capitalize">{option.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default RadioGroup;
