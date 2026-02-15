import { useColorMode } from "@/context/ColorModeContext";
import SwitchSkin from "./SwitchSkin";
import Logo from "../common/Logo";
import ClocksList from "./ClocksList";
import { motion } from "framer-motion";

const Navbar = () => {
  const { colorMode } = useColorMode();
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`sticky top-0 z-50 backdrop-blur-3xl md:flex lg:flex-row sm:flex-col xs:flex-col justify-between items-center border-b md:h-[8vh] px-6 py-3 transition-all duration-300 ${
        colorMode === "light"
          ? "text-gray-900 bg-white/95 border-gray-300 shadow-md shadow-gray-200/50"
          : "bg-gradient-to-r from-black/90 via-purple-950/50 to-black/90 text-white border-gray-700 shadow-lg shadow-black/20"
      }`}
    >
      <Logo width={200} height={100} colorMode={colorMode} />
      <div className="flex items-center gap-3 md:gap-5 flex-wrap justify-center">
        <div className="hidden md:block">
          <ClocksList />
        </div>
        <SwitchSkin />
      </div>
    </motion.nav>
  );
};

export default Navbar;
