import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/actions/getCurrentUser", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    trade: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { GET } from "./route";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { prisma } from "@/lib/prisma";

describe("GET /api/trades", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no authenticated user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/trades"));

    expect(response.status).toBe(401);
  });

  it("scopes the query to the authenticated user and returns paginated results", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.trade.count).mockResolvedValue(1 as any);
    vi.mocked(prisma.trade.findMany).mockResolvedValue([
      {
        id: "trade-1",
        date: new Date("2026-01-01"),
        symbol: "BTCUSDT",
        exchangeName: "Binance",
        position: "LONG",
        status: "WIN",
        size: 1,
        result: 100,
      },
    ] as any);

    const response = await GET(
      new Request("http://localhost/api/trades?page=1&pageSize=25")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.items).toHaveLength(1);
    expect(prisma.trade.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ traderID: "user-1" }),
      })
    );
  });

  it("rejects a non-numeric pageSize", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);

    const response = await GET(
      new Request("http://localhost/api/trades?pageSize=abc")
    );

    expect(response.status).toBe(400);
  });

  it("rejects an invalid exchangeId", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);

    const response = await GET(
      new Request("http://localhost/api/trades?exchangeId=not-an-object-id")
    );

    expect(response.status).toBe(400);
  });
});
