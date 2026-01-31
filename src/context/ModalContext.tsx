import React, { createContext, useContext, useState, useCallback } from "react";
import type { ModalContextData } from "@/types";
import type { ComponentType } from "react";

const ModalContext = createContext<ModalContextData>({
  isOpen: false,
  Component: null,
  setIsOpen: () => {},
  setComponent: () => {},
});

const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [Component, setComponent] = useState<ComponentType | null>(null);

  const handleSetIsOpen = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Clear component when closing modal
      setComponent(null);
    }
  }, []);

  const handleSetComponent = useCallback((component: ComponentType | null) => {
    setComponent(component);
    setIsOpen(component !== null);
  }, []);

  return (
    <ModalContext.Provider
      value={{
        isOpen,
        setIsOpen: handleSetIsOpen,
        setComponent: handleSetComponent,
        Component,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModalContext = () => {
  return useContext(ModalContext);
};

export default ModalProvider;
