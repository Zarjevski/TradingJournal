import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getFriendIds, getOrCreateConversationForPair, isValidObjectId } from "@/lib/chat";

async function getMeId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function GET() {
  const meId = await getMeId();
  if (!meId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const friendIds = await getFriendIds(meId);
  const friendSet = new Set(friendIds);

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ userAID: meId }, { userBID: meId }] },
    include: {
      userA: { select: { id: true, firstName: true, lastName: true, photoURL: true } },
      userB: { select: { id: true, firstName: true, lastName: true, photoURL: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, senderID: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const presenceUserIds = conversations.flatMap((c) =>
    c.userAID === meId ? [c.userBID] : [c.userAID]
  );
  const presenceMap = new Map<
    string,
    { status: string; updatedAt: Date }
  >();
  if (presenceUserIds.length > 0) {
    const presences = await prisma.presence.findMany({
      where: { userID: { in: presenceUserIds } },
      select: { userID: true, status: true, updatedAt: true },
    });
    const now = Date.now();
    for (const p of presences) {
      const isOnline = now - p.updatedAt.getTime() < 60_000;
      presenceMap.set(p.userID, {
        status: isOnline ? "ONLINE" : p.status,
        updatedAt: p.updatedAt,
      });
    }
  }

  const list = conversations
    .filter((c) => {
      const otherId = c.userAID === meId ? c.userBID : c.userAID;
      return friendSet.has(otherId);
    })
    .map((c) => {
      const other = c.userAID === meId ? c.userB : c.userA;
      const lastMsg = c.messages[0];
      const presence = presenceMap.get(other.id);
      return {
      id: c.id,
      friend: {
        id: other.id,
        firstName: other.firstName,
        lastName: other.lastName,
        photoURL: other.photoURL,
      },
      lastMessage: lastMsg
        ? {
            content: lastMsg.content,
            createdAt: lastMsg.createdAt.toISOString(),
            senderID: lastMsg.senderID,
          }
        : null,
      presence: presence
        ? {
            status: presence.status,
            updatedAt: presence.updatedAt.toISOString(),
          }
        : null,
      updatedAt: c.updatedAt.toISOString(),
    };
  });

  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const meId = await getMeId();
  if (!meId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { friendId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const friendId = body.friendId;
  if (!friendId || !isValidObjectId(friendId)) {
    return NextResponse.json({ error: "Valid friendId required" }, { status: 400 });
  }

  try {
    const conv = await getOrCreateConversationForPair(meId, friendId);
    return NextResponse.json(conv);
  } catch (e: any) {
    const msg = e?.message || "Forbidden";
    const status = msg === "Not friends" || msg === "Blocked" ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
