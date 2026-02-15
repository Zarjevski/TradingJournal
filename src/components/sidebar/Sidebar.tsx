"use client";

import { useColorMode } from "@/context/ColorModeContext";
import { IoExitOutline } from "react-icons/io5";
import UserDetails from "./UserDetails";
import SidebarUL from "./SidebarUL";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = () => {
  const { colorMode } = useColorMode();
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Load sidebar state from localStorage
    const savedState = localStorage.getItem("sidebarOpen");
    if (savedState !== null) {
      setIsOpen(savedState === "true");
    }
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("sidebarOpen", String(isOpen));
    }
  }, [isOpen, mounted]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        flex flex-col justify-between sticky top-[8vh] transition-all duration-300 ease-in-out
        ${isOpen ? "w-64" : "w-20"} 
        border-r h-[92vh] shadow-xl overflow-hidden
        ${
          colorMode === "light"
            ? "text-gray-900 bg-white/98 backdrop-blur-md border-gray-300"
            : "bg-gray-900/98 text-white border-gray-700 backdrop-blur-md"
        }
      `}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        <UserDetails
          isOpen={isOpen}
          setIsOpen={handleToggle}
        />
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <SidebarUL colorMode={colorMode} isOpen={isOpen} />
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => signOut({ callbackUrl: "/auth/login" })}
        className={`
          p-3 h-16 w-full flex items-center cursor-pointer border-t transition-all duration-200 
          text-red-500 hover:text-red-600 font-semibold
          ${
            colorMode === "light"
              ? "hover:bg-red-50/80 border-gray-300 active:bg-red-100"
              : "hover:bg-red-900/30 border-gray-700 active:bg-red-900/40"
          }
          ${!isOpen ? "justify-center" : "px-4"}
        `}
        title={!isOpen ? "Logout" : undefined}
      >
        <IoExitOutline className={`h-5 w-5 flex-shrink-0 ${isOpen ? "mr-3" : ""}`} />
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="whitespace-nowrap"
            >
              Logout
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.aside>
  );
};

export default Sidebar;
