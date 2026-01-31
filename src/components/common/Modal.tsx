import React from "react";
import { useModalContext } from "@/context/ModalContext";
import { motion, AnimatePresence } from "framer-motion";
import { useColorMode } from "@chakra-ui/react";

const Modal = () => {
  const { isOpen, Component } = useModalContext();
  const { colorMode } = useColorMode();

  return (
    <AnimatePresence>
      {isOpen && Component && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              // Close modal when clicking backdrop
            }
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 backdrop-blur-sm ${
              colorMode === "light"
                ? "bg-black/40"
                : "bg-black/60"
            }`}
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative z-10 w-full max-w-2xl"
          >
            <Component />
          </motion.div>
        </motion.section>
      )}
    </AnimatePresence>
  );
};

export default Modal;
