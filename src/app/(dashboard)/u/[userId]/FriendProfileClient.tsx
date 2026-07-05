"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useColorMode } from "@/context/ColorModeContext";
import type { Relationship } from "@/lib/profile";
import type { ProfileStats90d, ActivityItem, TradingDNA } from "@/lib/profile";
import { formatSimpleDate } from "@/lib/dateFormat";

interface ProfileUser {
  id: string;
  firstName: string;
  lastName: string;
  photoURL: string | null;
  bio: string | null;
  status: string | null;
}

interface Privacy {
  shareTradeCount: boolean;
  shareWinRate: boolean;
  shareTopSymbols: boolean;
  shareActivity: boolean;
}

interface FriendProfileClientProps {
  profileUser: ProfileUser;
  relationship: Relationship;
  stats: ProfileStats90d;
  activity: ActivityItem[];
  tradingDNA: TradingDNA;
  mutualTeams: { id: string; name: string }[];
  privacy: Privacy;
}

export default function FriendProfileClient({
  profileUser,
  relationship,
  stats,
  activity,
  tradingDNA,
  mutualTeams,
  privacy,
}: FriendProfileClientProps) {
  const router = useRouter();
  const { colorMode } = useColorMode();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isDark = colorMode === "dark";
  const cardClass = `rounded-xl border shadow ${isDark ? "bg-slate-900/50 border-gray-700" : "bg-white border-gray-200"}`;
  const text = isDark ? "text-gray-100" : "text-gray-900";
  const muted = isDark ? "text-gray-400" : "text-gray-600";
  const label = isDark ? "text-gray-500" : "text-gray-500";

  const handleUnfriend = async () => {
    setActionLoading("unfriend");
    try {
      const res = await fetch("/api/friends", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profileUser.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push("/community");
    } catch (e: any) {
      setActionLoading(null);
      alert(e?.message || "Failed to unfriend");
    }
  };

  const handleBlock = async () => {
    setActionLoading("block");
    try {
      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profileUser.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push("/community");
    } catch (e: any) {
      setActionLoading(null);
      alert(e?.message || "Failed to block");
    }
  };

  const isFriend = relationship === "FRIEND";
  const isSelf = relationship === "SELF";
  const showFriendOnly = isFriend || isSelf;

  const marketsTraded = "Not set";
  const styleTags = "Not set";
  const preferredSession = "Not set";
  const riskStyle = "Not set";

  const focusLabel =
    tradingDNA.crypto >= tradingDNA.fx && tradingDNA.crypto >= tradingDNA.stocks && (tradingDNA.crypto > 0 || tradingDNA.fx + tradingDNA.stocks === 0)
      ? "Crypto"
      : tradingDNA.fx >= tradingDNA.stocks && tradingDNA.fx > 0
        ? "FX"
        : tradingDNA.stocks > 0
          ? "Stocks/Index"
          : "—";

  return (
    <div className={`min-h-full w-full app-bg ${text}`}>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        {/* Hero */}
        <div className={`${cardClass} p-6 mb-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-shrink-0">
              {profileUser.photoURL ? (
                <Image
                  src={profileUser.photoURL}
                  alt={`${profileUser.firstName} ${profileUser.lastName}`}
                  width={96}
                  height={96}
                  className="rounded-full object-cover border-2 border-gray-600"
                />
              ) : (
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold ${
                    isDark ? "bg-zinc-600 text-white" : "bg-zinc-800 text-white"
                  }`}
                >
                  {(profileUser.firstName?.[0] || "") + (profileUser.lastName?.[0] || "")}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold">
                {profileUser.firstName} {profileUser.lastName}
              </h1>
              <p className={`text-sm ${muted} mt-1`}>
                {marketsTraded} · {styleTags} · {preferredSession}
              </p>
              {profileUser.bio && (
                <p className={`text-sm ${muted} mt-2`}>{profileUser.bio}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                <Link
                  href="/community"
                  className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium ${
                    isDark ? "bg-zinc-700 text-gray-200 hover:bg-zinc-600" : "bg-zinc-200 text-gray-800 hover:bg-zinc-300"
                  }`}
                >
                  Back to Friends
                </Link>
                {!isSelf && (
                  <>
                    <Link
                      href="/community"
                      className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium ${
                        isDark ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200" : "bg-zinc-900 text-white hover:bg-zinc-800"
                      }`}
                    >
                      Message
                    </Link>
                    {isFriend && (
                      <button
                        onClick={handleUnfriend}
                        disabled={!!actionLoading}
                        className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium bg-zinc-600 text-white hover:bg-zinc-700 disabled:opacity-50"
                      >
                        {actionLoading === "unfriend" ? "..." : "Unfriend"}
                      </button>
                    )}
                    <button
                      onClick={handleBlock}
                      disabled={!!actionLoading}
                      className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium border border-red-500 text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      {actionLoading === "block" ? "..." : "Block"}
                    </button>
                  </>
                )}
                {isSelf && (
                  <Link
                    href="/settings/information"
                    className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium ${
                      isDark ? "text-zinc-400 hover:underline" : "text-zinc-900 hover:underline"
                    }`}
                  >
                    Edit profile
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* About / Trader Identity */}
            <div className={cardClass}>
              <div className="p-4 border-b border-gray-700/50">
                <h2 className="text-lg font-semibold">About</h2>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className={`text-xs uppercase tracking-wide ${label}`}>Markets traded</p>
                  <p className={text}>{marketsTraded}</p>
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-wide ${label}`}>Style</p>
                  <p className={text}>{styleTags}</p>
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-wide ${label}`}>Preferred session</p>
                  <p className={text}>{preferredSession}</p>
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-wide ${label}`}>Risk style</p>
                  <p className={text}>{riskStyle}</p>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className={cardClass}>
              <div className="p-4 border-b border-gray-700/50">
                <h2 className="text-lg font-semibold">Activity</h2>
              </div>
              <div className="p-4">
                {showFriendOnly && privacy.shareActivity ? (
                  activity.length === 0 ? (
                    <p className={muted}>No recent activity</p>
                  ) : (
                    <ul className="space-y-2">
                      {activity.map((a, i) => (
                        <li key={i} className={`text-sm ${muted}`}>
                          <span className={text}>{a.text}</span>
                          <span className="ml-2">{formatSimpleDate(a.date)}</span>
                        </li>
                      ))}
                    </ul>
                  )
                ) : (
                  <p className={muted}>Activity is private</p>
                )}
              </div>
            </div>

            {/* Mutual teams */}
            <div className={cardClass}>
              <div className="p-4 border-b border-gray-700/50">
                <h2 className="text-lg font-semibold">Mutual teams</h2>
              </div>
              <div className="p-4">
                {mutualTeams.length === 0 ? (
                  <p className={muted}>Coming soon</p>
                ) : (
                  <ul className="space-y-2">
                    {mutualTeams.map((t) => (
                      <li key={t.id}>
                        <Link
                          href={`/community/teams/${t.id}`}
                          className={isDark ? "text-zinc-400 hover:underline" : "text-zinc-900 hover:underline"}
                        >
                          {t.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Snapshot */}
            <div className={cardClass}>
              <div className="p-4 border-b border-gray-700/50">
                <h2 className="text-lg font-semibold">Snapshot</h2>
              </div>
              <div className="p-4 space-y-4">
                {!showFriendOnly ? (
                  <p className={muted}>Add as friend to see stats (if they share them).</p>
                ) : (
                  <>
                    {privacy.shareTradeCount && (
                      <div>
                        <p className={`text-xs uppercase tracking-wide ${label}`}>Trades (90d)</p>
                        <p className="text-xl font-semibold">{stats.tradeCount90d}</p>
                      </div>
                    )}
                    {privacy.shareWinRate && stats.winRate90d !== null && (
                      <div>
                        <p className={`text-xs uppercase tracking-wide ${label}`}>Win rate (90d)</p>
                        <p className="text-xl font-semibold">{stats.winRate90d}%</p>
                      </div>
                    )}
                    {privacy.shareTopSymbols && stats.topSymbols90d[0] && (
                      <div>
                        <p className={`text-xs uppercase tracking-wide ${label}`}>Most traded</p>
                        <p className="text-xl font-semibold">{stats.topSymbols90d[0].symbol}</p>
                      </div>
                    )}
                    <div>
                      <p className={`text-xs uppercase tracking-wide ${label}`}>Focus</p>
                      <p className="text-lg font-medium">{focusLabel}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Performance (friend-only, counts + bars) */}
            {showFriendOnly && (
              <div className={cardClass}>
                <div className="p-4 border-b border-gray-700/50">
                  <h2 className="text-lg font-semibold">Performance</h2>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className={label}>Wins</p>
                      <p className="font-semibold text-green-500">{stats.wins90d}</p>
                    </div>
                    <div>
                      <p className={label}>Losses</p>
                      <p className="font-semibold text-red-500">{stats.losses90d}</p>
                    </div>
                    <div>
                      <p className={label}>Breakeven</p>
                      <p className={`font-semibold ${muted}`}>{stats.breakeven90d}</p>
                    </div>
                    <div>
                      <p className={label}>Canceled</p>
                      <p className={`font-semibold ${muted}`}>{stats.canceled90d}</p>
                    </div>
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-wide ${label} mb-2`}>Trading DNA</p>
                    <div className="flex h-3 rounded-full overflow-hidden bg-zinc-700/50">
                      {tradingDNA.crypto > 0 && (
                        <div
                          className="bg-amber-500"
                          style={{ width: `${tradingDNA.crypto}%` }}
                          title="Crypto"
                        />
                      )}
                      {tradingDNA.fx > 0 && (
                        <div
                          className="bg-zinc-500"
                          style={{ width: `${tradingDNA.fx}%` }}
                          title="FX"
                        />
                      )}
                      {tradingDNA.stocks > 0 && (
                        <div
                          className="bg-emerald-500"
                          style={{ width: `${tradingDNA.stocks}%` }}
                          title="Stocks"
                        />
                      )}
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span>Crypto {tradingDNA.crypto}%</span>
                      <span>FX {tradingDNA.fx}%</span>
                      <span>Stocks {tradingDNA.stocks}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
