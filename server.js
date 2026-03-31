const app = require("./app");
const http = require("http");
const { Server } = require("socket.io");
const { socketAuthentication, handleConnection } = require("./lib/socket");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.use(socketAuthentication);

io.on("connection", handleConnection(io));

server.listen(process.env.PORT || 3000, (error) => {
  console.log("server listening...");
  if (error) {
    console.log(error);
  }
});
