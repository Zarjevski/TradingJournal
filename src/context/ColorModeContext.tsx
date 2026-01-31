"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type ColorMode = "light" | "dark";

interface ColorModeContextType {
  colorMode: ColorMode;
  toggleColorMode: () => void;
  setColorMode: (mode: ColorMode) => void;
}

const ColorModeContext = createContext<ColorModeContextType | undefined>(undefined);

export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  // Always start with "dark" to match server-side rendering
  const [colorMode, setColorModeState] = useState<ColorMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only read from localStorage after mount to prevent hydration mismatch
    setMounted(true);
    const saved = localStorage.getItem("colorMode") as ColorMode | null;
    if (saved && (saved === "light" || saved === "dark")) {
      setColorModeState(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    } else {
      // Default to dark mode
      document.documentElement.classList.add("dark");
    }
  }, []);

  const setColorMode = (mode: ColorMode) => {
    setColorModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("colorMode", mode);
      document.documentElement.classList.toggle("dark", mode === "dark");
    }
  };

  const toggleColorMode = () => {
    const newMode = colorMode === "light" ? "dark" : "light";
    setColorMode(newMode);
  };

  // Don't update DOM class until mounted to prevent hydration mismatch
  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      document.documentElement.classList.toggle("dark", colorMode === "dark");
    }
  }, [colorMode, mounted]);

  return (
    <ColorModeContext.Provider value={{ colorMode, toggleColorMode, setColorMode }}>
      {children}
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  const context = useContext(ColorModeContext);
  if (context === undefined) {
    throw new Error("useColorMode must be used within a ColorModeProvider");
  }
  return context;
}
