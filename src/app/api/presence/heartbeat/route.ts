import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

async function getMeId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function POST() {
  const meId = await getMeId();
  if (!meId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  await prisma.presence.upsert({
    where: { userID: meId },
    create: { userID: meId, status: "ONLINE", lastSeen: now, updatedAt: now },
    update: { status: "ONLINE", lastSeen: now, updatedAt: now },
  });

  return NextResponse.json({ ok: true });
}
