import { NextResponse } from "next/server";
import { getOrCreateConversationForPair, isValidObjectId } from "@/lib/chat";

async function getMeId(): Promise<string | null> {
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  return user?.id ?? null;
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
    return NextResponse.json({ conversationId: conv.id });
  } catch (e: any) {
    const msg = e?.message || "Forbidden";
    const status = msg === "Not friends" || msg === "Blocked" ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
