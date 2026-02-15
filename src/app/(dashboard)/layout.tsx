"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import Navbar from "@/components/navbar/Navbar";
import Modal from "@/components/common/Modal";
import { useColorMode } from "@/context/ColorModeContext";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { colorMode } = useColorMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Default to dark mode until mounted to prevent hydration mismatch
  const displayColorMode = mounted ? colorMode : "dark";

  return (
    <>
      <Modal />
      <main
        className={`min-h-screen transition-colors duration-300 app-bg`}
      >
        <Navbar />
        <section className="flex relative h-[92vh]">
          <Sidebar />
          <div className="flex-1 overflow-auto w-full">
            {children}
          </div>
        </section>
      </main>
    </>
  );
};

export default DashboardLayout;
