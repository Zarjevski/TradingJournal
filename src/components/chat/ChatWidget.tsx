"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useUserContext } from "@/context/UserContext";
import { useColorMode } from "@/context/ColorModeContext";
import { IoCloseOutline } from "react-icons/io5";
import ChatPanel from "./ChatPanel";
import Button from "../common/Button";
import type { ConversationItem, FriendWithPresence } from "./ChatList";
import type { ChatMessage } from "./ChatThread";

const HEARTBEAT_INTERVAL_MS = 20_000;
const PRESENCE_POLL_MS = 10_000;
const MESSAGES_POLL_MS = 2_000;

export default function ChatWidget() {
  const { data: session, status } = useSession();
  const { user } = useUserContext();
  const { colorMode } = useColorMode();
  const [open, setOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [friends, setFriends] = useState<FriendWithPresence[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    photoURL: string | null;
  } | null>(null);
  const [openingFriendId, setOpeningFriendId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesSinceRef = useRef<number>(0);

  const myUserId = user?.id ?? (session?.user as { id?: string } | null)?.id ?? null;
  const isDark = colorMode === "dark";
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const fetchPresence = useCallback(async () => {
    if (!myUserId) return;
    try {
      const res = await fetch("/api/presence/friends");
      if (!res.ok) return;
      const data = await res.json();
      setOnlineCount(data.onlineCount ?? 0);
      const map = new Map<string, { status: string; updatedAt: string }>();
      for (const f of data.friends ?? []) {
        map.set(f.userId, { status: f.status, updatedAt: f.updatedAt });
      }
      setFriends((prev) =>
        prev.map((p) => ({
          ...p,
          presence: map.get(p.id) ?? null,
        }))
      );
      setConversations((prev) =>
        prev.map((c) => ({
          ...c,
          friend: { ...c.friend, presence: map.get(c.friend.id) ?? c.friend.presence ?? null },
          presence: map.get(c.friend.id) ? { status: map.get(c.friend.id)!.status, updatedAt: map.get(c.friend.id)!.updatedAt } : c.presence,
        }))
      );
    } catch {
      // ignore
    }
  }, [myUserId]);

  const heartbeat = useCallback(async () => {
    if (!myUserId) return;
    try {
      await fetch("/api/presence/heartbeat", { method: "POST" });
    } catch {
      // ignore
    }
  }, [myUserId]);

  const fetchFriends = useCallback(async () => {
    if (!myUserId) return;
    try {
      const res = await fetch("/api/friends");
      if (!res.ok) return;
      const list = await res.json();
      setFriends(
        list.map((u: { id: string; firstName: string; lastName: string; photoURL: string | null }) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          photoURL: u.photoURL,
          presence: null,
        }))
      );
    } catch {
      // ignore
    }
  }, [myUserId]);

  const fetchConversations = useCallback(async () => {
    if (!myUserId) return;
    try {
      const res = await fetch("/api/chat/conversations");
      if (!res.ok) return;
      const list = await res.json();
      setConversations(list);
    } catch {
      // ignore
    }
  }, [myUserId]);

  const fetchMessages = useCallback(
    async (convId: string, since?: number) => {
      if (!myUserId) return;
      setMessagesLoading(true);
      try {
        const url = since
          ? `/api/chat/conversations/${convId}/messages?since=${since}`
          : `/api/chat/conversations/${convId}/messages`;
        const res = await fetch(url);
        if (!res.ok) return;
        const list = await res.json();
        if (since) {
          setMessages((prev) => {
            const existing = new Set(prev.map((m) => m.id));
            const newOnes = list.filter((m: ChatMessage) => !existing.has(m.id));
            return newOnes.length ? [...prev, ...newOnes] : prev;
          });
        } else {
          setMessages(list);
        }
        if (list.length > 0) {
          const last = list[list.length - 1];
          messagesSinceRef.current = new Date(last.createdAt).getTime();
        }
      } catch {
        // ignore
      } finally {
        setMessagesLoading(false);
      }
    },
    [myUserId]
  );

  useEffect(() => {
    if (status !== "authenticated" || !myUserId) return;
    heartbeat();
    const h = setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(h);
  }, [status, myUserId, heartbeat]);

  useEffect(() => {
    if (status !== "authenticated" || !myUserId) return;
    fetchFriends();
    fetchConversations();
  }, [status, myUserId, fetchFriends, fetchConversations]);

  useEffect(() => {
    if (open && myUserId) {
      fetchFriends();
      fetchConversations();
      fetchPresence();
    }
  }, [open, myUserId, fetchFriends, fetchConversations, fetchPresence]);

  useEffect(() => {
    if (status !== "authenticated" || !myUserId || !open) return;
    fetchPresence();
    const t = setInterval(fetchPresence, PRESENCE_POLL_MS);
    return () => clearInterval(t);
  }, [status, myUserId, open, fetchPresence]);

  useEffect(() => {
    if (!open || !selectedConversationId || !myUserId) return;
    fetchMessages(selectedConversationId);
    const t = setInterval(
      () => fetchMessages(selectedConversationId, messagesSinceRef.current || undefined),
      MESSAGES_POLL_MS
    );
    return () => clearInterval(t);
  }, [open, selectedConversationId, myUserId, fetchMessages]);

  const handleSelectConversation = useCallback(
    async (convId: string | null, friend: FriendWithPresence, exists: boolean) => {
      setSendError(null);
      if (exists && convId) {
        setOpeningFriendId(null);
        setSelectedConversationId(convId);
        setSelectedFriend({
          id: friend.id,
          firstName: friend.firstName,
          lastName: friend.lastName,
          photoURL: friend.photoURL,
        });
        messagesSinceRef.current = 0;
        return;
      }
      setOpeningFriendId(friend.id);
      try {
        const res = await fetch("/api/chat/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ friendId: friend.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setSelectedConversationId(data.conversationId);
        setSelectedFriend({
          id: friend.id,
          firstName: friend.firstName,
          lastName: friend.lastName,
          photoURL: friend.photoURL,
        });
        setOpeningFriendId(null);
        messagesSinceRef.current = 0;
        setMessages([]);
        setConversations((prev) => {
          const has = prev.some((c) => c.friend.id === friend.id);
          if (has) return prev;
          return [
            {
              id: data.conversationId,
              friend: { ...friend, presence: friend.presence ?? null },
              lastMessage: null,
              presence: friend.presence ?? null,
              updatedAt: new Date().toISOString(),
            },
            ...prev,
          ];
        });
      } catch {
        setSendError("Could not start conversation");
        setOpeningFriendId(null);
      }
    },
    []
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedConversationId) return;
      setSendError(null);
      try {
        const res = await fetch(`/api/chat/conversations/${selectedConversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setMessages((prev) => [
          ...prev,
          {
            id: data.id,
            senderID: data.senderID,
            content: data.content,
            createdAt: data.createdAt,
          },
        ]);
        messagesSinceRef.current = new Date(data.createdAt).getTime();
      } catch (e: any) {
        setSendError(e?.message || "Failed to send");
      }
    },
    [selectedConversationId]
  );

  const barBg = isDark ? "bg-slate-800" : "bg-gray-100";
  const barBorder = isDark ? "border-gray-600" : "border-gray-400";
  const barText = isDark ? "text-slate-100" : "text-gray-900";
  const barShadow = "shadow-lg";
  const chatOffsetRight = "2rem";
  const isAuthenticated = status === "authenticated" && !!session;

  const handleReturn = useCallback(() => {
    setSelectedFriend(null);
    setSelectedConversationId(null);
  }, []);

  if (!mounted || typeof document === "undefined") return null;
  if (status !== "authenticated") return null;

  const widgetStyle = {
    position: "fixed" as const,
    bottom: "1rem",
    right: chatOffsetRight,
    zIndex: 2147483647,
    pointerEvents: "auto" as const,
  };

  // Single floating element: bar when closed, card when open
  if (!open) {
    return (
      <div style={widgetStyle}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 ${barBg} ${barBorder} ${barText} ${barShadow} hover:opacity-90 transition-opacity cursor-pointer`}
          style={isDark ? { backgroundColor: "#1e293b", color: "#f1f5f9" } : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm font-medium">Chat</span>
          {isAuthenticated ? (
            <span className="text-xs opacity-80">• {onlineCount} online</span>
          ) : (
            <span className="text-xs opacity-80">• Sign in</span>
          )}
        </button>
      </div>
    );
  }

  // Expanded: fixed size card (friends list or chat)
  return (
    <div style={widgetStyle} className="w-[360px] min-w-[360px] max-w-[360px]">
      {!isAuthenticated ? (
        <div
          className={`w-full min-h-[200px] rounded-lg border-2 p-6 ${barBg} ${barBorder} ${barText}`}
          style={isDark ? { boxShadow: "0 10px 40px rgba(0,0,0,0.5)", backgroundColor: "#0f172a" } : { boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}
        >
          <p className="text-sm">Sign in to use chat.</p>
          <div className="mt-3">
            <Button type="button" onClick={() => setOpen(false)} text="Close" variant="secondary" icon={IoCloseOutline} iconOnly />
          </div>
        </div>
      ) : !myUserId ? (
        <div
          className={`w-full h-[200px] min-h-[200px] rounded-lg border-2 flex items-center justify-center ${barBg} ${barBorder} ${barText}`}
          style={isDark ? { boxShadow: "0 10px 40px rgba(0,0,0,0.5)", backgroundColor: "#0f172a" } : { boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}
        >
          <p className="text-sm">Loading...</p>
        </div>
      ) : (
        <ChatPanel
          onClose={() => setOpen(false)}
          onReturn={handleReturn}
          friends={friends}
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          selectedFriend={selectedFriend}
          openingFriendId={openingFriendId}
          messages={messages}
          messagesLoading={messagesLoading}
          sendError={sendError}
          myUserId={myUserId}
          onSelectConversation={handleSelectConversation}
          onSendMessage={handleSendMessage}
          isDark={isDark}
        />
      )}
    </div>
  );
}
