import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { hasBlockBetween } from "@/lib/friends";

const MAX_RESULTS = 20;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters" },
      { status: 400 }
    );
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const search = q.toLowerCase();
  const users = await prisma.user.findMany({
    where: {
      id: { not: me.id },
      OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photoURL: true,
      email: true,
    },
    take: MAX_RESULTS * 2,
  });

  const filtered: Array<{
    id: string;
    firstName: string;
    lastName: string;
    photoURL: string | null;
    email: string;
  }> = [];
  for (const u of users) {
    if (await hasBlockBetween(me.id, u.id)) continue;
    filtered.push({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      photoURL: u.photoURL,
      email: u.email,
    });
    if (filtered.length >= MAX_RESULTS) break;
  }

  const masked = filtered.map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    photoURL: u.photoURL,
    email: maskEmail(u.email),
  }));

  return NextResponse.json(masked);
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  if (local.length <= 2) return local[0] + "***@" + domain;
  return local.slice(0, 2) + "***@" + domain;
}
