import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeamMember } from "@/lib/teamAuth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; roomId: string }> }
) {
  try {
    const { teamId, roomId } = await params;
    await requireTeamMember(teamId);

    const room = await prisma.teamRoom.findFirst({
      where: { id: roomId, teamID: teamId },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const body = await request.json();
    const { sharedSymbol, sharedMarket, sharedTf } = body;

    const data: { sharedSymbol?: string | null; sharedMarket?: string | null; sharedTf?: string | null } = {};

    if (sharedSymbol !== undefined) {
      const s = typeof sharedSymbol === "string" ? sharedSymbol.trim() : "";
      data.sharedSymbol = s || null;
    }
    if (sharedMarket !== undefined) {
      data.sharedMarket = typeof sharedMarket === "string" && sharedMarket.trim() ? sharedMarket.trim() : null;
    }
    if (sharedTf !== undefined) {
      const allowed = ["1m", "5m", "15m", "1h", "4h", "1d"];
      data.sharedTf = allowed.includes(sharedTf) ? sharedTf : null;
    }

    const updated = await prisma.teamRoom.update({
      where: { id: roomId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === "Not a team member") {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }
    console.error("Error updating room:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
