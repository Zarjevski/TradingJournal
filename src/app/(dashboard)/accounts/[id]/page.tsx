import { notFound, redirect } from "next/navigation";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { prisma } from "@/lib/prisma";
import AccountDetailClient from "./AccountDetailClient";

export const dynamic = "force-dynamic";

function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountDetailPage({ params }: PageProps) {
  const { id } = await params;

  if (!id || !isValidObjectId(id)) {
    notFound();
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/auth/login");
  }

  const exchange = await prisma.exchange.findUnique({ where: { id } });

  if (!exchange || exchange.traderID !== currentUser.id) {
    notFound();
  }

  const [trades, recentTrades] = await Promise.all([
    prisma.trade.findMany({
      where: { exchangeID: id },
      select: { result: true, status: true },
    }),
    prisma.trade.findMany({
      where: { exchangeID: id },
      select: {
        id: true,
        date: true,
        symbol: true,
        position: true,
        status: true,
        size: true,
        result: true,
      },
      orderBy: { date: "desc" },
      take: 10,
    }),
  ]);

  const closedTrades = trades.filter((t) => t.status === "WIN" || t.status === "LOSS");
  const wins = closedTrades.filter((t) => t.status === "WIN").length;
  const stats = {
    totalTrades: trades.length,
    openTradesCount: trades.filter((t) => t.status === "PENDING").length,
    winRate: closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : null,
    netPnl: trades.reduce((sum, t) => sum + t.result, 0),
  };

  return (
    <AccountDetailClient
      account={{
        id: exchange.id,
        exchangeName: exchange.exchangeName,
        balance: exchange.balance,
        image: exchange.image,
        connectedAt: exchange.connectedAt?.toISOString() ?? null,
        lastSyncedAt: exchange.lastSyncedAt?.toISOString() ?? null,
        hasApiCredentials: !!exchange.apiKeyEncrypted,
      }}
      stats={stats}
      initialRecentTrades={recentTrades.map((t) => ({
        ...t,
        date: t.date.toISOString(),
      }))}
    />
  );
}
