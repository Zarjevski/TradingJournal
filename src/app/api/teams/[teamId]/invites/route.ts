import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeamAdmin, badRequestResponse } from "@/lib/teamAuth";
import crypto from "crypto";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    await requireTeamAdmin(teamId);

    const invites = await prisma.teamInvite.findMany({
      where: {
        teamID: teamId,
        acceptedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invites);
  } catch (error: any) {
    if (error.message === "Not a team member") {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }
    if (error.message === "Insufficient permissions") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    console.error("Error fetching invites:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    await requireTeamAdmin(teamId);

    const body = await request.json();
    const { email, role } = body;

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return badRequestResponse("Valid email is required");
    }

    if (!role || !["ADMIN", "MEMBER"].includes(role)) {
      return badRequestResponse("Role must be ADMIN or MEMBER");
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamID: teamId,
        user: {
          email: email.toLowerCase(),
        },
      },
    });

    if (existingMember) {
      return badRequestResponse("User is already a team member");
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const invite = await prisma.teamInvite.create({
      data: {
        teamID: teamId,
        email: email.toLowerCase(),
        role,
        token,
        expiresAt,
      },
    });

    return NextResponse.json(invite, { status: 201 });
  } catch (error: any) {
    if (error.message === "Not a team member") {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }
    if (error.message === "Insufficient permissions") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    console.error("Error creating invite:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
