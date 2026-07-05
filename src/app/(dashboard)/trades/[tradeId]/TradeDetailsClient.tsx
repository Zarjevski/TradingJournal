"use client";

import React, { useState, useEffect, useRef } from "react";
import { useColorMode } from "@/context/ColorModeContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { FaSpinner, FaUndo, FaTrash, FaArrowLeft } from "react-icons/fa";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/common/ConfirmModal";
import Image from "next/image";
import showNotification from "@/hooks/useShowNotification";
import { useUserContext } from "@/context/UserContext";
import TVChart from "@/components/charts/TVChart";
import { computeRange, toUnixSec, normalizeSymbolForBinance } from "@/lib/market";
import type { TVCandle, TVVolumeBar, TVMarker } from "@/components/charts/TVChart";
import { getStatusBadgeClass, formatStatusLabel } from "@/lib/tradeStatus";
import { formatSimpleDate } from "@/lib/dateFormat";

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
  content: string;
  createdAt: string;
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
  const { refetch: refetchUser } = useUserContext();
  const [trade, setTrade] = useState<Trade>(initialTrade);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
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

  const [chartTf, setChartTf] = useState<"15m" | "1h" | "4h" | "1d">("15m");
  const [chartRange, setChartRange] = useState<"1D" | "1W" | "1M">("1W");
  const [chartCandles, setChartCandles] = useState<TVCandle[]>([]);
  const [chartVolume, setChartVolume] = useState<TVVolumeBar[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const symbol = normalizeSymbolForBinance(trade.symbol);
    const { from, to } = computeRange(chartRange);

    setChartLoading(true);
    setChartError(null);
    fetch(
      `/api/market/candles?market=crypto&symbol=${encodeURIComponent(symbol)}&tf=${chartTf}&from=${from}&to=${to}`
    )
      .then((res) => {
        if (!res.ok) return res.json().then((b) => Promise.reject(new Error(b.error ?? "Failed to fetch")));
        return res.json();
      })
      .then((data: Array<{ time: number; open: number; high: number; low: number; close: number; volume?: number }>) => {
        if (cancelled) return;
        setChartCandles(data.map((c) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })));
        setChartVolume(
          data.filter((c) => c.volume != null).map((c) => ({ time: c.time, value: c.volume! }))
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setChartError(err.message ?? "Failed to load chart");
          setChartCandles([]);
          setChartVolume([]);
        }
      })
      .finally(() => {
        if (!cancelled) setChartLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [trade.symbol, chartTf, chartRange]);

  const chartMarkers: TVMarker[] = (() => {
    const t = toUnixSec(trade.date);
    const isLong = trade.position.toUpperCase() === "LONG";
    return [
      {
        time: t,
        position: isLong ? "belowBar" : "aboveBar",
        color: isLong ? "#22c55e" : "#ef4444",
        shape: isLong ? "arrowUp" : "arrowDown",
        text: "Entry",
      },
    ];
  })();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    if (["WIN", "LOSS"].includes(formData.status) && resultNum === 0) {
      newErrors.result = "Result cannot be 0 when status is WIN or LOSS";
    }

    if (formData.status === "BREAK_EVEN" && resultNum !== 0) {
      newErrors.result = "Result must be 0 when status is BREAK_EVEN";
    }

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
      let resultNum = parseInt(formData.result, 10);
      if (formData.status === "LOSS" && !isNaN(resultNum) && resultNum > 0) {
        resultNum = -resultNum;
      }

      const updateData: any = {
        symbol: formData.symbol.trim(),
        position: formData.position,
        margin: formData.margin,
        date: new Date(formData.date).toISOString(),
        status: formData.status,
        size: parseInt(formData.size, 10),
        reason: formData.reason.trim(),
        result: resultNum,
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await axios.delete("/api/trades/delete", { data: { id: trade.id } });
      showNotification("Trade deleted", "Success");
      await refetchUser();
      router.push("/trades");
    } catch (error: any) {
      const msg = error.response?.data?.error || "Failed to delete trade";
      showNotification(msg, "Error");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleAddComment = async () => {
    const content = newComment.trim();
    if (!content) {
      setCommentError("Comment cannot be empty");
      return;
    }

    setIsSubmittingComment(true);
    setCommentError(null);
    try {
      const response = await axios.post(`/api/trades/${trade.id}/comments`, {
        content,
      });

      setTrade((prev) => ({
        ...prev,
        comments: [response.data, ...prev.comments],
      }));
      setNewComment("");
    } catch (error: any) {
      setCommentError(error.response?.data?.error || "Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleQuickAction = async (action: "WIN" | "LOSS" | "PENDING" | "BREAK_EVEN") => {
    setIsSaving(true);
    try {
      const updateData: any = {
        status: action,
      };

      if (action === "BREAK_EVEN") {
        updateData.result = 0;
      } else if (action === "LOSS" && trade.result > 0) {
        updateData.result = -trade.result;
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

  const borderColor = colorMode === "light" ? "border-zinc-200" : "border-zinc-800";
  const mutedText = colorMode === "light" ? "text-gray-500" : "text-gray-400";
  const selectClass = (hasError?: string) =>
    `w-full px-4 py-2.5 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
      hasError
        ? "border-red-500 focus:ring-red-500"
        : colorMode === "light"
        ? "bg-white border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500 text-gray-900"
        : "bg-zinc-800 border-zinc-700 focus:border-zinc-400 focus:ring-zinc-400 text-white"
    }`;
  const labelClass = `block mb-2 text-sm font-semibold ${colorMode === "light" ? "text-gray-700" : "text-gray-300"}`;
  const avatarFallback = colorMode === "light" ? "bg-zinc-200 text-gray-700" : "bg-zinc-700 text-gray-200";

  return (
    <div className="min-h-screen w-full app-bg">
      <div className="w-full h-full p-4 sm:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-[1600px] mx-auto">
        <Link
          href="/trades"
          className={`inline-flex items-center gap-2 text-sm ${mutedText} hover:underline`}
        >
          <FaArrowLeft /> Back to all trades
        </Link>

        <PageHeader
          title={trade.symbol}
          subtitle={`${trade.exchange?.exchangeName ?? trade.exchangeName} · ${formatSimpleDate(trade.date)}`}
          actions={
            <>
              <Badge className={getStatusBadgeClass(trade.status)}>
                {formatStatusLabel(trade.status)}
              </Badge>
              <Button
                onClick={() => setShowDeleteModal(true)}
                variant="secondary"
                leftIcon={<FaTrash />}
                className="text-red-500 hover:text-red-600"
              >
                Delete Trade
              </Button>
            </>
          }
        />

        {/* Chart */}
        <Card className={`app-surface ${borderColor} border`}>
          <h2 className="text-lg font-semibold mb-4">Chart</h2>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`text-sm font-medium ${mutedText}`}>Timeframe:</span>
            {(["15m", "1h", "4h", "1d"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setChartTf(tf)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  chartTf === tf
                    ? colorMode === "light"
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-900"
                    : colorMode === "light"
                    ? "bg-zinc-100 text-gray-700 hover:bg-zinc-200"
                    : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"
                }`}
              >
                {tf}
              </button>
            ))}
            <span className={`text-sm font-medium ml-2 ${mutedText}`}>Range:</span>
            {(["1D", "1W", "1M"] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setChartRange(range)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  chartRange === range
                    ? colorMode === "light"
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-900"
                    : colorMode === "light"
                    ? "bg-zinc-100 text-gray-700 hover:bg-zinc-200"
                    : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          {chartError && <p className="text-sm text-red-500 mb-2">{chartError}</p>}
          <TVChart
            candles={chartCandles}
            volume={chartVolume}
            markers={chartMarkers}
            height={420}
            loading={chartLoading}
          />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-4 md:gap-6">
          {/* Left column */}
          <div className="space-y-4 md:space-y-6">
            {trade.exchange && (
              <Card className={`app-surface ${borderColor} border`}>
                <h2 className="text-lg font-semibold mb-4">Exchange</h2>
                <div className="flex items-center gap-4">
                  <Image
                    src={trade.exchange.image}
                    alt={trade.exchange.exchangeName}
                    width={56}
                    height={56}
                    className="rounded-lg shrink-0"
                  />
                  <div className="flex-1 min-w-0 grid grid-cols-2 gap-3">
                    <div>
                      <p className={`text-xs uppercase tracking-wide ${mutedText}`}>Name</p>
                      <p className="font-semibold truncate">{trade.exchange.exchangeName}</p>
                    </div>
                    <div>
                      <p className={`text-xs uppercase tracking-wide ${mutedText}`}>Balance</p>
                      <p className="font-semibold">${trade.exchange.balance.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {trade.trader && (
              <Card className={`app-surface ${borderColor} border`}>
                <h2 className="text-lg font-semibold mb-4">Trader</h2>
                <div className="flex items-center gap-4">
                  {trade.trader.photoURL ? (
                    <Image
                      src={trade.trader.photoURL}
                      alt={`${trade.trader.firstName} ${trade.trader.lastName}`}
                      width={56}
                      height={56}
                      className="rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${avatarFallback}`}>
                      {trade.trader.firstName[0]}{trade.trader.lastName[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 grid grid-cols-2 gap-3">
                    <div>
                      <p className={`text-xs uppercase tracking-wide ${mutedText}`}>Name</p>
                      <p className="font-semibold truncate">{trade.trader.firstName} {trade.trader.lastName}</p>
                    </div>
                    <div>
                      <p className={`text-xs uppercase tracking-wide ${mutedText}`}>Email</p>
                      <p className="font-semibold truncate">{trade.trader.email}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <Card className={`app-surface ${borderColor} border`}>
              <h2 className="text-lg font-semibold mb-4">Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-xs uppercase tracking-wide ${mutedText}`}>Created</p>
                  <p className="font-semibold">{formatSimpleDate(trade.createdAt)}</p>
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-wide ${mutedText}`}>Entry Date</p>
                  <p className="font-semibold">{formatSimpleDate(trade.date)}</p>
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-wide ${mutedText}`}>Position</p>
                  <p className="font-semibold">{trade.position}</p>
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-wide ${mutedText}`}>Margin</p>
                  <p className="font-semibold">{trade.margin}</p>
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-wide ${mutedText}`}>Size</p>
                  <p className="font-semibold">${trade.size.toLocaleString()}</p>
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-wide ${mutedText}`}>Status</p>
                  <Badge className={getStatusBadgeClass(trade.status)}>
                    {formatStatusLabel(trade.status)}
                  </Badge>
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-wide ${mutedText}`}>Result (P/L)</p>
                  <p className={`font-semibold ${trade.result > 0 ? "text-green-500" : trade.result < 0 ? "text-red-500" : ""}`}>
                    ${trade.result.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className={`app-surface ${borderColor} border`}>
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => handleQuickAction("WIN")} disabled={isSaving} variant="primary">
                  Set to WIN
                </Button>
                <Button onClick={() => handleQuickAction("LOSS")} disabled={isSaving} variant="danger">
                  Set to LOSS
                </Button>
                <Button onClick={() => handleQuickAction("PENDING")} disabled={isSaving} variant="secondary">
                  Set to PENDING
                </Button>
                <Button onClick={() => handleQuickAction("BREAK_EVEN")} disabled={isSaving} variant="secondary">
                  Break Even
                </Button>
              </div>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-4 md:space-y-6">
            <Card className={`app-surface ${borderColor} border`}>
              <h2 className="text-lg font-semibold mb-4">Edit Trade</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="text"
                    label={<>Symbol<span className="text-red-500 ml-1">*</span></>}
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    required
                    error={errors.symbol}
                  />

                  <div>
                    <label className={labelClass}>Position</label>
                    <select
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      className={selectClass(errors.position)}
                    >
                      <option value="LONG">LONG</option>
                      <option value="SHORT">SHORT</option>
                    </select>
                    {errors.position && <p className="mt-1 text-sm text-red-500 font-medium">{errors.position}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>Margin</label>
                    <select
                      name="margin"
                      value={formData.margin}
                      onChange={handleInputChange}
                      className={selectClass(errors.margin)}
                    >
                      <option value="ISOLATED">ISOLATED</option>
                      <option value="CROSSED">CROSSED</option>
                    </select>
                    {errors.margin && <p className="mt-1 text-sm text-red-500 font-medium">{errors.margin}</p>}
                  </div>

                  <Input
                    type="datetime-local"
                    label={<>Date<span className="text-red-500 ml-1">*</span></>}
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    error={errors.date}
                  />

                  <div>
                    <label className={labelClass}>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className={selectClass(errors.status)}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="WIN">WIN</option>
                      <option value="LOSS">LOSS</option>
                      <option value="BREAK_EVEN">BREAK_EVEN</option>
                      <option value="CANCELED">CANCELED</option>
                    </select>
                    {errors.status && <p className="mt-1 text-sm text-red-500 font-medium">{errors.status}</p>}
                  </div>

                  <Input
                    type="number"
                    label={<>Size<span className="text-red-500 ml-1">*</span></>}
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

                <div>
                  <label className={labelClass}>Reason</label>
                  <Textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    cols={30}
                    rows={6}
                    placeholder="Trade summary / reason"
                  />
                  {errors.reason && <p className="mt-1 text-sm text-red-500 font-medium">{errors.reason}</p>}
                </div>

                <div>
                  <label className={labelClass}>Image URL</label>
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
                          ? "bg-zinc-100 text-gray-900 hover:bg-zinc-200"
                          : "bg-zinc-800 text-white hover:bg-zinc-700"
                      }`}
                    >
                      Upload Image
                    </label>
                  </div>
                  {formData.imageURL && (
                    <div className={`mt-4 relative w-full h-64 rounded-lg overflow-hidden border ${borderColor}`}>
                      <Image src={formData.imageURL} alt="Trade image" fill className="object-cover" />
                    </div>
                  )}
                </div>

                <div className={`flex justify-end gap-3 pt-4 border-t ${borderColor}`}>
                  <Button onClick={handleReset} disabled={isSaving} variant="secondary" leftIcon={<FaUndo />}>
                    Reset
                  </Button>
                  <Button type="submit" disabled={isSaving} leftIcon={isSaving ? <FaSpinner /> : undefined}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Card>

            <Card className={`app-surface ${borderColor} border`}>
              <h2 className="text-lg font-semibold mb-4">Comments ({trade.comments.length})</h2>

              {trade.comments.length > 0 && (
                <div className="space-y-3 mb-4">
                  {trade.comments.map((comment: Comment) => (
                    <div
                      key={comment.id}
                      className={`p-3 rounded-lg border ${borderColor} ${colorMode === "light" ? "bg-zinc-50" : "bg-zinc-800/50"}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {comment.owner.photoURL ? (
                          <Image
                            src={comment.owner.photoURL}
                            alt={`${comment.owner.firstName} ${comment.owner.lastName}`}
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${avatarFallback}`}>
                            {comment.owner.firstName[0]}{comment.owner.lastName[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-sm">
                            {comment.owner.firstName} {comment.owner.lastName}
                          </p>
                          <p className={`text-xs ${mutedText}`}>{formatSimpleDate(comment.createdAt)}</p>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Textarea
                  placeholder="Add a note about this trade..."
                  rows={3}
                  value={newComment}
                  onChange={(e) => {
                    setNewComment(e.target.value);
                    setCommentError(null);
                  }}
                />
                {commentError && <p className="text-sm text-red-500">{commentError}</p>}
                <Button type="button" variant="secondary" disabled={isSubmittingComment} onClick={handleAddComment}>
                  {isSubmittingComment ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="p-6 app-surface">
          <h2 className="text-xl font-bold mb-4">Delete trade</h2>
          <p className={`mb-4 ${colorMode === "light" ? "text-gray-700" : "text-gray-300"}`}>
            Remove this trade permanently? The exchange balance will be adjusted to reverse this trade&apos;s P/L.
          </p>
          <div className="flex gap-3 justify-end">
            <Button onClick={() => setShowDeleteModal(false)} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              variant="danger"
              leftIcon={isDeleting ? <FaSpinner /> : <FaTrash />}
            >
              {isDeleting ? "Deleting..." : "Delete trade"}
            </Button>
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
};

export default TradeDetailsClient;
