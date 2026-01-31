"use client";

import React, { useState, useEffect, useRef } from "react";
import { useColorMode } from "@/context/ColorModeContext";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import { FaSpinner, FaCheckCircle, FaTimesCircle, FaClock, FaUndo } from "react-icons/fa";
import Input from "@/components/common/Input";
import TextArea from "@/components/common/TextArea";
import Button from "@/components/common/Button";
import Badge from "@/components/common/Badge";
import Image from "next/image";
import showNotification from "@/hooks/useShowNotification";
import styles from "./TradeDetails.module.css";

interface Exchange {
  id: string;
  exchangeName: string;
  image: string;
  balance: number;
}

interface Trader {
  id: string;
  firstName: string;
  lastName: string;
  photoURL: string | null;
  email: string;
}

interface CommentOwner {
  id: string;
  firstName: string;
  lastName: string;
  photoURL: string | null;
}

interface Comment {
  id: string;
  owner: CommentOwner;
}

interface Trade {
  id: string;
  symbol: string;
  position: string;
  margin: string;
  date: string;
  status: string;
  size: number;
  reason: string;
  result: number;
  imageURL: string | null;
  exchangeName: string;
  createdAt: string;
  exchange: Exchange;
  trader: Trader;
  comments: Comment[];
}

interface TradeDetailsClientProps {
  trade: Trade;
}

