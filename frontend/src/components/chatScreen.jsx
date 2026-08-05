import "./chatScreen.css";

function ChatScreen({ chat, onBack }) {
  return (
    <div className="chat-screen">
      <div className="chat-screen-header">
        <button className="chat-screen-back" onClick={onBack} aria-label="Back">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
        <h2 className="chat-screen-name">{chat.name}</h2>
      </div>
      <div className="chat-screen-body">
        <p>No messages yet</p>
      </div>
    </div>
  );
}

export default ChatScreen;
