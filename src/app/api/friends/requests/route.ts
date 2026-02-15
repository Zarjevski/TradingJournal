import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import {
  isValidObjectId,
  isFriend,
  hasBlockBetween,
} from "@/lib/friends";

const MAX_PENDING_OUTGOING_PER_DAY = 20;

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

  const [incoming, outgoing] = await Promise.all([
    prisma.friendRequest.findMany({
      where: { toUserID: meId, status: "PENDING" },
      include: {
        fromUser: {
          select: { id: true, firstName: true, lastName: true, photoURL: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendRequest.findMany({
      where: { fromUserID: meId, status: "PENDING" },
      include: {
        toUser: {
          select: { id: true, firstName: true, lastName: true, photoURL: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    incoming: incoming.map((r) => ({
      id: r.id,
      fromUser: r.fromUser,
      createdAt: r.createdAt,
    })),
    outgoing: outgoing.map((r) => ({
      id: r.id,
      toUser: r.toUser,
      createdAt: r.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const meId = await getMeId();
  if (!meId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { toUserId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const toUserId = body.toUserId;
  if (!toUserId || !isValidObjectId(toUserId)) {
    return NextResponse.json({ error: "Valid toUserId required" }, { status: 400 });
  }

  if (toUserId === meId) {
    return NextResponse.json({ error: "Cannot send request to yourself" }, { status: 400 });
  }

  if (await hasBlockBetween(meId, toUserId)) {
    return NextResponse.json(
      { error: "Cannot send request: block exists" },
      { status: 403 }
    );
  }

  if (await isFriend(meId, toUserId)) {
    return NextResponse.json({ error: "Already friends" }, { status: 400 });
  }

  const existing = await prisma.friendRequest.findUnique({
    where: {
      fromUserID_toUserID: { fromUserID: meId, toUserID: toUserId },
    },
  });
  if (existing) {
    if (existing.status === "PENDING") {
      return NextResponse.json({ error: "Request already sent" }, { status: 400 });
    }
    if (existing.status === "ACCEPTED") {
      return NextResponse.json({ error: "Already friends" }, { status: 400 });
    }
  }

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const count = await prisma.friendRequest.count({
    where: {
      fromUserID: meId,
      status: "PENDING",
      createdAt: { gte: startOfDay },
    },
  });
  if (count >= MAX_PENDING_OUTGOING_PER_DAY) {
    return NextResponse.json(
      { error: "Rate limit: max 20 pending requests per day" },
      { status: 429 }
    );
  }

  const toUser = await prisma.user.findUnique({
    where: { id: toUserId },
    select: { id: true },
  });
  if (!toUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const requestRecord = await prisma.friendRequest.upsert({
    where: {
      fromUserID_toUserID: { fromUserID: meId, toUserID: toUserId },
    },
    create: {
      fromUserID: meId,
      toUserID: toUserId,
      status: "PENDING",
    },
    update: { status: "PENDING", respondedAt: null },
    include: {
      toUser: {
        select: { id: true, firstName: true, lastName: true, photoURL: true },
      },
    },
  });

  return NextResponse.json(requestRecord);
}
