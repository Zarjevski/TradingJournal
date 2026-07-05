import { prisma } from "./prisma";
import { isFriend, hasBlockBetween, getOrCreateUserPrivacy } from "./friends";

const NINETY_DAYS_AGO = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d;
})();

export type Relationship = "SELF" | "FRIEND" | "NOT_FRIEND" | "BLOCKED";

export async function getRelationship(
  viewerId: string,
  profileUserId: string
): Promise<Relationship> {
  if (viewerId === profileUserId) return "SELF";
  const blocked = await hasBlockBetween(viewerId, profileUserId);
  if (blocked) return "BLOCKED";
  const friend = await isFriend(viewerId, profileUserId);
  return friend ? "FRIEND" : "NOT_FRIEND";
}

export interface ProfileStats90d {
  tradeCount90d: number;
  wins90d: number;
  losses90d: number;
  breakeven90d: number;
  canceled90d: number;
  winRate90d: number | null;
  topSymbols90d: { symbol: string; count: number }[];
}

export interface ActivityItem {
  text: string;
  date: Date;
}

export interface TradingDNA {
  crypto: number;
  fx: number;
  stocks: number;
}

export interface ProfileData {
  stats: ProfileStats90d;
  activity: ActivityItem[];
  tradingDNA: TradingDNA;
  mutualTeams: { id: string; name: string }[];
}

const STATUS = {
  PENDING: "PENDING",
  WIN: "WIN",
  LOSS: "LOSS",
  BREAK_EVEN: "BREAK_EVEN",
  CANCELED: "CANCELED",
} as const;

export async function getProfileData(
  profileUserId: string,
  viewerId: string,
  relationship: Relationship
): Promise<{
  privacy: Awaited<ReturnType<typeof getOrCreateUserPrivacy>>;
  stats: ProfileStats90d;
  activity: ActivityItem[];
  tradingDNA: TradingDNA;
  mutualTeams: { id: string; name: string }[];
}> {
  const privacy = await getOrCreateUserPrivacy(profileUserId);
  const isFriendOrSelf = relationship === "FRIEND" || relationship === "SELF";

  const baseTradeWhere = {
    traderID: profileUserId,
    date: { gte: NINETY_DAYS_AGO },
  };

  const tradesForCounts = await prisma.trade.findMany({
    where: {
      ...baseTradeWhere,
      status: { not: STATUS.PENDING },
    },
    select: { status: true, symbol: true, exchangeName: true },
  });

  const wins90d = tradesForCounts.filter((t) => t.status === STATUS.WIN).length;
  const losses90d = tradesForCounts.filter((t) => t.status === STATUS.LOSS).length;
  const breakeven90d = tradesForCounts.filter((t) => t.status === STATUS.BREAK_EVEN).length;
  const canceled90d = tradesForCounts.filter((t) => t.status === STATUS.CANCELED).length;
  const tradeCount90d = tradesForCounts.length;
  const winRate90d =
    wins90d + losses90d > 0
      ? Math.round((wins90d / (wins90d + losses90d)) * 100)
      : null;

  const symbolCount: Record<string, number> = {};
  for (const t of tradesForCounts) {
    symbolCount[t.symbol] = (symbolCount[t.symbol] || 0) + 1;
  }
  const topSymbols90d = Object.entries(symbolCount)
    .map(([symbol, count]) => ({ symbol, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  let activity: ActivityItem[] = [];
  if (isFriendOrSelf && privacy.shareActivity) {
    const recentTrades = await prisma.trade.findMany({
      where: { traderID: profileUserId },
      select: { date: true, symbol: true, status: true, position: true },
      orderBy: { date: "desc" },
      take: 10,
    });
    activity = recentTrades.map((t) => {
      const pos = (t.position || "").toUpperCase();
      const positionLabel = pos === "LONG" || pos === "SHORT" ? pos : "LONG";
      const isOpen = (t.status || "").toUpperCase() === "PENDING";
      const text = isOpen
        ? `Opened ${t.symbol} ${positionLabel}`
        : `Closed ${t.symbol} ${positionLabel}`;
      return { text, date: t.date };
    });
  }

  const allTradesForDNA = await prisma.trade.findMany({
    where: { traderID: profileUserId, date: { gte: NINETY_DAYS_AGO } },
    select: { symbol: true, exchangeName: true },
  });
  let crypto = 0,
    fx = 0,
    stocks = 0;
  for (const t of allTradesForDNA) {
    const sym = (t.symbol || "").toUpperCase();
    const ex = (t.exchangeName || "").toLowerCase();
    if (
      sym.endsWith("USDT") ||
      sym.endsWith("USDC") ||
      ex.includes("binance") ||
      ex.includes("crypto") ||
      ex.includes("coinbase")
    ) {
      crypto++;
    } else if (/^[A-Z]{6}$/.test(sym) && (sym.includes("USD") || sym.includes("EUR") || sym.includes("GBP") || sym.includes("JPY"))) {
      fx++;
    } else {
      stocks++;
    }
  }
  const totalDNA = crypto + fx + stocks;
  const tradingDNA: TradingDNA =
    totalDNA === 0
      ? { crypto: 0, fx: 0, stocks: 0 }
      : {
          crypto: Math.round((crypto / totalDNA) * 100),
          fx: Math.round((fx / totalDNA) * 100),
          stocks: Math.round((stocks / totalDNA) * 100),
        };

  let mutualTeams: { id: string; name: string }[] = [];
  try {
    const myMemberships = await prisma.teamMember.findMany({
      where: { userID: viewerId },
      select: { teamID: true },
    });
    const profileMemberships = await prisma.teamMember.findMany({
      where: { userID: profileUserId },
      select: { teamID: true },
    });
    const myTeamIds = new Set(myMemberships.map((m) => m.teamID));
    const mutualIds = profileMemberships.filter((m) => myTeamIds.has(m.teamID)).map((m) => m.teamID);
    if (mutualIds.length > 0) {
      const teams = await prisma.team.findMany({
        where: { id: { in: mutualIds } },
        select: { id: true, name: true },
        take: 5,
      });
      mutualTeams = teams.map((t) => ({ id: t.id, name: t.name }));
    }
  } catch {
    mutualTeams = [];
  }

  return {
    privacy,
    stats: {
      tradeCount90d,
      wins90d,
      losses90d,
      breakeven90d,
      canceled90d,
      winRate90d,
      topSymbols90d,
    },
    activity,
    tradingDNA,
    mutualTeams,
  };
}
