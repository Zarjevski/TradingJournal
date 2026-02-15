import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { motion } from "framer-motion";
import type { Trade } from "@/types";
import Skeleton from "../common/Skeleton";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AccountGrowProps {
  colorMode: string;
  trades: Trade[];
  isLoading?: boolean;
}

const AccountGrow = ({ colorMode, trades, isLoading = false }: AccountGrowProps) => {
  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt).getTime();
      const dateB = new Date(b.date || b.createdAt).getTime();
      return dateA - dateB;
    });

    // Calculate cumulative profit/loss
    let cumulativePL = 0;
    const data = sortedTrades.map((trade) => {
      const result = trade.result ? parseFloat(trade.result.toString()) : 0;
      cumulativePL += result;
      return cumulativePL;
    });

    // Generate labels (dates)
    const labels = sortedTrades.map((trade) => {
      const date = new Date(trade.date || trade.createdAt);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });

    return {
      labels,
      datasets: [
        {
          label: "Cumulative P/L",
          data,
          borderColor: colorMode === "dark" 
            ? "rgba(34, 197, 94, 1)" 
            : "rgba(34, 197, 94, 1)",
          backgroundColor: colorMode === "dark"
            ? "rgba(34, 197, 94, 0.1)"
            : "rgba(34, 197, 94, 0.1)",
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: colorMode === "dark"
            ? "rgba(34, 197, 94, 1)"
            : "rgba(34, 197, 94, 1)",
        },
      ],
    };
  }, [trades, colorMode]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y;
            return `P/L: $${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: colorMode === "dark" 
            ? "rgba(255, 255, 255, 0.1)" 
            : "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: colorMode === "dark" 
            ? "rgba(255, 255, 255, 0.7)" 
            : "rgba(0, 0, 0, 0.7)",
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        grid: {
          color: colorMode === "dark" 
            ? "rgba(255, 255, 255, 0.1)" 
            : "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: colorMode === "dark" 
            ? "rgba(255, 255, 255, 0.7)" 
            : "rgba(0, 0, 0, 0.7)",
          callback: function(value: any) {
            return "$" + value.toFixed(0);
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
        <h2 className="font-bold text-xl">Account Growth</h2>
        <p className={`text-sm mt-1 ${
          colorMode === "light" ? "text-gray-600" : "text-gray-400"
        }`}>
          Cumulative profit/loss over time
        </p>
      </header>
      <div className="p-6 h-[calc(100%-100px)]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Skeleton width="w-full" hieght="h-full" />
          </div>
        ) : !trades || trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className={`text-lg ${
              colorMode === "light" ? "text-gray-500" : "text-gray-400"
            }`}>
              No trading data yet
            </p>
            <p className={`text-sm mt-2 ${
              colorMode === "light" ? "text-gray-400" : "text-gray-500"
            }`}>
              Start trading to track your account growth
            </p>
          </div>
        ) : (
          <Line options={options} data={chartData} />
        )}
      </div>
    </motion.div>
  );
};

export default AccountGrow;
