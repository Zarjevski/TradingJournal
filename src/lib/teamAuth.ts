import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "./prisma";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export interface SessionUser {
  id: string;
  email: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email as string },
    select: { id: true, email: true },
  });

  return user;
}

export async function getSessionUserId(): Promise<string | null> {
  const user = await getSessionUser();
  return user?.id || null;
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}

export async function requireTeamMember(teamId: string): Promise<{ user: SessionUser; member: { role: string } }> {
  const user = await requireAuth();

  const member = await prisma.teamMember.findUnique({
    where: {
      teamID_userID: {
        teamID: teamId,
        userID: user.id,
      },
    },
    select: { role: true },
  });

  if (!member) {
    throw new Error("Not a team member");
  }

  return { user, member };
}

export async function requireTeamAdmin(teamId: string): Promise<{ user: SessionUser; member: { role: string } }> {
  const { user, member } = await requireTeamMember(teamId);

  if (member.role !== "OWNER" && member.role !== "ADMIN") {
    throw new Error("Insufficient permissions");
  }

  return { user, member };
}

// API route helpers
export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFoundResponse(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function badRequestResponse(message = "Bad request") {
  return NextResponse.json({ error: message }, { status: 400 });
}
