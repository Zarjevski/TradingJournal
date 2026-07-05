import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/app/actions/getCurrentUser", () => ({
  default: vi.fn(),
}));

import { GET } from "./route";
import getCurrentUser from "@/app/actions/getCurrentUser";

const originalFetch = global.fetch;

describe("GET /api/market/symbols", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns 401 when there is no authenticated user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  // Runs before the success test below so the module-level cache is still
  // empty — otherwise a cached result from a prior test would mask the
  // fallback path entirely.
  it("falls back to the bundled static list when Binance is unreachable", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    global.fetch = vi.fn().mockRejectedValue(new Error("network error")) as any;

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe("fallback");
    expect(Array.isArray(body.symbols)).toBe(true);
    expect(body.symbols.length).toBeGreaterThan(0);
  });

  it("returns deduped USDT-tradeable base assets from Binance", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        symbols: [
          { symbol: "BTCUSDT", status: "TRADING", baseAsset: "BTC", quoteAsset: "USDT", isSpotTradingAllowed: true },
          { symbol: "ETHUSDT", status: "TRADING", baseAsset: "ETH", quoteAsset: "USDT", isSpotTradingAllowed: true },
          // Not USDT-quoted — should be excluded
          { symbol: "BTCBUSD", status: "TRADING", baseAsset: "BTC", quoteAsset: "BUSD", isSpotTradingAllowed: true },
          // Not trading — should be excluded
          { symbol: "OLDUSDT", status: "BREAK", baseAsset: "OLD", quoteAsset: "USDT", isSpotTradingAllowed: true },
          // Spot not allowed — should be excluded
          { symbol: "FUTUSDT", status: "TRADING", baseAsset: "FUT", quoteAsset: "USDT", isSpotTradingAllowed: false },
        ],
      }),
    }) as any;

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe("binance");
    expect(body.symbols).toEqual([
      { value: "BTC", label: "Bitcoin" },
      { value: "ETH", label: "Ethereum" },
    ]);
  });
});
