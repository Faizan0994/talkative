import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router";
import ChatList from "../components/chatList";
import ChatScreen from "./chatScreen";
import NewChatModal from "../components/newChatModal";
import ChatInfoModal from "../components/chatInfoModal";
import "../styles/dashboard.css";

const CURRENT_USER_ID = 99;

const CURRENT_USER = {
  id: CURRENT_USER_ID,
  name: "You",
  username: "you",
};

const PLACEHOLDER_USERS = [
  { id: 1, name: "Alice", username: "alice" },
  { id: 2, name: "Bob", username: "bob" },
  { id: 3, name: "Carol", username: "carol" },
  { id: 4, name: "Dave", username: "dave" },
  { id: 5, name: "Frank", username: "frank" },
  { id: 6, name: "Grace", username: "grace" },
  { id: 7, name: "Hank", username: "hank" },
  { id: 8, name: "Ivy", username: "ivy" },
  { id: 9, name: "Jack", username: "jack" },
  { id: 11, name: "Elena", username: "elena" },
];

const PLACEHOLDER_CHATS = [
  {
    id: 1,
    name: "Alice",
    isGroup: false,
    lastMessage: "See you at the meeting!",
    lastMessageAt: "2026-08-05T12:30:00",
    unreadCount: 2,
    participants: [
      { id: 1, name: "Alice", username: "alice" },
      CURRENT_USER,
    ],
  },
  {
    id: 2,
    name: "Bob",
    isGroup: false,
    lastMessage: "Sent the report over, let me know what you think.",
    lastMessageAt: "2026-08-04T18:05:00",
    unreadCount: 0,
    participants: [
      { id: 2, name: "Bob", username: "bob" },
      CURRENT_USER,
    ],
  },
  {
    id: 3,
    name: "Work Team",
    isGroup: true,
    lastMessage: "Elena: Sprint review is at 2pm.",
    lastMessageAt: "2026-08-05T09:15:00",
    unreadCount: 7,
    participants: [
      { id: 11, name: "Elena", username: "elena" },
      { id: 1, name: "Alice", username: "alice" },
      { id: 2, name: "Bob", username: "bob" },
      CURRENT_USER,
    ],
  },
  {
    id: 4,
    name: "Family Group",
    isGroup: true,
    lastMessage: null,
    lastMessageAt: null,
    unreadCount: 0,
    participants: [
      { id: 3, name: "Carol", username: "carol" },
      { id: 4, name: "Dave", username: "dave" },
      CURRENT_USER,
    ],
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
  const [chats, setChats] = useState(PLACEHOLDER_CHATS);
  const [messagesByChat, setMessagesByChat] = useState(PLACEHOLDER_MESSAGES);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
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
    navigate("/settings");
  };

  const handleStartChat = (userId) => {
    const user = PLACEHOLDER_USERS.find((u) => u.id === userId);
    if (!user) return;

    const existing = chats.find(
      (c) =>
        !c.isGroup &&
        c.participants &&
        c.participants.some((p) => p.id === userId),
    );
    if (existing) {
      navigate(`/dashboard/${existing.id}`);
      return;
    }

    const id = Date.now();
    const newChat = {
      id,
      name: user.name,
      isGroup: false,
      lastMessage: null,
      lastMessageAt: null,
      unreadCount: 0,
      participants: [user, CURRENT_USER],
    };
    setChats((prev) => [newChat, ...prev]);
    setMessagesByChat((prev) => ({ ...prev, [id]: [] }));
    navigate(`/dashboard/${id}`);
  };

  const handleCreateGroup = (name, userIds) => {
    const members = userIds
      .map((id) => PLACEHOLDER_USERS.find((u) => u.id === id))
      .filter(Boolean);

    const id = Date.now();
    const newChat = {
      id,
      name,
      isGroup: true,
      lastMessage: null,
      lastMessageAt: null,
      unreadCount: 0,
      participants: [...members, CURRENT_USER],
    };
    setChats((prev) => [newChat, ...prev]);
    setMessagesByChat((prev) => ({ ...prev, [id]: [] }));
    navigate(`/dashboard/${id}`);
  };

  const handleRenameChat = (name) => {
    if (!selectedChatId) return;
    setChats((prev) =>
      prev.map((c) => (c.id === selectedChatId ? { ...c, name } : c)),
    );
  };

  const handleAddParticipants = (userIds) => {
    if (!selectedChatId) return;
    const newMembers = userIds
      .map((id) => PLACEHOLDER_USERS.find((u) => u.id === id))
      .filter(Boolean);
    setChats((prev) =>
      prev.map((c) =>
        c.id === selectedChatId
          ? { ...c, participants: [...c.participants, ...newMembers] }
          : c,
      ),
    );
  };

  const handleLeaveChat = () => {
    if (!selectedChatId) return;
    setChats((prev) => prev.filter((c) => c.id !== selectedChatId));
    setMessagesByChat((prev) => {
      const next = { ...prev };
      delete next[selectedChatId];
      return next;
    });
    setShowChatInfo(false);
    navigate("/dashboard");
  };

  const handleDeleteMessage = (messageId) => {
    if (!selectedChatId) return;
    const id = selectedChatId;
    setMessagesByChat((prev) => ({
      ...prev,
      [id]: (prev[id] || []).filter((m) => m.id !== messageId),
    }));
  };

  const selectedChat = chats.find((c) => c.id === selectedChatId);
  const visibleMessages = (messagesByChat[selectedChatId] || []).map((m) =>
    m.senderId === CURRENT_USER_ID ? { ...m, read: true } : m,
  );

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
          onNewChat={() => setShowNewChat(true)}
        />
      </div>
      <div
        className={`dashboard-main ${showChat ? "dashboard-main-visible" : ""}`}
      >
        {selectedChat ? (
          <ChatScreen
            chat={selectedChat}
            messages={visibleMessages}
            currentUserId={CURRENT_USER_ID}
            onBack={handleBack}
            onSend={handleSend}
            onDelete={handleDeleteMessage}
            onOpenInfo={() => setShowChatInfo(true)}
          />
        ) : (
          <div className="dashboard-placeholder">
            Select a chat to start messaging
          </div>
        )}
      </div>

      <NewChatModal
        open={showNewChat}
        onClose={() => setShowNewChat(false)}
        users={PLACEHOLDER_USERS}
        onStartChat={handleStartChat}
        onCreateGroup={handleCreateGroup}
      />

      <ChatInfoModal
        open={showChatInfo}
        onClose={() => setShowChatInfo(false)}
        chat={selectedChat}
        users={PLACEHOLDER_USERS}
        currentUserId={CURRENT_USER_ID}
        onRenameChat={handleRenameChat}
        onAddParticipants={handleAddParticipants}
        onLeaveChat={handleLeaveChat}
      />
    </div>
  );
}

export default Dashboard;