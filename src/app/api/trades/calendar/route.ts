import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import getCurrentUser from "@/app/actions/getCurrentUser";

interface DayAggregate {
  date: string;
  netPnl: number;
  tradeCount: number;
  wins: number;
  losses: number;
}

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month");

    const now = new Date();
    let year = now.getUTCFullYear();
    let month = now.getUTCMonth() + 1; // 1-indexed

    if (monthParam) {
      const match = /^(\d{4})-(\d{2})$/.exec(monthParam);
      if (!match) {
        return NextResponse.json(
          { error: "Invalid 'month' format, expected YYYY-MM" },
          { status: 400 }
        );
      }
      year = parseInt(match[1], 10);
      month = parseInt(match[2], 10);
      if (month < 1 || month > 12) {
        return NextResponse.json(
          { error: "Invalid 'month' value" },
          { status: 400 }
        );
      }
    }

    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const trades = await prisma.trade.findMany({
      where: {
        traderID: currentUser.id,
        date: { gte: start, lte: end },
      },
      select: {
        date: true,
        result: true,
        status: true,
      },
    });

    const byDay = new Map<string, DayAggregate>();

    for (const trade of trades) {
      const dayKey = trade.date.toISOString().slice(0, 10);
      const existing = byDay.get(dayKey) ?? {
        date: dayKey,
        netPnl: 0,
        tradeCount: 0,
        wins: 0,
        losses: 0,
      };

      existing.netPnl += trade.result;
      existing.tradeCount += 1;
      if (trade.status.toUpperCase() === "WIN") existing.wins += 1;
      if (trade.status.toUpperCase() === "LOSS") existing.losses += 1;

      byDay.set(dayKey, existing);
    }

    const days = Array.from(byDay.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return NextResponse.json({
      month: `${year}-${String(month).padStart(2, "0")}`,
      days,
    });
  } catch (error) {
    console.error("Error fetching calendar trades:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
