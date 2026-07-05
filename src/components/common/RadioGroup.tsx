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
        className={`flex gap-2 flex-wrap ${
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
                    ? "bg-zinc-900 border-zinc-900 text-white ring-2 ring-zinc-300"
                    : "bg-zinc-100 border-zinc-100 text-zinc-900 ring-2 ring-zinc-500"
                  : colorMode === "light"
                  ? "bg-white border-zinc-300 text-gray-700 hover:border-zinc-400"
                  : "bg-zinc-700/50 border-zinc-600 text-gray-300 hover:border-zinc-500"
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
