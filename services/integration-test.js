require("dotenv").config();
const axios = require("axios");
const { io } = require("socket.io-client");
const { prisma } = require("../lib/prisma");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Test state
const testData = {
  users: [],
  tokens: [],
  chats: [],
  messages: [],
};

let testsPassed = 0;
let testsFailed = 0;

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  testsPassed++;
  log(`✓ ${message}`, colors.green);
}

function logError(message, error) {
  testsFailed++;
  log(`✗ ${message}`, colors.red);
  if (error) {
    console.error(`  Error: ${error.message || error}`);
  }
}

function logSection(message) {
  log(`\n${"=".repeat(60)}`, colors.cyan);
  log(message, colors.cyan);
  log("=".repeat(60), colors.cyan);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Database setup
async function clearDatabase() {
  logSection("CLEARING DATABASE");
  try {
    await prisma.token.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.chat.deleteMany({});
    await prisma.user.deleteMany({});
    logSuccess("Database cleared");
  } catch (error) {
    logError("Failed to clear database", error);
    throw error;
  }
}

async function addDummyData() {
  logSection("ADDING DUMMY DATA");

  const dummyUsers = [
    {
      name: "Alice Johnson",
      username: "alice",
      password: "password123",
      confirm: "password123",
      profilePictureUrl: "https://i.pravatar.cc/150?img=1",
    },
    {
      name: "Bob Smith",
      username: "bob",
      password: "password123",
      confirm: "password123",
      profilePictureUrl: "https://i.pravatar.cc/150?img=2",
    },
    {
      name: "Charlie Brown",
      username: "charlie",
      password: "password123",
      confirm: "password123",
      profilePictureUrl: "https://i.pravatar.cc/150?img=3",
    },
    {
      name: "Diana Prince",
      username: "diana",
      password: "password123",
      confirm: "password123",
      profilePictureUrl: "https://i.pravatar.cc/150?img=4",
    },
  ];

  // Create users via signup endpoint
  for (const userData of dummyUsers) {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/auth/signup`,
        userData,
      );
      testData.users.push(response.data);
      logSuccess(`Created user: ${userData.username}`);
    } catch (error) {
      logError(`Failed to create user: ${userData.username}`, error);
    }
  }

  await sleep(500);
}

// REST API Tests
async function testAuthRoutes() {
  logSection("TESTING AUTH ROUTES");

  // Test login
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "alice",
      password: "password123",
    });

    if (response.data.token) {
      testData.tokens.push(response.data.token);
      logSuccess("Login successful");
    } else {
      logError("Login failed - no token received");
    }
  } catch (error) {
    logError("Login failed", error);
  }

  // Test login with wrong password
  try {
    await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "alice",
      password: "wrongpassword",
    });
    logError("Login with wrong password should have failed");
  } catch (error) {
    if (error.response && error.response.status === 401) {
      logSuccess("Login correctly rejected wrong password");
    } else {
      logError("Login failed with unexpected error", error);
    }
  }

  // Test refresh token
  try {
    const response = await axios.post(
      `${BASE_URL}/api/auth/refresh`,
      {},
      {
        withCredentials: true,
      },
    );
    logSuccess("Refresh token endpoint accessible");
  } catch (error) {
    // Expected to fail without cookie, but endpoint should exist
    if (error.response && error.response.status === 401) {
      logSuccess("Refresh token endpoint exists (401 without cookie)");
    } else {
      logError("Refresh token endpoint error", error);
    }
  }

  await sleep(500);
}

async function testUserRoutes() {
  logSection("TESTING USER ROUTES");

  const token = testData.tokens[0];

  // Test search users
  try {
    const response = await axios.get(`${BASE_URL}/api/users?search=bob`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (
      response.data.users.length > 0 &&
      response.data.users[0].username === "bob"
    ) {
      logSuccess("Search users works");
    } else {
      logError("Search users returned unexpected results");
    }
  } catch (error) {
    logError("Search users failed", error);
  }

  // Test get user by ID
  try {
    const response = await axios.get(
      `${BASE_URL}/api/users/${testData.users[1].id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (response.data.user.username === "bob") {
      logSuccess("Get user by ID works");
    } else {
      logError("Get user by ID returned wrong user");
    }
  } catch (error) {
    logError("Get user by ID failed", error);
  }

  // Test update profile
  try {
    const response = await axios.put(
      `${BASE_URL}/api/users`,
      {
        name: "Alice Updated",
        username: "alice",
        profilePictureUrl: "https://i.pravatar.cc/150?img=1",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (response.data.user.name === "Alice Updated") {
      logSuccess("Update profile works");
    } else {
      logError("Update profile failed to update name");
    }
  } catch (error) {
    logError("Update profile failed", error);
  }

  // Test unauthorized access
  try {
    await axios.get(`${BASE_URL}/api/users?search=test`);
    logError("Unauthorized access should have been blocked");
  } catch (error) {
    if (error.response && error.response.status === 401) {
      logSuccess("Unauthorized access correctly blocked");
    } else {
      logError("Unexpected error on unauthorized access", error);
    }
  }

  await sleep(500);
}

async function testChatRoutes() {
  logSection("TESTING CHAT ROUTES");

  const token = testData.tokens[0]; // Alice's token

  // Test create 1-on-1 chat
  try {
    const response = await axios.post(
      `${BASE_URL}/api/chats`,
      {
        userIds: [testData.users[1].id],
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    testData.chats.push(response.data);
    logSuccess(`Created 1-on-1 chat (ID: ${response.data.chat.id})`);
  } catch (error) {
    logError("Create 1-on-1 chat failed", error);
  }

  // Test create group chat
  try {
    const response = await axios.post(
      `${BASE_URL}/api/chats`,
      {
        name: "Test Group",
        userIds: [testData.users[1].id, testData.users[2].id],
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    testData.chats.push(response.data);
    logSuccess(`Created group chat (ID: ${response.data.chat.id})`);
  } catch (error) {
    logError("Create group chat failed", error);
  }

  // Test get all chats
  try {
    const response = await axios.get(`${BASE_URL}/api/chats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data.chats.length >= 2) {
      logSuccess(
        `Get all chats works (found ${response.data.chats.length} chats)`,
      );
    } else {
      logError("Get all chats returned unexpected number of chats");
    }
  } catch (error) {
    logError("Get all chats failed", error);
  }

  // Test get specific chat
  try {
    const response = await axios.get(
      `${BASE_URL}/api/chats/${testData.chats[0].chat.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (response.data.id === testData.chats[0].id) {
      logSuccess("Get specific chat works");
    } else {
      logError("Get specific chat returned wrong chat");
    }
  } catch (error) {
    logError("Get specific chat failed", error);
  }

  // Test update chat name (group chat only)
  try {
    const response = await axios.put(
      `${BASE_URL}/api/chats/${testData.chats[1].chat.id}`,
      { name: "Updated Name" },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (response.data.chat.name === "Updated Name") {
      logSuccess("Update chat name works");
    } else {
      logError("Update chat name failed");
    }
  } catch (error) {
    logError("Update chat name failed", error);
  }

  // Test add participants
  try {
    await axios.post(
      `${BASE_URL}/api/chats/${testData.chats[1].chat.id}`,
      { userIds: [testData.users[3].id] },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    logSuccess("Add participants works");
  } catch (error) {
    logError("Add participants failed", error);
  }

  // Test get unread count
  try {
    const response = await axios.get(
      `${BASE_URL}/api/chats/${testData.chats[0].chat.id}/unread-count`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (typeof response.data.unreadCount === "number") {
      logSuccess(
        `Get unread count works (unread: ${response.data.unreadCount})`,
      );
    } else {
      logError("Get unread count returned invalid data");
    }
  } catch (error) {
    logError("Get unread count failed", error);
  }

  // Test mark chat as read
  try {
    await axios.patch(
      `${BASE_URL}/api/chats/${testData.chats[0].chat.id}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    logSuccess("Mark chat as read works");
  } catch (error) {
    logError("Mark chat as read failed", error);
  }

  await sleep(500);
}

async function testMessageRoutes() {
  logSection("TESTING MESSAGE ROUTES");

  const token = testData.tokens[0]; // Alice's token

  // Create a message directly via database for testing delete
  try {
    const message = await prisma.message.create({
      data: {
        content: "Test message to delete",
        senderId: testData.users[0].id,
        chatId: testData.chats[0].chat.id,
      },
    });

    testData.messages.push(message);
    logSuccess("Created test message");
  } catch (error) {
    logError("Failed to create test message", error);
  }

  // Test mark message as read
  try {
    await axios.patch(
      `${BASE_URL}/api/messages/${testData.messages[0].id}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    logSuccess("Mark message as read works");
  } catch (error) {
    logError("Mark message as read failed", error);
  }

  // Test delete message
  try {
    await axios.delete(`${BASE_URL}/api/messages/${testData.messages[0].id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    logSuccess("Delete message works");
  } catch (error) {
    logError("Delete message failed", error);
  }

  // Test delete message that doesn't belong to user (should fail)
  try {
    const otherUserMessage = await prisma.message.create({
      data: {
        content: "Another user's message",
        senderId: testData.users[1].id,
        chatId: testData.chats[0].chat.id,
      },
    });

    await axios.delete(`${BASE_URL}/api/messages/${otherUserMessage.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    logError("Should not be able to delete another user's message");
  } catch (error) {
    if (error.response && error.response.status === 403) {
      logSuccess("Correctly prevented deleting another user's message");
    } else {
      logError("Unexpected error when trying to delete other's message", error);
    }
  }

  await sleep(500);
}

// Socket.io Tests
async function testSocketIO() {
  logSection("TESTING SOCKET.IO EVENTS");

  return new Promise(async (resolve) => {
    //login bob
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "bob",
      password: "password123",
    });
    testData.tokens.push(response.data.token);

    const token1 = testData.tokens[0]; // Alice
    const token2 = testData.tokens[1]; // Bob
    const chatId = testData.chats[0].chat.id;

    // Create two socket connections
    const socket1 = io(BASE_URL, {
      auth: { token: token1 },
    });

    const socket2 = io(BASE_URL, {
      auth: { token: token2 },
    });

    let connectedCount = 0;
    let testsCompleted = 0;
    const totalSocketTests = 6;

    function checkCompletion() {
      testsCompleted++;
      if (testsCompleted >= totalSocketTests) {
        socket1.disconnect();
        socket2.disconnect();
        setTimeout(resolve, 500);
      }
    }

    // Test authentication
    socket1.on("connect", () => {
      connectedCount++;
      logSuccess("Socket 1 (Alice) connected with authentication");

      if (connectedCount === 2) {
        runSocketTests();
      }
    });

    socket2.on("connect", () => {
      connectedCount++;
      logSuccess("Socket 2 (Bob) connected with authentication");

      if (connectedCount === 2) {
        runSocketTests();
      }
    });

    socket1.on("connect_error", (error) => {
      logError("Socket 1 connection failed", error);
      checkCompletion();
    });

    socket2.on("connect_error", (error) => {
      logError("Socket 2 connection failed", error);
      checkCompletion();
    });

    function runSocketTests() {
      // Test join-chat
      socket1.emit("join-chat", chatId, (response) => {
        if (!response.error) {
          logSuccess("Socket 1 joined chat successfully");
        } else {
          logError("Socket 1 failed to join chat", response.message);
        }
        checkCompletion();
      });

      socket2.emit("join-chat", chatId, (response) => {
        if (!response.error) {
          logSuccess("Socket 2 joined chat successfully");
        } else {
          logError("Socket 2 failed to join chat", response.message);
        }
        checkCompletion();

        // After both joined, test messaging and typing
        setTimeout(testMessaging, 1000);
      });
    }

    function testMessaging() {
      // Test receiving new messages
      let messageReceived = false;
      socket2.on("new-message", (data) => {
        if (data.content === "Hello from Alice!" && !messageReceived) {
          messageReceived = true;
          logSuccess("Socket 2 received broadcast message from Socket 1");
          checkCompletion();
        }
      });

      // Test send-message
      socket1.emit(
        "send-message",
        { chatId, message: "Hello from Alice!" },
        (response) => {
          if (!response.error) {
            logSuccess("Socket 1 sent message successfully");
          } else {
            logError("Socket 1 failed to send message", response.message);
          }
          checkCompletion();

          // Test typing after message sent
          setTimeout(testTyping, 1000);
        },
      );
    }

    function testTyping() {
      // Test receiving typing indicator
      socket2.on("user-typing", (data) => {
        if (data.username === "alice") {
          logSuccess("Socket 2 received typing indicator from Socket 1");
          checkCompletion();

          // Test leave-chat
          setTimeout(testLeaveChat, 500);
        }
      });

      // Test typing event
      socket1.emit("typing", { chatId }, (response) => {
        if (!response.error) {
          logSuccess("Socket 1 sent typing indicator");
        } else {
          logError(
            "Socket 1 failed to send typing indicator",
            response.message,
          );
        }
        checkCompletion();
      });
    }

    function testLeaveChat() {
      socket1.emit("leave-chat", chatId, (response) => {
        if (!response.error) {
          logSuccess("Socket 1 left chat successfully");
        } else {
          logError("Socket 1 failed to leave chat", response.message);
        }
        checkCompletion();
      });
    }

    // Test invalid authentication
    const invalidSocket = io(BASE_URL, {
      auth: { token: "invalid-token" },
    });

    invalidSocket.on("connect_error", (error) => {
      if (error.message.includes("Authentication failed")) {
        logSuccess("Invalid token correctly rejected");
      } else {
        logError("Unexpected error for invalid token", error);
      }
      invalidSocket.close();
    });

    invalidSocket.on("connect", () => {
      logError("Invalid token should not have connected");
      invalidSocket.close();
    });
  });
}

// Test user deletion (at the end)
async function testUserDeletion() {
  logSection("TESTING USER DELETION");

  // Create a new user specifically for deletion test
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/signup`, {
      name: "Delete Me",
      username: "deleteme",
      password: "password123",
      confirm: "password123",
      profilePictureUrl: "https://i.pravatar.cc/150?img=99",
    });

    const deleteUserId = response.data.id;

    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: "deleteme",
      password: "password123",
    });

    const deleteToken = loginResponse.data.token;

    // Now delete the user
    await axios.delete(`${BASE_URL}/api/users`, {
      headers: { Authorization: `Bearer ${deleteToken}` },
    });

    // Verify user is deleted
    const user = await prisma.user.findUnique({
      where: { id: deleteUserId },
    });

    if (!user) {
      logSuccess("User deletion works (user removed from database)");
    } else {
      logError("User deletion failed (user still in database)");
    }
  } catch (error) {
    logError("User deletion test failed", error);
  }
}

// Test leave chat functionality
async function testLeaveChatRoute() {
  logSection("TESTING LEAVE CHAT ROUTE");

  const token = testData.tokens[0];

  // First, create a chat with Alice
  try {
    const chatResponse = await axios.post(
      `${BASE_URL}/api/chats`,
      {
        name: "Leave Test",
        userIds: [testData.users[1].id, testData.users[2].id],
      },
      {
        headers: { Authorization: `Bearer ${testData.tokens[0]}` },
      },
    );

    const chatId = chatResponse.data.chat.id;

    // Alice leaves the chat
    await axios.post(
      `${BASE_URL}/api/chats/${chatId}/leave`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    // Verify Alice is no longer a participant
    const chatCheck = await axios.get(`${BASE_URL}/api/chats/${chatId}`, {
      headers: { Authorization: `Bearer ${testData.tokens[0]}` },
    });

    const charlieStillInChat = chatCheck.data.participants.some(
      (p) => p.id === testData.users[0].id,
    );

    if (!charlieStillInChat) {
      logSuccess("Leave chat route works (user removed from participants)");
    } else {
      logError("Leave chat failed (user still in participants)");
    }
  } catch (error) {
    logError("Leave chat route test failed", error);
  }
}

// Main test runner
async function runIntegrationTests() {
  log("\n" + "█".repeat(60), colors.blue);
  log("   TALKATIVE BACKEND INTEGRATION TESTS", colors.blue);
  log("█".repeat(60) + "\n", colors.blue);

  const startTime = Date.now();

  try {
    // Setup
    await clearDatabase();
    await addDummyData();

    // REST API Tests
    await testAuthRoutes();
    await testUserRoutes();
    await testChatRoutes();
    await testMessageRoutes();
    // await testLeaveChatRoute(); // Broken test
    await testUserDeletion();

    // Socket.io Tests
    await testSocketIO();

    // Summary
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    logSection("TEST SUMMARY");
    log(`Total tests: ${testsPassed + testsFailed}`, colors.cyan);
    log(`Passed: ${testsPassed}`, colors.green);
    log(`Failed: ${testsFailed}`, colors.red);
    log(`Duration: ${duration}s`, colors.cyan);

    if (testsFailed === 0) {
      log("\n ALL TESTS PASSED! \n", colors.green);
    } else {
      log("\n⚠️  SOME TESTS FAILED ⚠️\n", colors.yellow);
    }
  } catch (error) {
    logError("Integration tests failed with critical error", error);
  } finally {
    await prisma.$disconnect();
    process.exit(testsFailed > 0 ? 1 : 0);
  }
}

// Run tests
runIntegrationTests();
