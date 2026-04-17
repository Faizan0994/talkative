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

const chatsRouter = require("../routes/chats");
app.use("/api/chats", chatsRouter);

// Helper function to create a valid JWT token
function createTestToken(user) {
  return jwt.sign({ user }, process.env.ACCESS_SECRET, {
    expiresIn: "15m",
  });
}

describe("Chats Routes Integration Tests", () => {
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

  describe("POST /api/chats (createChat)", () => {
    const validChatData = {
      name: "Test Group",
      userIds: [2, 3],
    };

    test("should successfully create a group chat with 3+ participants", async () => {
      const mockChat = {
        id: 1,
        name: "Test Group",
        isGroup: true,
        participants: [
          { id: 1, name: "John Doe" },
          { id: 2, name: "Jane Doe" },
          { id: 3, name: "Bob Smith" },
        ],
      };

      queries.doUsersExist.mockResolvedValue(true);
      queries.createGroupChat.mockResolvedValue(mockChat);

      const response = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${authToken}`)
        .send(validChatData)
        .expect(201);

      expect(response.body.chat).toEqual(mockChat);
      expect(queries.doUsersExist).toHaveBeenCalledWith([2, 3, 1]); // Includes creator
      expect(queries.createGroupChat).toHaveBeenCalledWith(
        "Test Group",
        [2, 3, 1],
      );
    });

    test("should successfully create a direct chat with 2 participants", async () => {
      const mockChat = {
        id: 1,
        isGroup: false,
        participants: [
          { id: 1, name: "John Doe" },
          { id: 2, name: "Jane Doe" },
        ],
      };

      queries.doUsersExist.mockResolvedValue(true);
      queries.createChat.mockResolvedValue(mockChat);

      const response = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Direct Chat",
          userIds: [2],
        })
        .expect(201);

      expect(response.body.chat).toEqual(mockChat);
      expect(queries.createChat).toHaveBeenCalledWith([2, 1]); // Direct chat, not group
      expect(queries.createGroupChat).not.toHaveBeenCalled();
    });

    test("should reject chat creation with name too short", async () => {
      const response = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "AB",
          userIds: [2, 3],
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain(
        "Name must be between 3 and 15 characters long",
      );
    });

    test("should reject chat creation with name too long", async () => {
      const response = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "A".repeat(16),
          userIds: [2, 3],
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain(
        "Name must be between 3 and 15 characters long",
      );
    });

    test("should reject chat creation with non-array userIds", async () => {
      const response = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test Group",
          userIds: "not-an-array",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain("Invalid value");
    });

    test("should reject chat creation with empty userIds array", async () => {
      queries.doUsersExist.mockResolvedValue(false);

      const response = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test Group",
          userIds: [],
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain(
        "Some users in the list do not exist",
      );
    });

    test("should reject chat creation when some users do not exist", async () => {
      queries.doUsersExist.mockResolvedValue(false);

      const response = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${authToken}`)
        .send(validChatData)
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain(
        "Some users in the list do not exist",
      );
    });

    test("should automatically add creator to participants", async () => {
      queries.doUsersExist.mockResolvedValue(true);
      queries.createGroupChat.mockResolvedValue({
        id: 1,
        name: "Test Group",
        isGroup: true,
        participants: [
          { id: 1, name: "John Doe" },
          { id: 2, name: "Jane Doe" },
        ],
      });

      await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test Group",
          userIds: [2],
        })
        .expect(201);

      // Should check existence of [2, 1] after adding creator
      expect(queries.doUsersExist).toHaveBeenCalledWith([2, 1]);
    });

    test("should create direct chat without name (name is optional)", async () => {
      const mockChat = {
        id: 1,
        isGroup: false,
        participants: [
          { id: 1, name: "John Doe" },
          { id: 2, name: "Jane Doe" },
        ],
      };

      queries.doUsersExist.mockResolvedValue(true);
      queries.createChat.mockResolvedValue(mockChat);

      const response = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          userIds: [2], // No name provided
        })
        .expect(201);

      expect(response.body.chat).toEqual(mockChat);
      expect(queries.createChat).toHaveBeenCalledWith([2, 1]);
    });

    test("should validate name if provided even for direct chat", async () => {
      const response = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "AB", // Invalid name (too short)
          userIds: [2],
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain(
        "Name must be between 3 and 15 characters long",
      );
    });

    test("should handle database errors gracefully", async () => {
      queries.doUsersExist.mockResolvedValue(true);
      queries.createGroupChat.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .post("/api/chats")
        .set("Authorization", `Bearer ${authToken}`)
        .send(validChatData)
        .expect(500);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain("Error creating chat");
    });

    test("should reject request without authentication token", async () => {
      const response = await request(app)
        .post("/api/chats")
        .send(validChatData)
        .expect(401);
    });

    test("should reject request with invalid authentication token", async () => {
      const response = await request(app)
        .post("/api/chats")
        .set("Authorization", "Bearer invalid_token")
        .send(validChatData)
        .expect(401);
    });
  });

  describe("GET /api/chats/:id (getChat)", () => {
    test("should successfully retrieve chat when user is a participant", async () => {
      const mockChat = {
        id: 1,
        name: "Test Chat",
        isGroup: true,
        participants: [
          { id: 1, name: "John Doe" },
          { id: 2, name: "Jane Doe" },
        ],
        messages: [
          { id: 1, content: "Hello", timestamp: "2026-03-25T12:27:51.815Z" },
        ],
      };

      queries.getChat.mockResolvedValue(mockChat);

      const response = await request(app)
        .get("/api/chats/1")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.chat).toEqual(mockChat);
      expect(queries.getChat).toHaveBeenCalledWith(1);
    });

    test("should return 404 when chat does not exist", async () => {
      queries.getChat.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/chats/999")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });

    test("should return 403 when user is not a participant", async () => {
      const mockChat = {
        id: 1,
        name: "Test Chat",
        isGroup: true,
        participants: [
          { id: 5, name: "Other User" },
          { id: 6, name: "Another User" },
        ],
        messages: [],
      };

      queries.getChat.mockResolvedValue(mockChat);

      const response = await request(app)
        .get("/api/chats/1")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(403);
    });

    test("should handle non-numeric chat ID", async () => {
      queries.getChat.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/chats/abc")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(queries.getChat).toHaveBeenCalledWith(NaN);
    });

    test("should handle database errors gracefully", async () => {
      queries.getChat.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .get("/api/chats/1")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain("Error retrieving chat");
    });

    test("should reject request without authentication token", async () => {
      const response = await request(app).get("/api/chats/1").expect(401);
    });

    test("should reject request with invalid authentication token", async () => {
      const response = await request(app)
        .get("/api/chats/1")
        .set("Authorization", "Bearer invalid_token")
        .expect(401);
    });
  });

  describe("GET /api/chats (getUserChats)", () => {
    test("should successfully retrieve all chats for authenticated user", async () => {
      const mockChats = [
        {
          id: 1,
          name: "Group Chat",
          isGroup: true,
          participants: [
            { id: 1, name: "John Doe" },
            { id: 2, name: "Jane Doe" },
          ],
        },
        {
          id: 2,
          name: null,
          isGroup: false,
          participants: [
            { id: 1, name: "John Doe" },
            { id: 3, name: "Bob Smith" },
          ],
        },
      ];

      queries.getChatsForUser.mockResolvedValue(mockChats);

      const response = await request(app)
        .get("/api/chats")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.chats).toEqual(mockChats);
      expect(queries.getChatsForUser).toHaveBeenCalledWith(1);
    });

    test("should return empty array when user has no chats", async () => {
      queries.getChatsForUser.mockResolvedValue([]);

      const response = await request(app)
        .get("/api/chats")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.chats).toEqual([]);
    });

    test("should handle database errors gracefully", async () => {
      queries.getChatsForUser.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .get("/api/chats")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain("Error retrieving user chats");
    });

    test("should reject request without authentication token", async () => {
      const response = await request(app).get("/api/chats").expect(401);
    });

    test("should reject request with invalid authentication token", async () => {
      const response = await request(app)
        .get("/api/chats")
        .set("Authorization", "Bearer invalid_token")
        .expect(401);
    });
  });

  describe("PUT /api/chats/:id (updateChatName)", () => {
    const validUpdateData = {
      name: "New Chat Name",
    };

    test("should successfully update chat name when user is a participant", async () => {
      const mockChat = {
        id: 1,
        name: "Old Name",
        isGroup: true,
        participants: [
          { id: 1, name: "John Doe" },
          { id: 2, name: "Jane Doe" },
        ],
      };

      queries.getChat.mockResolvedValue(mockChat);
      queries.updateChatName.mockResolvedValue(true);

      const response = await request(app)
        .put("/api/chats/1")
        .set("Authorization", `Bearer ${authToken}`)
        .send(validUpdateData)
        .expect(200);

      expect(queries.getChat).toHaveBeenCalledWith(1);
      expect(queries.updateChatName).toHaveBeenCalledWith(1, "New Chat Name");
    });

    test("should return 404 when chat does not exist", async () => {
      queries.getChat.mockResolvedValue(null);

      const response = await request(app)
        .put("/api/chats/1")
        .set("Authorization", `Bearer ${authToken}`)
        .send(validUpdateData)
        .expect(404);

      expect(queries.updateChatName).not.toHaveBeenCalled();
    });

    test("should return 403 when user is not a participant", async () => {
      const mockChat = {
        id: 1,
        name: "Old Name",
        isGroup: true,
        participants: [
          { id: 5, name: "Other User" },
          { id: 6, name: "Another User" },
        ],
      };

      queries.getChat.mockResolvedValue(mockChat);

      const response = await request(app)
        .put("/api/chats/1")
        .set("Authorization", `Bearer ${authToken}`)
        .send(validUpdateData)
        .expect(403);

      expect(queries.updateChatName).not.toHaveBeenCalled();
    });

    test("should reject update with name too short", async () => {
      const response = await request(app)
        .put("/api/chats/1")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "AB",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain(
        "Name must be between 3 and 15 characters long",
      );
    });

    test("should reject update with name too long", async () => {
      const response = await request(app)
        .put("/api/chats/1")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "A".repeat(16),
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain(
        "Name must be between 3 and 15 characters long",
      );
    });

    test("should handle database errors gracefully", async () => {
      queries.getChat.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .put("/api/chats/1")
        .set("Authorization", `Bearer ${authToken}`)
        .send(validUpdateData)
        .expect(500);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain("Error updating chat name");
    });

    test("should reject request without authentication token", async () => {
      const response = await request(app)
        .put("/api/chats/1")
        .send(validUpdateData)
        .expect(401);
    });

    test("should reject request with invalid authentication token", async () => {
      const response = await request(app)
        .put("/api/chats/1")
        .set("Authorization", "Bearer invalid_token")
        .send(validUpdateData)
        .expect(401);
    });

    test("should only update group chats (enforced by query)", async () => {
      const mockChat = {
        id: 1,
        name: "Old Name",
        isGroup: true,
        participants: [{ id: 1, name: "John Doe" }],
      };

      queries.getChat.mockResolvedValue(mockChat);
      queries.updateChatName.mockResolvedValue(true);

      await request(app)
        .put("/api/chats/1")
        .set("Authorization", `Bearer ${authToken}`)
        .send(validUpdateData)
        .expect(200);

      // The query itself enforces isGroup: true in the where clause
      expect(queries.updateChatName).toHaveBeenCalledWith(1, "New Chat Name");
    });
  });

  describe("POST /api/chats/:id (addChatParticipants)", () => {
    const validParticipantData = {
      userIds: [4, 5],
    };

    test("should successfully add participants when user is a participant", async () => {
      const mockChat = {
        id: 1,
        name: "Group Chat",
        isGroup: true,
        participants: [
          { id: 1, name: "John Doe" },
          { id: 2, name: "Jane Doe" },
        ],
      };

      queries.doUsersExist.mockResolvedValue(true);
      queries.getChat.mockResolvedValue(mockChat);
      queries.addChatParticipants.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/chats/1")
        .set("Authorization", `Bearer ${authToken}`)
        .send(validParticipantData)
        .expect(200);

      expect(queries.doUsersExist).toHaveBeenCalledWith([4, 5]);
      expect(queries.getChat).toHaveBeenCalledWith(1);
      expect(queries.addChatParticipants).toHaveBeenCalledWith(1, [4, 5]);
    });

    test("should return 404 when chat does not exist", async () => {
      queries.doUsersExist.mockResolvedValue(true);
      queries.getChat.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/chats/1")
        .set("Authorization", `Bearer ${authToken}`)
        .send(validParticipantData)
        .expect(404);

      expect(queries.addChatParticipants).not.toHaveBeenCalled();
    });

    test("should return 403 when user is not a participant", async () => {
      const mockChat = {
        id: 1,
        name: "Group Chat",
        isGroup: true,
        participants: [
          { id: 5, name: "Other User" },
          { id: 6, name: "Another User" },
        ],
      };

      queries.doUsersExist.mockResolvedValue(true);
      queries.getChat.mockResolvedValue(mockChat);

      const response = await request(app)
        .post("/api/chats/1")
        .set("Authorization", `Bearer ${authToken}`)
        .send(validParticipantData)
        .expect(403);

      expect(queries.addChatParticipants).not.toHaveBeenCalled();
    });

    test("should reject when some users do not exist", async () => {
      queries.doUsersExist.mockResolvedValue(false);

      const response = await request(app)
        .post("/api/chats/1")
        .set("Authorization", `Bearer ${authToken}`)
        .send(validParticipantData)
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain(
        "Some users in the list do not exist",
      );
      expect(queries.getChat).not.toHaveBeenCalled();
      expect(queries.addChatParticipants).not.toHaveBeenCalled();
    });

    test("should reject with non-array userIds", async () => {
      const response = await request(app)
        .post("/api/chats/1")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          userIds: "not-an-array",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain("Invalid value");
    });

    test("should reject with empty userIds array", async () => {
      queries.doUsersExist.mockResolvedValue(false);

      const response = await request(app)
        .post("/api/chats/1")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          userIds: [],
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain(
        "Some users in the list do not exist",
      );
    });

    test("should handle database errors gracefully", async () => {
      queries.doUsersExist.mockResolvedValue(true);
      queries.getChat.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .post("/api/chats/1")
        .set("Authorization", `Bearer ${authToken}`)
        .send(validParticipantData)
        .expect(500);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain("Error adding chat participants");
    });

    test("should reject request without authentication token", async () => {
      const response = await request(app)
        .post("/api/chats/1")
        .send(validParticipantData)
        .expect(401);
    });

    test("should reject request with invalid authentication token", async () => {
      const response = await request(app)
        .post("/api/chats/1")
        .set("Authorization", "Bearer invalid_token")
        .send(validParticipantData)
        .expect(401);
    });

    test("should only add participants to group chats (enforced by query)", async () => {
      const mockChat = {
        id: 1,
        name: "Group Chat",
        isGroup: true,
        participants: [{ id: 1, name: "John Doe" }],
      };

      queries.doUsersExist.mockResolvedValue(true);
      queries.getChat.mockResolvedValue(mockChat);
      queries.addChatParticipants.mockResolvedValue(true);

      await request(app)
        .post("/api/chats/1")
        .set("Authorization", `Bearer ${authToken}`)
        .send(validParticipantData)
        .expect(200);

      // The query itself enforces isGroup: true in the where clause
      expect(queries.addChatParticipants).toHaveBeenCalledWith(1, [4, 5]);
    });
  });

  describe("PATCH /api/chats/:id/read (markChatRead)", () => {
    test("should successfully mark chat as read when user is a participant", async () => {
      const mockChat = {
        id: 1,
        name: "Test Chat",
        isGroup: true,
        participants: [
          { id: 1, name: "John Doe" },
          { id: 2, name: "Jane Doe" },
        ],
      };

      queries.getChat.mockResolvedValue(mockChat);
      queries.markChatAsRead.mockResolvedValue();

      const response = await request(app)
        .patch("/api/chats/1/read")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(queries.getChat).toHaveBeenCalledWith(1);
      expect(queries.markChatAsRead).toHaveBeenCalledWith(1, 1);
    });

    test("should return 404 when chat does not exist", async () => {
      queries.getChat.mockResolvedValue(null);

      const response = await request(app)
        .patch("/api/chats/1/read")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(queries.markChatAsRead).not.toHaveBeenCalled();
    });

    test("should return 403 when user is not a participant", async () => {
      const mockChat = {
        id: 1,
        name: "Test Chat",
        isGroup: true,
        participants: [
          { id: 5, name: "Other User" },
          { id: 6, name: "Another User" },
        ],
      };

      queries.getChat.mockResolvedValue(mockChat);

      const response = await request(app)
        .patch("/api/chats/1/read")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(403);

      expect(queries.markChatAsRead).not.toHaveBeenCalled();
    });

    test("should handle database errors gracefully", async () => {
      queries.getChat.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .patch("/api/chats/1/read")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain("Error marking chat as read");
    });

    test("should reject request without authentication token", async () => {
      const response = await request(app)
        .patch("/api/chats/1/read")
        .expect(401);
    });
  });

  describe("GET /api/chats/:id/unread-count (getUnreadCount)", () => {
    test("should successfully return unread count for a chat", async () => {
      queries.unreadMessagesCount.mockResolvedValue(5);

      const response = await request(app)
        .get("/api/chats/1/unread-count")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({ unreadCount: 5 });
      expect(queries.unreadMessagesCount).toHaveBeenCalledWith(1, 1);
    });

    test("should return 0 when there are no unread messages", async () => {
      queries.unreadMessagesCount.mockResolvedValue(0);

      const response = await request(app)
        .get("/api/chats/1/unread-count")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({ unreadCount: 0 });
    });

    test("should handle database errors gracefully", async () => {
      queries.unreadMessagesCount.mockRejectedValue(
        new Error("Database error"),
      );

      const response = await request(app)
        .get("/api/chats/1/unread-count")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain("Error retrieving unread count");
    });

    test("should reject request without authentication token", async () => {
      const response = await request(app)
        .get("/api/chats/1/unread-count")
        .expect(401);
    });
  });

  describe("POST /api/chats/:id/leave (leaveChat)", () => {
    test("should successfully remove user from chat", async () => {
      queries.removeChatParticipant.mockResolvedValue();

      const response = await request(app)
        .post("/api/chats/1/leave")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(queries.removeChatParticipant).toHaveBeenCalledWith(1, 1);
    });

    test("should handle database errors gracefully", async () => {
      queries.removeChatParticipant.mockRejectedValue(
        new Error("Database error"),
      );

      const response = await request(app)
        .post("/api/chats/1/leave")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain("Error leaving chat");
    });

    test("should reject request without authentication token", async () => {
      const response = await request(app)
        .post("/api/chats/1/leave")
        .expect(401);
    });

    test("should allow user to leave even if not currently in chat (query enforces isGroup)", async () => {
      // This tests that the endpoint trusts the query layer's constraints
      queries.removeChatParticipant.mockResolvedValue();

      const response = await request(app)
        .post("/api/chats/1/leave")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(queries.removeChatParticipant).toHaveBeenCalledWith(1, 1);
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
        .get("/api/chats")
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect(401);
    });

    test("should reject requests with malformed Authorization header", async () => {
      const response = await request(app)
        .get("/api/chats")
        .set("Authorization", "InvalidFormat")
        .expect(401);
    });

    test("should reject requests with token signed with wrong secret", async () => {
      const wrongToken = jwt.sign({ user: mockUser }, "wrong_secret", {
        expiresIn: "15m",
      });

      const response = await request(app)
        .get("/api/chats")
        .set("Authorization", `Bearer ${wrongToken}`)
        .expect(401);
    });
  });
});
