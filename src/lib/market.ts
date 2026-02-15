/**
 * Market data utilities for candles API and charting.
 * Used by /api/market/candles and Trade Details / Team Room chart UIs.
 */

export const ALLOWED_TF = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
export type Timeframe = (typeof ALLOWED_TF)[number];

export const ALLOWED_MARKETS = ["crypto", "fx", "stocks"] as const;
export type Market = (typeof ALLOWED_MARKETS)[number];

/** Convert Date or ISO string to unix seconds (required by Lightweight Charts). */
export function toUnixSec(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  return Math.floor(d.getTime() / 1000);
}

/** Range keys for "last 1D / 1W / 1M" selection. */
export type RangeKey = "1D" | "1W" | "1M";

/**
 * Compute from/to unix seconds for a range ending at `endTime` (default now).
 */
export function computeRange(
  rangeKey: RangeKey,
  endTime: Date = new Date()
): { from: number; to: number } {
  const to = Math.floor(endTime.getTime() / 1000);
  const now = endTime.getTime();
  let fromMs: number;

  switch (rangeKey) {
    case "1D":
      fromMs = now - 24 * 60 * 60 * 1000;
      break;
    case "1W":
      fromMs = now - 7 * 24 * 60 * 60 * 1000;
      break;
    case "1M":
      fromMs = now - 30 * 24 * 60 * 60 * 1000;
      break;
    default:
      fromMs = now - 24 * 60 * 60 * 1000;
  }

  const from = Math.floor(fromMs / 1000);
  return { from, to };
}

/**
 * Normalize symbol for Binance (e.g. "BTC" -> "BTCUSDT", "BTCUSDT" -> "BTCUSDT").
 */
export function normalizeSymbolForBinance(symbol: string): string {
  const s = symbol.trim().toUpperCase();
  if (!s) return "BTCUSDT";
  if (s.endsWith("USDT") || s.endsWith("BUSD")) return s;
  return `${s}USDT`;
}

/**
 * Map our tf param to Binance klines interval.
 * @see https://binance-docs.github.io/apidocs/spot/en/#kline-candlestick-data
 */
export function mapTfToBinance(tf: string): string {
  const map: Record<string, string> = {
    "1m": "1m",
    "5m": "5m",
    "15m": "15m",
    "1h": "1h",
    "4h": "4h",
    "1d": "1d",
  };
  return map[tf] ?? "15m";
}

/** Lightweight Charts candle format (time in unix seconds). */
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/** Volume series item for Lightweight Charts. */
export interface VolumeBar {
  time: number;
  value: number;
}

/** Marker for entry/exit on chart. */
export interface ChartMarker {
  time: number;
  position: "aboveBar" | "belowBar";
  color: string;
  shape: "arrowUp" | "arrowDown" | "circle";
  text?: string;
}

export function isAllowedTf(tf: string): tf is Timeframe {
  return ALLOWED_TF.includes(tf as Timeframe);
}

export function isAllowedMarket(market: string): market is Market {
  return ALLOWED_MARKETS.includes(market as Market);
}
