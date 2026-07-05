import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import getCurrentUser from "@/app/actions/getCurrentUser";

function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

async function loadOwnedExchange(exchangeId: string, traderID: string) {
  const exchange = await prisma.exchange.findUnique({ where: { id: exchangeId } });
  if (!exchange) return { error: "Exchange not found" as const, status: 404 as const };
  if (exchange.traderID !== traderID) return { error: "Forbidden" as const, status: 403 as const };
  return { exchange };
}

// GET /api/exchanges/[id] — account details plus aggregate trade stats for this account.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: exchangeId } = await params;
    if (!exchangeId || !isValidObjectId(exchangeId)) {
      return NextResponse.json({ error: "Invalid account ID" }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await loadOwnedExchange(exchangeId, currentUser.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const trades = await prisma.trade.findMany({
      where: { exchangeID: exchangeId },
      select: { result: true, status: true },
    });

    const closedTrades = trades.filter((t) => t.status === "WIN" || t.status === "LOSS");
    const wins = closedTrades.filter((t) => t.status === "WIN").length;
    const netPnl = trades.reduce((sum, t) => sum + t.result, 0);
    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : null;
    const openTradesCount = trades.filter((t) => t.status === "PENDING").length;

    return NextResponse.json({
      ...result.exchange,
      stats: {
        totalTrades: trades.length,
        openTradesCount,
        winRate,
        netPnl,
      },
    });
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/exchanges/[id] — currently supports editing the balance only.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: exchangeId } = await params;
    if (!exchangeId || !isValidObjectId(exchangeId)) {
      return NextResponse.json({ error: "Invalid account ID" }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await loadOwnedExchange(exchangeId, currentUser.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const body = await request.json().catch(() => ({}));
    const { balance } = body as { balance?: unknown };

    if (typeof balance !== "number" || !Number.isFinite(balance)) {
      return NextResponse.json({ error: "balance must be a number" }, { status: 400 });
    }

    const updated = await prisma.exchange.update({
      where: { id: exchangeId },
      data: { balance: Math.round(balance) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/exchanges/[id] — removes the account and every trade linked to it.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: exchangeId } = await params;
    if (!exchangeId || !isValidObjectId(exchangeId)) {
      return NextResponse.json({ error: "Invalid account ID" }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await loadOwnedExchange(exchangeId, currentUser.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await prisma.$transaction([
      prisma.trade.deleteMany({ where: { exchangeID: exchangeId } }),
      prisma.exchange.delete({ where: { id: exchangeId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
