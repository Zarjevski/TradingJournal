import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, badRequestResponse, notFoundResponse } from "@/lib/teamAuth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invite = await prisma.teamInvite.findUnique({
      where: { token },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!invite) {
      return notFoundResponse("Invite not found");
    }

    if (invite.acceptedAt) {
      return badRequestResponse("Invite already accepted");
    }

    if (invite.expiresAt < new Date()) {
      return badRequestResponse("Invite has expired");
    }

    return NextResponse.json(invite);
  } catch (error) {
    console.error("Error fetching invite:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const user = await requireAuth();

    const invite = await prisma.teamInvite.findUnique({
      where: { token },
    });

    if (!invite) {
      return notFoundResponse("Invite not found");
    }

    if (invite.acceptedAt) {
      return badRequestResponse("Invite already accepted");
    }

    if (invite.expiresAt < new Date()) {
      return badRequestResponse("Invite has expired");
    }

    // Verify email matches
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return badRequestResponse("Invite email does not match your account email");
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamID_userID: {
          teamID: invite.teamID,
          userID: user.id,
        },
      },
    });

    if (existingMember) {
      return badRequestResponse("You are already a team member");
    }

    // Create member and mark invite as accepted
    await prisma.$transaction([
      prisma.teamMember.create({
        data: {
          teamID: invite.teamID,
          userID: user.id,
          role: invite.role,
        },
      }),
      prisma.teamInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    const team = await prisma.team.findUnique({
      where: { id: invite.teamID },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error: any) {
    if (error.message.includes("redirect")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error accepting invite:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
