"use client";

import React from "react";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";
import { useColorMode } from "@/context/ColorModeContext";

interface CalendarHeaderProps {
  monthDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  monthDate,
  onPrevMonth,
  onNextMonth,
  onToday,
}) => {
  const { colorMode } = useColorMode();

  const label = monthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const buttonClass = `flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
    colorMode === "light"
      ? "border-gray-300 text-gray-700 hover:bg-zinc-100"
      : "border-gray-600 text-gray-200 hover:bg-zinc-700"
  }`;

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <h1 className="text-2xl xs:text-3xl md:text-4xl font-bold">{label}</h1>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToday}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            colorMode === "light"
              ? "border-gray-300 text-gray-700 hover:bg-zinc-100"
              : "border-gray-600 text-gray-200 hover:bg-zinc-700"
          }`}
        >
          Today
        </button>
        <button
          type="button"
          aria-label="Previous month"
          onClick={onPrevMonth}
          className={buttonClass}
        >
          <IoChevronBackOutline className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next month"
          onClick={onNextMonth}
          className={buttonClass}
        >
          <IoChevronForwardOutline className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default CalendarHeader;
