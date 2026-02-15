import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import {
  isUserInConversation,
  checkMessageRateLimit,
  isValidObjectId,
} from "@/lib/chat";

async function getMeId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  return user?.id ?? null;
}

const MAX_CONTENT_LENGTH = 1000;
const MIN_CONTENT_LENGTH = 1;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const meId = await getMeId();
  if (!meId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: conversationId } = await params;
  if (!conversationId || !isValidObjectId(conversationId)) {
    return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
  }

  const inConv = await isUserInConversation(meId, conversationId);
  if (!inConv) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const sinceParam = searchParams.get("since");

  const where: { conversationID: string; createdAt?: { gt: Date } } = {
    conversationID: conversationId,
  };
  if (sinceParam) {
    const since = parseInt(sinceParam, 10);
    if (!Number.isNaN(since)) {
      where.createdAt = { gt: new Date(since) };
    }
  }

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: 50,
    select: {
      id: true,
      senderID: true,
      content: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    messages.map((m) => ({
      id: m.id,
      senderID: m.senderID,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }))
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const meId = await getMeId();
  if (!meId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: conversationId } = await params;
  if (!conversationId || !isValidObjectId(conversationId)) {
    return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
  }

  const inConv = await isUserInConversation(meId, conversationId);
  if (!inConv) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!checkMessageRateLimit(meId)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  let body: { content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const content =
    typeof body.content === "string" ? body.content.trim() : "";
  if (content.length < MIN_CONTENT_LENGTH || content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: `Message must be ${MIN_CONTENT_LENGTH}-${MAX_CONTENT_LENGTH} characters` },
      { status: 400 }
    );
  }

  const message = await prisma.message.create({
    data: {
      conversationID: conversationId,
      senderID: meId,
      content,
    },
    select: {
      id: true,
      senderID: true,
      content: true,
      createdAt: true,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({
    id: message.id,
    senderID: message.senderID,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  });
}
