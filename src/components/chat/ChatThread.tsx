"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = inputRef.current;
    if (!input) return;
    const content = input.value.trim();
    if (!content) return;
    onSend(content);
    input.value = "";
  };

  const bg = isDark ? "bg-slate-900" : "bg-white";
  const bubbleMine = isDark ? "bg-blue-600 text-white" : "bg-blue-500 text-white";
  const bubbleTheirs = isDark ? "bg-slate-700 text-slate-100" : "bg-gray-200 text-gray-900";
  const border = isDark ? "border-slate-700" : "border-gray-200";
  const inputBg = isDark ? "bg-slate-800 border-slate-600 text-white" : "bg-gray-50 border-gray-300 text-gray-900";

  return (
    <div className={`flex flex-col h-full ${bg} rounded-r-lg`}>
      {showHeader && (
        <div className={`flex items-center gap-2 px-3 py-2 border-b ${border} shrink-0`}>
          {friend.photoURL ? (
            <Image src={friend.photoURL} alt="" width={32} height={32} className="rounded-full object-cover" />
          ) : (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isDark ? "bg-slate-600 text-slate-200" : "bg-gray-300 text-gray-700"}`}>
              {(friend.firstName?.[0] || "") + (friend.lastName?.[0] || "")}
            </div>
          )}
          <span className={`font-medium text-sm ${isDark ? "text-slate-100" : "text-gray-900"}`}>
            {friend.firstName} {friend.lastName}
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {loading && messages.length === 0 ? (
          <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>Loading...</p>
        ) : messages.length === 0 ? (
          <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>No messages yet. Say hi!</p>
        ) : (
          messages.map((m) => {
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
          })
        )}
        <div ref={bottomRef} />
      </div>

      {sendError && (
        <p className="text-xs text-red-400 px-3 py-1">{sendError}</p>
      )}

      {/* Composer */}
      <form onSubmit={handleSubmit} className={`p-2 border-t ${border} shrink-0`}>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            maxLength={1000}
            className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
