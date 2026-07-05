import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import getCurrentUser from "@/app/actions/getCurrentUser";

function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// POST /api/learn/lessons/[id]/complete — marks a lesson as completed for the current user.
// Gated behind an active subscription, same as viewing the lesson body itself.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params;

    if (!lessonId || !isValidObjectId(lessonId)) {
      return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [lesson, subscription] = await Promise.all([
      prisma.lesson.findUnique({ where: { id: lessonId } }),
      prisma.subscription.findUnique({ where: { userID: currentUser.id } }),
    ]);

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    if (subscription?.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "An active subscription is required" },
        { status: 403 }
      );
    }

    const progress = await prisma.lessonProgress.upsert({
      where: { userID_lessonID: { userID: currentUser.id, lessonID: lessonId } },
      create: { userID: currentUser.id, lessonID: lessonId },
      update: {},
    });

    return NextResponse.json(progress, { status: 200 });
  } catch (error) {
    console.error("Error marking lesson complete:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
