import React from "react";
import Badge from "../common/Badge";
import { useColorMode } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { 
  FaClock, 
  FaRegClock,
  FaCheckCircle,
  FaTimesCircle 
} from "react-icons/fa";

interface ClockProps {
  status: "open" | "close" | "pre-market" | "post-market";
  market: string;
  time: string;
  timezone: string;
}

const Clock: React.FC<ClockProps> = ({ status, market, time, timezone }) => {
  const { colorMode } = useColorMode();
  
  const getStatusConfig = () => {
    switch (status) {
      case "open":
        return {
          color: "bg-green-500",
          icon: FaCheckCircle,
          label: "Open",
          pulse: true,
        };
      case "pre-market":
        return {
          color: "bg-yellow-500",
          icon: FaRegClock,
          label: "Pre-Market",
          pulse: false,
        };
      case "post-market":
        return {
          color: "bg-orange-500",
          icon: FaRegClock,
          label: "After Hours",
          pulse: false,
        };
      default:
        return {
          color: "bg-red-500",
          icon: FaTimesCircle,
          label: "Closed",
          pulse: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200 ${
        colorMode === "light"
          ? "bg-gray-50/80 hover:bg-gray-100/80 backdrop-blur-sm"
          : "bg-gray-700/30 hover:bg-gray-700/50 backdrop-blur-sm"
      } ${config.pulse ? "ring-1 ring-green-400/50" : ""}`}
    >
      <FaClock className={`text-[10px] ${
        colorMode === "light" ? "text-gray-600" : "text-gray-400"
      }`} />
      
      <span className={`text-[10px] font-semibold uppercase ${
        colorMode === "light" ? "text-gray-700" : "text-gray-300"
      }`}>
        {market}
      </span>
      
      <span className={`text-xs font-mono font-bold ${
        colorMode === "light" ? "text-gray-900" : "text-white"
      }`}>
        {time}
      </span>
      
      <div className="ml-auto">
        <Badge 
          color={config.color} 
          text={config.label}
          variant="solid"
        />
      </div>
    </motion.div>
  );
};

export default Clock;
