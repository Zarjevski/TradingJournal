import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { LEARN_MODULE_ENABLED } from "@/lib/constants";
import LearnClient from "./LearnClient";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  if (!LEARN_MODULE_ENABLED) {
    redirect("/dashboard");
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const [courses, subscription] = await Promise.all([
    prisma.course.findMany({
      orderBy: { order: "asc" },
      include: {
        lessons: {
          orderBy: { order: "asc" },
          select: { id: true, title: true, order: true },
        },
      },
    }),
    prisma.subscription.findUnique({
      where: { userID: currentUser.id },
      select: { status: true, currentPeriodEnd: true },
    }),
  ]);

  const isSubscribed = subscription?.status === "ACTIVE";

  return (
    <Suspense fallback={null}>
      <LearnClient
        courses={courses.map((course) => ({
          ...course,
          createdAt: course.createdAt.toISOString(),
        }))}
        isSubscribed={isSubscribed}
      />
    </Suspense>
  );
}
