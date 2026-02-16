"use client";

import React, { useState } from "react";
import { useColorMode } from "@/context/ColorModeContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaExclamationTriangle, FaTrash } from "react-icons/fa";
import Button from "@/components/common/Button";
import ConfirmModal from "@/components/common/ConfirmModal";
import axios from "axios";
import showNotification from "@/hooks/useShowNotification";

const Page = () => {
  const { colorMode } = useColorMode();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== "delete") {
      showNotification("Please type 'DELETE' to confirm", "Error");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await axios.delete("/api/user/delete");
      if (response.status === 200) {
        showNotification("Account deleted successfully", "Success");
        router.push("/auth/login");
      }
    } catch (error: any) {
      console.error("Error deleting account:", error);
      showNotification(
        error.response?.data?.error || "Failed to delete account",
        "Error"
      );
    } finally {
      setIsDeleting(false);
      setShowModal(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full h-full p-3 md:p-6 app-bg"
    >
      <div
        className={`rounded-lg border shadow-lg backdrop-blur-sm p-6 md:p-8 ${
          colorMode === "light"
            ? "bg-red-50 border-red-200"
            : "bg-red-900/20 border-red-800"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
          <div
            className={`p-3 rounded-full flex-shrink-0 w-fit ${
              colorMode === "light" ? "bg-red-100" : "bg-red-900/50"
            }`}
          >
            <FaExclamationTriangle className="text-2xl text-red-500" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold mb-2">Delete Your Account</h1>
            <p className={`text-sm ${
              colorMode === "light" ? "text-gray-700" : "text-gray-300"
            }`}>
              This action cannot be undone
            </p>
          </div>
        </div>

        <div className={`mb-6 p-4 rounded-lg ${
          colorMode === "light" ? "bg-white" : "bg-gray-800/50"
        }`}>
          <h2 className="font-semibold mb-3">What will be deleted:</h2>
          <ul className={`space-y-2 text-sm list-disc list-inside ${
            colorMode === "light" ? "text-gray-700" : "text-gray-300"
          }`}>
            <li>Your account and all personal information</li>
            <li>All your trading exchanges</li>
            <li>All your trades and trading history</li>
            <li>All your trading rules</li>
            <li>All analytics and statistics</li>
          </ul>
        </div>

        <div className={`mb-6 p-4 rounded-lg ${
          colorMode === "light" ? "bg-yellow-50 border-yellow-200" : "bg-yellow-900/20 border-yellow-800"
        } border`}>
          <p className={`text-sm ${
            colorMode === "light" ? "text-gray-700" : "text-gray-300"
          }`}>
            <strong>Warning:</strong> Before deleting your account, make sure to export
            any important data you want to keep. Once deleted, this information cannot
            be recovered.
          </p>
        </div>

        <Button
          text="Delete My Account"
          onClick={() => setShowModal(true)}
          icon={FaTrash}
          className="bg-red-500 hover:bg-red-600 text-white"
        />
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className={`p-4 sm:p-6 w-full max-w-[calc(100vw-2rem)] ${
          colorMode === "light" ? "bg-white" : "bg-gray-800"
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <FaExclamationTriangle className="text-2xl text-red-500" />
            <h2 className="text-xl font-bold">Final Confirmation</h2>
          </div>
          <p className={`mb-4 ${
            colorMode === "light" ? "text-gray-700" : "text-gray-300"
          }`}>
            This action is permanent and cannot be undone. All your data will be
            permanently deleted.
          </p>
          <p className={`mb-4 text-sm ${
            colorMode === "light" ? "text-gray-600" : "text-gray-400"
          }`}>
            Type <strong>DELETE</strong> to confirm:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className={`w-full px-4 py-3 rounded-lg border mb-4 min-h-[44px] text-base touch-manipulation ${
              colorMode === "light"
                ? "bg-white border-gray-300"
                : "bg-gray-700 border-gray-600 text-white"
            }`}
          />
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 justify-end">
            <Button
              text="Cancel"
              onClick={() => {
                setShowModal(false);
                setConfirmText("");
              }}
              className="bg-gray-500 hover:bg-gray-600 w-full sm:w-auto min-h-[44px] touch-manipulation"
            />
            <Button
              text={isDeleting ? "Deleting..." : "Delete Account"}
              onClick={handleDelete}
              disabled={isDeleting || confirmText.toLowerCase() !== "delete"}
              className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 w-full sm:w-auto min-h-[44px] touch-manipulation"
            />
          </div>
        </div>
      </ConfirmModal>
    </motion.div>
  );
};

export default Page;
