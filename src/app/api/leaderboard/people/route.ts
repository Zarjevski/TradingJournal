import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import getCurrentUser from "@/app/actions/getCurrentUser";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trades = await prisma.trade.findMany({
      select: {
        traderID: true,
        result: true,
        trader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoURL: true,
            email: true,
          },
        },
      },
    });

    const byUser = new Map<
      string,
      {
        userId: string;
        firstName: string;
        lastName: string;
        email: string;
        photoURL: string | null;
        totalPnL: number;
        tradeCount: number;
      }
    >();

    for (const t of trades) {
      if (!t.trader) continue;
      const key = t.trader.id;
      const existing = byUser.get(key);
      const pnl = t.result ?? 0;

      if (!existing) {
        byUser.set(key, {
          userId: t.trader.id,
          firstName: t.trader.firstName,
          lastName: t.trader.lastName,
          email: t.trader.email,
          photoURL: t.trader.photoURL ?? null,
          totalPnL: pnl,
          tradeCount: 1,
        });
      } else {
        existing.totalPnL += pnl;
        existing.tradeCount += 1;
      }
    }

    const leaderboard = Array.from(byUser.values()).sort(
      (a, b) => b.totalPnL - a.totalPnL
    );

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("Error generating people leaderboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
