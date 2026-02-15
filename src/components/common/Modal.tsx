"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useModalContext } from "@/context/ModalContext";
import { motion } from "framer-motion";
import { useColorMode } from "@/context/ColorModeContext";

const MODAL_CONTAINER_ID = "app-modal-root";
const MODAL_OVERLAY_ATTR = "data-app-modal-overlay";

const Modal = () => {
  const { isOpen, Component, setIsOpen } = useModalContext();
  const { colorMode } = useColorMode();
  const containerRef = useRef<HTMLElement | null>(null);

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen && Component) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, Component]);

  // Remove overlay from DOM as soon as modal closes (before paint)
  useLayoutEffect(() => {
    if (!isOpen) {
      const container = document.getElementById(MODAL_CONTAINER_ID);
      if (container?.parentNode) {
        container.parentNode.removeChild(container);
      }
      const stuck = document.querySelectorAll(`[${MODAL_OVERLAY_ATTR}]`);
      stuck.forEach((el) => el.remove());
      containerRef.current = null;
    }
  }, [isOpen]);

  if (typeof window === "undefined") {
    return null;
  }

  if (!isOpen || !Component) {
    return null;
  }

  let container = document.getElementById(MODAL_CONTAINER_ID);
  if (!container) {
    container = document.createElement("div");
    container.id = MODAL_CONTAINER_ID;
    document.body.appendChild(container);
  }
  containerRef.current = container;

  const overlayContent = (
    <section
      {...{ [MODAL_OVERLAY_ATTR]: "" }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
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
        className="relative z-10 w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Component />
      </motion.div>
    </section>
  );

  return createPortal(overlayContent, container);
};

export default Modal;
