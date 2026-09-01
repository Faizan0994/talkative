const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const authRouter = require("./routes/auth");
const userRouter = require("./routes/users");
const chatRouter = require("./routes/chats");
const messageRouter = require("./routes/messages");
const cors = require("cors");
const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
};

app.disable("x-powered-by");
app.use(helmet());
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(cors(corsOptions));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { errors: ["Too many requests, please try again later"] },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { errors: ["Too many attempts, please try again later"] },
});

app.use(generalLimiter);
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/users", userRouter);
app.use("/api/chats", chatRouter);
app.use("/api/messages", messageRouter);
app.use("/health", (req, res) => {
  return res.sendStatus(200);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ errors: ["Internal server error"] });
});

module.exports = app;
