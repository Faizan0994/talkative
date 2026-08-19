import "./chatListItem.css";

function formatTime(lastMessageAt) {
  if (!lastMessageAt) return "";
  const date = new Date(lastMessageAt);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function ChatListItem({ chat, isActive, onClick }) {
  const unreadCount = chat.unreadCount || 0;

  return (
    <div
      className={`chat-list-item ${isActive ? "chat-list-item--active" : ""}`}
      onClick={onClick}
    >
      <div
        className={`chat-list-item-avatar ${
          chat.isGroup ? "chat-list-item-avatar--group" : ""
        }`}
      >
        {chat.isGroup ? (
          <svg
            className="chat-list-item-group-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
        ) : (
          chat.name[0].toUpperCase()
        )}
      </div>
      <div className="chat-list-item-body">
        <div className="chat-list-item-name-row">
          <div className="chat-list-item-name">{chat.name}</div>
          <div className="chat-list-item-time">
            {formatTime(chat.lastMessageAt)}
          </div>
        </div>
        <div className="chat-list-item-preview">
          <p className="chat-list-item-preview-msg">
            {chat.lastMessage || "No messages yet"}
          </p>
          {unreadCount > 0 && !isActive && (
            <div className="chat-list-item-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatListItem;
