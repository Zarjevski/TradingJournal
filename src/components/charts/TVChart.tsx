"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { createChart, IChartApi, ISeriesApi, ColorType } from "lightweight-charts";
import { useColorMode } from "@/context/ColorModeContext";

export interface TVCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface TVVolumeBar {
  time: number;
  value: number;
}

export interface TVMarker {
  time: number;
  position: "aboveBar" | "belowBar";
  color: string;
  shape: "arrowUp" | "arrowDown" | "circle";
  text?: string;
}

interface TVChartProps {
  candles: TVCandle[];
  volume?: TVVolumeBar[];
  markers?: TVMarker[];
  height?: number;
  /** When true, show loading overlay. */
  loading?: boolean;
}

const CHART_HEIGHT_DEFAULT = 420;

export default function TVChart({
  candles,
  volume = [],
  markers = [],
  height = CHART_HEIGHT_DEFAULT,
  loading = false,
}: TVChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";

  const cleanup = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    candleSeriesRef.current = null;
    volumeSeriesRef.current = null;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const container = containerRef.current;
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? "#0f172a" : "#ffffff" },
        textColor: isDark ? "#e2e8f0" : "#1e293b",
      },
      grid: {
        vertLines: { color: isDark ? "#334155" : "#e2e8f0" },
        horzLines: { color: isDark ? "#334155" : "#e2e8f0" },
      },
      width: container.clientWidth,
      height,
      rightPriceScale: {
        borderColor: isDark ? "#475569" : "#cbd5e1",
        scaleMargins: {
          top: 0.1,
          bottom: volume.length > 0 ? 0.2 : 0.1,
        },
      },
      timeScale: {
        borderColor: isDark ? "#475569" : "#cbd5e1",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderDownColor: "#ef4444",
      borderUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      wickUpColor: "#22c55e",
    });

    candleSeriesRef.current = candleSeries;

    if (volume.length > 0) {
      const volSeries = chart.addHistogramSeries({
        color: "#26a69a",
        priceFormat: {
          type: "volume",
        },
        priceScaleId: "",
      });
      volSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
      volumeSeriesRef.current = volSeries;
    }

    chartRef.current = chart;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries.length || !chartRef.current) return;
      const { width } = entries[0].contentRect;
      chartRef.current.applyOptions({ width });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      cleanup();
    };
  }, [height, isDark, volume.length, cleanup]);

  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    if (!candleSeries || !chartRef.current) return;

    const formatted = candles.map((c) => ({
      time: c.time as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeries.setData(formatted);

    if (markers.length > 0) {
      candleSeries.setMarkers(
        markers.map((m) => ({
          time: m.time as any,
          position: m.position as any,
          color: m.color,
          shape: m.shape as any,
          text: m.text,
        }))
      );
    } else {
      candleSeries.setMarkers([]);
    }
  }, [candles, markers]);

  useEffect(() => {
    const volSeries = volumeSeriesRef.current;
    if (!volSeries || volume.length === 0) return;

    const formatted = volume.map((v) => ({
      time: v.time as any,
      value: v.value,
      color: "#26a69a",
    }));
    volSeries.setData(formatted);
  }, [volume]);

  const empty = !candles.length;
  const borderClass = isDark ? "border-gray-700" : "border-gray-300";
  const bgClass = isDark ? "bg-slate-900" : "bg-white";

  return (
    <div className={`relative w-full rounded-lg overflow-hidden border ${borderClass} ${bgClass}`}>
      <div
        ref={containerRef}
        style={{ height: `${height}px` }}
        className="w-full"
      />
      {loading && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${isDark ? "bg-slate-900/80 text-slate-300" : "bg-white/90 text-gray-600"}`}
          style={{ height: `${height}px` }}
        >
          <div className="font-medium">Loading chart…</div>
        </div>
      )}
      {!loading && empty && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${isDark ? "bg-slate-900/80 text-slate-400" : "bg-white/90 text-gray-500"}`}
          style={{ height: `${height}px` }}
        >
          No candle data for this symbol and range.
        </div>
      )}
    </div>
  );
}
