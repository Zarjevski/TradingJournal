import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { LEARN_MODULE_ENABLED } from "@/lib/constants";
import LessonClient from "./LessonClient";

export const dynamic = "force-dynamic";

function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

interface PageProps {
  params: Promise<{ lessonId: string }>;
}

export default async function LessonPage({ params }: PageProps) {
  if (!LEARN_MODULE_ENABLED) {
    redirect("/dashboard");
  }

  const { lessonId } = await params;

  if (!lessonId || !isValidObjectId(lessonId)) {
    notFound();
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/auth/login");
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: { select: { id: true, title: true } } },
  });

  if (!lesson) {
    notFound();
  }

  const [subscription, progress] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userID: currentUser.id },
      select: { status: true },
    }),
    prisma.lessonProgress.findUnique({
      where: { userID_lessonID: { userID: currentUser.id, lessonID: lessonId } },
    }),
  ]);

  const isSubscribed = subscription?.status === "ACTIVE";

  return (
    <LessonClient
      lesson={{
        id: lesson.id,
        title: lesson.title,
        body: isSubscribed ? lesson.body : null,
        videoUrl: isSubscribed ? lesson.videoUrl : null,
        courseTitle: lesson.course.title,
      }}
      isSubscribed={isSubscribed}
      isCompleted={!!progress}
    />
  );
}
