import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";

const TOKEN_KEY = "talkative_access_token";

function createSocket() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  return io(import.meta.env.VITE_SERVER_URL || "http://localhost:3000", {
    auth: { token },
    autoConnect: false,
  });
}

function useSocket() {
  const [socket] = useState(createSocket);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!socket) return undefined;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onConnectError = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.disconnect();
      setConnected(false);
    };
  }, [socket]);

  const emitWithAck = useCallback(
    (event, payload) => {
      if (!socket || !socket.connected) {
        return Promise.resolve({
          error: true,
          code: "DISCONNECTED",
          message: "Socket is not connected",
        });
      }
      return new Promise((resolve) => {
        socket.emit(event, payload, resolve);
      });
    },
    [socket],
  );

  const joinChat = useCallback(
    (chatId) => emitWithAck("join-chat", chatId),
    [emitWithAck],
  );

  const leaveChat = useCallback(
    (chatId) => emitWithAck("leave-chat", chatId),
    [emitWithAck],
  );

  const sendMessage = useCallback(
    (chatId, message) => emitWithAck("send-message", { chatId, message }),
    [emitWithAck],
  );

  const sendTyping = useCallback(
    (chatId) => emitWithAck("typing", { chatId }),
    [emitWithAck],
  );

  const subscribe = useCallback(
    (event, handler) => {
      if (!socket) return () => {};
      socket.on(event, handler);
      return () => socket.off(event, handler);
    },
    [socket],
  );

  const onNewMessage = useCallback(
    (handler) => subscribe("new-message", handler),
    [subscribe],
  );

  const onUserTyping = useCallback(
    (handler) => subscribe("user-typing", handler),
    [subscribe],
  );

  return {
    socket,
    connected,
    joinChat,
    leaveChat,
    sendMessage,
    sendTyping,
    onNewMessage,
    onUserTyping,
  };
}

export default useSocket;
