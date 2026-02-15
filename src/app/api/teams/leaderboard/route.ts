import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorizedResponse } from "@/lib/teamAuth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const teams = await prisma.team.findMany({
      include: {
        tradeShares: {
          include: {
            trade: {
              select: {
                result: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    const leaderboard = teams.map((team) => {
      const totalPnL = team.tradeShares.reduce((sum, share) => {
        const r = share.trade?.result ?? 0;
        return sum + r;
      }, 0);

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        imageURL: team.imageURL,
        membersCount: team._count.members,
        totalPnL,
        tradesShared: team.tradeShares.length,
      };
    }).sort((a, b) => b.totalPnL - a.totalPnL);

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("Error generating teams leaderboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

