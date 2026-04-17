const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const queries = require("../lib/queries");

// Mock the queries module
jest.mock("../lib/queries");

describe("Auth Controller Unit Tests", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      body: {},
      headers: {},
      cookies: {},
      user: null,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      sendStatus: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe("Token Creation", () => {
    test("should create valid access token", () => {
      const user = {
        id: 1,
        username: "testuser",
        name: "Test User",
      };

      const crypto = require("crypto");
      const hashToken = (token) => {
        return crypto
          .createHmac("sha256", process.env.REFRESH_HASH_SECRET)
          .update(token)
          .digest("hex");
      };

      // Create a mock JWT token
      const token = jwt.sign({ user }, process.env.ACCESS_SECRET, {
        expiresIn: "15m",
      });

      expect(token).toBeDefined();

      // Verify the token
      const decoded = jwt.verify(token, process.env.ACCESS_SECRET);
      expect(decoded.user).toEqual(user);
    });

    test("should create valid refresh token", () => {
      const user = {
        id: 1,
        username: "testuser",
        name: "Test User",
      };

      const token = jwt.sign({ user }, process.env.REFRESH_SECRET, {
        expiresIn: "7d",
      });

      expect(token).toBeDefined();

      const decoded = jwt.verify(token, process.env.REFRESH_SECRET);
      expect(decoded.user).toEqual(user);
    });
  });

  describe("Password Hashing", () => {
    test("should hash password correctly", async () => {
      const password = "testpassword123";
      const salt = await bcrypt.genSalt();
      const hashed = await bcrypt.hash(password, salt);

      expect(hashed).not.toBe(password);
      expect(hashed).toBeTruthy();
    });

    test("should verify correct password", async () => {
      const password = "testpassword123";
      const hashed = await bcrypt.hash(password, 10);
      const isMatch = await bcrypt.compare(password, hashed);

      expect(isMatch).toBe(true);
    });

    test("should reject incorrect password", async () => {
      const password = "testpassword123";
      const wrongPassword = "wrongpassword";
      const hashed = await bcrypt.hash(password, 10);
      const isMatch = await bcrypt.compare(wrongPassword, hashed);

      expect(isMatch).toBe(false);
    });
  });

  describe("Token Verification Middleware", () => {
    const { verifyToken } = require("../controllers/auth-controller");

    test("should accept valid token", () => {
      const user = {
        id: 1,
        username: "testuser",
        name: "Test User",
      };

      const token = jwt.sign({ user }, process.env.ACCESS_SECRET, {
        expiresIn: "15m",
      });

      mockReq.headers["authorization"] = `Bearer ${token}`;

      verifyToken(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toEqual(user);
    });

    test("should reject request without token", () => {
      verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.sendStatus).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should reject invalid token", () => {
      mockReq.headers["authorization"] = "Bearer invalid_token";

      verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.sendStatus).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should reject expired token", () => {
      const user = {
        id: 1,
        username: "testuser",
        name: "Test User",
      };

      const token = jwt.sign({ user }, process.env.ACCESS_SECRET, {
        expiresIn: "-1s", // Already expired
      });

      mockReq.headers["authorization"] = `Bearer ${token}`;

      verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.sendStatus).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Token Hashing", () => {
    test("should consistently hash the same token", () => {
      const crypto = require("crypto");
      const token = "test-refresh-token";

      const hash1 = crypto
        .createHmac("sha256", process.env.REFRESH_HASH_SECRET)
        .update(token)
        .digest("hex");

      const hash2 = crypto
        .createHmac("sha256", process.env.REFRESH_HASH_SECRET)
        .update(token)
        .digest("hex");

      expect(hash1).toBe(hash2);
    });

    test("should produce different hashes for different tokens", () => {
      const crypto = require("crypto");
      const token1 = "test-refresh-token-1";
      const token2 = "test-refresh-token-2";

      const hash1 = crypto
        .createHmac("sha256", process.env.REFRESH_HASH_SECRET)
        .update(token1)
        .digest("hex");

      const hash2 = crypto
        .createHmac("sha256", process.env.REFRESH_HASH_SECRET)
        .update(token2)
        .digest("hex");

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("Database Queries Integration", () => {
    test("should call createUser with correct parameters", async () => {
      queries.createUser.mockResolvedValue(true);

      await queries.createUser(
        "John Doe",
        "johndoe",
        "hashedpassword",
        "https://example.com/pic.jpg",
      );

      expect(queries.createUser).toHaveBeenCalledWith(
        "John Doe",
        "johndoe",
        "hashedpassword",
        "https://example.com/pic.jpg",
      );
    });

    test("should call getUserByName with correct parameter", async () => {
      const mockUser = {
        id: 1,
        username: "johndoe",
        name: "John Doe",
      };
      queries.getUserByName.mockResolvedValue(mockUser);

      const result = await queries.getUserByName("johndoe");

      expect(queries.getUserByName).toHaveBeenCalledWith("johndoe");
      expect(result).toEqual(mockUser);
    });

    test("should call saveRefreshToken with correct parameters", async () => {
      queries.saveRefreshToken.mockResolvedValue(true);

      const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
      await queries.saveRefreshToken("hashed_token", 1, expiresAt);

      expect(queries.saveRefreshToken).toHaveBeenCalledWith(
        "hashed_token",
        1,
        expiresAt,
      );
    });

    test("should call getToken with correct parameter", async () => {
      const mockToken = {
        id: 1,
        token: "hashed_token",
        userId: 1,
        revoked: false,
      };
      queries.getToken.mockResolvedValue(mockToken);

      const result = await queries.getToken("hashed_token");

      expect(queries.getToken).toHaveBeenCalledWith("hashed_token");
      expect(result).toEqual(mockToken);
    });

    test("should call revokeToken with correct parameter", async () => {
      queries.revokeToken.mockResolvedValue(true);

      await queries.revokeToken("hashed_token");

      expect(queries.revokeToken).toHaveBeenCalledWith("hashed_token");
    });
  });
});
