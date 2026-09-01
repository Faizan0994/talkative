import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import ChatList from "../components/chatList";
import ChatScreen from "./chatScreen";
import NewChatModal from "../components/newChatModal";
import ChatInfoModal from "../components/chatInfoModal";
import { ToastContainer } from "../components/toast";
import useApi from "../hooks/useApi";
import useSocket from "../hooks/useSocket";
import "../styles/dashboard.css";

function transformChat(chat, currentUserId) {
  const lastMessage = chat.messages?.[0];
  const other = chat.participants?.find((p) => p.id !== currentUserId);
  return {
    id: chat.id,
    name: chat.isGroup ? chat.name || "" : other?.name || chat.name || "",
    isGroup: chat.isGroup,
    participants: chat.participants || [],
    lastMessage: lastMessage?.content ?? null,
    lastMessageAt: lastMessage?.timestamp ?? null,
    unreadCount: 0,
  };
}

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];

function Dashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { chatId } = useParams();
  const { loading, error, get, post, put, patch, del } = useApi();
  const {
    joinChat,
    leaveChat,
    sendMessage,
    sendTyping,
    onNewMessage,
    onUserTyping,
  } = useSocket();

  const [chats, setChats] = useState([]);
  const [messagesByChat, setMessagesByChat] = useState({});
  const [showNewChat, setShowNewChat] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(null);
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [toasts, setToasts] = useState([]);

  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const addToast = useCallback((message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const searchUsers = useCallback(
    async (query) => {
      if (!query || query.trim().length === 0) {
        setSearchedUsers([]);
        return;
      }
      const res = await get(
        `/api/users?search=${encodeURIComponent(query.trim())}`,
      ).catch(() => null);
      setSearchedUsers(res?.users || []);
    },
    [get],
  );

  const currentUserId = user?.id;
  const selectedChatId = chatId ? +chatId : null;
  const showChat = !!(
    selectedChatId && chats.find((c) => c.id === selectedChatId)
  );

  const loadChats = useCallback(async () => {
    const res = await get("/api/chats/").catch(() => null);
    if (!res) return;
    const loaded = res.chats.map((chat) => transformChat(chat, currentUserId));
    setChats(loaded);
    loaded.forEach((chat) => {
      get(`/api/chats/${chat.id}/unread-count`)
        .then((data) => {
          if (!data) return;
          setChats((prev) =>
            prev.map((c) =>
              c.id === chat.id ? { ...c, unreadCount: data.unreadCount } : c,
            ),
          );
        })
        .catch(() => {});
    });
  }, [get, currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    loadChats();
  }, [loadChats, currentUserId]);

  useEffect(() => {
    if (!selectedChatId) return;
    setLoadingMessages(true);
    get(`/api/chats/${selectedChatId}`)
      .then((res) => {
        if (!res?.chat) return;
        const chat = res.chat;
        const transformed = chat.messages.map((m) => ({
          ...m,
          sender: chat.participants.find((p) => p.id === m.senderId) || {
            id: m.senderId,
            name: "Unknown",
          },
        }));
        setMessagesByChat((prev) => ({
          ...prev,
          [selectedChatId]: transformed,
        }));
        setChats((prev) =>
          prev.map((c) =>
            c.id === selectedChatId
              ? { ...c, participants: chat.participants }
              : c,
          ),
        );
      })
      .catch(() => {})
      .finally(() => setLoadingMessages(false));
    patch(`/api/chats/${selectedChatId}/read`).catch(() => {});
    setChats((prev) =>
      prev.map((c) => (c.id === selectedChatId ? { ...c, unreadCount: 0 } : c)),
    );
  }, [selectedChatId, get, patch]);

  const joinedRoomsRef = useRef(new Set());

  useEffect(() => {
    if (!currentUserId) return;
    const topChats = chats.slice(0, 5);
    const targetIds = new Set(topChats.map((c) => c.id));

    topChats.forEach((chat) => {
      if (!joinedRoomsRef.current.has(chat.id)) {
        joinChat(chat.id);
        joinedRoomsRef.current.add(chat.id);
      }
    });

    joinedRoomsRef.current.forEach((id) => {
      if (!targetIds.has(id)) {
        leaveChat(id);
        joinedRoomsRef.current.delete(id);
      }
    });

    const joined = joinedRoomsRef.current;
    return () => {
      joined.forEach((id) => leaveChat(id));
      joined.clear();
    };
  }, [chats, currentUserId, joinChat, leaveChat]);

  useEffect(() => {
    const unsub = onNewMessage((msg) => {
      setMessagesByChat((prev) => {
        const existing = prev[msg.chatId] || [];
        if (existing.some((m) => m.id === msg.id)) return prev;
        const sender = chats
          .find((c) => c.id === msg.chatId)
          ?.participants?.find((p) => p.id === msg.senderId) || {
          id: msg.senderId,
          name: "Unknown",
        };
        const enriched = { ...msg, sender };
        return { ...prev, [msg.chatId]: [...existing, enriched] };
      });
      if (msg.chatId !== selectedChatId) {
        const chat = chats.find((c) => c.id === msg.chatId);
        const chatName = chat?.name || "Unknown chat";
        addToast(`${chatName}: new message(s)`);
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(chatName, { body: "new message(s)" });
        }
        setChats((prev) =>
          prev.map((c) =>
            c.id === msg.chatId
              ? {
                  ...c,
                  lastMessage: msg.content,
                  lastMessageAt: msg.timestamp,
                  unreadCount: (c.unreadCount || 0) + 1,
                }
              : c,
          ),
        );
      }
    });
    return unsub;
  }, [onNewMessage, selectedChatId, chats, addToast]);

  useEffect(() => {
    const unsub = onUserTyping((data) => {
      if (data.chatId !== selectedChatId) return;
      setIsTyping(data.username);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(null), 3000);
    });
    return () => {
      unsub();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [onUserTyping, selectedChatId]);

  if (!user && !authLoading) {
    return <Navigate to="/signin" replace />;
  }

  const handleSelectChat = (id) => {
    navigate(`/dashboard/${id}`);
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleSend = (content) => {
    if (!selectedChatId) return;
    const id = Date.now();
    setMessagesByChat((prev) => ({
      ...prev,
      [selectedChatId]: [
        ...(prev[selectedChatId] || []),
        {
          id,
          content,
          timestamp: new Date().toISOString(),
          read: false,
          senderId: currentUserId,
          sender: { id: currentUserId, name: user.name },
        },
      ],
    }));
    sendMessage(selectedChatId, content).then((res) => {
      if (res?.error || res?.message) return;
      setMessagesByChat((prev) => ({
        ...prev,
        [selectedChatId]: (prev[selectedChatId] || []).map((m) =>
          m.id === id ? { ...m, id: res.id } : m,
        ),
      }));
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/signin");
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  const handleStartChat = async (userId) => {
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

    const res = await post("/api/chats/", { userIds: [userId] }).catch(
      () => null,
    );
    if (!res?.chat) return;
    const chat = transformChat(res.chat, currentUserId);
    setChats((prev) => [chat, ...prev]);
    navigate(`/dashboard/${chat.id}`);
  };

  const handleCreateGroup = async (name, userIds) => {
    const res = await post("/api/chats/", { userIds, name }).catch(() => null);
    if (!res?.chat) return;
    const chat = transformChat(res.chat, currentUserId);
    setChats((prev) => [chat, ...prev]);
    navigate(`/dashboard/${chat.id}`);
  };

  const handleRenameChat = async (name) => {
    if (!selectedChatId) return;
    const res = await put(`/api/chats/${selectedChatId}`, { name }).catch(
      () => null,
    );
    if (!res?.chat) return;
    setChats((prev) =>
      prev.map((c) => (c.id === selectedChatId ? { ...c, name } : c)),
    );
  };

  const handleAddParticipants = async (userIds) => {
    if (!selectedChatId) return;
    await post(`/api/chats/${selectedChatId}`, { userIds }).catch(() => {});
    const res = await get(`/api/chats/${selectedChatId}`).catch(() => null);
    if (!res?.chat) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === selectedChatId
          ? { ...c, participants: res.chat.participants }
          : c,
      ),
    );
  };

  const handleLeaveChat = async () => {
    if (!selectedChatId) return;
    await post(`/api/chats/${selectedChatId}/leave`).catch(() => {});
    leaveChat(selectedChatId);
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
    del(`/api/messages/${messageId}`).catch(() => {});
  };

  const handleTyping = () => {
    if (!selectedChatId) return;
    sendTyping(selectedChatId);
  };

  const selectedChat = chats.find((c) => c.id === selectedChatId);
  const visibleMessages = (messagesByChat[selectedChatId] || []).map((m) =>
    m.senderId === currentUserId ? { ...m, read: true } : m,
  );

  return (
    <div className="dashboard">
      <div
        className={`dashboard-chats ${showChat ? "dashboard-chats-hidden" : ""}`}
      >
        {loading || (authLoading && !currentUserId) ? (
          <div className="dashboard-skeleton" aria-hidden="true">
            {SKELETON_ROWS.map((row) => (
              <div className="dashboard-skeleton-item" key={row}>
                <div className="dashboard-skeleton-avatar" />
                <div className="dashboard-skeleton-lines">
                  <div className="dashboard-skeleton-line dashboard-skeleton-line--short" />
                  <div className="dashboard-skeleton-line" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="dashboard-error">
            <p className="dashboard-error-message">
              {error.messages?.[0] || "Something went wrong"}
            </p>
            <button className="dashboard-error-retry" onClick={loadChats}>
              Try again
            </button>
          </div>
        ) : (
          <ChatList
            chats={chats}
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
            onLogout={handleLogout}
            onSettings={handleSettings}
            onNewChat={() => setShowNewChat(true)}
          />
        )}
      </div>
      <div
        className={`dashboard-main ${showChat ? "dashboard-main-visible" : ""}`}
      >
        {selectedChat ? (
          loadingMessages ? (
            <div className="dashboard-message-skeleton" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div className="dashboard-message-skeleton-bubble" key={i} />
              ))}
            </div>
          ) : (
            <ChatScreen
              chat={selectedChat}
              messages={visibleMessages}
              currentUserId={currentUserId}
              onBack={handleBack}
              onSend={handleSend}
              onDelete={handleDeleteMessage}
              onOpenInfo={() => setShowChatInfo(true)}
              onTyping={handleTyping}
              isTyping={isTyping}
            />
          )
        ) : (
          <div className="dashboard-placeholder">
            Select a chat to start messaging
          </div>
        )}
      </div>

      <NewChatModal
        open={showNewChat}
        onClose={() => {
          setShowNewChat(false);
          setSearchedUsers([]);
        }}
        users={searchedUsers}
        onSearchUsers={searchUsers}
        onStartChat={handleStartChat}
        onCreateGroup={handleCreateGroup}
      />

      <ChatInfoModal
        open={showChatInfo}
        onClose={() => {
          setShowChatInfo(false);
          setSearchedUsers([]);
        }}
        chat={selectedChat}
        users={searchedUsers}
        onSearchUsers={searchUsers}
        currentUserId={currentUserId}
        onRenameChat={handleRenameChat}
        onAddParticipants={handleAddParticipants}
        onLeaveChat={handleLeaveChat}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default Dashboard;
