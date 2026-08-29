import { useState } from "react";
import ChatHeader from "./chatHeader";
import ChatListItem from "./chatListItem";
import "./chatList.css";

function ChatList({
  chats,
  selectedChatId,
  onSelectChat,
  onLogout,
  onSettings,
  onNewChat,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = chats.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="chat-list">
      <ChatHeader
        onSettings={onSettings}
        onLogout={onLogout}
        onNewChat={onNewChat}
      />
      <div className="chat-list-search">
        <div className="chat-list-search-wrapper">
          <svg className="chat-list-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            type="text"
            placeholder="Search chats"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      {filtered.length > 0 && (
        <div className="chat-list-section">Messages</div>
      )}
      <div className="chat-list-items">
        {filtered.map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            isActive={chat.id === selectedChatId}
            onClick={() => onSelectChat(chat.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="chat-list-empty">
            {searchQuery ? "No chats found" : "No conversations yet. Start a new chat!"}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatList;
