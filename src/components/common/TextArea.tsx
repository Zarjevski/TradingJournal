import React from "react";
import { useColorMode } from "@/context/ColorModeContext";

interface TextAreaProps {
  placeholder?: string;
  name?: string;
  id?: string;
  cols: number;
  rows: number;
  onChange?: (e: any) => void;
  value?: string;
}

const TextArea: React.FC<TextAreaProps> = ({
  placeholder,
  name,
  id,
  cols,
  rows,
  onChange,
  value
}) => {
  const { colorMode } = useColorMode();
  return (
    <textarea
      className={`w-full border-2 rounded-lg p-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
        colorMode === "light"
          ? "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
          : "bg-gray-800 border-gray-600 focus:border-purple-500 focus:ring-purple-500 text-white"
      } placeholder:${colorMode === "light" ? "text-gray-400" : "text-gray-500"}`}
      placeholder={placeholder}
      name={name}
      id={id}
      onChange={onChange}
      value={value}
      cols={cols}
      rows={rows}
    ></textarea>
  );
};

export default TextArea;
