import React from "react";
import { useColorMode } from "@/context/ColorModeContext";
import axios from "axios";
import Image from "next/image";

const TopCoins = () => {
  const [coins, setCoins] = React.useState([]);
  const { colorMode } = useColorMode();
  const fetchCoins = async () => {
    const data: any = await axios.get(
      "https://api.coingecko.com/api/v3/search/trending"
    );
    setCoins(await data.data.coins);
  };
  React.useEffect(() => {
    fetchCoins();
  }, []);
  return (
    <div
      className={`rounded col-start-2 col-span-2 w-full h-full border overflow-hidden ${
        colorMode === "light" 
          ? "text-black bg-white border-gray-200" 
          : "bg-gray-800 text-white border-white/30"
      }`}
    >
      <header className="shadow py-2 px-4 h-14 flex items-center">
        <h1 className="font-bold text-xl">Trending</h1>
      </header>
      <div className="w-full h-full p-2 overflow-y-scroll">
        {coins.map((coin: any, index) => {
          const todayChange =
            coin.item.data.price_change_percentage_24h.usd.toFixed(2);
            const price = coin.item.data.price.toFixed(5)
          return (
            <div
              className={`w-full h-12 border-b py-1 flex items-center justify-between gap-2 font-medium ${
                colorMode === "light" ? "border-gray-200/[0.8] " : "border-white/30 "
              }`}
              key={index}
            >
              <div className="flex px-1 gap-4">
                <Image src={coin.item.thumb} alt="" width={30} height={30} />
                <h4>{coin.item.name}</h4>
              </div>
              <div className="flex pr-5 ">
                <h4>{price}</h4>
                <h4
                  className={`${
                    todayChange[0] === "-" ? "text-red-500" : "text-green-500"
                  } ml-4`}
                >
                  {todayChange}%
                </h4>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopCoins;
