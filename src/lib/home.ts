import { prisma } from "./prisma";
import getCurrentUser from "@/app/actions/getCurrentUser";

export interface HomeData {
  exchanges: Array<{
    id: string;
    exchangeName: string;
    balance: number;
    image: string;
  }>;
  rules: Array<{
    id: string;
    content: string;
  }>;
  recentTrades: Array<{
    id: string;
    date: Date;
    symbol: string;
    exchangeName: string;
    position: string;
    status: string;
    result: number;
  }>;
  todayTradesCount: number;
  openTradesCount: number;
  todayPnL: number;
  totalBalance: number;
}

export async function getHomeData(): Promise<HomeData | null> {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return null;
    }

    // Get today's date range (start and end of day in UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    // Fetch all required data in parallel - optimized to prevent memory issues
    const [exchanges, recentTradesQuery, rules, openTradesCount, todayTradesCount, todayPnLTrades] = await Promise.all([
      prisma.exchange.findMany({
        where: { traderID: currentUser.id },
        select: {
          id: true,
          exchangeName: true,
          balance: true,
          image: true,
        },
      }),
      // Only fetch recent 10 trades for display
      prisma.trade.findMany({
        where: { traderID: currentUser.id },
        select: {
          id: true,
          date: true,
          symbol: true,
          exchangeName: true,
          position: true,
          status: true,
          result: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.rule.findMany({
        where: { traderID: currentUser.id },
        select: {
          id: true,
          content: true,
        },
      }),
      // Count open trades using database query
      prisma.trade.count({
        where: {
          traderID: currentUser.id,
          status: "PENDING",
        },
      }),
      // Count trades created today using database query
      prisma.trade.count({
        where: {
          traderID: currentUser.id,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      // Get today's P&L trades only
      prisma.trade.findMany({
        where: {
          traderID: currentUser.id,
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
        select: {
          result: true,
        },
      }),
    ]);

    // Calculate total balance
    const totalBalance = exchanges.reduce((sum, exchange) => sum + exchange.balance, 0);

    // Calculate daily P&L from today's trades
    const todayPnL = todayPnLTrades.reduce((sum, trade) => sum + trade.result, 0);

    // Map recent trades
    const recentTrades = recentTradesQuery.map((trade) => ({
      id: trade.id,
      date: trade.date,
      symbol: trade.symbol,
      exchangeName: trade.exchangeName,
      position: trade.position,
      status: trade.status,
      result: trade.result,
    }));

    return {
      exchanges,
      rules,
      recentTrades,
      todayTradesCount,
      openTradesCount,
      todayPnL,
      totalBalance,
    };
  } catch (error) {
    console.error("Error fetching home data:", error);
    return null;
  }
}
