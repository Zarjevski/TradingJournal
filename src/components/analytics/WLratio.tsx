import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { motion } from "framer-motion";
import Skeleton from "../common/Skeleton";

ChartJS.register(ArcElement, Tooltip, Legend);

interface WLratioProps {
  colorMode: string;
  wins: number;
  losses: number;
  isLoading?: boolean;
}

const WLratio = ({ colorMode, wins, losses, isLoading = false }: WLratioProps) => {
  const winColor = colorMode === "dark" 
    ? "rgba(34, 197, 94, 0.8)" 
    : "rgba(34, 197, 94, 0.8)";
  const lossColor = colorMode === "dark"
    ? "rgba(239, 68, 68, 0.8)"
    : "rgba(239, 68, 68, 0.8)";

  const total = wins + losses;
  const winPercentage = total > 0 ? ((wins / total) * 100).toFixed(1) : "0";
  const lossPercentage = total > 0 ? ((losses / total) * 100).toFixed(1) : "0";

  const data = {
    labels: ["Wins", "Losses"],
    datasets: [
      {
        label: "Trades",
        data: [wins, losses],
        backgroundColor: [winColor, lossColor],
        borderColor: [
          colorMode === "dark" ? "rgba(34, 197, 94, 1)" : "rgba(34, 197, 94, 1)",
          colorMode === "dark" ? "rgba(239, 68, 68, 1)" : "rgba(239, 68, 68, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
          labels: {
            color: colorMode === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)",
            padding: 15,
            font: {
              size: 12,
            },
          },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || "";
            const value = context.parsed || 0;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`h-full rounded-lg border shadow-lg backdrop-blur-sm app-surface ${
        colorMode === "light"
          ? "border-gray-200 text-gray-900"
          : "border-gray-700 text-white"
      }`}
    >
      <header className={`p-4 border-b ${
        colorMode === "light" ? "border-gray-200" : "border-gray-700"
      }`}>
        <h2 className="font-bold text-xl">Win/Loss Ratio</h2>
        <p className={`text-sm mt-1 ${
          colorMode === "light" ? "text-gray-600" : "text-gray-400"
        }`}>
          Trading performance overview
        </p>
      </header>
      <div className="w-full h-[calc(100%-100px)] flex flex-col items-center justify-center p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Skeleton width="w-48" hieght="h-48" />
          </div>
        ) : total === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className={`text-lg ${
              colorMode === "light" ? "text-gray-500" : "text-gray-400"
            }`}>
              No trades yet
            </p>
            <p className={`text-sm mt-2 ${
              colorMode === "light" ? "text-gray-400" : "text-gray-500"
            }`}>
              Start trading to see your statistics
            </p>
          </div>
        ) : (
          <>
            <div className="w-full max-w-[250px] h-[250px] mb-4">
              <Doughnut data={data} options={options} />
            </div>
            <div className="flex gap-6 mt-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  colorMode === "light" ? "text-green-600" : "text-green-400"
                }`}>
                  {wins}
                </div>
                <div className={`text-xs ${
                  colorMode === "light" ? "text-gray-600" : "text-gray-400"
                }`}>
                  Wins ({winPercentage}%)
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  colorMode === "light" ? "text-red-600" : "text-red-400"
                }`}>
                  {losses}
                </div>
                <div className={`text-xs ${
                  colorMode === "light" ? "text-gray-600" : "text-gray-400"
                }`}>
                  Losses ({lossPercentage}%)
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default WLratio;
