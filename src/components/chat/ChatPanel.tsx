"use client";

import React from "react";
import { IoChevronBackOutline, IoCloseOutline } from "react-icons/io5";
import ChatList, { type ConversationItem, type FriendWithPresence } from "./ChatList";
import ChatThread, { type ChatMessage } from "./ChatThread";
import Button from "../common/Button";

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
  const headerBg = isDark ? "bg-slate-800" : "bg-gray-50";
  const border = isDark ? "border-gray-600" : "border-gray-400";
  const text = isDark ? "text-slate-100" : "text-gray-900";
  const muted = isDark ? "text-slate-400" : "text-gray-500";
  const hover = isDark ? "hover:bg-slate-700" : "hover:bg-gray-100";
  const inChatView = !!selectedFriend && !!selectedConversationId;

  return (
    <div
      className={`w-[360px] min-w-[360px] max-w-[360px] rounded-lg shadow-2xl border-2 ${border} ${bg} flex flex-col overflow-hidden shrink-0`}
      style={{
        height: 420,
        maxHeight: 420,
        overflow: "hidden",
        ...(isDark ? { boxShadow: "0 10px 40px rgba(0,0,0,0.5)", backgroundColor: "#0f172a" } : { boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }),
      }}
    >
      <header className={`flex items-center justify-between gap-2 px-3 py-2 border-b ${border} ${headerBg} shrink-0 min-h-[48px]`}>
        <div className="flex items-center gap-2 min-w-0">
          {inChatView ? (
            <Button
              type="button"
              onClick={onReturn}
              text="Back to friends"
              variant="secondary"
              icon={IoChevronBackOutline}
              iconOnly
              className="shrink-0"
            />
          ) : (
            <h2 className={`font-semibold ${text} truncate`}>Chats</h2>
          )}
        </div>
        {inChatView && selectedFriend && (
          <span className={`font-medium truncate text-sm flex-1 min-w-0 text-center ${text}`}>
            {selectedFriend.firstName} {selectedFriend.lastName}
          </span>
        )}
        <Button
          type="button"
          onClick={onClose}
          text="Close"
          variant="secondary"
          icon={IoCloseOutline}
          iconOnly
          className="shrink-0"
        />
      </header>

      {/* Fixed-height content area: same size for friends list and chat (scrolls internally) */}
      <div
        className={`flex flex-col overflow-hidden flex-1 min-h-0 ${bg}`}
        style={{ height: 372, maxHeight: 372, overflow: "hidden" }}
      >
        {openingFriendId ? (
          <div className="flex-1 flex items-center justify-center text-sm ${muted}">
            Opening conversation...
          </div>
        ) : inChatView && selectedFriend && selectedConversationId ? (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden w-full">
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
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden w-full">
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
