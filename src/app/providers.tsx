"use client";

import { SessionProvider } from "next-auth/react";
import UserProvider from "@/context/UserContext";
import ModalProvider from "@/context/ModalContext";
import { ColorModeProvider } from "@/context/ColorModeContext";
import ChatWidget from "@/components/chat/ChatWidget";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ColorModeProvider>
        <UserProvider>
          <ModalProvider>
            {children}
            <ChatWidget />
          </ModalProvider>
        </UserProvider>
      </ColorModeProvider>
    </SessionProvider>
  );
}
