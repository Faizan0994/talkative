const queries = require("../lib/queries");
const { prisma } = require("../lib/prisma");

// Mock the Prisma client
jest.mock("../lib/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    token: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("Queries - User Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllUsers", () => {
    test("should return all users from database", async () => {
      const mockUsers = [
        { id: 1, name: "User 1", username: "user1" },
        { id: 2, name: "User 2", username: "user2" },
      ];

      prisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await queries.getAllUsers();

      expect(result).toEqual(mockUsers);
      expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.user.findMany).toHaveBeenCalledWith();
    });

    test("should return empty array when no users exist", async () => {
      prisma.user.findMany.mockResolvedValue([]);

      const result = await queries.getAllUsers();

      expect(result).toEqual([]);
    });

    test("should handle database errors", async () => {
      prisma.user.findMany.mockRejectedValue(
        new Error("Database connection failed"),
      );

      await expect(queries.getAllUsers()).rejects.toThrow(
        "Database connection failed",
      );
    });
  });

  describe("getUser", () => {
    test("should return user by ID", async () => {
      const mockUser = {
        id: 1,
        name: "John Doe",
        username: "johndoe",
        password: "hashed",
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await queries.getUser(1);

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    test("should return null when user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await queries.getUser(999);

      expect(result).toBeNull();
    });

    test("should handle non-numeric IDs", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await queries.getUser(NaN);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: NaN },
      });
    });
  });

  describe("getUserByName", () => {
    test("should return user by username", async () => {
      const mockUser = {
        id: 1,
        name: "John Doe",
        username: "johndoe",
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await queries.getUserByName("johndoe");

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: "johndoe" },
      });
    });

    test("should return null when username not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await queries.getUserByName("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("createUser", () => {
    test("should create user and return true when username is available", async () => {
      prisma.user.findUnique.mockResolvedValue(null); // Username not taken
      prisma.user.create.mockResolvedValue({
        id: 1,
        name: "John Doe",
        username: "johndoe",
        password: "hashed",
        profilePictureUrl: "https://example.com/pic.jpg",
      });

      const result = await queries.createUser(
        "John Doe",
        "johndoe",
        "hashed_password",
        "https://example.com/pic.jpg",
      );

      expect(result).toBe(true);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: "johndoe" },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: "John Doe",
          username: "johndoe",
          password: "hashed_password",
          profilePictureUrl: "https://example.com/pic.jpg",
        },
      });
    });

    test("should return false when username is already taken", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        username: "johndoe",
      });

      const result = await queries.createUser(
        "John Doe",
        "johndoe",
        "hashed_password",
        "https://example.com/pic.jpg",
      );

      expect(result).toBe(false);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe("deleteUser", () => {
    test("should delete user by ID", async () => {
      prisma.user.delete.mockResolvedValue({ id: 1 });

      await queries.deleteUser(1);

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    test("should handle deletion of non-existent user", async () => {
      prisma.user.delete.mockRejectedValue(new Error("Record not found"));

      await expect(queries.deleteUser(999)).rejects.toThrow("Record not found");
    });
  });

  describe("updateUser", () => {
    test("should update user with provided parameters", async () => {
      const mockUser = {
        id: 1,
        name: "Jane Doe",
        username: "janedoe",
        profilePictureUrl: "https://example.com/newpic.jpg",
      };

      prisma.user.update.mockResolvedValue(mockUser);

      await queries.updateUser(
        1,
        "Jane Doe",
        "janedoe",
        "https://example.com/newpic.jpg",
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: "Jane Doe",
          username: "janedoe",
          profilePictureUrl: "https://example.com/newpic.jpg",
        },
      });
    });

    test("should handle update of non-existent user", async () => {
      prisma.user.update.mockRejectedValue(new Error("Record not found"));

      await expect(
        queries.updateUser(999, "Test", "test", "https://example.com/pic.jpg"),
      ).rejects.toThrow("Record not found");
    });

    test("should update all provided fields", async () => {
      prisma.user.update.mockResolvedValue({
        id: 1,
        name: "Updated Name",
        username: "updateduser",
        profilePictureUrl: "https://example.com/updated.jpg",
      });

      await queries.updateUser(
        1,
        "Updated Name",
        "updateduser",
        "https://example.com/updated.jpg",
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: "Updated Name",
          username: "updateduser",
          profilePictureUrl: "https://example.com/updated.jpg",
        },
      });
    });
  });

  describe("searchUsers", () => {
    test("should search users by username and return without sensitive data", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "John Doe",
          username: "johndoe",
          password: "hashed",
          tokens: [],
        },
        {
          id: 2,
          name: "Jane Doe",
          username: "janedoe",
          password: "hashed",
          tokens: [],
        },
      ];

      prisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await queries.searchUsers("doe");

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty("password");
      expect(result[0]).not.toHaveProperty("tokens");
      expect(result[1]).not.toHaveProperty("password");
      expect(result[1]).not.toHaveProperty("tokens");
    });

    test("should perform case-insensitive search", async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await queries.searchUsers("JOHN");

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              username: {
                contains: "JOHN",
                mode: "insensitive",
              },
            },
            {
              name: {
                contains: "JOHN",
                mode: "insensitive",
              },
            },
          ],
        },
      });
    });

    test("should return empty array when no matches found", async () => {
      prisma.user.findMany.mockResolvedValue([]);

      const result = await queries.searchUsers("zzz");

      expect(result).toEqual([]);
    });

    test("should handle special characters in search query", async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await queries.searchUsers("john@doe");

      expect(prisma.user.findMany).toHaveBeenCalled();
    });
  });
});

