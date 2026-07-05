import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/actions/getCurrentUser", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    trade: {
      findMany: vi.fn(),
    },
  },
}));

import { GET } from "./route";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { prisma } from "@/lib/prisma";

describe("GET /api/trades/calendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no authenticated user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/trades/calendar"));

    expect(response.status).toBe(401);
  });

  it("rejects a malformed month parameter", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);

    const response = await GET(
      new Request("http://localhost/api/trades/calendar?month=not-a-month")
    );

    expect(response.status).toBe(400);
  });

  it("aggregates trades by day, computing net P&L and win/loss counts", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.trade.findMany).mockResolvedValue([
      { date: new Date("2026-07-01T00:00:00.000Z"), result: 100, status: "WIN" },
      { date: new Date("2026-07-01T00:00:00.000Z"), result: -40, status: "LOSS" },
      { date: new Date("2026-07-02T00:00:00.000Z"), result: 50, status: "WIN" },
    ] as any);

    const response = await GET(
      new Request("http://localhost/api/trades/calendar?month=2026-07")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.month).toBe("2026-07");
    expect(body.days).toEqual([
      { date: "2026-07-01", netPnl: 60, tradeCount: 2, wins: 1, losses: 1 },
      { date: "2026-07-02", netPnl: 50, tradeCount: 1, wins: 1, losses: 0 },
    ]);
  });

  it("scopes the query to the authenticated user and the requested month bounds", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.trade.findMany).mockResolvedValue([]);

    await GET(new Request("http://localhost/api/trades/calendar?month=2026-02"));

    expect(prisma.trade.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          traderID: "user-1",
          date: {
            gte: new Date(Date.UTC(2026, 1, 1, 0, 0, 0, 0)),
            lte: new Date(Date.UTC(2026, 1, 28, 23, 59, 59, 999)),
          },
        },
      })
    );
  });
});
