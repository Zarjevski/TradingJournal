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
      className={`flex justify-between items-center border-b py-4 px-6 ${
        colorMode === "light"
          ? "border-zinc-200 bg-zinc-50"
          : "border-zinc-800 bg-zinc-800/40"
      }`}
    >
      <h1 className="font-bold text-lg capitalize">{title}</h1>
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        className={`rounded-full p-2 transition-colors ${
          colorMode === "light"
            ? "hover:bg-zinc-200 text-gray-600"
            : "hover:bg-zinc-700 text-gray-300"
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
