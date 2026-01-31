import React from "react";
import Badge from "@/components/common/Badge";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface TradeProps {
  id: string | number;
  symbol: string;
  size: string;
  margin: string;
  date: string;
  position: string;
  status: string;
  colorMode: string;
  exchange: string;
}

const Trade: React.FC<TradeProps> = ({
  id,
  symbol,
  size,
  margin,
  date,
  position,
  status,
  exchange,
  colorMode,
}) => {
  const positionColor =
    position === "long"
      ? "bg-green-500"
      : position === "short"
      ? "bg-red-500"
      : "bg-gray-500";
  const statusColor =
    status === "win"
      ? "bg-green-500"
      : status === "loss"
      ? "bg-red-500"
      : "bg-yellow-500";
  const router = useRouter();

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ scale: 1.01 }}
      className={`h-14 text-center cursor-pointer transition-all duration-200 border-b ${
        colorMode === "light"
          ? "hover:bg-blue-50 border-gray-100"
          : "hover:bg-gray-700/50 border-gray-700"
      }`}
      onClick={() => router.push(`/trades/${id}`)}
    >
      <td className="px-4">
        <span className="font-semibold text-lg">{symbol}</span>
      </td>
      <td className="px-4">
        <span className="font-medium">${parseInt(size).toLocaleString()}</span>
      </td>
      <td className="px-4">
        <div className="flex items-center justify-center capitalize">
          <Badge text={position} color={positionColor} />
        </div>
      </td>
      <td className="px-4">
        <span className="font-medium">{margin}</span>
      </td>
      <td className="px-4">
        <div className="flex items-center justify-center capitalize">
          <Badge text={status} color={statusColor} />
        </div>
      </td>
      <td className="px-4">
        <span className="text-sm">{date}</span>
      </td>
      <td className="px-4">
        <span className="text-sm font-medium">{exchange}</span>
      </td>
    </motion.tr>
  );
};

export default Trade;
