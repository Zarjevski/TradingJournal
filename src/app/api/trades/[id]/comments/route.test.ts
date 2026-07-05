import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/actions/getCurrentUser", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    trade: {
      findUnique: vi.fn(),
    },
    comment: {
      create: vi.fn(),
    },
  },
}));

import { POST } from "./route";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { prisma } from "@/lib/prisma";

const VALID_TRADE_ID = "507f1f77bcf86cd799439011";

function makeRequest(body: unknown) {
  return new Request(`http://localhost/api/trades/${VALID_TRADE_ID}/comments`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const params = Promise.resolve({ id: VALID_TRADE_ID });

describe("POST /api/trades/[id]/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for a malformed trade id", async () => {
    const response = await POST(makeRequest({ content: "hi" }), {
      params: Promise.resolve({ id: "not-an-object-id" }),
    });
    expect(response.status).toBe(400);
  });

  it("returns 401 when there is no authenticated user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const response = await POST(makeRequest({ content: "hi" }), { params });
    expect(response.status).toBe(401);
  });

  it("returns 404 when the trade doesn't exist", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.trade.findUnique).mockResolvedValue(null);

    const response = await POST(makeRequest({ content: "hi" }), { params });
    expect(response.status).toBe(404);
  });

  it("returns 403 when the trade belongs to a different user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.trade.findUnique).mockResolvedValue({
      id: VALID_TRADE_ID,
      traderID: "someone-else",
    } as any);

    const response = await POST(makeRequest({ content: "hi" }), { params });
    expect(response.status).toBe(403);
  });

  it("returns 400 for empty comment content", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.trade.findUnique).mockResolvedValue({
      id: VALID_TRADE_ID,
      traderID: "user-1",
    } as any);

    const response = await POST(makeRequest({ content: "   " }), { params });
    expect(response.status).toBe(400);
  });

  it("returns 400 when the comment exceeds the max length", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.trade.findUnique).mockResolvedValue({
      id: VALID_TRADE_ID,
      traderID: "user-1",
    } as any);

    const response = await POST(makeRequest({ content: "x".repeat(2001) }), { params });
    expect(response.status).toBe(400);
  });

  it("creates the comment and returns it with owner info on success", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as any);
    vi.mocked(prisma.trade.findUnique).mockResolvedValue({
      id: VALID_TRADE_ID,
      traderID: "user-1",
    } as any);
    vi.mocked(prisma.comment.create).mockResolvedValue({
      id: "comment-1",
      tradeID: VALID_TRADE_ID,
      ownerID: "user-1",
      content: "Nice trade",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      owner: { id: "user-1", firstName: "Jane", lastName: "Doe", photoURL: null },
    } as any);

    const response = await POST(makeRequest({ content: "  Nice trade  " }), { params });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.content).toBe("Nice trade");
    expect(body.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(prisma.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { tradeID: VALID_TRADE_ID, ownerID: "user-1", content: "Nice trade" },
      })
    );
  });
});
