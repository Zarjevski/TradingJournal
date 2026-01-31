import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeamAdmin, badRequestResponse, notFoundResponse } from "@/lib/teamAuth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    await requireTeamAdmin(teamId);

    const members = await prisma.teamMember.findMany({
      where: { teamID: teamId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoURL: true,
          },
        },
      },
      orderBy: [
        { role: "asc" }, // OWNER first, then ADMIN, then MEMBER
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json(members);
  } catch (error: any) {
    if (error.message === "Not a team member") {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }
    if (error.message === "Insufficient permissions") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    await requireTeamAdmin(teamId);

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || typeof userId !== "string") {
      return badRequestResponse("User ID is required");
    }

    if (!role || !["OWNER", "ADMIN", "MEMBER"].includes(role)) {
      return badRequestResponse("Invalid role");
    }

    // Cannot change owner role
    const member = await prisma.teamMember.findUnique({
      where: {
        teamID_userID: {
          teamID: teamId,
          userID: userId,
        },
      },
    });

    if (!member) {
      return notFoundResponse("Member not found");
    }

    if (member.role === "OWNER") {
      return badRequestResponse("Cannot change owner role");
    }

    const updated = await prisma.teamMember.update({
      where: {
        teamID_userID: {
          teamID: teamId,
          userID: userId,
        },
      },
      data: { role },
      include: {
        user: {
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

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === "Not a team member") {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }
    if (error.message === "Insufficient permissions") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    console.error("Error updating member:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    await requireTeamAdmin(teamId);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return badRequestResponse("User ID is required");
    }

    const member = await prisma.teamMember.findUnique({
      where: {
        teamID_userID: {
          teamID: teamId,
          userID: userId,
        },
      },
    });

    if (!member) {
      return notFoundResponse("Member not found");
    }

    // Cannot remove owner
    if (member.role === "OWNER") {
      return badRequestResponse("Cannot remove owner");
    }

    await prisma.teamMember.delete({
      where: {
        teamID_userID: {
          teamID: teamId,
          userID: userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Not a team member") {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }
    if (error.message === "Insufficient permissions") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    console.error("Error removing member:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
