import React from "react";
import { useColorMode } from "@/context/ColorModeContext";
import axios from "axios";
import Image from "next/image";

const TopCoins = () => {
  const [coins, setCoins] = React.useState([]);
  const { colorMode } = useColorMode();
  React.useEffect(() => {
    const fetchCoins = async () => {
      try {
        const data: any = await axios.get(
          "https://api.coingecko.com/api/v3/search/trending"
        );
        setCoins(Array.isArray(data.data.coins) ? data.data.coins : []);
      } catch {
        setCoins([]);
      }
    };
    fetchCoins();
  }, []);
  return (
    <div
      className={`rounded w-full border overflow-hidden flex flex-col ${
        colorMode === "light"
          ? "text-black bg-white border-gray-200"
          : "bg-gray-900 text-white border-white/20"
      }`}
    >
      <header className="py-2 px-4 h-10 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
        <h1 className="font-semibold text-sm uppercase tracking-wide">Trending</h1>
        <span className="text-[11px] text-gray-400">24h</span>
      </header>
      <div className="w-full h-64 p-2 overflow-y-auto">
        {coins.map((coin: any, index: number) => {
          const todayChange =
            coin.item.data.price_change_percentage_24h.usd.toFixed(2);
            const price = coin.item.data.price.toFixed(5)
          return (
            <div
              className={`w-full border-b last:border-b-0 py-1.5 flex items-center justify-between gap-2 text-xs sm:text-sm ${
                colorMode === "light" ? "border-gray-200/70" : "border-gray-800"
              }`}
              key={index}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-4 text-[11px] text-gray-400">#{index + 1}</span>
                <Image src={coin.item.thumb} alt={coin.item.name} width={24} height={24} className="rounded-full" />
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate">{coin.item.name}</span>
                  <span className="text-[11px] uppercase text-gray-400 truncate">
                    {coin.item.symbol}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end pr-1">
                <span className="font-semibold text-[11px] sm:text-xs">${price}</span>
                <span
                  className={`text-[11px] font-medium ${
                    todayChange[0] === "-" ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {todayChange}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopCoins;
