"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useColorMode } from "@/context/ColorModeContext";
import { useUserContext } from "@/context/UserContext";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";

type SubTab = "leaderboard" | "friends" | "requests" | "sent" | "blocked";

interface FriendUser {
  id: string;
  firstName: string;
  lastName: string;
  photoURL: string | null;
  email?: string;
  friendshipId?: string;
}

interface IncomingRequest {
  id: string;
  fromUser: FriendUser;
  createdAt: string;
}

interface OutgoingRequest {
  id: string;
  toUser: FriendUser;
  createdAt: string;
}

interface BlockedUser {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  photoURL: string | null;
  createdAt: string;
}

interface PeopleLeaderboardEntry {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string | null;
  totalPnL: number;
  tradeCount: number;
}

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: "leaderboard", label: "Leaderboard" },
  { id: "friends", label: "Friends" },
  { id: "requests", label: "Requests" },
  { id: "sent", label: "Sent" },
  { id: "blocked", label: "Blocked" },
];

export default function PeopleTab() {
  const { colorMode } = useColorMode();
  const { user: currentUser } = useUserContext();
  const [tab, setTab] = useState<SubTab>("leaderboard");
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incoming, setIncoming] = useState<IncomingRequest[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingRequest[]>([]);
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<PeopleLeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  const loadFriends = useCallback(async () => {
    try {
      const [frRes, reqRes, blRes] = await Promise.all([
        fetch("/api/friends"),
        fetch("/api/friends/requests"),
        fetch("/api/blocks"),
      ]);
      if (!frRes.ok || !reqRes.ok || !blRes.ok) throw new Error("Failed to load");
      const friendsData = await frRes.json();
      const reqData = await reqRes.json();
      const blocksData = await blRes.json();
      setFriends(friendsData);
      setIncoming(reqData.incoming ?? []);
      setOutgoing(reqData.outgoing ?? []);
      setBlocked(blocksData ?? []);
    } catch (e) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    setLeaderboardError(null);
    try {
      const res = await fetch("/api/leaderboard/people");
      if (!res.ok) throw new Error("Failed to load");
      setLeaderboard(await res.json());
    } catch {
      setLeaderboardError("Failed to load leaderboard");
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFriends();
    loadLeaderboard();
  }, [loadFriends, loadLeaderboard]);

  const doSearch = async () => {
    const q = searchQ.trim();
    if (q.length < 2) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("Search failed");
      setSearchResults(await res.json());
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const sendRequest = async (toUserId: string) => {
    setActionLoading(toUserId);
    try {
      const res = await fetch("/api/friends/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      await loadFriends();
      setSearchResults((prev) => prev.filter((u) => u.id !== toUserId));
    } catch (e: any) {
      setError(e.message || "Failed to send request");
    } finally {
      setActionLoading(null);
    }
  };

  const acceptRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const res = await fetch(`/api/friends/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      if (!res.ok) throw new Error("Failed");
      await loadFriends();
    } catch {
      setError("Failed to accept");
    } finally {
      setActionLoading(null);
    }
  };

  const declineRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const res = await fetch(`/api/friends/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      });
      if (!res.ok) throw new Error("Failed");
      await loadFriends();
    } catch {
      setError("Failed to decline");
    } finally {
      setActionLoading(null);
    }
  };

  const cancelRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const res = await fetch(`/api/friends/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (!res.ok) throw new Error("Failed");
      await loadFriends();
    } catch {
      setError("Failed to cancel");
    } finally {
      setActionLoading(null);
    }
  };

  const removeFriend = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/friends", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed");
      await loadFriends();
    } catch {
      setError("Failed to remove");
    } finally {
      setActionLoading(null);
    }
  };

  const blockUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed");
      await loadFriends();
    } catch {
      setError("Failed to block");
    } finally {
      setActionLoading(null);
    }
  };

  const unblockUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/blocks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed");
      await loadFriends();
    } catch {
      setError("Failed to unblock");
    } finally {
      setActionLoading(null);
    }
  };

  const bg = colorMode === "light" ? "bg-white" : "bg-zinc-900";
  const border = colorMode === "light" ? "border-zinc-200" : "border-zinc-800";
  const text = colorMode === "light" ? "text-gray-900" : "text-gray-100";
  const textMuted = colorMode === "light" ? "text-gray-500" : "text-gray-400";
  const tabActive = colorMode === "light" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-900";
  const tabInactive = colorMode === "light" ? "text-gray-600 hover:bg-zinc-100" : "text-gray-400 hover:bg-zinc-800";

  const friendIds = new Set(friends.map((f) => f.id));
  const outgoingByUserId = new Map(outgoing.map((r) => [r.toUser.id, r.id]));
  const incomingByUserId = new Map(incoming.map((r) => [r.fromUser.id, r.id]));

  const renderRelationAction = (userId: string) => {
    if (currentUser?.id === userId) return null;
    if (friendIds.has(userId)) {
      return (
        <Badge variant="success" size="sm">
          Friends
        </Badge>
      );
    }
    const incomingId = incomingByUserId.get(userId);
    if (incomingId) {
      return (
        <Button size="sm" onClick={() => acceptRequest(incomingId)} disabled={actionLoading === incomingId}>
          Accept Request
        </Button>
      );
    }
    if (outgoingByUserId.has(userId)) {
      return (
        <Badge variant="default" size="sm">
          Requested
        </Badge>
      );
    }
    return (
      <Button size="sm" onClick={() => sendRequest(userId)} disabled={!!actionLoading}>
        {actionLoading === userId ? "..." : "Add Friend"}
      </Button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className={`${bg} border ${border} rounded-lg p-4`}>
        <p className={`text-sm font-medium mb-2 ${text}`}>Add friend</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="Search by name or email..."
            className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
              colorMode === "light" ? "bg-white border-zinc-300 text-gray-900" : "bg-zinc-800 border-zinc-700 text-gray-100"
            }`}
          />
          <Button type="button" onClick={doSearch} disabled={searching || searchQ.trim().length < 2}>
            Search
          </Button>
        </div>
        {searchResults.length > 0 && (
          <ul className="mt-3 space-y-2">
            {searchResults.map((u) => (
              <li
                key={u.id}
                className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                  colorMode === "light" ? "bg-zinc-50" : "bg-zinc-800/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  {u.photoURL ? (
                    <Image src={u.photoURL} alt="" width={36} height={36} className="rounded-full object-cover" />
                  ) : (
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${colorMode === "light" ? "bg-zinc-200 text-gray-700" : "bg-zinc-700 text-gray-200"}`}>
                      {(u.firstName?.[0] || "") + (u.lastName?.[0] || "")}
                    </div>
                  )}
                  <span className={`font-medium ${text}`}>{u.firstName} {u.lastName}</span>
                  {u.email && <span className={`text-xs ${textMuted}`}>{u.email}</span>}
                </div>
                {renderRelationAction(u.id)}
              </li>
            ))}
          </ul>
        )}
        {searching && <p className={`text-sm mt-2 ${textMuted}`}>Searching...</p>}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Sub-tabs */}
      <div className={`inline-flex flex-wrap gap-1 rounded-lg border p-1 ${border} ${bg}`}>
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t.id ? tabActive : tabInactive}`}
          >
            {t.label}
            {t.id === "requests" && incoming.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[10px] bg-red-500 text-white">
                {incoming.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={`${bg} border ${border} rounded-lg p-4 min-h-[200px]`}>
        {tab === "leaderboard" ? (
          leaderboardError ? (
            <p className="text-red-500 text-sm">{leaderboardError}</p>
          ) : leaderboardLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : leaderboard.length === 0 ? (
            <p className={textMuted}>No traders with trades yet.</p>
          ) : (
            <ul className="space-y-3">
              {leaderboard.map((entry, index) => (
                <li
                  key={entry.userId}
                  className={`flex items-center justify-between gap-3 py-2 ${colorMode === "light" ? "border-b border-zinc-100 last:border-0" : "border-b border-zinc-800/50 last:border-0"}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-sm font-semibold text-gray-500 shrink-0">#{index + 1}</span>
                    {entry.photoURL ? (
                      <Image src={entry.photoURL} alt="" width={40} height={40} className="rounded-full object-cover shrink-0" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${colorMode === "light" ? "bg-zinc-200 text-gray-700" : "bg-zinc-700 text-gray-200"}`}>
                        {entry.firstName?.[0]}{entry.lastName?.[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <Link href={`/u/${entry.userId}`} className={`font-medium hover:underline ${text}`}>
                        {entry.firstName} {entry.lastName}
                      </Link>
                      <p className={`text-xs ${textMuted}`}>{entry.tradeCount} trade{entry.tradeCount !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className={`text-sm font-bold ${entry.totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {entry.totalPnL >= 0 ? "+" : "-"}${Math.abs(entry.totalPnL).toLocaleString()}
                    </p>
                    {renderRelationAction(entry.userId)}
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : loading ? (
          <p className={textMuted}>Loading...</p>
        ) : tab === "friends" ? (
          friends.length === 0 ? (
            <p className={textMuted}>No friends yet. Search above to add someone, or check the leaderboard.</p>
          ) : (
            <ul className="space-y-3">
              {friends.map((u) => (
                <li key={u.id} className={`flex items-center justify-between py-2 ${colorMode === "light" ? "border-b border-zinc-100 last:border-0" : "border-b border-zinc-800/50 last:border-0"}`}>
                  <div className="flex items-center gap-3">
                    {u.photoURL ? (
                      <Image src={u.photoURL} alt="" width={40} height={40} className="rounded-full object-cover" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${colorMode === "light" ? "bg-zinc-200 text-gray-700" : "bg-zinc-700 text-gray-200"}`}>
                        {(u.firstName?.[0] || "") + (u.lastName?.[0] || "")}
                      </div>
                    )}
                    <span className={`font-medium ${text}`}>{u.firstName} {u.lastName}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/u/${u.id}`}
                      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold text-sm ${
                        colorMode === "light"
                          ? "bg-zinc-100 text-gray-900 hover:bg-zinc-200"
                          : "bg-zinc-800 text-white hover:bg-zinc-700"
                      }`}
                    >
                      View Profile
                    </Link>
                    <Button variant="danger" onClick={() => removeFriend(u.id)} disabled={!!actionLoading}>Remove</Button>
                    <Button variant="secondary" onClick={() => blockUser(u.id)} disabled={!!actionLoading}>Block</Button>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : tab === "requests" ? (
          incoming.length === 0 ? (
            <p className={textMuted}>No incoming requests.</p>
          ) : (
            <ul className="space-y-3">
              {incoming.map((r) => (
                <li key={r.id} className={`flex items-center justify-between py-2 ${colorMode === "light" ? "border-b border-zinc-100 last:border-0" : "border-b border-zinc-800/50 last:border-0"}`}>
                  <div className="flex items-center gap-3">
                    {r.fromUser.photoURL ? (
                      <Image src={r.fromUser.photoURL} alt="" width={40} height={40} className="rounded-full object-cover" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${colorMode === "light" ? "bg-zinc-200 text-gray-700" : "bg-zinc-700 text-gray-200"}`}>
                        {(r.fromUser.firstName?.[0] || "") + (r.fromUser.lastName?.[0] || "")}
                      </div>
                    )}
                    <div>
                      <span className={`font-medium ${text}`}>{r.fromUser.firstName} {r.fromUser.lastName}</span>
                      <span className={`text-xs block ${textMuted}`}>Requested</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => acceptRequest(r.id)} disabled={actionLoading === r.id}>Accept</Button>
                    <Button variant="secondary" onClick={() => declineRequest(r.id)} disabled={actionLoading === r.id}>Decline</Button>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : tab === "sent" ? (
          outgoing.length === 0 ? (
            <p className={textMuted}>No pending sent requests.</p>
          ) : (
            <ul className="space-y-3">
              {outgoing.map((r) => (
                <li key={r.id} className={`flex items-center justify-between py-2 ${colorMode === "light" ? "border-b border-zinc-100 last:border-0" : "border-b border-zinc-800/50 last:border-0"}`}>
                  <div className="flex items-center gap-3">
                    {r.toUser.photoURL ? (
                      <Image src={r.toUser.photoURL} alt="" width={40} height={40} className="rounded-full object-cover" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${colorMode === "light" ? "bg-zinc-200 text-gray-700" : "bg-zinc-700 text-gray-200"}`}>
                        {(r.toUser.firstName?.[0] || "") + (r.toUser.lastName?.[0] || "")}
                      </div>
                    )}
                    <span className={`font-medium ${text}`}>{r.toUser.firstName} {r.toUser.lastName}</span>
                  </div>
                  <Button variant="secondary" onClick={() => cancelRequest(r.id)} disabled={actionLoading === r.id}>Cancel</Button>
                </li>
              ))}
            </ul>
          )
        ) : (
          blocked.length === 0 ? (
            <p className={textMuted}>No blocked users.</p>
          ) : (
            <ul className="space-y-3">
              {blocked.map((b) => (
                <li key={b.id} className={`flex items-center justify-between py-2 ${colorMode === "light" ? "border-b border-zinc-100 last:border-0" : "border-b border-zinc-800/50 last:border-0"}`}>
                  <div className="flex items-center gap-3">
                    {b.photoURL ? (
                      <Image src={b.photoURL} alt="" width={40} height={40} className="rounded-full object-cover" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${colorMode === "light" ? "bg-zinc-200 text-gray-700" : "bg-zinc-700 text-gray-200"}`}>
                        {(b.firstName?.[0] || "") + (b.lastName?.[0] || "")}
                      </div>
                    )}
                    <span className={`font-medium ${text}`}>{b.firstName} {b.lastName}</span>
                  </div>
                  <Button variant="secondary" onClick={() => unblockUser(b.userId)} disabled={actionLoading === b.userId}>Unblock</Button>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  );
}
