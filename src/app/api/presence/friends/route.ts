import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getFriendIds } from "@/lib/chat";
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

const ONLINE_THRESHOLD_MS = 60_000; // 60 seconds

export async function GET() {
  const meId = await getMeId();
  if (!meId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const friendIds = await getFriendIds(meId);
  if (friendIds.length === 0) {
    return NextResponse.json({ friends: [], onlineCount: 0 });
  }

  const presenceList = await prisma.presence.findMany({
    where: { userID: { in: friendIds } },
    select: { userID: true, status: true, updatedAt: true, lastSeen: true },
  });

  const now = Date.now();
  const friends = presenceList.map((p) => ({
    userId: p.userID,
    status: now - p.updatedAt.getTime() < ONLINE_THRESHOLD_MS ? "ONLINE" : p.status,
    updatedAt: p.updatedAt.toISOString(),
    lastSeen: p.lastSeen.toISOString(),
  }));

  const onlineCount = friends.filter((f) => f.status === "ONLINE").length;

  return NextResponse.json({ friends, onlineCount });
}
