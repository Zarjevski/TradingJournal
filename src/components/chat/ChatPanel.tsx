"use client";

import React from "react";
import ChatList, { type ConversationItem, type FriendWithPresence } from "./ChatList";
import ChatThread, { type ChatMessage } from "./ChatThread";

interface ChatPanelProps {
  onClose: () => void;
  onReturn: () => void;
  friends: FriendWithPresence[];
  conversations: ConversationItem[];
  selectedConversationId: string | null;
  selectedFriend: { id: string; firstName: string; lastName: string; photoURL: string | null } | null;
  openingFriendId: string | null;
  messages: ChatMessage[];
  messagesLoading: boolean;
  sendError: string | null;
  myUserId: string;
  onSelectConversation: (conversationId: string | null, friend: FriendWithPresence, conversationExists: boolean) => void;
  onSendMessage: (content: string) => void;
  isDark?: boolean;
}

export default function ChatPanel({
  onClose,
  onReturn,
  friends,
  conversations,
  selectedConversationId,
  selectedFriend,
  openingFriendId,
  messages,
  messagesLoading,
  sendError,
  myUserId,
  onSelectConversation,
  onSendMessage,
  isDark = true,
}: ChatPanelProps) {
  const bg = isDark ? "bg-slate-900" : "bg-white";
  const border = isDark ? "border-slate-500" : "border-gray-400";
  const text = isDark ? "text-slate-100" : "text-gray-900";
  const muted = isDark ? "text-slate-400" : "text-gray-500";
  const hover = isDark ? "hover:bg-slate-800" : "hover:bg-gray-100";
  const inChatView = !!selectedFriend && !!selectedConversationId;

  return (
    <div
      className={`w-[360px] h-[420px] rounded-lg shadow-2xl border-2 ${border} ${bg} flex flex-col overflow-hidden`}
      style={{ boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}
    >
      <header className={`flex items-center justify-between gap-2 px-3 py-2 border-b ${border} shrink-0 min-h-[48px]`}>
        <div className="flex items-center gap-2 min-w-0">
          {inChatView ? (
            <button
              type="button"
              onClick={onReturn}
              className={`flex items-center gap-1 shrink-0 p-1.5 rounded-lg ${hover} ${muted} text-sm font-medium`}
              aria-label="Back to friends"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Return</span>
            </button>
          ) : (
            <h2 className={`font-semibold ${text} truncate`}>Chats</h2>
          )}
        </div>
        {inChatView && selectedFriend && (
          <span className={`font-medium truncate text-sm flex-1 min-w-0 text-center ${text}`}>
            {selectedFriend.firstName} {selectedFriend.lastName}
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          className={`p-1.5 rounded-lg shrink-0 ${hover} ${muted}`}
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div className="flex-1 min-h-0 flex flex-col">
        {openingFriendId ? (
          <div className={`flex-1 flex items-center justify-center text-sm ${muted}`}>
            Opening conversation...
          </div>
        ) : inChatView && selectedFriend && selectedConversationId ? (
          <ChatThread
            conversationId={selectedConversationId}
            myUserId={myUserId}
            friend={selectedFriend}
            messages={messages}
            loading={messagesLoading}
            sendError={sendError}
            onSend={onSendMessage}
            isDark={isDark}
            showHeader={false}
          />
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <ChatList
              friends={friends}
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              selectedFriendId={selectedFriend?.id ?? null}
              onSelect={onSelectConversation}
              isDark={isDark}
            />
          </div>
        )}
      </div>
    </div>
  );
}
