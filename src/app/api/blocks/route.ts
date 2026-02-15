import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { isValidObjectId, normalizeFriendshipPair } from "@/lib/friends";

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

  const blocks = await prisma.block.findMany({
    where: { blockerID: meId },
    include: {
      blocked: {
        select: { id: true, firstName: true, lastName: true, photoURL: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    blocks.map((b) => ({
      id: b.id,
      userId: b.blockedID,
      firstName: b.blocked.firstName,
      lastName: b.blocked.lastName,
      photoURL: b.blocked.photoURL,
      createdAt: b.createdAt,
    }))
  );
}

export async function POST(request: Request) {
  const meId = await getMeId();
  if (!meId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { userId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = body.userId;
  if (!userId || !isValidObjectId(userId)) {
    return NextResponse.json({ error: "Valid userId required" }, { status: 400 });
  }

  if (userId === meId) {
    return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [a, b] = normalizeFriendshipPair(meId, userId);
  await prisma.$transaction(async (tx) => {
    const friendship = await tx.friendship.findUnique({
      where: { userAID_userBID: { userAID: a, userBID: b } },
    });
    if (friendship) {
      await tx.friendship.delete({ where: { id: friendship.id } });
    }
    await tx.friendRequest.updateMany({
      where: {
        OR: [
          { fromUserID: meId, toUserID: userId },
          { fromUserID: userId, toUserID: meId },
        ],
        status: "PENDING",
      },
      data: { status: "CANCELED", respondedAt: new Date() },
    });
    await tx.block.upsert({
      where: {
        blockerID_blockedID: { blockerID: meId, blockedID: userId },
      },
      create: { blockerID: meId, blockedID: userId },
      update: {},
    });
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const meId = await getMeId();
  if (!meId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { userId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = body.userId;
  if (!userId || !isValidObjectId(userId)) {
    return NextResponse.json({ error: "Valid userId required" }, { status: 400 });
  }

  const block = await prisma.block.findUnique({
    where: {
      blockerID_blockedID: { blockerID: meId, blockedID: userId },
    },
  });

  if (!block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  await prisma.block.delete({
    where: { id: block.id },
  });

  return NextResponse.json({ success: true });
}
