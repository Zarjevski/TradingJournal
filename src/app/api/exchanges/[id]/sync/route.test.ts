import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/actions/getCurrentUser", () => ({
  default: vi.fn(),
}));

const mockFetchBalance = vi.fn();
const mockFetchMyTrades = vi.fn();

vi.mock("ccxt", () => ({
  default: {
    binance: vi.fn().mockImplementation(function MockBinance(this: any) {
      this.fetchBalance = mockFetchBalance;
      this.fetchMyTrades = mockFetchMyTrades;
    }),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    exchange: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    trade: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/encryption", () => ({
  encrypt: vi.fn((s: string) => `encrypted(${s})`),
  decrypt: vi.fn((s: string) => s.replace(/^encrypted\(/, "").replace(/\)$/, "")),
}));

import { POST } from "./route";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { prisma } from "@/lib/prisma";

const VALID_EXCHANGE_ID = "507f1f77bcf86cd799439011";
const params = Promise.resolve({ id: VALID_EXCHANGE_ID });

function makeRequest(body: unknown) {
  return new Request(`http://localhost/api/exchanges/${VALID_EXCHANGE_ID}/sync`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/exchanges/[id]/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchBalance.mockResolvedValue({ total: { USDT: 1234.5 } });
    mockFetchMyTrades.mockResolvedValue([]);
  });

  it("returns 400 for a malformed exchange id", async () => {
    const response = await POST(makeRequest({}), {
      params: Promise.resolve({ id: "not-an-object-id" }),
    });
    expect(response.status).toBe(400);
  });

  it("returns 401 when there is no authenticated user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const response = await POST(makeRequest({}), { params });
    expect(response.status).toBe(401);
  });

  it("returns 404 when the exchange doesn't exist", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.exchange.findUnique).mockResolvedValue(null);
    const response = await POST(makeRequest({}), { params });
    expect(response.status).toBe(404);
  });

  it("returns 403 when the exchange belongs to a different user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.exchange.findUnique).mockResolvedValue({
      id: VALID_EXCHANGE_ID,
      traderID: "someone-else",
    } as any);
    const response = await POST(makeRequest({}), { params });
    expect(response.status).toBe(403);
  });

  it("returns 400 when connecting fresh without both apiKey and apiSecret", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.exchange.findUnique).mockResolvedValue({
      id: VALID_EXCHANGE_ID,
      traderID: "user-1",
      apiKeyEncrypted: null,
      apiSecretEncrypted: null,
    } as any);
    const response = await POST(makeRequest({ apiKey: "only-key" }), { params });
    expect(response.status).toBe(400);
  });

  it("returns 400 when no credentials are provided and none are stored", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.exchange.findUnique).mockResolvedValue({
      id: VALID_EXCHANGE_ID,
      traderID: "user-1",
      apiKeyEncrypted: null,
      apiSecretEncrypted: null,
    } as any);
    const response = await POST(makeRequest({}), { params });
    expect(response.status).toBe(400);
  });

  it("returns 400 when Binance rejects the credentials", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.exchange.findUnique).mockResolvedValue({
      id: VALID_EXCHANGE_ID,
      traderID: "user-1",
      exchangeName: "Binance",
    } as any);
    mockFetchBalance.mockRejectedValue(new Error("Invalid API-key"));

    const response = await POST(
      makeRequest({ apiKey: "bad-key", apiSecret: "bad-secret" }),
      { params }
    );
    expect(response.status).toBe(400);
  });

  it("connects, stores encrypted credentials, and updates the balance with no symbols given", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.exchange.findUnique).mockResolvedValue({
      id: VALID_EXCHANGE_ID,
      traderID: "user-1",
      exchangeName: "Binance",
    } as any);

    const response = await POST(
      makeRequest({ apiKey: "my-key", apiSecret: "my-secret" }),
      { params }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.connected).toBe(true);
    expect(body.balanceUsdt).toBe(1235); // rounded from 1234.5
    expect(body.tradesImported).toBe(0);
    expect(prisma.exchange.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          apiKeyEncrypted: "encrypted(my-key)",
          apiSecretEncrypted: "encrypted(my-secret)",
          balance: 1235,
        }),
      })
    );
  });

  it("imports new trades for the requested symbol and skips ones already stored", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.exchange.findUnique).mockResolvedValue({
      id: VALID_EXCHANGE_ID,
      traderID: "user-1",
      exchangeName: "Binance",
      apiKeyEncrypted: "encrypted(stored-key)",
      apiSecretEncrypted: "encrypted(stored-secret)",
    } as any);
    mockFetchMyTrades.mockResolvedValue([
      { id: "t1", timestamp: 1735689600000, symbol: "BTC/USDT", side: "buy", amount: 0.01, cost: 650 },
      { id: "t2", timestamp: 1735689700000, symbol: "BTC/USDT", side: "sell", amount: 0.01, cost: 660 },
    ]);
    vi.mocked(prisma.trade.findFirst)
      .mockResolvedValueOnce(null) // t1 is new
      .mockResolvedValueOnce({ id: "existing-trade" } as any); // t2 already imported

    const response = await POST(makeRequest({ symbols: ["BTC/USDT"] }), { params });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.tradesImported).toBe(1);
    expect(body.tradesSkipped).toBe(1);
    expect(prisma.trade.create).toHaveBeenCalledTimes(1);
    expect(prisma.trade.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ externalId: "t1", exchangeID: VALID_EXCHANGE_ID }),
      })
    );
  });

  it("rejects more than the maximum number of symbols per sync", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.exchange.findUnique).mockResolvedValue({
      id: VALID_EXCHANGE_ID,
      traderID: "user-1",
      apiKeyEncrypted: "encrypted(k)",
      apiSecretEncrypted: "encrypted(s)",
    } as any);

    const tooManySymbols = Array.from({ length: 11 }, (_, i) => `SYM${i}/USDT`);
    const response = await POST(makeRequest({ symbols: tooManySymbols }), { params });
    expect(response.status).toBe(400);
  });
});
