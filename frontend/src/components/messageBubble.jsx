import "./messageBubble.css";

function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MessageBubble({ message, isOwn, showSenderName, isGroup }) {
  return (
    <div
      className={`message-bubble-row ${
        isOwn ? "message-bubble-row--own" : "message-bubble-row--incoming"
      }`}
    >
      <div className="message-bubble-wrapper">
        {showSenderName && isGroup && !isOwn && (
          <div className="message-bubble-sender">{message.sender?.name}</div>
        )}
        <div
          className={`message-bubble ${
            isOwn ? "message-bubble--own" : "message-bubble--incoming"
          }`}
        >
          <div className="message-bubble-content">
            {message.content || ""}
          </div>
          <div className="message-bubble-meta">
            <span>{formatTime(message.timestamp)}</span>
            {isOwn && (
              <svg
                className={`message-bubble-read ${
                  message.read ? "message-bubble-read--seen" : ""
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 1C5.9 1 1 5.9 1 12s4.9 11 11 11 11-4.9 11-11S18.1 1 12 1zm-1.4 16l-4.3-4.3 1.4-1.4 2.9 2.9 6-6 1.4 1.4-7 7.4z" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
