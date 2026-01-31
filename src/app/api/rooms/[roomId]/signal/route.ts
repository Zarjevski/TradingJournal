import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeamMember, badRequestResponse, forbiddenResponse } from "@/lib/teamAuth";

/**
 * POST /api/rooms/[roomId]/signal
 * Send a signaling message (offer, answer, ICE, join, leave)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { type, targetID, payload } = body;

    // Validate type
    const validTypes = ["offer", "answer", "ice", "join", "leave", "share_start", "share_stop"];
    if (!type || !validTypes.includes(type)) {
      return badRequestResponse("Invalid signal type");
    }

    if (!payload) {
      return badRequestResponse("Payload is required");
    }

    // Get teamId from room
    const room = await prisma.teamRoom.findUnique({
      where: { id: roomId },
      select: { teamID: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Enforce team membership
    const { user } = await requireTeamMember(room.teamID);

    // Create signal
    const signal = await prisma.roomSignal.create({
      data: {
        roomID: roomId,
        senderID: user.id,
        targetID: targetID || null,
        type,
        payload,
      },
    });

    return NextResponse.json(signal, { status: 201 });
  } catch (error: any) {
    if (error.message === "Not a team member") {
      return forbiddenResponse("Not a team member");
    }
    console.error("Error creating signal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rooms/[roomId]/signal?since=<timestamp>
 * Poll for new signaling messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");

    // Get teamId from room
    const room = await prisma.teamRoom.findUnique({
      where: { id: roomId },
      select: { teamID: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Enforce team membership
    const { user } = await requireTeamMember(room.teamID);

    // Build query
    const where: any = {
      roomID: roomId,
      senderID: { not: user.id }, // Exclude signals sent by current user
    };

    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        where.createdAt = { gt: sinceDate };
      }
    }

    // Fetch signals
    const signals = await prisma.roomSignal.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: 100, // Limit to prevent huge responses
    });

    return NextResponse.json(signals);
  } catch (error: any) {
    if (error.message === "Not a team member") {
      return forbiddenResponse("Not a team member");
    }
    console.error("Error fetching signals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
