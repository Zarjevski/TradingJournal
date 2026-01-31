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

  return (
    <section className="w-full h-[92vh] py-8 px-4 md:py-16 md:px-8 lg:px-16 xl:px-32 flex justify-center items-center">
      <m.div
        className={`w-full max-w-6xl flex h-full rounded-lg border shadow-lg backdrop-blur-sm ${
          colorMode === "light" 
            ? "bg-white/95 border-gray-200" 
            : "bg-gray-800/95 border-gray-700"
        }`}
        initial={fadeIn.initial}
        animate={fadeIn.animate}
        transition={fadeIn.transition}
      >
        <div className={`w-64 min-w-64 h-full border-r p-6 flex flex-col ${
          colorMode === "light" ? "border-gray-200" : "border-gray-700"
        }`}>
          <div className={`flex items-center gap-3 mb-8 ${colorMode === "light" ? "text-gray-900" : "text-gray-100"}`}>
            <IoSettings className="h-8 w-8" />
            <h1 className="font-bold text-2xl">Settings</h1>
          </div>
          <ul className="w-full flex flex-col gap-2">
            {SettingsLinks.map((link, index) => {
              const isActive = pathname === `/settings${link.link}`;
              return (
                <m.li
                  key={index}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/settings${link.link.startsWith('/') ? link.link : '/' + link.link}`)}
                  className={`w-full rounded-lg cursor-pointer h-12 capitalize font-medium flex items-center px-4 transition-all duration-200 ${
                    isActive
                      ? colorMode === "light"
                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                        : "bg-blue-900/50 text-blue-300 border border-blue-700"
                      : colorMode === "light"
                      ? "hover:bg-gray-100 text-gray-700"
                      : "hover:bg-gray-700/50 text-gray-300"
                  }`}
                >
                  {link.title}
                </m.li>
              );
            })}
          </ul>
        </div>
        <div className="flex-1 overflow-hidden">{children}</div>
      </m.div>
    </section>
  );
};

export default SettingsLayout;
