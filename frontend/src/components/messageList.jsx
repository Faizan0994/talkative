import { useEffect, useRef } from "react";
import MessageBubble from "./messageBubble";
import "./messageList.css";

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MessageList({
  messages,
  currentUserId,
  isGroup,
  isTyping,
  emptyMessage,
  onDelete,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  if (messages.length === 0) {
    return (
      <div className="message-list message-list--empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const rendered = [];
  let lastDay = "";

  messages.forEach((message, index) => {
    const day = new Date(message.timestamp).toDateString();
    if (day !== lastDay) {
      lastDay = day;
      rendered.push(
        <div className="message-list-divider" key={`divider-${index}`}>
          <span>{formatDate(message.timestamp)}</span>
        </div>,
      );
    }

    const isOwn = message.senderId === currentUserId;
    const prev = messages[index - 1];
    const showSenderName = isGroup && !isOwn && prev?.senderId !== message.senderId;

    rendered.push(
      <MessageBubble
        key={message.id}
        message={message}
        isOwn={isOwn}
        isGroup={isGroup}
        showSenderName={showSenderName}
        onDelete={onDelete}
      />,
    );
  });

  return (
    <div className="message-list">
      <div className="message-list-scroll">
        {rendered}
        {isTyping && (
          <div className="message-list-typing">
            <span />
            <span />
            <span />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default MessageList;
