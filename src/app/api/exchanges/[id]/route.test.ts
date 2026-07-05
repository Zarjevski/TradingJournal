import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/actions/getCurrentUser", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    exchange: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    trade: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { GET, PATCH, DELETE } from "./route";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { prisma } from "@/lib/prisma";

const VALID_ID = "507f1f77bcf86cd799439011";
const params = Promise.resolve({ id: VALID_ID });

function makeRequest(method: string, body?: unknown) {
  return new Request(`http://localhost/api/exchanges/${VALID_ID}`, {
    method,
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
}

describe("/api/exchanges/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 400 for a malformed id", async () => {
      const response = await GET(makeRequest("GET"), {
        params: Promise.resolve({ id: "not-an-object-id" }),
      });
      expect(response.status).toBe(400);
    });

    it("returns 401 when there is no authenticated user", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);
      const response = await GET(makeRequest("GET"), { params });
      expect(response.status).toBe(401);
    });

    it("returns 404 when the exchange doesn't exist", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
      vi.mocked(prisma.exchange.findUnique).mockResolvedValue(null);

      const response = await GET(makeRequest("GET"), { params });
      expect(response.status).toBe(404);
    });

    it("returns 403 when the exchange belongs to a different user", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
      vi.mocked(prisma.exchange.findUnique).mockResolvedValue({
        id: VALID_ID,
        traderID: "someone-else",
      } as any);

      const response = await GET(makeRequest("GET"), { params });
      expect(response.status).toBe(403);
    });

    it("returns account details with computed stats", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
      vi.mocked(prisma.exchange.findUnique).mockResolvedValue({
        id: VALID_ID,
        traderID: "user-1",
        exchangeName: "Binance",
        balance: 1000,
      } as any);
      vi.mocked(prisma.trade.findMany).mockResolvedValue([
        { result: 100, status: "WIN" },
        { result: -50, status: "LOSS" },
        { result: 0, status: "PENDING" },
      ] as any);

      const response = await GET(makeRequest("GET"), { params });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.exchangeName).toBe("Binance");
      expect(body.stats).toEqual({
        totalTrades: 3,
        openTradesCount: 1,
        winRate: 50,
        netPnl: 50,
      });
    });
  });

  describe("PATCH", () => {
    it("returns 400 when balance is not a number", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
      vi.mocked(prisma.exchange.findUnique).mockResolvedValue({
        id: VALID_ID,
        traderID: "user-1",
      } as any);

      const response = await PATCH(makeRequest("PATCH", { balance: "abc" }), { params });
      expect(response.status).toBe(400);
    });

    it("updates the balance on success", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
      vi.mocked(prisma.exchange.findUnique).mockResolvedValue({
        id: VALID_ID,
        traderID: "user-1",
      } as any);
      vi.mocked(prisma.exchange.update).mockResolvedValue({
        id: VALID_ID,
        balance: 500,
      } as any);

      const response = await PATCH(makeRequest("PATCH", { balance: 500 }), { params });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.balance).toBe(500);
      expect(prisma.exchange.update).toHaveBeenCalledWith({
        where: { id: VALID_ID },
        data: { balance: 500 },
      });
    });
  });

  describe("DELETE", () => {
    it("returns 403 when the exchange belongs to a different user", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
      vi.mocked(prisma.exchange.findUnique).mockResolvedValue({
        id: VALID_ID,
        traderID: "someone-else",
      } as any);

      const response = await DELETE(makeRequest("DELETE"), { params });
      expect(response.status).toBe(403);
    });

    it("deletes the exchange and its trades in a transaction", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
      vi.mocked(prisma.exchange.findUnique).mockResolvedValue({
        id: VALID_ID,
        traderID: "user-1",
      } as any);
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as any);

      const response = await DELETE(makeRequest("DELETE"), { params });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
