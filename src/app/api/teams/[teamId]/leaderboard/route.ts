import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeamMember } from "@/lib/teamAuth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    // Ensure the user is a member of this team
    await requireTeamMember(teamId);

    const shares = await prisma.teamTradeShare.findMany({
      where: { teamID: teamId },
      include: {
        trade: {
          select: {
            id: true,
            result: true,
          },
        },
        sharer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoURL: true,
          },
        },
      },
    });

    type LeaderboardEntry = {
      userId: string;
      firstName: string;
      lastName: string;
      email: string;
      photoURL: string | null;
      totalPnL: number;
      tradesShared: number;
    };

    const byUser = new Map<string, LeaderboardEntry>();

    for (const share of shares) {
      if (!share.sharer || !share.trade) continue;
      const key = share.sharer.id;
      const existing = byUser.get(key);
      const pnl = share.trade.result ?? 0;

      if (!existing) {
        byUser.set(key, {
          userId: share.sharer.id,
          firstName: share.sharer.firstName,
          lastName: share.sharer.lastName,
          email: share.sharer.email,
          photoURL: share.sharer.photoURL ?? null,
          totalPnL: pnl,
          tradesShared: 1,
        });
      } else {
        existing.totalPnL += pnl;
        existing.tradesShared += 1;
      }
    }

    const leaderboard = Array.from(byUser.values()).sort(
      (a, b) => b.totalPnL - a.totalPnL
    );

    return NextResponse.json(leaderboard);
  } catch (error: any) {
    if (error?.message === "Not a team member") {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }
    console.error("Error generating team leaderboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

