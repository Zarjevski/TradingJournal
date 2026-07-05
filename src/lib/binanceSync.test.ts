import { describe, it, expect } from "vitest";
import { mapCcxtTradeToTradeInput, type CcxtTrade } from "./binanceSync";

function makeTrade(overrides: Partial<CcxtTrade> = {}): CcxtTrade {
  return {
    id: "12345",
    timestamp: 1735689600000, // 2025-01-01T00:00:00.000Z
    symbol: "BTC/USDT",
    side: "buy",
    amount: 0.01,
    cost: 650.25,
    ...overrides,
  };
}

describe("mapCcxtTradeToTradeInput", () => {
  it("strips the slash from the CCXT symbol", () => {
    expect(mapCcxtTradeToTradeInput(makeTrade()).symbol).toBe("BTCUSDT");
  });

  it("maps buy to LONG and sell to SHORT", () => {
    expect(mapCcxtTradeToTradeInput(makeTrade({ side: "buy" })).position).toBe("LONG");
    expect(mapCcxtTradeToTradeInput(makeTrade({ side: "sell" })).position).toBe("SHORT");
  });

  it("uses the rounded quote-currency cost as size, not the base-asset amount", () => {
    expect(mapCcxtTradeToTradeInput(makeTrade({ cost: 650.6 })).size).toBe(651);
  });

  it("never returns a negative size even if cost is negative", () => {
    expect(mapCcxtTradeToTradeInput(makeTrade({ cost: -5 })).size).toBe(0);
  });

  it("converts the millisecond timestamp to a Date", () => {
    const result = mapCcxtTradeToTradeInput(makeTrade());
    expect(result.date.toISOString()).toBe("2025-01-01T00:00:00.000Z");
  });

  it("always imports as PENDING with zero result (no cost-basis P&L computed)", () => {
    const result = mapCcxtTradeToTradeInput(makeTrade());
    expect(result.status).toBe("PENDING");
    expect(result.result).toBe(0);
  });

  it("carries the trade id through as externalId for dedup", () => {
    expect(mapCcxtTradeToTradeInput(makeTrade({ id: "abc-123" })).externalId).toBe("abc-123");
  });
});
