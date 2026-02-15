"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useColorMode } from "@/context/ColorModeContext";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";

  const navBg = isDark
    ? "bg-black/60 border-purple-500/40 shadow-purple-900/30"
    : "bg-white/70 border-blue-400/40 shadow-blue-200/40";

  const linkBase =
    "text-sm font-medium transition-colors hover:opacity-90";

  const isActive = (path: string) =>
    pathname === path || (path !== "/landing" && pathname.startsWith(path));

  return (
    <div
      className={`min-h-screen w-full ${
        isDark
          ? "bg-gradient-to-br from-black via-black to-black"
          : "bg-gradient-to-br from-sky-300 via-blue-500 to-indigo-600"
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
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  isDark
                    ? "bg-gradient-to-br from-purple-500 to-blue-500"
                    : "bg-gradient-to-br from-blue-500 to-purple-500"
                } text-white`}
              >
                TJ
              </div>
              <span className="font-semibold text-sm sm:text-base">
                Trading Journal
              </span>
            </div>

            {/* Nav Links + CTA */}
            <div className="flex items-center gap-3 sm:gap-4">
              <nav className="hidden sm:flex items-center gap-4">
                <Link
                  href="/landing"
                  className={`${linkBase} ${
                    isActive("/landing")
                      ? isDark
                        ? "text-purple-300"
                        : "text-blue-700"
                      : isDark
                      ? "text-gray-300"
                      : "text-gray-700"
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/landing/features"
                  className={`${linkBase} ${
                    isActive("/landing/features")
                      ? isDark
                        ? "text-purple-300"
                        : "text-blue-700"
                      : isDark
                      ? "text-gray-300"
                      : "text-gray-700"
                  }`}
                >
                  Features
                </Link>
                <Link
                  href="/landing/pricing"
                  className={`${linkBase} ${
                    isActive("/landing/pricing")
                      ? isDark
                        ? "text-purple-300"
                        : "text-blue-700"
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
                href="/"
                className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all ${
                  isDark
                    ? "bg-purple-600 hover:bg-purple-500 text-white"
                    : "bg-blue-600 hover:bg-blue-500 text-white"
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

