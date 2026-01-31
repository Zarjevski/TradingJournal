import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeamMember, requireTeamAdmin, badRequestResponse, notFoundResponse } from "@/lib/teamAuth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    await requireTeamMember(teamId);

    const tradeShares = await prisma.teamTradeShare.findMany({
      where: { teamID: teamId },
      include: {
        trade: {
          select: {
            id: true,
            symbol: true,
            position: true,
            status: true,
            result: true,
            date: true,
            exchangeName: true,
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tradeShares);
  } catch (error: any) {
    if (error.message === "Not a team member") {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }
    console.error("Error fetching trade shares:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const { user } = await requireTeamMember(teamId);

    const body = await request.json();
    const { tradeId, note } = body;

    if (!tradeId || typeof tradeId !== "string") {
      return badRequestResponse("Trade ID is required");
    }

    if (note && (typeof note !== "string" || note.length > 300)) {
      return badRequestResponse("Note must be 300 characters or less");
    }

    // Verify trade belongs to user
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      select: { traderID: true },
    });

    if (!trade) {
      return notFoundResponse("Trade not found");
    }

    if (trade.traderID !== user.id) {
      return NextResponse.json({ error: "You can only share your own trades" }, { status: 403 });
    }

    // Check if already shared
    const existing = await prisma.teamTradeShare.findUnique({
      where: {
        teamID_tradeID: {
          teamID: teamId,
          tradeID: tradeId,
        },
      },
    });

    if (existing) {
      return badRequestResponse("Trade already shared to this team");
    }

    const share = await prisma.teamTradeShare.create({
      data: {
        teamID: teamId,
        tradeID: tradeId,
        sharedBy: user.id,
        note: note?.trim() || null,
      },
      include: {
        trade: {
          select: {
            id: true,
            symbol: true,
            position: true,
            status: true,
            result: true,
            date: true,
            exchangeName: true,
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

    return NextResponse.json(share, { status: 201 });
  } catch (error: any) {
    if (error.message === "Not a team member") {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }
    console.error("Error sharing trade:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const { user, member } = await requireTeamMember(teamId);

    const { searchParams } = new URL(request.url);
    const tradeId = searchParams.get("tradeId");

    if (!tradeId) {
      return badRequestResponse("Trade ID is required");
    }

    const share = await prisma.teamTradeShare.findUnique({
      where: {
        teamID_tradeID: {
          teamID: teamId,
          tradeID: tradeId,
        },
      },
    });

    if (!share) {
      return notFoundResponse("Trade share not found");
    }

    // Only sharer or admin can unshare
    if (share.sharedBy !== user.id && member.role !== "OWNER" && member.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    await prisma.teamTradeShare.delete({
      where: {
        teamID_tradeID: {
          teamID: teamId,
          tradeID: tradeId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Not a team member") {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }
    console.error("Error unsharing trade:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
