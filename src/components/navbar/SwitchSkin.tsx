import React from "react";
import { FaRegSun, FaRegMoon } from "react-icons/fa6";
import { motion } from "framer-motion";
import { useColorMode } from "@/context/ColorModeContext";

const SwitchSkin = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <motion.button
      whileHover={{ scale: 1.1, rotate: 15 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleColorMode}
      className={`p-2.5 rounded-lg transition-all duration-300 shadow-lg
        ${colorMode === "light" 
          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-blue-500/30" 
          : "bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-purple-500/30"}`}
      aria-label="Toggle color mode"
    >
      {colorMode === "light" ? <FaRegMoon className="h-5 w-5" /> : <FaRegSun className="h-5 w-5" />}
    </motion.button>
  );
};

export default SwitchSkin;
