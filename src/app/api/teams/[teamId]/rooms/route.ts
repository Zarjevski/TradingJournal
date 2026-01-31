import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeamMember, badRequestResponse } from "@/lib/teamAuth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    await requireTeamMember(teamId);

    const rooms = await prisma.teamRoom.findMany({
      where: { teamID: teamId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(rooms);
  } catch (error: any) {
    if (error.message === "Not a team member") {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }
    console.error("Error fetching rooms:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    await requireTeamMember(teamId);

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.length < 2 || name.length > 40) {
      return badRequestResponse("Room name must be between 2 and 40 characters");
    }

    const room = await prisma.teamRoom.create({
      data: {
        teamID: teamId,
        name: name.trim(),
        isActive: true,
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error: any) {
    if (error.message === "Not a team member") {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }
    console.error("Error creating room:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
