import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TradesClient from "./TradesClient";
import getCurrentUser from "@/app/actions/getCurrentUser";

export const dynamic = "force-dynamic";

export default async function TradesPage() {
  // Use getCurrentUser for consistency with other pages
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  try {
    // Fetch data in parallel for better performance
    const [exchanges, initialTrades, totalTrades] = await Promise.all([
      // Fetch user exchanges for filter dropdown
      prisma.exchange.findMany({
        where: { traderID: currentUser.id },
        select: {
          id: true,
          exchangeName: true,
        },
        orderBy: { exchangeName: "asc" },
      }),
      // Fetch initial trades (last 25, date desc) - reduced for better performance
      prisma.trade.findMany({
        where: { traderID: currentUser.id },
        select: {
          id: true,
          date: true,
          symbol: true,
          exchangeName: true,
          position: true,
          status: true,
          size: true,
          result: true,
        },
        orderBy: { date: "desc" },
        take: 25,
      }),
      // Get total count (this is lightweight)
      prisma.trade.count({
        where: { traderID: currentUser.id },
      }),
    ]);

    // Serialize dates to ISO strings for client component
    const serializedTrades = initialTrades.map((trade) => ({
      ...trade,
      date: trade.date instanceof Date ? trade.date.toISOString() : trade.date,
    }));

    return (
      <TradesClient
        initialTrades={serializedTrades}
        initialTotal={totalTrades}
        exchanges={exchanges}
      />
    );
  } catch (error) {
    console.error("Error fetching trades data:", error);
    // Return empty state on error - still try to get exchanges
    try {
      const exchanges = await prisma.exchange.findMany({
        where: { traderID: currentUser.id },
        select: {
          id: true,
          exchangeName: true,
        },
        orderBy: { exchangeName: "asc" },
      });
      return (
        <TradesClient
          initialTrades={[]}
          initialTotal={0}
          exchanges={exchanges}
        />
      );
    } catch (exchangeError) {
      console.error("Error fetching exchanges:", exchangeError);
      return (
        <TradesClient
          initialTrades={[]}
          initialTotal={0}
          exchanges={[]}
        />
      );
    }
  }
}
