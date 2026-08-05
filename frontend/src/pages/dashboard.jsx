import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import ChatList from "../components/chatList";
import ChatScreen from "../components/chatScreen";
import "../styles/dashboard.css";

const PLACEHOLDER_CHATS = [
  {
    id: 1,
    name: "Alice",
    isGroup: false,
    lastMessage: "See you at the meeting!",
    lastMessageAt: "2026-08-05T12:30:00",
    unreadCount: 2,
  },
  {
    id: 2,
    name: "Bob",
    isGroup: false,
    lastMessage: "Sent the report over, let me know what you think.",
    lastMessageAt: "2026-08-04T18:05:00",
    unreadCount: 0,
  },
  {
    id: 3,
    name: "Work Team",
    isGroup: true,
    lastMessage: "Elena: Sprint review is at 2pm.",
    lastMessageAt: "2026-08-05T09:15:00",
    unreadCount: 7,
  },
  {
    id: 4,
    name: "Family Group",
    isGroup: true,
    lastMessage: null,
    lastMessageAt: null,
    unreadCount: 0,
  },
];

function Dashboard() {
  const [chats] = useState(PLACEHOLDER_CHATS);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
    setShowChat(true);
  };

  const handleBack = () => {
    setShowChat(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/signin");
  };

  const handleSettings = () => {
    // TODO: open settings
  };

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  return (
    <div className="dashboard">
      <div
        className={`dashboard-chats ${showChat ? "dashboard-chats-hidden" : ""}`}
      >
        <ChatList
          chats={chats}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
          onLogout={handleLogout}
          onSettings={handleSettings}
        />
      </div>
      <div
        className={`dashboard-main ${showChat ? "dashboard-main-visible" : ""}`}
      >
        {selectedChat ? (
          <ChatScreen chat={selectedChat} onBack={handleBack} />
        ) : (
          <div className="dashboard-placeholder">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
