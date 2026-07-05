"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useColorMode } from "@/context/ColorModeContext";
import { APP_NAME } from "@/lib/constants";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";

  const navBg = isDark
    ? "bg-black/60 border-zinc-500/40 shadow-zinc-900/30"
    : "bg-white/70 border-zinc-400/40 shadow-zinc-200/40";

  const linkBase =
    "text-sm font-medium transition-colors hover:opacity-90";

  const isActive = (path: string) =>
    pathname === path || (path !== "/" && pathname.startsWith(path));

  return (
    <div
      className={`min-h-screen w-full ${
        isDark
          ? "bg-gradient-to-br from-black via-black to-black"
          : "bg-gradient-to-br from-zinc-300 via-zinc-500 to-zinc-700"
      } text-gray-900 dark:text-gray-100`}
    >
      <header className="sticky top-0 z-40">
        <div
          className={`backdrop-blur-3xl border-b shadow-lg ${navBg}`}
        >
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            {/* Logo / Brand */}
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-gradient-to-br from-zinc-500 to-zinc-700 text-white"
              >
                TD
              </div>
              <span className="font-semibold text-sm sm:text-base">
                {APP_NAME}
              </span>
            </div>

            {/* Nav Links + CTA */}
            <div className="flex items-center gap-3 sm:gap-4">
              <nav className="hidden sm:flex items-center gap-4">
                <Link
                  href="/"
                  className={`${linkBase} ${
                    isActive("/")
                      ? isDark
                        ? "text-zinc-100"
                        : "text-zinc-900"
                      : isDark
                      ? "text-gray-300"
                      : "text-gray-700"
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/features"
                  className={`${linkBase} ${
                    isActive("/features")
                      ? isDark
                        ? "text-zinc-100"
                        : "text-zinc-900"
                      : isDark
                      ? "text-gray-300"
                      : "text-gray-700"
                  }`}
                >
                  Features
                </Link>
                <Link
                  href="/pricing"
                  className={`${linkBase} ${
                    isActive("/pricing")
                      ? isDark
                        ? "text-zinc-100"
                        : "text-zinc-900"
                      : isDark
                      ? "text-gray-300"
                      : "text-gray-700"
                  }`}
                >
                  Pricing
                </Link>
              </nav>

              {/* Dashboard CTA */}
              <Link
                href="/dashboard"
                className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all ${
                  isDark
                    ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                    : "bg-zinc-900 hover:bg-zinc-800 text-white"
                }`}
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}
