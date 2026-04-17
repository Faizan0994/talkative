const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");
const queries = require("../lib/queries");
const jwt = require("jsonwebtoken");

// Mock the queries module
jest.mock("../lib/queries");

// Note: This test file assumes the bugs in the actual code are fixed
// See the issues list for details on what needs to be fixed first

// Create a test app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// We'll need to fix the import path in routes/users.js before this works
// It should be: const controller = require("../controllers/users-controller");
const usersRouter = require("../routes/users");
app.use("/api/users", usersRouter);

// Helper function to create a valid JWT token
function createTestToken(user) {
  return jwt.sign({ user }, process.env.ACCESS_SECRET, {
    expiresIn: "15m",
  });
}

describe("Users Routes Integration Tests", () => {
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

  describe("GET /api/users (searchUsers)", () => {
    test("should return empty array when no search query provided", async () => {
      const response = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({ users: [] });
      expect(queries.searchUsers).not.toHaveBeenCalled();
    });

    test("should return filtered users excluding authenticated user", async () => {
      const mockUsers = [
        { id: 1, name: "John Doe", username: "johndoe" },
        { id: 2, name: "Jane Doe", username: "janedoe" },
        { id: 3, name: "John Smith", username: "johnsmith" },
      ];

      queries.searchUsers.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get("/api/users?search=john")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Should filter out the authenticated user (id: 1)
      expect(response.body.users).toHaveLength(2);
      expect(response.body.users).toEqual([
        { id: 2, name: "Jane Doe", username: "janedoe" },
        { id: 3, name: "John Smith", username: "johnsmith" },
      ]);
      expect(queries.searchUsers).toHaveBeenCalledWith("john");
    });

    test("should return 404 when no users found (after filtering self)", async () => {
      // Only the authenticated user matches
      const mockUsers = [{ id: 1, name: "John Doe", username: "johndoe" }];

      queries.searchUsers.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get("/api/users?search=johndoe")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });

    test("should return 404 when no users found (empty result from query)", async () => {
      queries.searchUsers.mockResolvedValue([]);

      const response = await request(app)
        .get("/api/users?search=nonexistent")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });

    test("should reject request without authentication token", async () => {
      const response = await request(app)
        .get("/api/users?search=john")
        .expect(401);
    });

    test("should reject request with invalid authentication token", async () => {
      const response = await request(app)
        .get("/api/users?search=john")
        .set("Authorization", "Bearer invalid_token")
        .expect(401);
    });

    test("should handle special characters in search query", async () => {
      queries.searchUsers.mockResolvedValue([]);

      const response = await request(app)
        .get("/api/users?search=john@doe")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(queries.searchUsers).toHaveBeenCalledWith("john@doe");
    });

    test("should handle empty search query", async () => {
      const response = await request(app)
        .get("/api/users?search=")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({ users: [] });
      expect(queries.searchUsers).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/users/:id (getUser)", () => {
    test("should return user when found and not self", async () => {
      const requestedUser = {
        id: 2,
        name: "Jane Doe",
        username: "janedoe",
        password: "hashed_password",
        tokens: [],
        profilePictureUrl: "https://example.com/jane.jpg",
      };

      queries.getUser.mockResolvedValue(requestedUser);

      const response = await request(app)
        .get("/api/users/2")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user).toEqual({
        id: 2,
        name: "Jane Doe",
        username: "janedoe",
        profilePictureUrl: "https://example.com/jane.jpg",
      });
      expect(response.body.user).not.toHaveProperty("password");
      expect(response.body.user).not.toHaveProperty("tokens");
      expect(response.body.isSelf).toBe(false);
      expect(queries.getUser).toHaveBeenCalledWith(2);
    });

    test("should return user with isSelf flag when viewing own profile", async () => {
      const requestedUser = {
        id: 1,
        name: "John Doe",
        username: "johndoe",
        password: "hashed_password",
        tokens: [],
        profilePictureUrl: "https://example.com/pic.jpg",
      };

      queries.getUser.mockResolvedValue(requestedUser);

      const response = await request(app)
        .get("/api/users/1")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user).toEqual({
        id: 1,
        name: "John Doe",
        username: "johndoe",
        profilePictureUrl: "https://example.com/pic.jpg",
      });
      expect(response.body.isSelf).toBe(true);
      expect(queries.getUser).toHaveBeenCalledWith(1);
    });

    test("should return 404 when user not found", async () => {
      queries.getUser.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/users/999")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });

    test("should reject request without authentication token", async () => {
      const response = await request(app).get("/api/users/2").expect(401);
    });

    test("should reject request with invalid authentication token", async () => {
      const response = await request(app)
        .get("/api/users/2")
        .set("Authorization", "Bearer invalid_token")
        .expect(401);
    });

    test("should handle non-numeric ID gracefully", async () => {
      queries.getUser.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/users/abc")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      // NaN is coerced to NaN, which should not match any user
      expect(queries.getUser).toHaveBeenCalledWith(NaN);
    });

    test("should filter out sensitive data (password, tokens)", async () => {
      const requestedUser = {
        id: 2,
        name: "Jane Doe",
        username: "janedoe",
        password: "super_secret_hash",
        tokens: [{ id: 1, token: "refresh_token" }],
        profilePictureUrl: "https://example.com/jane.jpg",
      };

      queries.getUser.mockResolvedValue(requestedUser);

      const response = await request(app)
        .get("/api/users/2")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user).not.toHaveProperty("password");
      expect(response.body.user).not.toHaveProperty("tokens");
    });
  });

  describe("PUT /api/users (updateUser)", () => {
    const validUpdateData = {
      name: "Jane Smith",
      username: "janesmith",
      profilePictureUrl: "https://example.com/newpic.jpg",
    };

    test("should successfully update user profile", async () => {
      queries.updateUser.mockResolvedValue(true);

      const response = await request(app)
        .put("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send(validUpdateData)
        .expect(200);

      // Note: updateUser in queries.js has mismatched signature - needs fixing
      // Controller calls: queries.updateUser(user.id, name, username, profilePictureUrl)
      // But queries.js expects: queries.updateUser(data) where data has id, name, etc.
      expect(queries.updateUser).toHaveBeenCalledWith(
        1,
        "Jane Smith",
        "janesmith",
        "https://example.com/newpic.jpg",
      );
    });

    test("should reject update with invalid name (contains numbers)", async () => {
      const response = await request(app)
        .put("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          ...validUpdateData,
          name: "Jane123",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain("Name must contain only letters and spaces");
    });

    test("should reject update with name too short", async () => {
      const response = await request(app)
        .put("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          ...validUpdateData,
          name: "Jo",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain(
        "Name must be between 3 and 25 characters long",
      );
    });

    test("should reject update with name too long", async () => {
      const response = await request(app)
        .put("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          ...validUpdateData,
          name: "A".repeat(26),
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain(
        "Name must be between 3 and 25 characters long",
      );
    });

    test("should reject update with username too short", async () => {
      const response = await request(app)
        .put("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          ...validUpdateData,
          username: "ab",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain(
        "username must be between 3 and 25 characters long",
      );
    });

    test("should reject update with username too long", async () => {
      const response = await request(app)
        .put("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          ...validUpdateData,
          username: "a".repeat(26),
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
    });

    test("should reject update with invalid profile picture URL", async () => {
      const response = await request(app)
        .put("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          ...validUpdateData,
          profilePictureUrl: "not-a-valid-url",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain("Invalid profile picture URL");
    });

    test("should reject update without authentication token", async () => {
      const response = await request(app)
        .put("/api/users")
        .send(validUpdateData)
        .expect(401);
    });

    test("should reject update with invalid authentication token", async () => {
      const response = await request(app)
        .put("/api/users")
        .set("Authorization", "Bearer invalid_token")
        .send(validUpdateData)
        .expect(401);
    });

    test("should only update authenticated user's profile", async () => {
      // Even if someone tries to pass a different user ID, it should use the authenticated user's ID
      queries.updateUser.mockResolvedValue(true);

      const response = await request(app)
        .put("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          ...validUpdateData,
          id: 999, // Attempting to update a different user
        })
        .expect(200);

      // Should still update user ID 1 (from the token), not 999
      expect(queries.updateUser).toHaveBeenCalledWith(
        1,
        "Jane Smith",
        "janesmith",
        "https://example.com/newpic.jpg",
      );
    });

    test("should handle missing fields", async () => {
      const response = await request(app)
        .put("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Jane Smith",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
    });

    test("should trim whitespace from inputs", async () => {
      queries.updateUser.mockResolvedValue(true);

      const response = await request(app)
        .put("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "  Jane Smith  ",
          username: "  janesmith  ",
          profilePictureUrl: "  https://example.com/newpic.jpg  ",
        })
        .expect(200);

      expect(queries.updateUser).toHaveBeenCalledWith(
        1,
        "Jane Smith",
        "janesmith",
        "https://example.com/newpic.jpg",
      );
    });

    test("should handle name with spaces correctly", async () => {
      queries.updateUser.mockResolvedValue(true);

      const response = await request(app)
        .put("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          ...validUpdateData,
          name: "Mary Jane Watson",
        })
        .expect(200);

      expect(queries.updateUser).toHaveBeenCalledWith(
        1,
        "Mary Jane Watson",
        "janesmith",
        "https://example.com/newpic.jpg",
      );
    });
  });

  describe("DELETE /api/users (deleteUser)", () => {
    test("should successfully delete authenticated user's account", async () => {
      queries.deleteUser.mockResolvedValue(true);

      const response = await request(app)
        .delete("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(204);

      expect(queries.deleteUser).toHaveBeenCalledWith(1);
    });

    test("should reject delete without authentication token", async () => {
      const response = await request(app).delete("/api/users").expect(401);

      expect(queries.deleteUser).not.toHaveBeenCalled();
    });

    test("should reject delete with invalid authentication token", async () => {
      const response = await request(app)
        .delete("/api/users")
        .set("Authorization", "Bearer invalid_token")
        .expect(401);

      expect(queries.deleteUser).not.toHaveBeenCalled();
    });

    test("should only delete authenticated user's account", async () => {
      // Only the authenticated user can delete their own account
      queries.deleteUser.mockResolvedValue(true);

      const response = await request(app)
        .delete("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(204);

      // Should delete user ID 1 (from token)
      expect(queries.deleteUser).toHaveBeenCalledWith(1);
    });

    test("should handle deletion errors gracefully", async () => {
      queries.deleteUser.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .delete("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain("Error deleting user");
    });
  });

  describe("Authorization checks", () => {
    test("should reject requests with malformed Authorization header", async () => {
      const response = await request(app)
        .get("/api/users?search=john")
        .set("Authorization", "InvalidFormat")
        .expect(401);
    });

    test("should reject requests with expired token", async () => {
      const expiredToken = jwt.sign(
        { user: mockUser },
        process.env.ACCESS_SECRET,
        {
          expiresIn: "0s", // Immediately expired
        },
      );

      // Wait a moment to ensure it's expired
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await request(app)
        .get("/api/users?search=john")
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect(401);
    });

    test("should reject requests with token signed with wrong secret", async () => {
      const wrongToken = jwt.sign({ user: mockUser }, "wrong_secret", {
        expiresIn: "15m",
      });

      const response = await request(app)
        .get("/api/users?search=john")
        .set("Authorization", `Bearer ${wrongToken}`)
        .expect(401);
    });
  });
});
