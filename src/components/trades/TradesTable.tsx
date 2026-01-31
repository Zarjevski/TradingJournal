import React from "react";
import Button from "../common/Button";
import Trade from "@/components/trades/Trade";
import TableHeader from "./TableHeader";
import useNewTradeForm from "@/hooks/useNewTradeForm";
import { motion } from "framer-motion";
import { useUserContext } from "@/context/UserContext";
import Skeleton from "../common/Skeleton";

interface TradesTableProps {
  colorMode: string;
  data?: [{}];
  title: string;
  icon?: any;
}

const TradesTable: React.FC<TradesTableProps> = ({
  colorMode,
  title,
  icon: Icon,
}) => {
  const newTrade = useNewTradeForm();
  const data: any = useUserContext();
  const loading = data.isLoading;
  const trades = data.user?.trades || [];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: "easeOut", duration: 0.5 }}
      className={`rounded-lg overflow-hidden col-start-1 col-span-3 w-full h-full border shadow-lg backdrop-blur-sm ${
        colorMode === "light"
          ? "text-gray-900 bg-white/95 border-gray-200"
          : "bg-gray-800/95 text-white border-gray-700"
      }`}
    >
      <header className={`py-3 px-6 capitalize border-b flex justify-between items-center bg-gradient-to-r ${
        colorMode === "light"
          ? "from-gray-50 to-white border-gray-200"
          : "from-gray-800 to-gray-700 border-gray-700"
      }`}>
        <h1 className="font-bold flex items-center text-xl">
          {Icon ? <Icon className="w-5 h-5 mr-2" /> : null}
          {title}
        </h1>
        <Button text="+ New Trade" onClick={() => newTrade()} />
      </header>
      {loading ? (
        [1, 2, 3, 4, 5].map((item, index) => {
          return <Skeleton key={index} width={"w-[90%]"} hieght={"h-12"} />;
        })
      ) : trades && trades.length > 0 ? (
        <table className="table-auto w-full">
          <TableHeader />
          <tbody>
            {trades?.map((trade: any) => {
              const splitDate = trade.date?.split("T");
              return (
                <Trade
                  id={trade.id}
                  key={trade.id}
                  symbol={trade.symbol.toUpperCase()}
                  size={trade.size}
                  position={trade.position}
                  margin={trade.margin}
                  status={trade.status}
                  exchange={trade.exchangeName}
                  date={splitDate[0]}
                  colorMode={colorMode}
                />
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="w-full h-full min-h-[10vh] flex flex-col justify-center items-center text-center p-8">
          <div className={`text-6xl mb-4 ${
            colorMode === "light" ? "text-gray-300" : "text-gray-600"
          }`}>
            📊
          </div>
          <h1 className={`text-lg font-semibold capitalize mb-2 ${
            colorMode === "light" ? "text-gray-600" : "text-gray-400"
          }`}>
            No trades available
          </h1>
          <p className={`text-sm ${
            colorMode === "light" ? "text-gray-500" : "text-gray-500"
          }`}>
            Start tracking your trades by adding a new one
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default TradesTable;
