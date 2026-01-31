import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import AnalyticsClient from "./AnalyticsClient";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  // Get current user
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email as string },
    select: { id: true },
  });

  if (!currentUser) {
    redirect("/auth/login");
  }

  // Fetch user exchanges for filter dropdown
  const exchanges = await prisma.exchange.findMany({
    where: { traderID: currentUser.id },
    select: {
      id: true,
      exchangeName: true,
    },
  });

  return <AnalyticsClient exchanges={exchanges} />;
}
