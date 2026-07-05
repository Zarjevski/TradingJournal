"use client";

import React from "react";
import { useColorMode } from "@/context/ColorModeContext";
import SettingsLinks from "@/app/(dashboard)/settings/settingsLinks.json";
import { useRouter, usePathname } from "next/navigation";
import { motion as m } from "framer-motion";
import { IoSettings } from "react-icons/io5";
import { fadeIn } from "@/utils/framerEffects";

const SettingsLayout = ({ children }: { children: React.ReactNode }) => {
  const { colorMode } = useColorMode();
  const router = useRouter();
  const pathname = usePathname();

  const goTo = (link: string) => {
    router.push(`/settings${link.startsWith("/") ? link : "/" + link}`);
  };

  const navLink = (link: (typeof SettingsLinks)[0], index: number) => {
    const isActive = pathname === `/settings${link.link}`;
    const base =
      "rounded-lg cursor-pointer font-medium flex items-center justify-center px-4 transition-all duration-200 whitespace-nowrap";
    const active =
      colorMode === "light"
        ? "bg-zinc-900 text-white border border-zinc-900"
        : "bg-zinc-100 text-zinc-900 border border-zinc-100";
    const inactive =
      colorMode === "light"
        ? "hover:bg-zinc-100 text-zinc-700 border border-transparent"
        : "hover:bg-zinc-800/50 text-zinc-300 border border-transparent";

    return (
      <m.li
        key={index}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => goTo(link.link)}
        className={`${base} h-12 ${isActive ? active : inactive}`}
      >
        {link.title}
      </m.li>
    );
  };

  return (
    <section className="w-full min-h-0 flex-1 flex flex-col py-4 px-4 md:py-12 md:px-8 lg:px-16">
      <m.div
        className={`w-full max-w-5xl mx-auto flex flex-col flex-1 min-h-0 rounded-xl border shadow-sm backdrop-blur-sm ${
          colorMode === "light"
            ? "bg-white/95 border-zinc-200"
            : "bg-zinc-900/95 border-zinc-800"
        }`}
        initial={fadeIn.initial}
        animate={fadeIn.animate}
        transition={fadeIn.transition}
      >
        {/* Top bar with title + horizontal nav (all breakpoints) */}
        <div className="flex flex-col flex-shrink-0 border-b px-4 pt-4 pb-3 gap-3 border-zinc-200 dark:border-zinc-800 md:px-6">
          <div
            className={`flex items-center gap-3 ${
              colorMode === "light" ? "text-zinc-900" : "text-zinc-100"
            }`}
          >
            <IoSettings className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0" />
            <h1 className="font-bold text-xl md:text-2xl">Settings</h1>
          </div>
          <ul className="flex gap-2 overflow-x-auto pb-1 -mx-1">
            {SettingsLinks.map(navLink)}
          </ul>
        </div>

        {/* Content area: scrollable on all screens */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          {children}
        </div>
      </m.div>
    </section>
  );
};

export default SettingsLayout;
