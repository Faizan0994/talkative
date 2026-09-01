const app = require("./app");
const http = require("http");
const { Server } = require("socket.io");
const { socketAuthentication, handleConnection } = require("./lib/socket");
const { ensureRandomStrangers } = require("./scripts/ensure-random-strangers");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.use(socketAuthentication);

io.on("connection", handleConnection(io));

const PORT = process.env.PORT || 3000;

ensureRandomStrangers()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`server listening on port ${PORT}...`);
    });
  })
  .catch((err) => {
    console.error("Failed to ensure random strangers group:", err);
    server.listen(PORT, () => {
      console.log(`server listening on port ${PORT} (group init failed)...`);
    });
  });
