import React, { useState, useRef } from "react";
import { useColorMode } from "@chakra-ui/react";
import SearchableSelect from "../common/SearchableSelect";
import RadioGroup from "../common/RadioGroup";
import Input from "../common/Input";
import Button from "../common/Button";
import { MdDelete, MdImage } from "react-icons/md";
import { FaSpinner, FaArrowUp, FaArrowDown, FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";
import TextArea from "../common/TextArea";
import Image from "next/image";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import showNotification from "@/hooks/useShowNotification";
import cryptocurrenciesData from "@/data/cryptocurrencies.json";

const cryptocurrencies = cryptocurrenciesData as Array<{ symbol: string; name: string }>;

const TradeDetails = ({
  setFormData,
  formData,
}: {
  setFormData: any;
  formData: any;
}) => {
  const { colorMode } = useColorMode();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    setIsUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("type", "trade");

      const response = await axios.post("/api/upload", uploadFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.url) {
        setImageUrl(response.data.url);
        setFormData({ ...formData, imageURL: response.data.url });
        showNotification("Image uploaded successfully", "Success");
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      showNotification(
        error.response?.data?.error || "Failed to upload image",
        "Error"
      );
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageUrl(null);
    setFormData({ ...formData, imageURL: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Convert cryptocurrencies to options format
  const symbolOptions = cryptocurrencies.map((crypto) => ({
    value: crypto.symbol,
    label: crypto.name,
  }));

  const positionOptions = [
    { value: "long", label: "Long", icon: <FaArrowUp /> },
    { value: "short", label: "Short", icon: <FaArrowDown /> },
  ];

  const statusOptions = [
    { value: "win", label: "Win", icon: <FaCheckCircle /> },
    { value: "loss", label: "Loss", icon: <FaTimesCircle /> },
    { value: "pending", label: "Pending", icon: <FaClock /> },
  ];

  return (
    <section className="p-6 space-y-6">
      {/* Symbol and Position */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchableSelect
          label="Symbol"
          options={symbolOptions}
          value={formData.symbol}
          onChange={(value) => setFormData({ ...formData, symbol: value })}
          placeholder="Select cryptocurrency..."
        />
        <RadioGroup
          label="Position"
          options={positionOptions}
          value={formData.position}
          onChange={(value) => setFormData({ ...formData, position: value })}
        />
      </div>

      {/* Size and Margin */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={"size"}
          name={"size"}
          type={"number"}
          placeholder={"amount in dollars"}
          value={formData.size || ""}
          onChange={(e) => setFormData({ ...formData, size: e.target.value })}
        />
        <Input
          label={"contract/margin"}
          name={"margin"}
          type={"number"}
          placeholder={"example 20x"}
          value={formData.margin || ""}
          onChange={(e) => setFormData({ ...formData, margin: e.target.value })}
        />
      </div>

      {/* Status and Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RadioGroup
          label="Status"
          options={statusOptions}
          value={formData.status}
          onChange={(value) => setFormData({ ...formData, status: value })}
        />
        <Input
          type={"date"}
          name={"date"}
          label={"entry date"}
          value={formData.date || ""}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>

      {/* Result */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={"result (P/L)"}
          name={"result"}
          type={"number"}
          placeholder={"profit or loss amount"}
          value={formData.result || ""}
          onChange={(e) => setFormData({ ...formData, result: e.target.value })}
        />
      </div>

      {/* Reason and Image */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextArea
          placeholder="Trade Summary / Reason"
          cols={30}
          rows={8}
          value={formData.reason || ""}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
        />
        
        {/* Image Upload Section */}
        <div className="flex flex-col">
          <label className={`block mb-2 text-sm font-semibold ${
            colorMode === "light" ? "text-gray-700" : "text-gray-300"
          }`}>
            Trade Image (Optional)
          </label>
          <div
            className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
              isUploading
                ? colorMode === "light"
                  ? "border-blue-400 bg-blue-50"
                  : "border-blue-500 bg-blue-900/20"
                : colorMode === "light"
                ? "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                : "border-gray-600 bg-gray-700/50 hover:border-gray-500 hover:bg-gray-700"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="trade-image-upload"
              disabled={isUploading}
            />
            
            <AnimatePresence mode="wait">
              {imagePreview || imageUrl ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative w-full h-full min-h-[200px] rounded-lg overflow-hidden group"
                >
                  <Image
                    src={imagePreview || imageUrl || ""}
                    alt="Trade preview"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleRemoveImage}
                      className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded-full transition-opacity"
                      type="button"
                    >
                      <MdDelete className="text-xl" />
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.label
                  htmlFor="trade-image-upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`flex flex-col items-center justify-center cursor-pointer w-full h-full min-h-[200px] ${
                    isUploading ? "pointer-events-none" : ""
                  }`}
                >
                  {isUploading ? (
                    <FaSpinner className="animate-spin text-4xl text-blue-500 mb-2" />
                  ) : (
                    <MdImage className="text-4xl mb-2" />
                  )}
                  <span className={`text-sm font-medium ${
                    colorMode === "light" ? "text-gray-600" : "text-gray-400"
                  }`}>
                    {isUploading ? "Uploading..." : "Click to upload image"}
                  </span>
                  <span className={`text-xs mt-1 ${
                    colorMode === "light" ? "text-gray-500" : "text-gray-500"
                  }`}>
                    PNG, JPG, WEBP up to 5MB
                  </span>
                </motion.label>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TradeDetails;