const TradeDetailsClient: React.FC<TradeDetailsClientProps> = ({ trade: initialTrade }) => {
  const { colorMode } = useColorMode();
  const router = useRouter();
  const [trade, setTrade] = useState<Trade>(initialTrade);
  const [formData, setFormData] = useState({
    symbol: initialTrade.symbol,
    position: initialTrade.position.toUpperCase(),
    margin: initialTrade.margin.toUpperCase(),
    date: new Date(initialTrade.date).toISOString().slice(0, 16),
    status: initialTrade.status.toUpperCase(),
    size: initialTrade.size.toString(),
    reason: initialTrade.reason,
    result: initialTrade.result.toString(),
    imageURL: initialTrade.imageURL || "",
  });
  const [originalFormData, setOriginalFormData] = useState(formData);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    if (s === "WIN") return "bg-green-500";
    if (s === "LOSS") return "bg-red-500";
    if (s === "PENDING") return "bg-yellow-500";
    if (s === "BREAK_EVEN") return colorMode === "light" ? "bg-blue-500" : "bg-purple-500";
    if (s === "CANCELED") return "bg-gray-500";
    return "bg-gray-500";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const symbol = formData.symbol.trim();
    if (symbol.length === 0 || symbol.length > 30) {
      newErrors.symbol = "Symbol must be between 1 and 30 characters";
    }

    if (!["LONG", "SHORT"].includes(formData.position)) {
      newErrors.position = "Position must be LONG or SHORT";
    }

    if (!["ISOLATED", "CROSSED"].includes(formData.margin)) {
      newErrors.margin = "Margin must be ISOLATED or CROSSED";
    }

    if (!["PENDING", "WIN", "LOSS", "BREAK_EVEN", "CANCELED"].includes(formData.status)) {
      newErrors.status = "Invalid status";
    }

    const sizeNum = parseInt(formData.size, 10);
    if (isNaN(sizeNum) || sizeNum < 0) {
      newErrors.size = "Size must be a non-negative number";
    }

    const resultNum = parseInt(formData.result, 10);
    if (isNaN(resultNum)) {
      newErrors.result = "Result must be a valid number";
    }

    const reason = formData.reason.trim();
    if (reason.length < 2) {
      newErrors.reason = "Reason must be at least 2 characters";
    }

    // Cross-field validation
    if (["WIN", "LOSS"].includes(formData.status) && resultNum === 0) {
      newErrors.result = "Result cannot be 0 when status is WIN or LOSS";
    }

    if (formData.status === "BREAK_EVEN" && resultNum !== 0) {
      newErrors.result = "Result must be 0 when status is BREAK_EVEN";
    }

    // Validate imageURL if provided
    if (formData.imageURL && formData.imageURL.trim()) {
      try {
        if (!formData.imageURL.startsWith("/") && !formData.imageURL.startsWith("http")) {
          newErrors.imageURL = "Image URL must be a valid URL or relative path";
        }
      } catch {
        newErrors.imageURL = "Invalid image URL format";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showNotification("Please fix the errors in the form", "Validation Error");
      return;
    }

    setIsSaving(true);
    try {
      const updateData: any = {
        symbol: formData.symbol.trim(),
        position: formData.position,
        margin: formData.margin,
        date: new Date(formData.date).toISOString(),
        status: formData.status,
        size: parseInt(formData.size, 10),
        reason: formData.reason.trim(),
        result: parseInt(formData.result, 10),
        imageURL: formData.imageURL.trim() || null,
      };

      const response = await axios.patch(`/api/trades/${trade.id}`, updateData);

      if (response.status === 200) {
        setTrade(response.data);
        setOriginalFormData(formData);
        showNotification("Trade updated successfully", "Success");
        router.refresh();
      }
    } catch (error: any) {
      console.error("Error updating trade:", error);
      const errorMessage = error.response?.data?.error || "Failed to update trade";
      showNotification(errorMessage, "Error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(originalFormData);
    setErrors({});
    showNotification("Form reset to last saved state", "Info");
  };

  const handleQuickAction = async (action: "WIN" | "LOSS" | "PENDING" | "BREAK_EVEN") => {
    setIsSaving(true);
    try {
      const updateData: any = {
        status: action,
      };

      if (action === "BREAK_EVEN") {
        updateData.result = 0;
      }

      const response = await axios.patch(`/api/trades/${trade.id}`, updateData);

      if (response.status === 200) {
        setTrade(response.data);
        setFormData((prev) => ({
          ...prev,
          status: response.data.status.toUpperCase(),
          result: response.data.result.toString(),
        }));
        setOriginalFormData((prev) => ({
          ...prev,
          status: response.data.status.toUpperCase(),
          result: response.data.result.toString(),
        }));
        showNotification(`Trade status set to ${action}`, "Success");
        router.refresh();
      }
    } catch (error: any) {
      console.error("Error updating trade:", error);
      const errorMessage = error.response?.data?.error || "Failed to update trade";
      showNotification(errorMessage, "Error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotification("Please select an image file", "Error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification("Image size must be less than 5MB", "Error");
      return;
    }

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
        setFormData((prev) => ({ ...prev, imageURL: response.data.url }));
        showNotification("Image uploaded successfully", "Success");
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      showNotification(
        error.response?.data?.error || "Failed to upload image",
        "Error"
      );
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{trade.symbol}</h1>
          <Badge
            text={trade.status}
            color={getStatusColor(trade.status)}
            variant="solid"
          />
        </div>
      </div>

      <div className={styles.content}>
        {/* Left Column: Overview + Quick Actions */}
        <div className={styles.leftColumn}>
          {/* Exchange Section */}
          {trade.exchange && (
            <div className={`${styles.card} ${colorMode === "light" ? styles.cardLight : styles.cardDark}`}>
              <h2 className={styles.cardTitle}>Exchange</h2>
              <div className={styles.exchangeSection}>
                <div className={styles.exchangeImage}>
                  <Image
                    src={trade.exchange.image}
                    alt={trade.exchange.exchangeName}
                    width={64}
                    height={64}
                    className={styles.exchangeImage}
                  />
                </div>
                <div className={styles.exchangeInfo}>
                  <div className={styles.overviewItem}>
                    <span className={styles.overviewLabel}>Name</span>
                    <span className={styles.overviewValue}>{trade.exchange.exchangeName}</span>
                  </div>
                  <div className={styles.overviewItem}>
                    <span className={styles.overviewLabel}>Balance</span>
                    <span className={styles.overviewValue}>
                      ${trade.exchange.balance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trader Section */}
          {trade.trader && (
            <div className={`${styles.card} ${colorMode === "light" ? styles.cardLight : styles.cardDark}`}>
              <h2 className={styles.cardTitle}>Trader</h2>
              <div className={styles.traderSection}>
                <div className={styles.traderAvatar}>
                  {trade.trader.photoURL ? (
                    <Image
                      src={trade.trader.photoURL}
                      alt={`${trade.trader.firstName} ${trade.trader.lastName}`}
                      width={64}
                      height={64}
                      className={styles.traderImage}
                    />
                  ) : (
                    <div className={styles.traderInitials}>
                      {trade.trader.firstName[0]}{trade.trader.lastName[0]}
                    </div>
                  )}
                </div>
                <div className={styles.traderInfo}>
                  <div className={styles.overviewItem}>
                    <span className={styles.overviewLabel}>Name</span>
                    <span className={styles.overviewValue}>
                      {trade.trader.firstName} {trade.trader.lastName}
                    </span>
                  </div>
                  <div className={styles.overviewItem}>
                    <span className={styles.overviewLabel}>Email</span>
                    <span className={styles.overviewValue}>{trade.trader.email}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overview Card */}
          <div className={`${styles.card} ${colorMode === "light" ? styles.cardLight : styles.cardDark}`}>
            <h2 className={styles.cardTitle}>Overview</h2>
            <div className={styles.overviewGrid}>
              <div className={styles.overviewItem}>
                <span className={styles.overviewLabel}>Created</span>
                <span className={styles.overviewValue}>
                  {new Date(trade.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.overviewItem}>
                <span className={styles.overviewLabel}>Entry Date</span>
                <span className={styles.overviewValue}>
                  {new Date(trade.date).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.overviewItem}>
                <span className={styles.overviewLabel}>Position</span>
                <span className={styles.overviewValue}>{trade.position}</span>
              </div>
              <div className={styles.overviewItem}>
                <span className={styles.overviewLabel}>Margin</span>
                <span className={styles.overviewValue}>{trade.margin}</span>
              </div>
              <div className={styles.overviewItem}>
                <span className={styles.overviewLabel}>Size</span>
                <span className={styles.overviewValue}>${trade.size.toLocaleString()}</span>
              </div>
              <div className={styles.overviewItem}>
                <span className={styles.overviewLabel}>Status</span>
                <Badge
                  text={trade.status}
                  color={getStatusColor(trade.status)}
                  variant="solid"
                />
              </div>
              <div className={styles.overviewItem}>
                <span className={styles.overviewLabel}>Result (P/L)</span>
                <span
                  className={`${styles.overviewValue} ${
                    trade.result > 0
                      ? styles.positive
                      : trade.result < 0
                      ? styles.negative
                      : ""
                  }`}
                >
                  ${trade.result.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={`${styles.card} ${colorMode === "light" ? styles.cardLight : styles.cardDark}`}>
            <h2 className={styles.cardTitle}>Quick Actions</h2>
            <div className={styles.quickActions}>
              <Button
                text="Set to WIN"
                onClick={() => handleQuickAction("WIN")}
                disabled={isSaving}
                variant="primary"
                className={styles.quickActionButton}
              />
              <Button
                text="Set to LOSS"
                onClick={() => handleQuickAction("LOSS")}
                disabled={isSaving}
                variant="danger"
                className={styles.quickActionButton}
              />
              <Button
                text="Set to PENDING"
                onClick={() => handleQuickAction("PENDING")}
                disabled={isSaving}
                variant="secondary"
                className={styles.quickActionButton}
              />
              <Button
                text="Break Even (Result = 0)"
                onClick={() => handleQuickAction("BREAK_EVEN")}
                disabled={isSaving}
                variant="secondary"
                className={styles.quickActionButton}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className={styles.rightColumn}>
          <div className={`${styles.card} ${colorMode === "light" ? styles.cardLight : styles.cardDark}`}>
            <h2 className={styles.cardTitle}>Edit Trade</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className={styles.form}
            >
              <div className={styles.formGrid}>
                <Input
                  type="text"
                  label="Symbol"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  required
                  error={errors.symbol}
                />

                <div>
                  <label
                    className={`block mb-2 text-sm font-semibold capitalize transition-colors ${
                      colorMode === "light" ? "text-gray-700" : "text-gray-300"
                    }`}
                  >
                    Position
                  </label>
                  <select
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                      errors.position
                        ? "border-red-500 focus:ring-red-500"
                        : colorMode === "light"
                        ? "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                        : "bg-gray-800 border-gray-600 focus:border-purple-500 focus:ring-purple-500 text-white"
                    }`}
                  >
                    <option value="LONG">LONG</option>
                    <option value="SHORT">SHORT</option>
                  </select>
                  {errors.position && (
                    <p className="mt-1 text-sm text-red-500 font-medium">{errors.position}</p>
                  )}
                </div>

                <div>
                  <label
                    className={`block mb-2 text-sm font-semibold capitalize transition-colors ${
                      colorMode === "light" ? "text-gray-700" : "text-gray-300"
                    }`}
                  >
                    Margin
                  </label>
                  <select
                    name="margin"
                    value={formData.margin}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                      errors.margin
                        ? "border-red-500 focus:ring-red-500"
                        : colorMode === "light"
                        ? "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                        : "bg-gray-800 border-gray-600 focus:border-purple-500 focus:ring-purple-500 text-white"
                    }`}
                  >
                    <option value="ISOLATED">ISOLATED</option>
                    <option value="CROSSED">CROSSED</option>
                  </select>
                  {errors.margin && (
                    <p className="mt-1 text-sm text-red-500 font-medium">{errors.margin}</p>
                  )}
                </div>

                <Input
                  type="datetime-local"
                  label="Date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  error={errors.date}
                />

                <div>
                  <label
                    className={`block mb-2 text-sm font-semibold capitalize transition-colors ${
                      colorMode === "light" ? "text-gray-700" : "text-gray-300"
                    }`}
                  >
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                      errors.status
                        ? "border-red-500 focus:ring-red-500"
                        : colorMode === "light"
                        ? "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                        : "bg-gray-800 border-gray-600 focus:border-purple-500 focus:ring-purple-500 text-white"
                    }`}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="WIN">WIN</option>
                    <option value="LOSS">LOSS</option>
                    <option value="BREAK_EVEN">BREAK_EVEN</option>
                    <option value="CANCELED">CANCELED</option>
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-500 font-medium">{errors.status}</p>
                  )}
                </div>

                <Input
                  type="number"
                  label="Size"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  required
                  error={errors.size}
                />

                <Input
                  type="number"
                  label="Result (P/L)"
                  name="result"
                  value={formData.result}
                  onChange={handleInputChange}
                  error={errors.result}
                />
              </div>

              <div className={styles.formSection}>
                <label
                  className={`block mb-2 text-sm font-semibold capitalize transition-colors ${
                    colorMode === "light" ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  Reason
                </label>
                <TextArea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  cols={30}
                  rows={6}
                  placeholder="Trade summary / reason"
                />
                {errors.reason && (
                  <p className="mt-1 text-sm text-red-500 font-medium">{errors.reason}</p>
                )}
              </div>

              <div className={styles.formSection}>
                <label
                  className={`block mb-2 text-sm font-semibold capitalize transition-colors ${
                    colorMode === "light" ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  Image URL
                </label>
                <Input
                  type="text"
                  name="imageURL"
                  value={formData.imageURL}
                  onChange={handleInputChange}
                  placeholder="/uploads/trades/..."
                  error={errors.imageURL}
                />
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className={`inline-block px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                      colorMode === "light"
                        ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                        : "bg-gray-700 text-white hover:bg-gray-600"
                    }`}
                  >
                    Upload Image
                  </label>
                </div>
                {formData.imageURL && (
                  <div className="mt-4 relative w-full h-64 rounded-lg overflow-hidden border-2 border-gray-300">
                    <Image
                      src={formData.imageURL}
                      alt="Trade image"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              <div className={styles.formActions}>
                <Button
                  text="Reset"
                  onClick={handleReset}
                  disabled={isSaving}
                  variant="secondary"
                  icon={FaUndo}
                />
                <Button
                  text={isSaving ? "Saving..." : "Save Changes"}
                  type="submit"
                  disabled={isSaving}
                  icon={isSaving ? FaSpinner : undefined}
                />
              </div>
            </form>
          </div>

          {/* Comments Section (Read-only) */}
          {trade.comments && trade.comments.length > 0 && (
            <div className={`${styles.card} ${colorMode === "light" ? styles.cardLight : styles.cardDark}`}>
              <h2 className={styles.cardTitle}>Comments ({trade.comments.length})</h2>
              <div className={styles.commentsList}>
                {trade.comments.map((comment: Comment) => (
                  <div key={comment.id} className={styles.comment}>
                    <div className={styles.commentHeader}>
                      {comment.owner.photoURL ? (
                        <Image
                          src={comment.owner.photoURL}
                          alt={`${comment.owner.firstName} ${comment.owner.lastName}`}
                          width={32}
                          height={32}
                          className={styles.commentAvatar}
                        />
                      ) : (
                        <div className={styles.commentAvatarPlaceholder}>
                          {comment.owner.firstName[0]}{comment.owner.lastName[0]}
                        </div>
                      )}
                      <div className={styles.commentOwner}>
                        <span className={styles.commentOwnerName}>
                          {comment.owner.firstName} {comment.owner.lastName}
                        </span>
                        <span className={styles.commentId}>Comment ID: {comment.id}</span>
                      </div>
                    </div>
                    <p className={styles.commentContent}>
                      Comment by {comment.owner.firstName} {comment.owner.lastName}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeDetailsClient;
