import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeamMember, requireTeamAdmin, notFoundResponse, badRequestResponse } from "@/lib/teamAuth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const { user } = await requireTeamMember(teamId);

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoURL: true,
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
            tradeShares: true,
            rooms: true,
          },
        },
      },
    });

    if (!team) {
      return notFoundResponse("Team not found");
    }

    return NextResponse.json(team);
  } catch (error: any) {
    if (error.message === "Not a team member") {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }
    console.error("Error fetching team:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const { member, response } = await requireTeamAdmin(teamId);
    if (response) return response;

    const body = await request.json();
    const { imageURL, name, description } = body;

    const updateData: any = {};
    if (imageURL !== undefined) {
      updateData.imageURL = imageURL === null ? null : String(imageURL);
    }
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 40) {
        return badRequestResponse("Team name must be between 2 and 40 characters.");
      }
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = description === null || description === "" ? null : String(description).trim();
    }

    const team = await prisma.team.update({
      where: { id: teamId },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoURL: true,
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
            tradeShares: true,
            rooms: true,
          },
        },
      },
    });

    return NextResponse.json(team);
  } catch (error: any) {
    if (error.code === "P2025") {
      return notFoundResponse("Team not found");
    }
    console.error("Error updating team:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
