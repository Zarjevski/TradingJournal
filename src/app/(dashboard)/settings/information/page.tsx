"use client";

import React, { useState, useEffect, useRef } from "react";
import { useColorMode } from "@/context/ColorModeContext";
import { MdOutlineFileUpload, MdDelete } from "react-icons/md";
import { FaSpinner } from "react-icons/fa";
import { useUserContext } from "@/context/UserContext";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import axios from "axios";
import { motion } from "framer-motion";
import Skeleton from "@/components/common/Skeleton";
import showNotification from "@/hooks/useShowNotification";

const Page = () => {
  const { colorMode } = useColorMode();
  const { user, isLoading, refetch } = useUserContext();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: session?.user?.email || "",
      });
      // Initialize photoUrl from user's photoURL
      if (user.photoURL) {
        setPhotoUrl(user.photoURL);
        setPhotoPreview(user.photoURL);
      }
    }
  }, [user, session]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showNotification("Please select an image file", "Error");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification("Image size must be less than 5MB", "Error");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    setIsUploadingPhoto(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("type", "profile");

      const response = await axios.post("/api/upload", uploadFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.url) {
        setPhotoUrl(response.data.url);
        showNotification("Profile image uploaded successfully", "Success");
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      showNotification(
        error.response?.data?.error || "Failed to upload image",
        "Error"
      );
      setPhotoPreview(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.patch("/api/user/update", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        photoURL: photoUrl,
      });

      if (response.status === 200) {
        showNotification("Profile updated successfully", "Success");
        await refetch();
        setPhotoPreview(null);
        setPhotoUrl(null);
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      showNotification(
        error.response?.data?.error || "Failed to update profile",
        "Error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoPreview(null);
    setPhotoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    // Update the database to remove photoURL
    try {
      const response = await axios.patch("/api/user/update", {
        photoURL: null,
      });
      
      if (response.status === 200) {
        showNotification("Profile picture removed", "Success");
        await refetch();
      }
    } catch (error: any) {
      console.error("Error removing profile picture:", error);
      showNotification(
        error.response?.data?.error || "Failed to remove profile picture",
        "Error"
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full h-full p-6 overflow-y-auto app-bg"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">User Information</h1>
        <p className={`text-sm ${
          colorMode === "light" ? "text-gray-600" : "text-gray-400"
        }`}>
          Update your personal information and profile picture
        </p>
      </div>

      {/* Profile Picture */}
      <div className="flex items-center justify-center mb-8">
        <div className="relative">
          <div
            className={`relative rounded-full h-32 w-32 border-2 flex items-center justify-center overflow-hidden group ${
              colorMode === "light"
                ? "bg-gray-100 border-gray-300"
                : "bg-gray-700 border-gray-600"
            }`}
          >
            {isLoading ? (
              <Skeleton width="w-full" hieght="h-full" />
            ) : photoPreview || photoUrl || user?.photoURL ? (
              <>
                <Image
                  src={photoPreview || photoUrl || user?.photoURL || ""}
                  alt="Profile"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleRemovePhoto}
                    className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded-full transition-opacity"
                    type="button"
                  >
                    <MdDelete className="text-xl" />
                  </motion.button>
                </div>
              </>
            ) : (
              <div
                className={`w-full h-full flex items-center justify-center text-4xl font-bold ${
                  colorMode === "light" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {user?.firstName?.[0]?.toUpperCase() || "U"}
              </div>
            )}
          </div>
          <label
            htmlFor="photo-upload"
            className={`absolute bottom-0 right-0 p-2 rounded-full border-2 cursor-pointer transition-all ${
              isUploadingPhoto
                ? "opacity-50 cursor-not-allowed"
                : colorMode === "light"
                ? "bg-white border-gray-300 hover:bg-gray-50"
                : "bg-gray-800 border-gray-600 hover:bg-gray-700"
            }`}
          >
            {isUploadingPhoto ? (
              <FaSpinner className="text-lg animate-spin" />
            ) : (
              <MdOutlineFileUpload className="text-lg" />
            )}
            <input
              ref={fileInputRef}
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
              disabled={isUploadingPhoto}
            />
          </label>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="text"
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="Enter your first name"
            required
          />
          <Input
            type="text"
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="Enter your last name"
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${
            colorMode === "light" ? "text-gray-700" : "text-gray-300"
          }`}>
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            disabled
            className={`w-full px-4 py-2 rounded-lg border transition-all duration-200 ${
              colorMode === "light"
                ? "bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gray-700/50 border-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          />
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            text={isSubmitting ? "Saving..." : "Save Changes"}
            onClick={() => {}}
            disabled={isSubmitting || isLoading}
            type="submit"
          />
        </div>
      </form>
    </motion.div>
  );
};

export default Page;
