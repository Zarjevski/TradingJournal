"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useColorMode } from "@/context/ColorModeContext";
import { motion } from "framer-motion";

const CONFIRM_MODAL_CONTAINER_ID = "app-confirm-modal-root";
const CONFIRM_MODAL_OVERLAY_ATTR = "data-app-confirm-modal-overlay";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, children }) => {
  const { colorMode } = useColorMode();
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) {
      const container = document.getElementById(CONFIRM_MODAL_CONTAINER_ID);
      if (container?.parentNode) {
        container.parentNode.removeChild(container);
      }
      const stuck = document.querySelectorAll(`[${CONFIRM_MODAL_OVERLAY_ATTR}]`);
      stuck.forEach((el) => el.remove());
      containerRef.current = null;
    }
  }, [isOpen]);

  if (typeof window === "undefined") {
    return null;
  }

  if (!isOpen) {
    return null;
  }

  let container = document.getElementById(CONFIRM_MODAL_CONTAINER_ID);
  if (!container) {
    container = document.createElement("div");
    container.id = CONFIRM_MODAL_CONTAINER_ID;
    document.body.appendChild(container);
  }
  containerRef.current = container;

  const overlayContent = (
    <section
      {...{ [CONFIRM_MODAL_OVERLAY_ATTR]: "" }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`absolute inset-0 backdrop-blur-sm ${
          colorMode === "light" ? "bg-black/40" : "bg-black/60"
        }`}
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`relative z-10 w-full max-w-md rounded-lg shadow-xl app-surface border ${
          colorMode === "light" ? "border-gray-300" : "border-gray-700"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </section>
  );

  return createPortal(overlayContent, container);
};

export default ConfirmModal;
