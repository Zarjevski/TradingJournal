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

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ userAID: meId }, { userBID: meId }],
    },
    include: {
      userA: {
        select: { id: true, firstName: true, lastName: true, photoURL: true, email: true },
      },
      userB: {
        select: { id: true, firstName: true, lastName: true, photoURL: true, email: true },
      },
    },
  });

  const friends = friendships.map((f) => {
    const other = f.userAID === meId ? f.userB : f.userA;
    return {
      id: other.id,
      firstName: other.firstName,
      lastName: other.lastName,
      photoURL: other.photoURL,
      email: other.email,
      friendshipId: f.id,
    };
  });

  return NextResponse.json(friends);
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

  if (userId === meId) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  const [a, b] = normalizeFriendshipPair(meId, userId);
  const friendship = await prisma.friendship.findUnique({
    where: { userAID_userBID: { userAID: a, userBID: b } },
  });

  if (!friendship) {
    return NextResponse.json({ error: "Not friends" }, { status: 400 });
  }

  await prisma.friendship.delete({
    where: { id: friendship.id },
  });

  return NextResponse.json({ success: true });
}
