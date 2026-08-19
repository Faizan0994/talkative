import MessageList from "../components/messageList";
import MessageComposer from "../components/messageComposer";
import "../styles/chatScreen.css";

function ChatScreen({ chat, messages, currentUserId, onBack, onSend, isTyping }) {
  return (
    <div className="chat-screen">
      <div className="chat-screen-header">
        <button className="chat-screen-back" onClick={onBack} aria-label="Back">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
        <div className="chat-screen-avatar">
          {chat.isGroup ? (
            <svg className="chat-screen-avatar-group-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          ) : (
            chat.name[0].toUpperCase()
          )}
        </div>
        <div className="chat-screen-title">
          <h2 className="chat-screen-name">{chat.name}</h2>
          <div className="chat-screen-subtitle">
            {isTyping ? "typing..." : chat.isGroup ? "Group chat" : "Online"}
          </div>
        </div>
      </div>
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        isGroup={chat.isGroup}
        isTyping={isTyping}
        emptyMessage="No messages yet"
      />
      <MessageComposer onSend={onSend} />
    </div>
  );
}

export default ChatScreen;
