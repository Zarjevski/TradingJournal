import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getOrCreateUserPrivacy } from "@/lib/friends";

async function getMeId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const { prisma } = await import("@/lib/prisma");
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

  const privacy = await getOrCreateUserPrivacy(meId);
  return NextResponse.json({
    shareWinRate: privacy.shareWinRate,
    shareTradeCount: privacy.shareTradeCount,
    shareTopSymbols: privacy.shareTopSymbols,
    shareActivity: privacy.shareActivity,
  });
}

export async function PATCH(request: Request) {
  const meId = await getMeId();
  if (!meId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    shareWinRate?: boolean;
    shareTradeCount?: boolean;
    shareTopSymbols?: boolean;
    shareActivity?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { prisma } = await import("@/lib/prisma");
  await getOrCreateUserPrivacy(meId);

  const data: Record<string, boolean> = {};
  if (typeof body.shareWinRate === "boolean") data.shareWinRate = body.shareWinRate;
  if (typeof body.shareTradeCount === "boolean") data.shareTradeCount = body.shareTradeCount;
  if (typeof body.shareTopSymbols === "boolean") data.shareTopSymbols = body.shareTopSymbols;
  if (typeof body.shareActivity === "boolean") data.shareActivity = body.shareActivity;

  if (Object.keys(data).length === 0) {
    const privacy = await getOrCreateUserPrivacy(meId);
    return NextResponse.json(privacy);
  }

  const privacy = await prisma.userPrivacy.upsert({
    where: { userID: meId },
    create: { userID: meId, ...data },
    update: data,
  });

  return NextResponse.json({
    shareWinRate: privacy.shareWinRate,
    shareTradeCount: privacy.shareTradeCount,
    shareTopSymbols: privacy.shareTopSymbols,
    shareActivity: privacy.shareActivity,
  });
}
