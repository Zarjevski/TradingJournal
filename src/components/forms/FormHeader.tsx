import React from "react";
import { MdClose } from "react-icons/md";
import useResetModal from "@/hooks/useResetModal";
import { useColorMode } from "@/context/ColorModeContext";
import { motion } from "framer-motion";

interface FormHeaderProps {
  title: string;
}

const FormHeader: React.FC<FormHeaderProps> = ({ title }) => {
  const reset = useResetModal();
  const { colorMode } = useColorMode();
  return (
    <header
      className={`flex justify-between items-center border-b py-4 px-6 bg-gradient-to-r ${
        colorMode === "light"
          ? "border-gray-200 from-gray-50 to-white"
          : "border-gray-700 from-gray-800 to-gray-700"
      }`}
    >
      <span></span>
      <h1 className="font-bold text-xl capitalize">{title}</h1>
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        className={`rounded-full p-2 transition-colors ${
          colorMode === "light"
            ? "hover:bg-gray-100 text-gray-600"
            : "hover:bg-gray-700 text-gray-300"
        }`}
        type="button"
        title="close form"
        onClick={() => reset()}
      >
        <MdClose className="w-5 h-5" />
      </motion.button>
    </header>
  );
};

export default FormHeader;
