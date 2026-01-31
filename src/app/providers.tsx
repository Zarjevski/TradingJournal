"use client";

import { SessionProvider } from "next-auth/react";
import UserProvider from "@/context/UserContext";
import ModalProvider from "@/context/ModalContext";
import { ColorModeProvider } from "@/context/ColorModeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ColorModeProvider>
        <UserProvider>
          <ModalProvider>
            {children}
          </ModalProvider>
        </UserProvider>
      </ColorModeProvider>
    </SessionProvider>
  );
}
