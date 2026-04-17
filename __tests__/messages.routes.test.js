const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");
const queries = require("../lib/queries");
const jwt = require("jsonwebtoken");

// Mock the queries module
jest.mock("../lib/queries");

// Create a test app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const messagesRouter = require("../routes/messages");
app.use("/api/messages", messagesRouter);

// Helper function to create a valid JWT token
function createTestToken(user) {
  return jwt.sign({ user }, process.env.ACCESS_SECRET, {
    expiresIn: "15m",
  });
}

describe("Messages Routes Integration Tests", () => {
  let mockUser;
  let authToken;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup a mock authenticated user
    mockUser = {
      id: 1,
      name: "John Doe",
      username: "johndoe",
      profilePictureUrl: "https://example.com/pic.jpg",
    };

    authToken = createTestToken(mockUser);
  });

  describe("DELETE /api/messages/:messageId (deleteMessage)", () => {
    test("should successfully delete message when user is the sender", async () => {
      const mockMessage = {
        id: 1,
        content: "Test message",
        senderId: 1,
        chatId: 1,
        timestamp: "2026-03-28T12:00:00.000Z",
        isRead: false,
      };

      queries.getMessage.mockResolvedValue(mockMessage);
      queries.deleteMessage.mockResolvedValue();

      const response = await request(app)
        .delete("/api/messages/1")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(204);

      expect(queries.getMessage).toHaveBeenCalledWith(1);
      expect(queries.deleteMessage).toHaveBeenCalledWith(1);
    });

    test("should return 404 when message does not exist", async () => {
      queries.getMessage.mockResolvedValue(null);

      const response = await request(app)
        .delete("/api/messages/1")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(queries.deleteMessage).not.toHaveBeenCalled();
    });

    test("should return 403 when user is not the sender", async () => {
      const mockMessage = {
        id: 1,
        content: "Test message",
        senderId: 2, // Different user
        chatId: 1,
        timestamp: "2026-03-28T12:00:00.000Z",
        isRead: false,
      };

      queries.getMessage.mockResolvedValue(mockMessage);

      const response = await request(app)
        .delete("/api/messages/1")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(403);

      expect(queries.deleteMessage).not.toHaveBeenCalled();
    });

    test("should handle non-numeric message ID", async () => {
      queries.getMessage.mockResolvedValue(null);

      const response = await request(app)
        .delete("/api/messages/abc")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(queries.getMessage).toHaveBeenCalledWith(NaN);
    });

    test("should handle database errors gracefully", async () => {
      queries.getMessage.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .delete("/api/messages/1")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain("Error deleting message");
    });

    test("should reject request without authentication token", async () => {
      const response = await request(app).delete("/api/messages/1").expect(401);
    });

    test("should reject request with invalid authentication token", async () => {
      const response = await request(app)
        .delete("/api/messages/1")
        .set("Authorization", "Bearer invalid_token")
        .expect(401);
    });
  });

  describe("PATCH /api/messages/:id/read (markMessageRead)", () => {
    test("should successfully mark message as read when user is a participant", async () => {
      const mockMessage = {
        id: 1,
        content: "Test message",
        senderId: 2,
        chatId: 1,
        timestamp: "2026-03-28T12:00:00.000Z",
        isRead: false,
      };

      const mockChat = {
        id: 1,
        name: "Test Chat",
        isGroup: false,
        participants: [
          { id: 1, name: "John Doe" },
          { id: 2, name: "Jane Doe" },
        ],
      };

      queries.getMessage.mockResolvedValue(mockMessage);
      queries.getChat.mockResolvedValue(mockChat);
      queries.markMessageAsRead.mockResolvedValue();

      const response = await request(app)
        .patch("/api/messages/1/read")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(queries.getMessage).toHaveBeenCalledWith(1);
      expect(queries.getChat).toHaveBeenCalledWith(1);
      expect(queries.markMessageAsRead).toHaveBeenCalledWith(1);
    });

    test("should return 404 when message does not exist", async () => {
      queries.getMessage.mockResolvedValue(null);

      const response = await request(app)
        .patch("/api/messages/1/read")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(queries.getChat).not.toHaveBeenCalled();
      expect(queries.markMessageAsRead).not.toHaveBeenCalled();
    });

    test("should return 403 when user is not a participant in the chat", async () => {
      const mockMessage = {
        id: 1,
        content: "Test message",
        senderId: 2,
        chatId: 1,
        timestamp: "2026-03-28T12:00:00.000Z",
        isRead: false,
      };

      const mockChat = {
        id: 1,
        name: "Test Chat",
        isGroup: false,
        participants: [
          { id: 5, name: "Other User" },
          { id: 6, name: "Another User" },
        ],
      };

      queries.getMessage.mockResolvedValue(mockMessage);
      queries.getChat.mockResolvedValue(mockChat);

      const response = await request(app)
        .patch("/api/messages/1/read")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(403);

      expect(queries.markMessageAsRead).not.toHaveBeenCalled();
    });

    test("should work for group chat participants", async () => {
      const mockMessage = {
        id: 1,
        content: "Test message",
        senderId: 2,
        chatId: 1,
        timestamp: "2026-03-28T12:00:00.000Z",
        isRead: false,
      };

      const mockChat = {
        id: 1,
        name: "Group Chat",
        isGroup: true,
        participants: [
          { id: 1, name: "John Doe" },
          { id: 2, name: "Jane Doe" },
          { id: 3, name: "Bob Smith" },
        ],
      };

      queries.getMessage.mockResolvedValue(mockMessage);
      queries.getChat.mockResolvedValue(mockChat);
      queries.markMessageAsRead.mockResolvedValue();

      const response = await request(app)
        .patch("/api/messages/1/read")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(queries.markMessageAsRead).toHaveBeenCalledWith(1);
    });

    test("should handle database errors gracefully", async () => {
      queries.getMessage.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .patch("/api/messages/1/read")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain("Error marking message as read");
    });

    test("should reject request without authentication token", async () => {
      const response = await request(app)
        .patch("/api/messages/1/read")
        .expect(401);
    });

    test("should reject request with invalid authentication token", async () => {
      const response = await request(app)
        .patch("/api/messages/1/read")
        .set("Authorization", "Bearer invalid_token")
        .expect(401);
    });

    test("should handle non-numeric message ID", async () => {
      queries.getMessage.mockResolvedValue(null);

      const response = await request(app)
        .patch("/api/messages/abc/read")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(queries.getMessage).toHaveBeenCalledWith(NaN);
    });
  });

  describe("Authorization edge cases", () => {
    test("should reject requests with expired token", async () => {
      const expiredToken = jwt.sign(
        { user: mockUser },
        process.env.ACCESS_SECRET,
        {
          expiresIn: "0s",
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await request(app)
        .delete("/api/messages/1")
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect(401);
    });

    test("should reject requests with malformed Authorization header", async () => {
      const response = await request(app)
        .delete("/api/messages/1")
        .set("Authorization", "InvalidFormat")
        .expect(401);
    });

    test("should reject requests with token signed with wrong secret", async () => {
      const wrongToken = jwt.sign({ user: mockUser }, "wrong_secret", {
        expiresIn: "15m",
      });

      const response = await request(app)
        .delete("/api/messages/1")
        .set("Authorization", `Bearer ${wrongToken}`)
        .expect(401);
    });
  });
});
