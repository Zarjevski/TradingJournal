import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getOrCreateUserPrivacy } from "@/lib/friends";
import { z } from "zod";

const privacyPatchSchema = z
  .object({
    shareWinRate: z.boolean().optional(),
    shareTradeCount: z.boolean().optional(),
    shareTopSymbols: z.boolean().optional(),
    shareActivity: z.boolean().optional(),
  })
  .strict();

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

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = privacyPatchSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { prisma } = await import("@/lib/prisma");
  await getOrCreateUserPrivacy(meId);

  const data = parsed.data;

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
