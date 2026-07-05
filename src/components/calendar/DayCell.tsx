"use client";

import React from "react";
import { useColorMode } from "@/context/ColorModeContext";

export interface DayAggregate {
  date: string;
  netPnl: number;
  tradeCount: number;
  wins: number;
  losses: number;
}

interface DayCellProps {
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  aggregate?: DayAggregate;
  onClick?: () => void;
}

const formatPnl = (value: number): string => {
  return value >= 0
    ? `+$${value.toLocaleString()}`
    : `-$${Math.abs(value).toLocaleString()}`;
};

const DayCell: React.FC<DayCellProps> = ({
  dayOfMonth,
  isCurrentMonth,
  isToday,
  aggregate,
  onClick,
}) => {
  const { colorMode } = useColorMode();
  const hasTrades = !!aggregate && aggregate.tradeCount > 0;

  const baseBorder = colorMode === "light" ? "border-gray-200" : "border-gray-700";
  const mutedText = colorMode === "light" ? "text-gray-400" : "text-gray-600";
  const normalText = colorMode === "light" ? "text-gray-700" : "text-gray-300";
  const surfaceHover = colorMode === "light" ? "hover:bg-zinc-50" : "hover:bg-zinc-700/50";

  const pnlColor = !aggregate
    ? mutedText
    : aggregate.netPnl > 0
    ? "text-green-500"
    : aggregate.netPnl < 0
    ? "text-red-500"
    : mutedText;

  return (
    <button
      type="button"
      disabled={!hasTrades}
      onClick={onClick}
      className={`app-surface border ${baseBorder} rounded-lg p-2 min-h-[70px] sm:min-h-[90px] flex flex-col items-start text-left transition-colors ${
        isCurrentMonth ? "" : "opacity-40"
      } ${hasTrades ? `cursor-pointer ${surfaceHover}` : "cursor-default"}`}
    >
      <span
        className={`text-xs sm:text-sm font-medium ${
          isToday
            ? colorMode === "light"
              ? "bg-zinc-900 text-white rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center"
              : "bg-zinc-100 text-zinc-900 rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center"
            : normalText
        }`}
      >
        {dayOfMonth}
      </span>

      {hasTrades && (
        <div className="mt-auto w-full">
          <p className={`text-xs sm:text-sm font-semibold ${pnlColor}`}>
            {formatPnl(aggregate!.netPnl)}
          </p>
          <p className={`hidden sm:block text-[11px] ${mutedText}`}>
            {aggregate!.tradeCount} trade{aggregate!.tradeCount !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </button>
  );
};

export default DayCell;
