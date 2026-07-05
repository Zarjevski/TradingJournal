"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaQuoteLeft, FaSyncAlt } from "react-icons/fa";
import quotes from "@/data/motivationalQuotes.json";

interface MotivationalQuoteProps {
  colorMode: string;
}

// Deterministic per-day pick so the quote stays the same across a single day's
// page loads, with a manual shuffle button for picking a different one.
function getStartIndex(): number {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return dayOfYear % quotes.length;
}

const MotivationalQuote: React.FC<MotivationalQuoteProps> = ({ colorMode }) => {
  const [index, setIndex] = useState(getStartIndex);
  const current = quotes[index];

  const shuffle = () => {
    let next = Math.floor(Math.random() * quotes.length);
    if (next === index && quotes.length > 1) {
      next = (next + 1) % quotes.length;
    }
    setIndex(next);
  };

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 flex items-center gap-4 app-surface ${
        colorMode === "light" ? "border-zinc-200" : "border-zinc-800"
      }`}
    >
      <FaQuoteLeft
        className={`hidden sm:block shrink-0 h-6 w-6 ${
          colorMode === "light" ? "text-zinc-300" : "text-zinc-700"
        }`}
      />
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.quote}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <p className="italic text-sm sm:text-base">&ldquo;{current.quote}&rdquo;</p>
            <p className={`text-xs mt-1 ${colorMode === "light" ? "text-gray-500" : "text-gray-400"}`}>
              — {current.author}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
      <button
        type="button"
        onClick={shuffle}
        aria-label="Show another quote"
        title="Show another quote"
        className={`shrink-0 p-2 rounded-full transition-colors ${
          colorMode === "light" ? "hover:bg-zinc-100 text-gray-500" : "hover:bg-zinc-800 text-gray-400"
        }`}
      >
        <FaSyncAlt className="h-4 w-4" />
      </button>
    </div>
  );
};

export default MotivationalQuote;
