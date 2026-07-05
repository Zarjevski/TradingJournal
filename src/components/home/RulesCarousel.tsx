"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface Rule {
  id: string;
  content: string;
}

interface RulesCarouselProps {
  rules: Rule[];
  onAddRule: () => void;
  colorMode: string;
}

// Deterministic per-day starting index so the carousel doesn't jump to a
// different rule on every page load, matching the old "rule of the day" feel.
function getStartIndex(count: number): number {
  if (count === 0) return 0;
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return dayOfYear % count;
}

const RulesCarousel: React.FC<RulesCarouselProps> = ({ rules, onAddRule, colorMode }) => {
  const [index, setIndex] = useState(() => getStartIndex(rules.length));
  const [direction, setDirection] = useState(1);

  const subTextColor = colorMode === "light" ? "text-gray-600" : "text-gray-400";
  const textColor = colorMode === "light" ? "text-gray-900" : "text-gray-100";
  const borderColor = colorMode === "light" ? "border-gray-200" : "border-gray-700";

  if (rules.length === 0) {
    return (
      <div className={`p-4 rounded-md border ${borderColor} ${colorMode === "light" ? "bg-zinc-50" : "bg-zinc-700"}`}>
        <p className={`text-xs font-bold uppercase mb-2 ${subTextColor}`}>Rule of the Day</p>
        <p className={`italic text-base ${textColor}`}>
          <button
            onClick={onAddRule}
            className={`${colorMode === "light" ? "text-zinc-500" : "text-zinc-400"} hover:underline`}
          >
            Add your first trading rule
          </button>
        </p>
      </div>
    );
  }

  const safeIndex = index % rules.length;
  const current = rules[safeIndex];

  const goTo = (newIndex: number, dir: number) => {
    setDirection(dir);
    setIndex((newIndex + rules.length) % rules.length);
  };

  return (
    <div className={`p-4 rounded-md border ${borderColor} ${colorMode === "light" ? "bg-zinc-50" : "bg-zinc-700"}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-xs font-bold uppercase ${subTextColor}`}>Rule of the Day</p>
        {rules.length > 1 && (
          <p className={`text-xs ${subTextColor}`}>
            {safeIndex + 1} / {rules.length}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {rules.length > 1 && (
          <button
            type="button"
            aria-label="Previous rule"
            onClick={() => goTo(safeIndex - 1, -1)}
            className={`shrink-0 p-1.5 rounded-full transition-colors ${
              colorMode === "light" ? "hover:bg-zinc-200 text-gray-500" : "hover:bg-zinc-600 text-gray-400"
            }`}
          >
            <FaChevronLeft className="h-3 w-3" />
          </button>
        )}

        <div className="flex-1 min-h-[2.5rem] overflow-hidden relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.p
              key={current.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 16 }}
              transition={{ duration: 0.2 }}
              className={`italic text-base text-center ${textColor}`}
            >
              {current.content}
            </motion.p>
          </AnimatePresence>
        </div>

        {rules.length > 1 && (
          <button
            type="button"
            aria-label="Next rule"
            onClick={() => goTo(safeIndex + 1, 1)}
            className={`shrink-0 p-1.5 rounded-full transition-colors ${
              colorMode === "light" ? "hover:bg-zinc-200 text-gray-500" : "hover:bg-zinc-600 text-gray-400"
            }`}
          >
            <FaChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {rules.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {rules.map((rule, i) => (
            <button
              key={rule.id}
              type="button"
              aria-label={`Go to rule ${i + 1}`}
              onClick={() => goTo(i, i > safeIndex ? 1 : -1)}
              className={`h-1.5 rounded-full transition-all ${
                i === safeIndex
                  ? colorMode === "light"
                    ? "w-4 bg-zinc-900"
                    : "w-4 bg-zinc-100"
                  : colorMode === "light"
                  ? "w-1.5 bg-zinc-300"
                  : "w-1.5 bg-zinc-600"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RulesCarousel;
