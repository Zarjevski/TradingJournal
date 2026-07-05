import { describe, it, expect } from "vitest";
import {
  toUnixSec,
  computeRange,
  normalizeSymbolForBinance,
  mapTfToBinance,
  isAllowedTf,
  isAllowedMarket,
} from "./market";

describe("toUnixSec", () => {
  it("converts a Date to unix seconds", () => {
    const date = new Date("2026-01-01T00:00:00.000Z");
    expect(toUnixSec(date)).toBe(1767225600);
  });

  it("converts an ISO string to unix seconds", () => {
    expect(toUnixSec("2026-01-01T00:00:00.000Z")).toBe(1767225600);
  });
});

describe("computeRange", () => {
  const end = new Date("2026-01-31T00:00:00.000Z");

  it("computes a 1D range", () => {
    const { from, to } = computeRange("1D", end);
    expect(to - from).toBe(24 * 60 * 60);
  });

  it("computes a 1W range", () => {
    const { from, to } = computeRange("1W", end);
    expect(to - from).toBe(7 * 24 * 60 * 60);
  });

  it("computes a 1M range", () => {
    const { from, to } = computeRange("1M", end);
    expect(to - from).toBe(30 * 24 * 60 * 60);
  });
});

describe("normalizeSymbolForBinance", () => {
  it("appends USDT to a bare symbol", () => {
    expect(normalizeSymbolForBinance("btc")).toBe("BTCUSDT");
  });

  it("leaves an already-suffixed symbol untouched", () => {
    expect(normalizeSymbolForBinance("ethusdt")).toBe("ETHUSDT");
    expect(normalizeSymbolForBinance("ETHBUSD")).toBe("ETHBUSD");
  });

  it("falls back to BTCUSDT for an empty symbol", () => {
    expect(normalizeSymbolForBinance("   ")).toBe("BTCUSDT");
  });
});

describe("mapTfToBinance", () => {
  it("maps known timeframes", () => {
    expect(mapTfToBinance("1h")).toBe("1h");
  });

  it("falls back to 15m for unknown timeframes", () => {
    expect(mapTfToBinance("bogus")).toBe("15m");
  });
});

describe("isAllowedTf / isAllowedMarket", () => {
  it("accepts allowed values", () => {
    expect(isAllowedTf("1d")).toBe(true);
    expect(isAllowedMarket("crypto")).toBe(true);
  });

  it("rejects disallowed values", () => {
    expect(isAllowedTf("1y")).toBe(false);
    expect(isAllowedMarket("commodities")).toBe(false);
  });
});
