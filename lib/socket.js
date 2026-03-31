const jwt = require("jsonwebtoken");
const queries = require("./queries");

exports.verifyJWT = (token) => {
  return new Promise((resolve, reject) => {
    if (!token) {
      return reject(new Error("No token provided"));
    }

    jwt.verify(token, process.env.ACCESS_SECRET, (err, authData) => {
      if (err) {
        return reject(new Error("Invalid or expired token"));
      }
      resolve(authData.user);
    });
  });
};

exports.socketAuthentication = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.split(" ")[1];
    const user = await this.verifyJWT(token);

    socket.user = user;
    socket.userId = user.id;

    next();
  } catch (err) {
    next(new Error("Authentication failed: " + err.message));
  }
};

exports.handleConnection = (io) => (socket) => {
  console.log("User connected on socket: ", socket.id);

  socket.on("join-chat", async (chatId, callback) => {
    try {
      if (!chatId || typeof chatId !== "number") {
        return callback?.({
          error: true,
          code: "VALIDATION_ERROR",
          message: "Invalid chat ID",
        });
      }

      // Check if user is participant (authorization)
      const chat = await queries.getChat(chatId);
      if (!chat) {
        return callback?.({
          error: true,
          code: "NOT_FOUND",
          message: "Chat not found",
        });
      }

      const isParticipant = chat.participants.some(
        (p) => p.userId === socket.userId,
      );
      if (!isParticipant) {
        return callback?.({
          error: true,
          code: "FORBIDDEN",
          message: "You are not a participant in this chat",
        });
      }

      socket.join(`chat-${chatId}`);
      callback?.({ error: false });
    } catch (err) {
      console.error("Error joining chat:", err);
      callback?.({
        error: true,
        code: "SERVER_ERROR",
        message: "Failed to join chat",
      });
    }
  });

  socket.on("send-message", async (data, callback) => {
    try {
      // Validate input
      if (!data.chatId || !data.message) {
        return callback?.({
          error: true,
          code: "VALIDATION_ERROR",
          message: "chatId and message are required",
        });
      }

      if (typeof data.message !== "string" || data.message.trim() === "") {
        return callback?.({
          error: true,
          code: "VALIDATION_ERROR",
          message: "Message cannot be empty",
        });
      }

      if (data.message.length > 2000) {
        return callback?.({
          error: true,
          code: "VALIDATION_ERROR",
          message: "Message too long (max 2000 characters)",
        });
      }

      // Check authorization
      const chat = await queries.getChat(data.chatId);
      if (!chat) {
        return callback?.({
          error: true,
          code: "NOT_FOUND",
          message: "Chat not found",
        });
      }

      const isParticipant = chat.participants.some(
        (p) => p.userId === socket.userId,
      );
      if (!isParticipant) {
        return callback?.({
          error: true,
          code: "FORBIDDEN",
          message: "You cannot send messages to this chat",
        });
      }

      // Save message to database
      const generatedMessage = await queries.createMessage(
        socket.userId,
        data.chatId,
        data.message.trim(),
      );

      // Broadcast to all users in the chat
      io.to(`chat-${data.chatId}`).emit("new-message", generatedMessage);
      callback?.({ error: false, message: generatedMessage });
    } catch (err) {
      console.error("Error sending message:", err);
      callback?.({
        error: true,
        code: "SERVER_ERROR",
        message: "Failed to send message",
      });
    }
  });

  socket.on("typing", async (data, callback) => {
    try {
      if (!data.chatId) {
        return callback?.({
          error: true,
          code: "VALIDATION_ERROR",
          message: "chatId is required",
        });
      }

      // Verify user is in chat
      const chat = await queries.getChat(data.chatId);
      const isParticipant = chat?.participants.some(
        (p) => p.userId === socket.userId,
      );

      if (!isParticipant) {
        return callback?.({
          error: true,
          code: "FORBIDDEN",
          message: "Not authorized",
        });
      }

      // Broadcast to others
      socket.to(`chat-${data.chatId}`).emit("user-typing", {
        userId: socket.userId,
        username: socket.user.username,
        chatId: data.chatId,
      });

      callback?.({ error: false });
    } catch (err) {
      callback?.({
        error: true,
        code: "SERVER_ERROR",
        message: "Failed to send typing indicator",
      });
    }
  });

  socket.on("leave-chat", async (chatId, callback) => {
    try {
      if (!chatId || typeof chatId !== "number") {
        return callback?.({
          error: true,
          code: "VALIDATION_ERROR",
          message: "Invalid chat ID",
        });
      }

      socket.leave(`chat-${chatId}`);
      callback?.({ error: false });
    } catch (err) {
      console.error("Error leaving chat:", err);
      callback?.({
        error: true,
        code: "SERVER_ERROR",
        message: "Failed to leave chat",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected from socket: ", socket.id);
  });
};
