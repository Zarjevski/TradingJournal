"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useColorMode } from "@/context/ColorModeContext";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Image from "next/image";
import Link from "next/link";

type Tab = "friends" | "requests" | "sent" | "blocked";

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

export default function FriendsClient() {
  const { colorMode } = useColorMode();
  const [tab, setTab] = useState<Tab>("friends");
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

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const doSearch = async () => {
    const q = searchQ.trim();
    if (q.length < 2) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data);
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

  const bg = colorMode === "light" ? "bg-white" : "bg-gray-800";
  const border = colorMode === "light" ? "border-gray-200" : "border-gray-700";
  const text = colorMode === "light" ? "text-gray-900" : "text-gray-100";
  const textMuted = colorMode === "light" ? "text-gray-500" : "text-gray-400";
  const tabActive = colorMode === "light" ? "bg-blue-100 text-blue-700" : "bg-purple-900/40 text-purple-300";
  const tabInactive = colorMode === "light" ? "text-gray-600 hover:bg-gray-100" : "text-gray-400 hover:bg-gray-700";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className={`text-2xl xs:text-3xl font-bold mb-4 ${text}`}>Friends</h1>

      {/* Search */}
      <div className={`${bg} border ${border} rounded-lg p-4 mb-6`}>
        <p className={`text-sm font-medium mb-2 ${text}`}>Add friend</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="Search by name or email..."
            className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
              colorMode === "light" ? "bg-white border-gray-300 text-gray-900" : "bg-gray-700 border-gray-600 text-gray-100"
            }`}
          />
          <Button text="Search" type="button" onClick={doSearch} disabled={searching || searchQ.trim().length < 2} />
        </div>
        {searchResults.length > 0 && (
          <ul className="mt-3 space-y-2">
            {searchResults.map((u) => (
              <li
                key={u.id}
                className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                  colorMode === "light" ? "bg-gray-50" : "bg-gray-700/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  {u.photoURL ? (
                    <Image src={u.photoURL} alt="" width={36} height={36} className="rounded-full object-cover" />
                  ) : (
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${colorMode === "light" ? "bg-gray-300 text-gray-700" : "bg-gray-600 text-gray-200"}`}>
                      {(u.firstName?.[0] || "") + (u.lastName?.[0] || "")}
                    </div>
                  )}
                  <span className={`font-medium ${text}`}>{u.firstName} {u.lastName}</span>
                  {u.email && <span className={`text-xs ${textMuted}`}>{u.email}</span>}
                </div>
                <Button
                  text={actionLoading === u.id ? "..." : "Send Request"}
                  onClick={() => sendRequest(u.id)}
                  disabled={!!actionLoading}
                />
              </li>
            ))}
          </ul>
        )}
        {searching && <p className={`text-sm mt-2 ${textMuted}`}>Searching...</p>}
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-4" onAnimationEnd={() => setError(null)}>
          {error}
        </p>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
        {(["friends", "requests", "sent", "blocked"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg capitalize ${tab === t ? tabActive : tabInactive}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={`${bg} border ${border} rounded-lg p-4 min-h-[200px]`}>
        {loading ? (
          <p className={textMuted}>Loading...</p>
        ) : tab === "friends" ? (
          friends.length === 0 ? (
            <p className={textMuted}>No friends yet. Search above to add someone.</p>
          ) : (
            <ul className="space-y-3">
              {friends.map((u) => (
                <li key={u.id} className={`flex items-center justify-between py-2 ${colorMode === "light" ? "border-b border-gray-100 last:border-0" : "border-b border-gray-700/50 last:border-0"}`}>
                  <div className="flex items-center gap-3">
                    {u.photoURL ? (
                      <Image src={u.photoURL} alt="" width={40} height={40} className="rounded-full object-cover" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${colorMode === "light" ? "bg-gray-300 text-gray-700" : "bg-gray-600 text-gray-200"}`}>
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
                          ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                          : "bg-gray-700 text-white hover:bg-gray-600"
                      }`}
                    >
                      View Profile
                    </Link>
                    <Button text="Remove" variant="danger" onClick={() => removeFriend(u.id)} disabled={!!actionLoading} />
                    <Button text="Block" variant="secondary" onClick={() => blockUser(u.id)} disabled={!!actionLoading} />
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
                <li key={r.id} className={`flex items-center justify-between py-2 ${colorMode === "light" ? "border-b border-gray-100 last:border-0" : "border-b border-gray-700/50 last:border-0"}`}>
                  <div className="flex items-center gap-3">
                    {r.fromUser.photoURL ? (
                      <Image src={r.fromUser.photoURL} alt="" width={40} height={40} className="rounded-full object-cover" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${colorMode === "light" ? "bg-gray-300 text-gray-700" : "bg-gray-600 text-gray-200"}`}>
                        {(r.fromUser.firstName?.[0] || "") + (r.fromUser.lastName?.[0] || "")}
                      </div>
                    )}
                    <div>
                      <span className={`font-medium ${text}`}>{r.fromUser.firstName} {r.fromUser.lastName}</span>
                      <span className={`text-xs block ${textMuted}`}>Requested</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button text="Accept" onClick={() => acceptRequest(r.id)} disabled={actionLoading === r.id} />
                    <Button text="Decline" variant="secondary" onClick={() => declineRequest(r.id)} disabled={actionLoading === r.id} />
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
                <li key={r.id} className={`flex items-center justify-between py-2 ${colorMode === "light" ? "border-b border-gray-100 last:border-0" : "border-b border-gray-700/50 last:border-0"}`}>
                  <div className="flex items-center gap-3">
                    {r.toUser.photoURL ? (
                      <Image src={r.toUser.photoURL} alt="" width={40} height={40} className="rounded-full object-cover" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${colorMode === "light" ? "bg-gray-300 text-gray-700" : "bg-gray-600 text-gray-200"}`}>
                        {(r.toUser.firstName?.[0] || "") + (r.toUser.lastName?.[0] || "")}
                      </div>
                    )}
                    <span className={`font-medium ${text}`}>{r.toUser.firstName} {r.toUser.lastName}</span>
                  </div>
                  <Button text="Cancel" variant="secondary" onClick={() => cancelRequest(r.id)} disabled={actionLoading === r.id} />
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
                <li key={b.id} className={`flex items-center justify-between py-2 ${colorMode === "light" ? "border-b border-gray-100 last:border-0" : "border-b border-gray-700/50 last:border-0"}`}>
                  <div className="flex items-center gap-3">
                    {b.photoURL ? (
                      <Image src={b.photoURL} alt="" width={40} height={40} className="rounded-full object-cover" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${colorMode === "light" ? "bg-gray-300 text-gray-700" : "bg-gray-600 text-gray-200"}`}>
                        {(b.firstName?.[0] || "") + (b.lastName?.[0] || "")}
                      </div>
                    )}
                    <span className={`font-medium ${text}`}>{b.firstName} {b.lastName}</span>
                  </div>
                  <Button text="Unblock" variant="secondary" onClick={() => unblockUser(b.userId)} disabled={actionLoading === b.userId} />
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  );
}
