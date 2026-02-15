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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const meId = await getMeId();
  if (!meId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await params;
  if (!requestId || !isValidObjectId(requestId)) {
    return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
  }

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action;
  if (!["accept", "decline", "cancel"].includes(action ?? "")) {
    return NextResponse.json(
      { error: "action must be accept, decline, or cancel" },
      { status: 400 }
    );
  }

  const fr = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });
  if (!fr) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (action === "accept" || action === "decline") {
    if (fr.toUserID !== meId) {
      return NextResponse.json({ error: "Only recipient can accept or decline" }, { status: 403 });
    }
    if (fr.status !== "PENDING") {
      return NextResponse.json({ error: "Request is no longer pending" }, { status: 400 });
    }

    const newStatus = action === "accept" ? "ACCEPTED" : "DECLINED";
    await prisma.$transaction(async (tx) => {
      await tx.friendRequest.update({
        where: { id: requestId },
        data: { status: newStatus, respondedAt: new Date() },
      });
      if (action === "accept") {
        const [a, b] = normalizeFriendshipPair(fr.fromUserID, fr.toUserID);
        await tx.friendship.upsert({
          where: { userAID_userBID: { userAID: a, userBID: b } },
          create: { userAID: a, userBID: b },
          update: {},
        });
      }
    });

    return NextResponse.json({ success: true, status: newStatus });
  }

  if (action === "cancel") {
    if (fr.fromUserID !== meId) {
      return NextResponse.json({ error: "Only sender can cancel" }, { status: 403 });
    }
    if (fr.status !== "PENDING") {
      return NextResponse.json({ error: "Request is no longer pending" }, { status: 400 });
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "CANCELED", respondedAt: new Date() },
    });
    return NextResponse.json({ success: true, status: "CANCELED" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
