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
          ? "bg-gradient-to-br from-zinc-800 to-zinc-900 text-white hover:from-zinc-700 hover:to-zinc-800 shadow-zinc-900/30"
          : "bg-gradient-to-br from-zinc-100 to-zinc-200 text-zinc-900 hover:from-zinc-200 hover:to-zinc-300 shadow-zinc-100/30"}`}
      aria-label="Toggle color mode"
    >
      {colorMode === "light" ? <FaRegMoon className="h-5 w-5" /> : <FaRegSun className="h-5 w-5" />}
    </motion.button>
  );
};

export default SwitchSkin;
