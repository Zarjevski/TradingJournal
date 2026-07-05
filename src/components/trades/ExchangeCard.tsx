import React, { Dispatch, SetStateAction } from "react";
import Image from "next/image";
import { FaCheckCircle } from "react-icons/fa";
import { motion } from "framer-motion";

interface ExchangeCardProps {
  setActive: Dispatch<SetStateAction<any>>;
  title: string;
  image: string;
  id: string;
  active: { id: string; title: string };
  colorMode: string;
}

const ExchangeCard: React.FC<ExchangeCardProps> = ({
  setActive,
  title,
  image,
  id,
  active,
  colorMode,
}) => {
  const isSelected = active.id === id;

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      key={id}
      onClick={() => setActive({ title: title, id: id })}
      className={`relative rounded-lg border p-3 flex flex-col items-center justify-center gap-2 text-center transition-colors min-h-[96px] ${
        isSelected
          ? colorMode === "light"
            ? "border-zinc-500 bg-zinc-100 ring-2 ring-zinc-300"
            : "border-zinc-400 bg-zinc-700/50 ring-2 ring-zinc-600"
          : colorMode === "light"
          ? "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
          : "border-zinc-700 bg-zinc-800/60 hover:border-zinc-600 hover:bg-zinc-800"
      }`}
    >
      {isSelected && (
        <FaCheckCircle className="absolute top-2 right-2 text-green-500 h-4 w-4" />
      )}
      <Image height={40} width={40} src={image} alt={title} className="rounded-md" />
      <h2 className="text-sm font-medium truncate w-full">{title}</h2>
    </motion.button>
  );
};

export default ExchangeCard;
