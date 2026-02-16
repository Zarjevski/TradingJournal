"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar/Sidebar";
import Navbar from "@/components/navbar/Navbar";
import Modal from "@/components/common/Modal";
import { useColorMode } from "@/context/ColorModeContext";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { colorMode } = useColorMode();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile sidebar and restore scroll on navigation (fixes mobile scroll/click after nav)
  useEffect(() => {
    setMobileSidebarOpen(false);
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.touchAction = "";
  }, [pathname]);

  // Lock body scroll when mobile sidebar is open, restore when closed
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  // Default to dark mode until mounted to prevent hydration mismatch
  const displayColorMode = mounted ? colorMode : "dark";

  return (
    <>
      <Modal />
      <main
        className={`min-h-screen transition-colors duration-300 app-bg`}
      >
        <Navbar
          mobileSidebarOpen={mobileSidebarOpen}
          onMobileSidebarToggle={() => setMobileSidebarOpen((prev) => !prev)}
        />
        <section className="flex relative h-[92vh]">
          <Sidebar
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />
          <div className="flex-1 overflow-auto w-full">
            {children}
          </div>
        </section>
      </main>
    </>
  );
};

export default DashboardLayout;