describe("Queries - Token Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("saveRefreshToken", () => {
    test("should save refresh token to database", async () => {
      const token = "hashed_refresh_token";
      const userId = 1;
      const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

      prisma.token.create.mockResolvedValue({
        id: 1,
        token: token,
        userId: userId,
        expires_at: expiresAt,
        revoked: false,
      });

      await queries.saveRefreshToken(token, userId, expiresAt);

      expect(prisma.token.create).toHaveBeenCalledWith({
        data: {
          token: token,
          userId: userId,
          expires_at: expiresAt,
        },
      });
    });

    test("should handle database errors when saving token", async () => {
      prisma.token.create.mockRejectedValue(new Error("Database error"));

      await expect(
        queries.saveRefreshToken("token", 1, new Date()),
      ).rejects.toThrow("Database error");
    });
  });

  describe("getToken", () => {
    test("should retrieve token with user data", async () => {
      const mockTokenRecord = {
        id: 1,
        token: "hashed_token",
        userId: 1,
        expires_at: new Date(),
        revoked: false,
        user: {
          id: 1,
          name: "John Doe",
          username: "johndoe",
          password: "hashed",
        },
      };

      prisma.token.findUnique.mockResolvedValue(mockTokenRecord);

      const result = await queries.getToken("hashed_token");

      expect(result).toEqual(mockTokenRecord);
      expect(prisma.token.findUnique).toHaveBeenCalledWith({
        where: { token: "hashed_token" },
        include: { user: true },
      });
    });

    test("should return null when token not found", async () => {
      prisma.token.findUnique.mockResolvedValue(null);

      const result = await queries.getToken("nonexistent_token");

      expect(result).toBeNull();
    });
  });

  describe("revokeToken", () => {
    test("should mark token as revoked", async () => {
      prisma.token.update.mockResolvedValue({
        id: 1,
        token: "hashed_token",
        revoked: true,
      });

      await queries.revokeToken("hashed_token");

      expect(prisma.token.update).toHaveBeenCalledWith({
        where: { token: "hashed_token" },
        data: { revoked: true },
      });
    });

    test("should handle revoking non-existent token", async () => {
      prisma.token.update.mockRejectedValue(new Error("Record not found"));

      await expect(queries.revokeToken("nonexistent_token")).rejects.toThrow(
        "Record not found",
      );
    });
  });
});
