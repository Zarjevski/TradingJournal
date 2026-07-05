"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export interface ChatMessage {
  id: string;
  senderID: string;
  content: string;
  createdAt: string;
}

interface ChatThreadProps {
  conversationId: string;
  myUserId: string;
  friend: { id: string; firstName: string; lastName: string; photoURL: string | null };
  messages: ChatMessage[];
  loading?: boolean;
  sendError?: string | null;
  onSend: (content: string) => void;
  onLoadMore?: () => void;
  isDark?: boolean;
  showHeader?: boolean;
}

export default function ChatThread({
  conversationId,
  myUserId,
  friend,
  messages,
  loading,
  sendError,
  onSend,
  isDark = true,
  showHeader = true,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messageInput, setMessageInput] = useState("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = messageInput.trim();
    if (!content) return;
    onSend(content);
    setMessageInput("");
  };

  const bg = isDark ? "bg-zinc-900" : "bg-white";
  const bubbleMine = isDark ? "bg-zinc-100 text-zinc-900" : "bg-zinc-900 text-white";
  const bubbleTheirs = isDark ? "bg-zinc-800 text-gray-100" : "bg-zinc-100 text-gray-900";
  const border = isDark ? "border-zinc-800" : "border-zinc-200";

  return (
    <div
      className={`flex flex-col overflow-hidden ${bg} rounded-r-xl`}
      style={{ flex: "1 1 0", minHeight: 0, height: "100%" }}
    >
      {showHeader && (
        <div className={`flex items-center gap-2 px-3 py-2 border-b ${border} shrink-0 ${isDark ? "bg-zinc-800/60" : "bg-zinc-50"}`}>
          {friend.photoURL ? (
            <Image src={friend.photoURL} alt="" width={32} height={32} className="rounded-full object-cover" />
          ) : (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isDark ? "bg-zinc-700 text-gray-200" : "bg-zinc-200 text-gray-700"}`}>
              {(friend.firstName?.[0] || "") + (friend.lastName?.[0] || "")}
            </div>
          )}
          <span className={`font-medium text-sm ${isDark ? "text-gray-100" : "text-gray-900"}`}>
            {friend.firstName} {friend.lastName}
          </span>
        </div>
      )}

      {/* Messages: fixed-height scroll area so conversation size stays constant */}
      <div
        className="overflow-y-auto overflow-x-hidden p-3 space-y-2"
        style={{ flex: "1 1 0", minHeight: 0, maxHeight: "100%" }}
      >
        {loading && messages.length === 0 ? (
          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Loading...</p>
        ) : messages.length === 0 ? (
          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>No messages yet. Say hi!</p>
        ) : (
          (() => {
            const byId = new Map<string, ChatMessage>();
            for (const m of messages) byId.set(m.id, m);
            const uniqueMessages = Array.from(byId.values()).sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            return uniqueMessages.map((m) => {
              const isMine = m.senderID === myUserId;
              return (
                <div
                  key={m.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-1.5 rounded-2xl text-sm ${
                      isMine ? `${bubbleMine} rounded-br-md` : `${bubbleTheirs} rounded-bl-md`
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            });
          })()
        )}
        <div ref={bottomRef} />
      </div>

      {sendError && (
        <p className="text-xs text-red-400 px-3 py-1">{sendError}</p>
      )}

      {/* Composer: fixed at bottom, never shrinks */}
      <form onSubmit={handleSubmit} className={`p-2 border-t ${border} shrink-0 ${isDark ? "bg-zinc-800/60" : "bg-zinc-50"}`}>
        <div className="flex gap-2 items-center">
          <div className="flex-1 min-w-0">
            <Input
              type="text"
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              maxLength={1000}
            />
          </div>
          <Button type="submit" variant="primary" className="shrink-0">Send</Button>
        </div>
      </form>
    </div>
  );
}
