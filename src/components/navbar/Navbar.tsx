"use client";

import { useColorMode } from "@/context/ColorModeContext";
import SwitchSkin from "./SwitchSkin";
import Logo from "../common/Logo";
import TjLogo from "./TjLogo";
import ClocksList from "./ClocksList";
import { motion } from "framer-motion";

const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface NavbarProps {
  mobileSidebarOpen?: boolean;
  onMobileSidebarToggle?: () => void;
}

const Navbar = ({ mobileSidebarOpen = false, onMobileSidebarToggle }: NavbarProps) => {
  const { colorMode } = useColorMode();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`sticky top-0 z-50 backdrop-blur-3xl flex flex-row justify-between items-center border-b min-h-[56px] md:min-h-[8vh] px-4 py-2 md:px-6 md:py-3 transition-all duration-300 ${
        colorMode === "light"
          ? "text-gray-900 bg-white/95 border-gray-300 shadow-md shadow-gray-200/50"
          : "bg-gradient-to-r from-black/90 via-purple-950/50 to-black/90 text-white border-gray-700 shadow-lg shadow-black/20"
      }`}
    >
      {/* Mobile only: TJ logo on far left (hidden on desktop via .nav-mobile-only) */}
      <div className="nav-mobile-only min-w-0 flex-1 items-center">
        <TjLogo colorMode={colorMode} />
      </div>

      {/* Desktop only: full logo (hidden on mobile via .nav-desktop-only in globals.css) */}
      <div className="nav-desktop-only flex-shrink-0 w-[200px] items-center">
        <Logo width={200} height={100} colorMode={colorMode} className="w-full h-auto object-contain object-left" />
      </div>

      <div className="flex items-center gap-2 sm:gap-3 md:gap-5">
        <div className="hidden md:block">
          <ClocksList />
        </div>
        <div className="min-w-[44px] min-h-[44px] flex items-center justify-center">
          <SwitchSkin />
        </div>
        {/* Mobile only: menu button on far right (hidden on desktop via .nav-mobile-only) */}
        <div className="nav-mobile-only flex items-center">
          <button
            type="button"
            onClick={() => onMobileSidebarToggle?.()}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
              colorMode === "light"
                ? "border-gray-300 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-800"
                : "border-gray-500 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white"
            }`}
            aria-label={mobileSidebarOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileSidebarOpen}
          >
            {mobileSidebarOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
