import React from "react";
import { motion } from "framer-motion";

interface BadgeProps {
  text: string;
  color?: string;
  variant?: "solid" | "outline";
}

const Badge: React.FC<BadgeProps> = ({
  text,
  color = "bg-gray-500",
  variant = "solid",
}) => {
  const baseStyles = "w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold flex items-center justify-center transition-all duration-200";
  
  const variantStyles =
    variant === "outline"
      ? `border-2 ${color.replace("bg-", "border-")} ${color.replace("bg-", "text-")} bg-transparent`
      : `${color} text-white shadow-sm`;

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
