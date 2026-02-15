import React from "react";
import { motion } from "framer-motion";
import { useColorMode } from "@/context/ColorModeContext";

interface BadgeProps {
  text: string;
  color?: string;
  variant?: "solid" | "outline";
}

const Badge: React.FC<BadgeProps> = ({
  text,
  color,
  variant = "solid",
}) => {
  const { colorMode } = useColorMode();
  const resolvedColor = color ?? (colorMode === "light" ? "bg-gray-500" : "bg-gray-400");
  const baseStyles = "w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold flex items-center justify-center transition-all duration-200";
  
  const variantStyles =
    variant === "outline"
      ? `border-2 ${resolvedColor.replace("bg-", "border-")} ${resolvedColor.replace("bg-", "text-")} bg-transparent`
      : `${resolvedColor} text-white shadow-sm`;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`${baseStyles} ${variantStyles}`}
    >
      {text.toUpperCase()}
    </motion.div>
  );
};

export default Badge;
