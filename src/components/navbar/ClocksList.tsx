import React, { useState, useEffect, useCallback, useRef } from "react";
import Clock from "./Clock";
import { useColorMode } from "@/context/ColorModeContext";
import { motion } from "framer-motion";

interface MarketClock {
  time: string;
  status: "open" | "close" | "pre-market" | "post-market";
  timezone: string;
}

interface MarketConfig {
  name: string;
  timezone: string;
  openHour: number;
  closeHour: number;
  preMarketStart?: number;
  postMarketEnd?: number;
}

const MARKETS: MarketConfig[] = [
  {
    name: "New York",
    timezone: "EST",
    openHour: 9,
    closeHour: 16,
    preMarketStart: 4,
    postMarketEnd: 20,
  },
  {
    name: "London",
    timezone: "GMT",
    openHour: 8,
    closeHour: 16,
    preMarketStart: 7,
    postMarketEnd: 16,
  },
  {
    name: "Tokyo",
    timezone: "JST",
    openHour: 9,
    closeHour: 15,
    preMarketStart: 8,
    postMarketEnd: 15,
  },
];

const ClocksList = () => {
  const { colorMode } = useColorMode();
  const [clocks, setClocks] = useState<Record<string, MarketClock>>({});
  const notificationShown = useRef<Record<string, boolean>>({});

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const getMarketStatus = (
    hour: number,
    minute: number,
    dayOfWeek: number,
    config: MarketConfig
  ): "open" | "close" | "pre-market" | "post-market" => {
    // Markets are closed on weekends (Saturday = 6, Sunday = 0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return "close";
    }

    const currentTime = hour * 60 + minute; // Convert to minutes
    const openTime = config.openHour * 60;
    const closeTime = config.closeHour * 60;
    const preMarketStart = (config.preMarketStart || config.openHour) * 60;
    const postMarketEnd = (config.postMarketEnd || config.closeHour) * 60;

    if (currentTime >= openTime && currentTime < closeTime) {
      return "open";
    } else if (currentTime >= preMarketStart && currentTime < openTime) {
      return "pre-market";
    } else if (currentTime >= closeTime && currentTime < postMarketEnd) {
      return "post-market";
    } else {
      return "close";
    }
  };

  const updateClocks = useCallback(() => {
    const newClocks: Record<string, MarketClock> = {};

    MARKETS.forEach((market) => {
      try {
        const now = new Date();
        
        // Get timezone string
        const timezoneMap: Record<string, string> = {
          "New York": "America/New_York",
          "London": "Europe/London",
          "Tokyo": "Asia/Tokyo",
        };
        
        const timezoneString = timezoneMap[market.name];
        
        // Use Intl.DateTimeFormat for reliable timezone conversion
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: timezoneString,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });

        // Format time string
        const timeString = formatter.format(now);

        // Get hour and minute for market status
        const parts = formatter.formatToParts(now);
        const hour = parseInt(parts.find(p => p.type === "hour")?.value || "0", 10);
        const minute = parseInt(parts.find(p => p.type === "minute")?.value || "0", 10);
        
        // Get day of week (0 = Sunday, 6 = Saturday) using UTC offset calculation
        // Create a date formatter to get the day
        const dayFormatter = new Intl.DateTimeFormat("en-US", {
          timeZone: timezoneString,
          weekday: "long",
        });
        const dayName = dayFormatter.format(now);
        const dayMap: Record<string, number> = {
          "Sunday": 0,
          "Monday": 1,
          "Tuesday": 2,
          "Wednesday": 3,
          "Thursday": 4,
          "Friday": 5,
          "Saturday": 6,
        };
        const dayOfWeek = dayMap[dayName] ?? 1;

        const status = getMarketStatus(hour, minute, dayOfWeek, market);

        // Show notification when market is about to open (5 minutes before)
        if (
          status === "pre-market" &&
          hour === market.openHour - 1 &&
          minute >= 55 &&
          !notificationShown.current[market.name]
        ) {
          // Notification logic can be added here if needed
          notificationShown.current[market.name] = true;
        }

        // Reset notification flag when market opens
        if (status === "open") {
          notificationShown.current[market.name] = false;
        }

        newClocks[market.name] = {
          time: timeString,
          status,
          timezone: market.timezone,
        };
      } catch (error) {
        console.error(`Error updating clock for ${market.name}:`, error);
        newClocks[market.name] = {
          time: "--:--:--",
          status: "close",
          timezone: market.timezone,
        };
      }
    });

    setClocks(newClocks);
  }, []);

  useEffect(() => {
    // Initial update immediately
    updateClocks();

    // Update every second
    const intervalId = setInterval(updateClocks, 1000);

    return () => clearInterval(intervalId);
  }, [updateClocks]);

  // Show loading state if no clocks are initialized yet
  if (Object.keys(clocks).length === 0) {
    return (
      <div className={`flex items-center gap-1.5 md:gap-2 lg:gap-3 ${
        colorMode === "light" ? "text-gray-900" : "text-white"
      }`}>
        {MARKETS.map((market) => (
          <div
            key={market.name}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[90px] animate-pulse"
          >
            <div className={`h-3 w-12 rounded ${
              colorMode === "light" ? "bg-gray-300" : "bg-gray-600"
            }`}></div>
            <div className={`h-4 w-16 rounded ${
              colorMode === "light" ? "bg-gray-300" : "bg-gray-600"
            }`}></div>
            <div className={`h-4 w-14 rounded ${
              colorMode === "light" ? "bg-gray-300" : "bg-gray-600"
            }`}></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-1.5 md:gap-2 lg:gap-3 flex-wrap justify-center ${
        colorMode === "light" ? "text-gray-900" : "text-white"
      }`}
    >
      {MARKETS.map((market) => {
        const clock = clocks[market.name];
        if (!clock) {
          return (
            <div
              key={market.name}
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[90px]"
            >
              <span className="text-xs text-gray-500">Loading...</span>
            </div>
          );
        }

        return (
          <Clock
            key={market.name}
            market={market.name}
            status={clock.status}
            time={clock.time}
            timezone={clock.timezone}
          />
        );
      })}
    </motion.div>
  );
};

export default ClocksList;
