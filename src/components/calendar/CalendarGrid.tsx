"use client";

import React from "react";
import { useColorMode } from "@/context/ColorModeContext";
import DayCell, { DayAggregate } from "./DayCell";

interface CalendarGridProps {
  monthDate: Date; // first-of-month, UTC-normalized
  aggregatesByDate: Map<string, DayAggregate>;
  onDayClick: (dateKey: string) => void;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toDateKey = (year: number, month: number, day: number): string => {
  const d = new Date(Date.UTC(year, month, day));
  return d.toISOString().slice(0, 10);
};

const CalendarGrid: React.FC<CalendarGridProps> = ({
  monthDate,
  aggregatesByDate,
  onDayClick,
}) => {
  const { colorMode } = useColorMode();
  const year = monthDate.getUTCFullYear();
  const month = monthDate.getUTCMonth();

  const firstDayOfWeek = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const daysInPrevMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const todayKey = new Date().toISOString().slice(0, 10);

  const cells: { key: string; dayOfMonth: number; isCurrentMonth: boolean }[] = [];

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayOfMonth = daysInPrevMonth - i;
    cells.push({
      key: toDateKey(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, dayOfMonth),
      dayOfMonth,
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      key: toDateKey(year, month, d),
      dayOfMonth: d,
      isCurrentMonth: true,
    });
  }

  const remainder = cells.length % 7;
  if (remainder !== 0) {
    const trailing = 7 - remainder;
    for (let d = 1; d <= trailing; d++) {
      cells.push({
        key: toDateKey(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, d),
        dayOfMonth: d,
        isCurrentMonth: false,
      });
    }
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className={`text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${
              colorMode === "light" ? "text-gray-500" : "text-gray-400"
            }`}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((cell) => (
          <DayCell
            key={cell.key}
            dayOfMonth={cell.dayOfMonth}
            isCurrentMonth={cell.isCurrentMonth}
            isToday={cell.key === todayKey}
            aggregate={aggregatesByDate.get(cell.key)}
            onClick={() => onDayClick(cell.key)}
          />
        ))}
      </div>
    </div>
  );
};

export default CalendarGrid;
