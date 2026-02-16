"use client";

import React from "react";
import Image from "next/image";

export interface FriendWithPresence {
  id: string;
  firstName: string;
  lastName: string;
  photoURL: string | null;
  presence?: { status: string; updatedAt: string } | null;
}

export interface ConversationItem {
  id: string;
  friend: FriendWithPresence;
  lastMessage: { content: string; createdAt: string; senderID: string } | null;
  presence?: { status: string; updatedAt: string } | null;
  updatedAt: string;
}

interface ChatListProps {
  friends: FriendWithPresence[];
  conversations: ConversationItem[];
  selectedConversationId: string | null;
  selectedFriendId: string | null;
  onSelect: (conversationId: string | null, friend: FriendWithPresence, conversationExists: boolean) => void;
  isDark?: boolean;
}

function formatActive(updatedAt: string): string {
  const ms = Date.now() - new Date(updatedAt).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "Active now";
  if (mins < 60) return `Active ${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Active ${days}d ago`;
}

function snippet(content: string, max = 35): string {
  const t = content.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : t.slice(0, max) + "…";
}

export default function ChatList({
  friends,
  conversations,
  selectedConversationId,
  selectedFriendId,
  onSelect,
  isDark = true,
}: ChatListProps) {
  const convByFriendId = new Map(conversations.map((c) => [c.friend.id, c]));

  const merged: Array<{
    friend: FriendWithPresence;
    conversationId: string | null;
    lastMessage: ConversationItem["lastMessage"];
    presence: ConversationItem["presence"];
    updatedAt: string;
  }> = friends.map((f) => {
    const conv = convByFriendId.get(f.id);
    return {
      friend: { ...f, presence: f.presence ?? conv?.presence ?? null },
      conversationId: conv?.id ?? null,
      lastMessage: conv?.lastMessage ?? null,
      presence: f.presence ?? conv?.presence ?? null,
      updatedAt: conv?.updatedAt ?? f.id,
    };
  });

  merged.sort((a, b) => {
    const aOnline = a.presence?.status === "ONLINE" ? 1 : 0;
    const bOnline = b.presence?.status === "ONLINE" ? 1 : 0;
    if (bOnline !== aOnline) return bOnline - aOnline;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const border = isDark ? "border-gray-600" : "border-gray-200";
  const hover = isDark ? "hover:bg-slate-700" : "hover:bg-gray-100";
  const selected = isDark ? "bg-slate-700" : "bg-gray-100";
  const text = isDark ? "text-slate-100" : "text-gray-900";
  const textMuted = isDark ? "text-slate-400" : "text-gray-500";
  const listBg = isDark ? "bg-slate-900" : "bg-white";

  return (
    <div className={`flex flex-col h-full min-h-0 overflow-hidden w-full ${listBg}`}>
      <div className={`flex-1 min-h-0 overflow-y-auto w-full ${listBg}`}>
        {merged.length === 0 ? (
          <p className={`p-3 text-sm ${textMuted}`}>No friends to chat with yet.</p>
        ) : (
          merged.map((item) => {
            const isSelected =
              (item.conversationId && item.conversationId === selectedConversationId) ||
              (!item.conversationId && item.friend.id === selectedFriendId);
            const isOnline = item.presence?.status === "ONLINE";
            return (
              <button
                key={item.friend.id}
                type="button"
                onClick={() =>
                  onSelect(item.conversationId, item.friend, !!item.conversationId)
                }
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b ${border} ${hover} ${isSelected ? selected : ""}`}
              >
                <div className="relative flex-shrink-0">
                  {item.friend.photoURL ? (
                    <Image
                      src={item.friend.photoURL}
                      alt=""
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                        isDark ? "bg-slate-600 text-slate-200" : "bg-gray-300 text-gray-700"
                      }`}
                    >
                      {(item.friend.firstName?.[0] || "") + (item.friend.lastName?.[0] || "")}
                    </div>
                  )}
                  {isOnline && (
                    <span
                      className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-slate-900"
                      title="Online"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${text}`}>
                    {item.friend.firstName} {item.friend.lastName}
                  </p>
                  <p className={`text-xs truncate ${textMuted}`}>
                    {item.lastMessage
                      ? snippet(item.lastMessage.content)
                      : isOnline
                      ? "Online"
                      : item.presence?.updatedAt
                      ? formatActive(item.presence.updatedAt)
                      : "No messages yet"}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
