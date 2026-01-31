import { useUserContext } from "@/context/UserContext";
import { AiOutlineRise, AiOutlineFall, AiFillTrophy } from "react-icons/ai";
import { FaHashtag } from "react-icons/fa6";

const useTradeData = () => {
  const data: any = useUserContext();
  const trades = data.user?.trades || [];

  const totalTrades = trades.length;

  const totalOfPositionTypes = () => {
    let shortPositions = 0;
    let longPositions = 0;

    for (let i = 0; i < trades.length; i++) {
      if (trades[i].position == "short") {
        shortPositions++;
      } else if (trades[i].position == "long") {
        longPositions++;
      }
    }

    return { shortPositions, longPositions };
  };

  const highestWin = () => {
    let highestNumer = 0;
    for (let i = 0; i < trades.length; i++) {
      if (trades[i].status === "win" && trades[i].result > highestNumer) {
        highestNumer = trades[i].result;
      }
    }

    return highestNumer;
  };

  return [
    { title: "total trades", data: totalTrades, icon: FaHashtag },
    { title: "highest win", data: highestWin(), icon: AiFillTrophy },
    {
      title: "total shorts",
      data: totalOfPositionTypes().shortPositions,
      icon: AiOutlineFall,
    },
    {
      title: "total longs",
      data: totalOfPositionTypes().longPositions,
      icon: AiOutlineRise,
    },
  ];
};

export default useTradeData;
