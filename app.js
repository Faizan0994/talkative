const express = require("express");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth");
const userRouter = require("./routes/users");
const chatRouter = require("./routes/chats");
const messageRouter = require("./routes/messages");
const cors = require("cors");
const app = express();

const corsOptions = { origin: process.env.FRONTEND_URL };

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

//TODO: Rate limiting

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/chats", chatRouter);
app.use("/api/messages", messageRouter);
app.use("/health", (req, res) => {
  return res.sendStatus(200);
});

module.exports = app;
