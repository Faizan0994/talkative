import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router";
import ChatList from "../components/chatList";
import ChatScreen from "./chatScreen";
import "../styles/dashboard.css";

const CURRENT_USER_ID = 99;

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

const PLACEHOLDER_MESSAGES = {
  1: [
    {
      id: 101,
      content: "Hey! Did you get the deck I sent?",
      timestamp: "2026-08-05T10:05:00",
      read: true,
      senderId: 1,
      sender: { id: 1, name: "Alice" },
    },
    {
      id: 102,
      content: "Yes, it looks great. Nice work.",
      timestamp: "2026-08-05T10:12:00",
      read: true,
      senderId: CURRENT_USER_ID,
      sender: { id: CURRENT_USER_ID, name: "You" },
    },
    {
      id: 103,
      content: "I made a few tweaks to the pricing slide, mind taking a look?",
      timestamp: "2026-08-05T10:15:00",
      read: true,
      senderId: 1,
      sender: { id: 1, name: "Alice" },
    },
    {
      id: 104,
      content: "Sure, sending them over in a few minutes from now.",
      timestamp: "2026-08-05T10:20:00",
      read: true,
      senderId: CURRENT_USER_ID,
      sender: { id: CURRENT_USER_ID, name: "You" },
    },
    {
      id: 105,
      content: "Perfect, thanks! See you at the meeting!",
      timestamp: "2026-08-05T12:30:00",
      read: false,
      senderId: 1,
      sender: { id: 1, name: "Alice" },
    },
  ],
  2: [
    {
      id: 201,
      content: "Morning! How is the report coming along?",
      timestamp: "2026-08-03T09:00:00",
      read: true,
      senderId: 2,
      sender: { id: 2, name: "Bob" },
    },
    {
      id: 202,
      content: "Almost done, just polishing the summary.",
      timestamp: "2026-08-03T09:30:00",
      read: true,
      senderId: CURRENT_USER_ID,
      sender: { id: CURRENT_USER_ID, name: "You" },
    },
    {
      id: 203,
      content: "Sent the report over, let me know what you think.",
      timestamp: "2026-08-04T18:05:00",
      read: true,
      senderId: 2,
      sender: { id: 2, name: "Bob" },
    },
  ],
  3: [
    {
      id: 301,
      content: "Hey team, quick standup at 9:30?",
      timestamp: "2026-08-04T08:45:00",
      read: true,
      senderId: 11,
      sender: { id: 11, name: "Elena" },
    },
    {
      id: 302,
      content: "Works for me.",
      timestamp: "2026-08-04T08:50:00",
      read: true,
      senderId: CURRENT_USER_ID,
      sender: { id: CURRENT_USER_ID, name: "You" },
    },
    {
      id: 303,
      content: "Elena: Sprint review is at 2pm.",
      timestamp: "2026-08-05T09:15:00",
      read: false,
      senderId: 11,
      sender: { id: 11, name: "Elena" },
    },
  ],
  4: [],
};

function Dashboard() {
  const [chats] = useState(PLACEHOLDER_CHATS);
  const [messagesByChat, setMessagesByChat] = useState(PLACEHOLDER_MESSAGES);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { chatId } = useParams();

  const selectedChatId = chatId ? +chatId : null;
  const showChat = !!(
    selectedChatId && chats.find((c) => c.id === selectedChatId)
  );

  const handleSelectChat = (id) => {
    navigate(`/dashboard/${id}`);
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleSend = (content) => {
    if (!selectedChatId) return;
    const id = selectedChatId;
    setMessagesByChat((prev) => ({
      ...prev,
      [id]: [
        ...(prev[id] || []),
        {
          id: Date.now(),
          content,
          timestamp: new Date().toISOString(),
          read: false,
          senderId: CURRENT_USER_ID,
          sender: { id: CURRENT_USER_ID, name: "You" },
        },
      ],
    }));
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
          <ChatScreen
            chat={selectedChat}
            messages={messagesByChat[selectedChat.id] || []}
            currentUserId={CURRENT_USER_ID}
            onBack={handleBack}
            onSend={handleSend}
          />
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
