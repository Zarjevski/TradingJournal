import axios from "axios";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FaChartLine, 
  FaArrowUp, 
  FaArrowDown,
  FaExclamationTriangle,
  FaInfoCircle 
} from "react-icons/fa";
import Skeleton from "../common/Skeleton";

interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update?: string;
}

const FearAndGreed = ({ colorMode }: { colorMode: string }) => {
  const [data, setData] = useState<FearGreedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<FearGreedData[]>([]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get("https://api.alternative.me/fng/");
      const current = response.data.data[0];
      const historical = response.data.data.slice(0, 7); // Last 7 days
      
      setData({
        value: current.value,
        value_classification: current.value_classification,
        timestamp: current.timestamp,
        time_until_update: current.time_until_update,
      });
      setHistoricalData(historical);
    } catch (error: any) {
      console.error("Error fetching Fear & Greed data:", error);
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const value = data ? parseInt(data.value, 10) : 0;
  const classification = data?.value_classification || "";

  // Get stroke color based on value
  const getStrokeColor = (val: number) => {
    if (val <= 25) return "#ef4444"; // red-500
    if (val <= 45) return "#f97316"; // orange-500
    if (val <= 55) return "#eab308"; // yellow-500
    if (val <= 75) return "#22c55e"; // green-500
    return "#10b981"; // emerald-500
  };


  // Get status icon and text
  const getStatusInfo = () => {
    if (value <= 25) {
      return {
        icon: <FaExclamationTriangle className="text-red-500" />,
        text: "Extreme Fear",
        color: "text-red-500",
        bgColor: "bg-red-500/10",
      };
    }
    if (value <= 45) {
      return {
        icon: <FaArrowDown className="text-orange-500" />,
        text: "Fear",
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
      };
    }
    if (value <= 55) {
      return {
        icon: <FaChartLine className="text-yellow-500" />,
        text: "Neutral",
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
      };
    }
    if (value <= 75) {
      return {
        icon: <FaArrowUp className="text-green-500" />,
        text: "Greed",
        color: "text-green-500",
        bgColor: "bg-green-500/10",
      };
    }
    return {
      icon: <FaExclamationTriangle className="text-emerald-500" />,
      text: "Extreme Greed",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    };
  };

  const statusInfo = getStatusInfo();

  // Calculate trend (compare with previous day)
  const trend = historicalData.length > 1
    ? parseInt(historicalData[0].value, 10) - parseInt(historicalData[1].value, 10)
    : 0;

  if (isLoading) {
    return (
      <div
        className={`rounded-lg col-start-1 w-full h-full border shadow-lg backdrop-blur-sm ${
          colorMode === "light"
            ? "bg-white/95 border-gray-200"
            : "bg-gray-800/95 border-white/30"
        }`}
      >
        <div className="p-6">
          <Skeleton width="w-3/4" hieght="h-6" />
          <div className="mt-8">
            <Skeleton width="w-full" hieght="h-48" />
          </div>
          <div className="mt-4">
            <Skeleton width="w-1/2" hieght="h-8" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className={`rounded-lg col-start-1 w-full h-full border shadow-lg backdrop-blur-sm p-6 flex flex-col items-center justify-center ${
          colorMode === "light"
            ? "bg-white/95 border-gray-200"
            : "bg-gray-800/95 border-white/30"
        }`}
      >
        <FaInfoCircle className="text-4xl mb-4 text-gray-400" />
        <p className={`text-center ${
          colorMode === "light" ? "text-gray-600" : "text-gray-400"
        }`}>
          {error || "No data available"}
        </p>
        <button
          onClick={fetchData}
          className={`mt-4 px-4 py-2 rounded-lg ${
            colorMode === "light"
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`rounded-lg col-start-1 w-full h-full border shadow-lg backdrop-blur-sm overflow-hidden ${
        colorMode === "light"
          ? "bg-white/95 border-gray-200"
          : "bg-gray-800/95 border-white/30"
      }`}
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b ${
        colorMode === "light" ? "border-gray-200" : "border-gray-700"
      }`}>
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-lg flex items-center gap-2">
            <FaChartLine className="text-blue-500" />
            Fear & Greed Index
          </h1>
          {trend !== 0 && (
            <div className={`flex items-center gap-1 text-sm ${
              trend > 0 ? "text-green-500" : "text-red-500"
            }`}>
              {trend > 0 ? <FaArrowUp /> : <FaArrowDown />}
              <span>{Math.abs(trend)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-6 flex flex-col items-center justify-center h-[calc(100%-60px)]">
        {/* Circular Gauge */}
        <div className="relative w-40 h-40 md:w-48 md:h-48 mb-4">
          {/* Background Circle */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            {/* Background arc */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke={colorMode === "light" ? "#e5e7eb" : "#374151"}
              strokeWidth="20"
              strokeLinecap="round"
            />
            {/* Value arc */}
            <motion.circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke={getStrokeColor(value)}
              strokeWidth="20"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 80}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
              animate={{ 
                strokeDashoffset: 2 * Math.PI * 80 - (value / 100) * 2 * Math.PI * 80 
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>

          {/* Center Value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className={`text-5xl font-bold ${
                value <= 25 ? "text-red-500"
                : value <= 45 ? "text-orange-500"
                : value <= 55 ? "text-yellow-500"
                : value <= 75 ? "text-green-500"
                : "text-emerald-500"
              }`}
            >
              {value}
            </motion.div>
            <div className={`text-xs mt-1 ${
              colorMode === "light" ? "text-gray-500" : "text-gray-400"
            }`}>
              / 100
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 mb-3 ${statusInfo.bgColor}`}>
          {statusInfo.icon}
          <span className={`font-semibold text-sm ${statusInfo.color}`}>
            {classification}
          </span>
        </div>

        {/* Scale Labels */}
        <div className="w-full flex justify-between text-xs mt-2 mb-2">
          <div className={`text-center ${colorMode === "light" ? "text-gray-600" : "text-gray-400"}`}>
            <div className="font-semibold text-red-500">0</div>
            <div>Extreme Fear</div>
          </div>
          <div className={`text-center ${colorMode === "light" ? "text-gray-600" : "text-gray-400"}`}>
            <div className="font-semibold text-yellow-500">50</div>
            <div>Neutral</div>
          </div>
          <div className={`text-center ${colorMode === "light" ? "text-gray-600" : "text-gray-400"}`}>
            <div className="font-semibold text-green-500">100</div>
            <div>Extreme Greed</div>
          </div>
        </div>

        {/* Historical Trend */}
        {historicalData.length > 1 && (
          <div className="mt-3 w-full">
            <div className={`text-xs mb-1.5 ${
              colorMode === "light" ? "text-gray-600" : "text-gray-400"
            }`}>
              Last 7 Days
            </div>
            <div className="flex items-end justify-between gap-1 h-12">
              {historicalData.slice(0, 7).reverse().map((day, index) => {
                const dayValue = parseInt(day.value, 10);
                const height = (dayValue / 100) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className={`w-full rounded-t transition-all duration-300 ${
                        dayValue <= 25
                          ? "bg-red-500"
                          : dayValue <= 45
                          ? "bg-orange-500"
                          : dayValue <= 55
                          ? "bg-yellow-500"
                          : dayValue <= 75
                          ? "bg-green-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    <div className={`text-[10px] mt-1 ${
                      colorMode === "light" ? "text-gray-500" : "text-gray-400"
                    }`}>
                      {new Date(parseInt(day.timestamp) * 1000).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FearAndGreed;
