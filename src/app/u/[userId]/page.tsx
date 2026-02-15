import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { isFriend, hasBlockBetween, isValidObjectId, getOrCreateUserPrivacy } from "@/lib/friends";
import Image from "next/image";
import Link from "next/link";

const NINETY_DAYS_AGO = new Date();
NINETY_DAYS_AGO.setDate(NINETY_DAYS_AGO.getDate() - 90);

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Please sign in to view profiles.</p>
        <Link href="/auth/login" className="text-blue-600 underline mt-2 inline-block">
          Sign in
        </Link>
      </div>
    );
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) notFound();

  const { userId } = await params;
  if (!userId || !isValidObjectId(userId)) notFound();

  const profileUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photoURL: true,
      bio: true,
    },
  });
  if (!profileUser) notFound();

  const isSelf = me.id === profileUser.id;
  const blocked = await hasBlockBetween(me.id, profileUser.id);
  const friend = await isFriend(me.id, profileUser.id);

  if (blocked && !isSelf) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-gray-800 text-gray-200 rounded-lg p-6 text-center">
          <p className="font-medium">You cannot view this profile.</p>
          <p className="text-sm text-gray-400 mt-1">This user is blocked or has blocked you.</p>
          <Link href="/friends" className="text-purple-400 underline mt-3 inline-block">
            Back to Friends
          </Link>
        </div>
      </div>
    );
  }

  const privacy = await getOrCreateUserPrivacy(profileUser.id);
  let tradeCount: number | null = null;
  let winRate: number | null = null;
  let topSymbols: { symbol: string; count: number }[] = [];
  let activity: { action: string; date: Date; symbol: string }[] = [];

  if (friend || isSelf) {
    if (privacy.shareTradeCount) {
      tradeCount = await prisma.trade.count({
        where: {
          traderID: profileUser.id,
          date: { gte: NINETY_DAYS_AGO },
        },
      });
    }
    if (privacy.shareWinRate) {
      const trades = await prisma.trade.findMany({
        where: {
          traderID: profileUser.id,
          date: { gte: NINETY_DAYS_AGO },
          result: { not: 0 },
        },
        select: { result: true },
      });
      const wins = trades.filter((t) => t.result > 0).length;
      const losses = trades.filter((t) => t.result < 0).length;
      const total = wins + losses;
      winRate = total > 0 ? Math.round((wins / total) * 100) : null;
    }
    if (privacy.shareTopSymbols) {
      const trades = await prisma.trade.findMany({
        where: {
          traderID: profileUser.id,
          date: { gte: NINETY_DAYS_AGO },
        },
        select: { symbol: true },
      });
      const countBySymbol: Record<string, number> = {};
      for (const t of trades) {
        countBySymbol[t.symbol] = (countBySymbol[t.symbol] || 0) + 1;
      }
      topSymbols = Object.entries(countBySymbol)
        .map(([symbol, count]) => ({ symbol, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }
    if (privacy.shareActivity) {
      const recentTrades = await prisma.trade.findMany({
        where: { traderID: profileUser.id },
        select: { date: true, symbol: true, status: true },
        orderBy: { date: "desc" },
        take: 10,
      });
      activity = recentTrades.map((t) => ({
        action: (t.status || "").toUpperCase() === "OPEN" ? "Opened" : "Closed",
        date: t.date,
        symbol: t.symbol,
      }));
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            {profileUser.photoURL ? (
              <Image
                src={profileUser.photoURL}
                alt=""
                width={80}
                height={80}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center text-2xl font-bold text-gray-300">
                {(profileUser.firstName?.[0] || "") + (profileUser.lastName?.[0] || "")}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">
                {profileUser.firstName} {profileUser.lastName}
              </h1>
              {isSelf && (
                <Link
                  href="/settings/information"
                  className="text-sm text-purple-400 hover:underline"
                >
                  Edit profile
                </Link>
              )}
            </div>
          </div>
          {profileUser.bio && (
            <p className="mt-3 text-gray-300 text-sm">{profileUser.bio}</p>
          )}
        </div>

        {/* Friend-only stats */}
        {(friend || isSelf) && (privacy.shareTradeCount || privacy.shareWinRate || privacy.shareTopSymbols) && (
          <div className="p-6 border-b border-gray-700 space-y-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Stats (last 90 days)
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {privacy.shareTradeCount && tradeCount !== null && (
                <div>
                  <p className="text-2xl font-bold text-white">{tradeCount}</p>
                  <p className="text-xs text-gray-500">Trades</p>
                </div>
              )}
              {privacy.shareWinRate && winRate !== null && (
                <div>
                  <p className="text-2xl font-bold text-white">{winRate}%</p>
                  <p className="text-xs text-gray-500">Win rate</p>
                </div>
              )}
            </div>
            {privacy.shareTopSymbols && topSymbols.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Top symbols</p>
                <div className="flex flex-wrap gap-2">
                  {topSymbols.map((s) => (
                    <span
                      key={s.symbol}
                      className="px-2 py-1 rounded bg-gray-700 text-gray-200 text-sm"
                    >
                      {s.symbol} ({s.count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity */}
        {(friend || isSelf) && privacy.shareActivity && activity.length > 0 && (
          <div className="p-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Recent activity
            </h2>
            <ul className="space-y-2">
              {activity.map((a, i) => (
                <li key={i} className="text-sm text-gray-300">
                  {a.action} {a.symbol} — {a.date.toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!friend && !isSelf && (
          <div className="p-6 text-center text-gray-500 text-sm">
            Add this user as a friend to see their stats and activity (if they share it).
          </div>
        )}
      </div>
      <div className="mt-4">
        <Link href="/friends" className="text-purple-400 hover:underline text-sm">
          ← Back to Friends
        </Link>
      </div>
    </div>
  );
}
