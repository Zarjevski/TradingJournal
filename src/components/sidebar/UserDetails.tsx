"use client";

import Image from "next/image";
import React, { Dispatch, SetStateAction, useState, useEffect, useRef } from "react";
import { IoChevronForwardOutline, IoChevronBackOutline } from "react-icons/io5";
import { useUserContext } from "@/context/UserContext";
import Skeleton from "../common/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useColorMode } from "@/context/ColorModeContext";
import axios from "axios";
import Select from "@/components/ui/Select";
import { FaArrowUp, FaArrowDown, FaMinus, FaCamera, FaTimes } from "react-icons/fa";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

const UserDetails = ({
  isOpen,
  setIsOpen,
  hideToggle = false,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  hideToggle?: boolean;
}) => {
  const { colorMode } = useColorMode();
  const data = useUserContext();
  const fullName = data.user
    ? `${data.user.firstName} ${data.user.lastName}`
    : "User";
  const loading = data.isLoading;
  const [status, setStatus] = useState<string>(data.user?.status || "NEUTRAL");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(data.user?.photoURL || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data.user?.status) {
      setStatus(data.user.status);
    }
  }, [data.user?.status]);

  const handleStatusClick = () => {
    if (isUpdatingStatus) return;
    // Cycle through statuses: NEUTRAL -> BULLISH -> BEARISH -> NEUTRAL
    const statusOrder = ["NEUTRAL", "BULLISH", "BEARISH"];
    const currentIndex = statusOrder.indexOf(status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    handleStatusChange(statusOrder[nextIndex]);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status || isUpdatingStatus) return;
    
    setIsUpdatingStatus(true);
    try {
      await axios.patch("/api/user/update", { status: newStatus });
      setStatus(newStatus);
      // Update user context
      if (data.user) {
        data.user.status = newStatus;
      }
      await data.refetch();
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePhotoClick = () => {
    setIsProfileModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      alert("Please select a valid image file (JPEG, PNG, WebP, or GIF)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "profile");

      const response = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.url) {
        // Update user photoURL
        await axios.patch("/api/user/update", { photoURL: response.data.url });
        setPhotoPreview(response.data.url);
        await data.refetch();
        setIsProfileModalOpen(false);
      }
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      alert(error.response?.data?.error || "Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await axios.patch("/api/user/update", { photoURL: null });
      setPhotoPreview(null);
      await data.refetch();
      setIsProfileModalOpen(false);
    } catch (error) {
      console.error("Error removing photo:", error);
      alert("Failed to remove photo");
    }
  };

  const getStatusConfig = (statusValue: string) => {
    switch (statusValue) {
      case "BULLISH":
        return {
          label: "Bullish",
          icon: FaArrowUp,
          color: "text-green-500",
          bgColor: colorMode === "light" ? "bg-green-50" : "bg-green-900/30",
          borderColor: "border-green-500",
        };
      case "BEARISH":
        return {
          label: "Bearish",
          icon: FaArrowDown,
          color: "text-red-500",
          bgColor: colorMode === "light" ? "bg-red-50" : "bg-red-900/30",
          borderColor: "border-red-500",
        };
      default:
        return {
          label: "Neutral",
          icon: FaMinus,
          color: "text-zinc-500",
          bgColor: colorMode === "light" ? "bg-zinc-100" : "bg-zinc-800",
          borderColor: "border-zinc-500",
        };
    }
  };

  return (
    <div
      className={`
        w-full border-b transition-colors duration-200
        ${colorMode === "light" ? "border-zinc-300" : "border-zinc-700"}
      `}
    >
      {/* Toggle Button (hidden on mobile overlay) */}
      {!hideToggle && (
        <div className={`h-14 border-b flex w-full justify-end ${colorMode === "light" ? "border-zinc-300" : "border-zinc-700"}`}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(!isOpen)}
            className={`
              ${isOpen ? "w-full flex justify-end p-4 items-center" : "w-full flex items-center justify-center p-4"}
              ${
                colorMode === "light"
                  ? "hover:bg-zinc-100 text-zinc-700 active:bg-zinc-200"
                  : "hover:bg-zinc-800/80 text-zinc-200 active:bg-zinc-700/80 border border-transparent hover:border-zinc-600/50"
              }
              cursor-pointer transition-colors duration-200 rounded-lg m-1
            `}
            title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="collapse"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <IoChevronBackOutline className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="expand"
                  initial={{ opacity: 0, rotate: 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <IoChevronForwardOutline className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      )}

      {/* User Avatar */}
      <div className="w-full flex justify-center my-6 px-2">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative cursor-pointer"
          onClick={handlePhotoClick}
          title="Click to change profile picture"
        >
          {loading ? (
            <div
              className={`
                ${isOpen ? "w-20 h-20" : "w-12 h-12"} rounded-full
                ${colorMode === "light" ? "bg-zinc-200" : "bg-zinc-700"}
              `}
            />
          ) : photoPreview || data.user?.photoURL ? (
            <div className={`relative ${isOpen ? "w-20 h-20" : "w-12 h-12"} group`}>
              <div className={`
                ${isOpen ? "w-20 h-20" : "w-12 h-12"} rounded-full border-2 overflow-hidden shadow-lg
                ${colorMode === "light" ? "border-zinc-300" : "border-zinc-500"}
              `}>
                <Image
                  src={photoPreview || data.user?.photoURL || ""}
                  width={isOpen ? 80 : 48}
                  height={isOpen ? 80 : 48}
                  alt="user"
                  className="w-full h-full object-cover"
                />
              </div>
              {isOpen && (
                <>
                  <div className={`
                    absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity
                    flex items-center justify-center
                  `}>
                    <FaCamera className="text-white text-sm" />
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`
                      absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2
                      ${colorMode === "light" ? "bg-green-500 border-white" : "bg-green-500 border-zinc-900"}
                    `}
                  />
                </>
              )}
            </div>
          ) : (
            <div
              className={`
                ${isOpen ? "w-20 h-20 text-2xl" : "w-12 h-12 text-lg"} rounded-full flex items-center justify-center font-bold
                shadow-lg border-2 group cursor-pointer
                ${
                  colorMode === "light"
                    ? "bg-gradient-to-br from-zinc-700 to-zinc-900 border-zinc-300 text-white"
                    : "bg-gradient-to-br from-zinc-300 to-zinc-100 border-zinc-500 text-zinc-900"
                }
              `}
            >
              {data.user?.firstName?.[0]?.toUpperCase() || "U"}
              {isOpen && data.user?.lastName?.[0]?.toUpperCase()}
              {isOpen && (
                <div className={`
                  absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity
                  flex items-center justify-center
                `}>
                  <FaCamera className="text-white text-sm" />
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* User Info */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full flex flex-col justify-center items-center mb-6 px-4 overflow-hidden"
          >
            {loading ? (
              <div className="w-full flex flex-col items-center gap-2">
                <Skeleton width="w-3/4" hieght="h-4" />
                <Skeleton width="w-1/2" hieght="h-3" />
              </div>
            ) : (
              <>
                <h6
                  className={`
                    text-sm font-bold capitalize mb-2 text-center
                    ${colorMode === "light" ? "text-zinc-900" : "text-white"}
                  `}
                >
                  {fullName}
                </h6>
                {(() => {
                  const statusConfig = getStatusConfig(status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div
                      onClick={isOpen ? handleStatusClick : undefined}
                      className={`
                        ${isOpen ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
                        text-xs px-3 py-1.5 rounded-full text-center border
                        ${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor}
                        ${isUpdatingStatus ? "opacity-50 cursor-not-allowed" : ""}
                        flex items-center justify-center gap-1.5
                      `}
                      title={isOpen ? "Click to change status" : undefined}
                    >
                      <StatusIcon className="h-3 w-3" />
                      <span>{statusConfig.label}</span>
                    </div>
                  );
                })()}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Picture Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Change Profile Picture"
      >
        <div className="space-y-4">
          {photoPreview || data.user?.photoURL ? (
            <div className="flex flex-col items-center space-y-4">
              <div className={`relative w-32 h-32 rounded-full overflow-hidden border-2 ${
                colorMode === "light" ? "border-zinc-300" : "border-zinc-600"
              }`}>
                <Image
                  src={photoPreview || data.user?.photoURL || ""}
                  width={128}
                  height={128}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <FaCamera className="mr-2" />
                  Change Photo
                </Button>
                <Button
                  variant="danger"
                  onClick={handleRemovePhoto}
                  disabled={isUploading}
                >
                  <FaTimes className="mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-zinc-500 to-zinc-800 flex items-center justify-center text-white text-4xl font-bold">
                {data.user?.firstName?.[0]?.toUpperCase() || "U"}
                {data.user?.lastName?.[0]?.toUpperCase()}
              </div>
              <Button
                variant="primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <FaCamera className="mr-2" />
                Upload Photo
              </Button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {isUploading && (
            <div className={`text-center text-sm ${
              colorMode === "light" ? "text-zinc-500" : "text-zinc-400"
            }`}>
              Uploading...
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default UserDetails;
