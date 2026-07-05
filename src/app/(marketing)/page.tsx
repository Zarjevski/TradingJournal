import React from "react";
import Link from "next/link";
import { FaArrowRight, FaChartLine, FaUsers, FaVideo } from "react-icons/fa";
import { APP_NAME } from "@/lib/constants";

export default function MarketingHomePage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="grid gap-8 md:grid-cols-2 items-center">
        <div className="space-y-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
            Trade with{" "}
            <span className="bg-gradient-to-r from-zinc-400 via-zinc-600 to-zinc-900 dark:from-zinc-300 dark:via-zinc-500 dark:to-zinc-100 bg-clip-text text-transparent">
              discipline
            </span>
            , not emotion.
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-xl">
            {APP_NAME} helps you capture every trade, learn from mistakes,
            and grow with your team using real-time analytics, chat, and video
            rooms.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 shadow-md hover:shadow-lg transition-all"
            >
              Go to Dashboard
              <FaArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Sign in
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 pt-4">
            <div>
              <p className="font-semibold">Daily review</p>
              <p>Close the day knowing exactly what worked and what didn&apos;t.</p>
            </div>
            <div>
              <p className="font-semibold">Team rooms</p>
              <p>Trade with accountability using TEAM chat &amp; video.</p>
            </div>
            <div>
              <p className="font-semibold">Data-first</p>
              <p>Turn your P&amp;L and screenshots into real insights.</p>
            </div>
          </div>
        </div>

        {/* Hero Card */}
        <div className="relative">
          <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-500/40 bg-white/70 dark:bg-black/40 shadow-xl backdrop-blur-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Today&apos;s P&amp;L
                </p>
                <p className="text-2xl font-bold text-green-500">+$1,250</p>
              </div>
              <div className="rounded-full bg-green-500/10 text-green-500 px-3 py-1 text-xs font-semibold flex items-center gap-1">
                <FaChartLine className="h-3 w-3" />
                Risk-On
              </div>
            </div>

            <div className="h-20 rounded-xl bg-gradient-to-r from-zinc-400/20 via-zinc-600/20 to-zinc-900/20 border border-zinc-300/40 dark:border-zinc-500/40 dark:from-zinc-800/70 dark:via-zinc-900/80 dark:to-black/80" />

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Win rate</p>
                <p className="font-semibold">62%</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Avg R:R</p>
                <p className="font-semibold">1.9 : 1</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Trades today</p>
                <p className="font-semibold">7</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pillars */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200/70 dark:border-gray-700 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl p-4 space-y-2">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-500/10 text-zinc-500 text-xs">
              1
            </span>
            Journal every trade
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Capture entries, exits, screenshots, and reasons so nothing gets
            lost in your memory.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200/70 dark:border-gray-700 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl p-4 space-y-2">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <FaUsers className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            Trade with your team
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            TEAM chat, shared trades, and video rooms keep everyone aligned on
            the plan.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200/70 dark:border-gray-700 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl p-4 space-y-2">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <FaVideo className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            Learn in real time
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Review sessions with live screen share and analytics instead of
            guessing.
          </p>
        </div>
      </section>
    </div>
  );
}
