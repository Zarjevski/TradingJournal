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
          ? "text-gray-900 bg-gradient-to-r from-blue-50/30 via-white/30 to-blue-50/30 border-blue-200/10 shadow-lg shadow-blue-200/3"
          : "bg-gradient-to-r from-purple-900/25 via-gray-900/25 to-purple-900/25 text-white border-purple-700/10 shadow-lg shadow-purple-900/5"
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
