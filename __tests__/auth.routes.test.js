const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");
const authRouter = require("../routes/auth");
const queries = require("../lib/queries");
const bcrypt = require("bcryptjs");

// Mock the queries module
jest.mock("../lib/queries");

// Create a test app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/auth", authRouter);

describe("Auth Routes Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/signup", () => {
    const validSignupData = {
      name: "John Doe",
      username: "johndoe",
      password: "password123",
      confirm: "password123",
      profilePictureUrl: "https://example.com/pic.jpg",
    };

    test("should successfully register a new user", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const mockUser = {
        id: 1,
        name: "John Doe",
        username: "johndoe",
        password: hashedPassword,
        profilePictureUrl: "https://example.com/pic.jpg",
        tokens: [],
      };

      queries.createUser.mockResolvedValue(true);
      queries.getUserByName.mockResolvedValue(mockUser);

      const response = await request(app)
        .post("/api/auth/signup")
        .send(validSignupData)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("name", "John Doe");
      expect(response.body).toHaveProperty("username", "johndoe");
      expect(response.body).not.toHaveProperty("password");
      expect(response.body).not.toHaveProperty("tokens");
      expect(queries.createUser).toHaveBeenCalledWith(
        "John Doe",
        "johndoe",
        expect.any(String),
        "https://example.com/pic.jpg",
      );
    });

    test("should reject signup with invalid name (contains numbers)", async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          ...validSignupData,
          name: "John123",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain(
        "Name must contain only letters and spaces",
      );
    });

    test("should reject signup with short name", async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          ...validSignupData,
          name: "Jo",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain(
        "Name must be between 3 and 25 characters long",
      );
    });

    test("should reject signup with short username", async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          ...validSignupData,
          username: "ab",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
    });

    test("should reject signup with short password", async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          ...validSignupData,
          password: "pass123",
          confirm: "pass123",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain(
        "Password must be at least 8 characters long",
      );
    });

    test("should reject signup when passwords do not match", async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          ...validSignupData,
          confirm: "differentpassword",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain("Passwords do not match");
    });

    test("should reject signup without profile picture URL", async () => {
      queries.createUser.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          name: "John Doe",
          username: "johndoe",
          password: "password123",
          confirm: "password123",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain("Invalid profile picture URL");
    });

    test("should reject signup with already taken username", async () => {
      queries.createUser.mockResolvedValue(false);

      const response = await request(app)
        .post("/api/auth/signup")
        .send(validSignupData)
        .expect(409);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain("Username already Taken");
    });
  });

  describe("POST /api/auth/login", () => {
    test("should successfully login with valid credentials", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const mockUser = {
        id: 1,
        name: "John Doe",
        username: "johndoe",
        password: hashedPassword,
        profilePictureUrl: "https://example.com/pic.jpg",
        tokens: [],
      };

      queries.getUserByName.mockResolvedValue(mockUser);
      queries.saveRefreshToken.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: "johndoe",
          password: "password123",
        })
        .expect(200);

      expect(response.body).toHaveProperty("token");
      expect(response.headers["set-cookie"]).toBeDefined();
      expect(response.headers["set-cookie"][0]).toContain("refreshToken");
      expect(queries.saveRefreshToken).toHaveBeenCalled();
    });

    test("should reject login with invalid username", async () => {
      queries.getUserByName.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: "nonexistent",
          password: "password123",
        })
        .expect(401);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain("invalid username or password");
    });

    test("should reject login with incorrect password", async () => {
      const hashedPassword = await bcrypt.hash("correctpassword", 10);
      const mockUser = {
        id: 1,
        name: "John Doe",
        username: "johndoe",
        password: hashedPassword,
        profilePictureUrl: "https://example.com/pic.jpg",
      };

      queries.getUserByName.mockResolvedValue(mockUser);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: "johndoe",
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toContain("invalid username or password");
    });

    test("should reject login with username too long", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          username: "a".repeat(26),
          password: "password123",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
    });
  });

  describe("POST /api/auth/refresh", () => {
    test("should successfully refresh access token with valid refresh token", async () => {
      const mockUser = {
        id: 1,
        name: "John Doe",
        username: "johndoe",
        profilePictureUrl: "https://example.com/pic.jpg",
      };

      const mockTokenRecord = {
        id: 1,
        token: "hashed_refresh_token",
        userId: 1,
        expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        revoked: false,
        user: {
          ...mockUser,
          password: "hashed",
          tokens: [],
        },
      };

      queries.getToken.mockResolvedValue(mockTokenRecord);

      // First, login to get a real refresh token
      const hashedPassword = await bcrypt.hash("password123", 10);
      queries.getUserByName.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
        tokens: [],
      });
      queries.saveRefreshToken.mockResolvedValue(true);

      const loginResponse = await request(app).post("/api/auth/login").send({
        username: "johndoe",
        password: "password123",
      });

      const cookies = loginResponse.headers["set-cookie"];

      const response = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", cookies)
        .expect(200);

      expect(response.body).toHaveProperty("token");
    });

    test("should reject refresh without refresh token", async () => {
      const response = await request(app).post("/api/auth/refresh").expect(401);
    });

    test("should reject refresh with revoked token", async () => {
      const mockTokenRecord = {
        id: 1,
        token: "hashed_refresh_token",
        userId: 1,
        expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        revoked: true,
        user: {
          id: 1,
          name: "John Doe",
          username: "johndoe",
          password: "hashed",
          tokens: [],
        },
      };

      queries.getToken.mockResolvedValue(mockTokenRecord);

      const response = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", ["refreshToken=fake_token"])
        .expect(401);
    });

    test("should reject refresh with non-existent token", async () => {
      queries.getToken.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", ["refreshToken=fake_token"])
        .expect(401);
    });
  });

  describe("POST /api/auth/logout", () => {
    test("should successfully logout with valid access token and refresh token", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const mockUser = {
        id: 1,
        name: "John Doe",
        username: "johndoe",
        password: hashedPassword,
        profilePictureUrl: "https://example.com/pic.jpg",
        tokens: [],
      };

      queries.getUserByName.mockResolvedValue(mockUser);
      queries.saveRefreshToken.mockResolvedValue(true);
      queries.revokeToken.mockResolvedValue(true);

      // First login to get tokens
      const loginResponse = await request(app).post("/api/auth/login").send({
        username: "johndoe",
        password: "password123",
      });

      const accessToken = loginResponse.body.token;
      const cookies = loginResponse.headers["set-cookie"];

      const response = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", cookies)
        .expect(204);

      expect(queries.revokeToken).toHaveBeenCalled();
    });

    test("should reject logout without access token", async () => {
      const response = await request(app).post("/api/auth/logout").expect(401);
    });

    test("should reject logout with invalid access token", async () => {
      const response = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", "Bearer invalid_token")
        .set("Cookie", ["refreshToken=fake_token"])
        .expect(401);
    });
  });
});
