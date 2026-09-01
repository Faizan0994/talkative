const { validationResult, body } = require("express-validator");
const bcrypt = require("bcryptjs");
const queries = require("../lib/queries");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const validator = [
  body("name")
    .trim()
    .matches(/^[A-Za-z\s]+$/)
    .withMessage("Name must contain only letters and spaces")
    .isLength({ min: 3, max: 25 })
    .withMessage("Name must be between 3 and 25 characters long"),
  body("username")
    .trim()
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username must contain only letters, numbers, and underscores")
    .isLength({ min: 3, max: 25 })
    .withMessage("Username must be between 3 and 25 characters long"),
  body("password")
    .isLength({ min: 8, max: 50 })
    .withMessage("Password must be between 8 and 50 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),
  body("confirm")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match"),
  body("profilePictureUrl")
    .trim()
    .isURL()
    .withMessage("Invalid profile picture URL"),
];

const loginValidator = [
  body("username")
    .trim()
    .isLength({ min: 1, max: 25 })
    .withMessage("Username must be between 1 and 25 characters long"),
  body("password")
    .isLength({ min: 1, max: 50 })
    .withMessage("Password must be between 1 and 50 characters long"),
];

function createAccessToken(user) {
  return jwt.sign({ user }, process.env.ACCESS_SECRET, {
    expiresIn: "15m",
  });
}

function createRefreshToken(user) {
  return jwt.sign({ user }, process.env.REFRESH_SECRET, {
    expiresIn: "7d",
  });
}

exports.verifyToken = (req, res, next) => {
  const bearerHeader = req.headers["authorization"];
  if (!bearerHeader) return res.sendStatus(401);

  const token = bearerHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET);
    req.user = decoded.user;
    next();
  } catch {
    return res.sendStatus(401);
  }
};

function hashToken(token) {
  return crypto
    .createHmac("sha256", process.env.REFRESH_HASH_SECRET)
    .update(token)
    .digest("hex");
}

exports.signup = [
  validator,
  async (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors = errors.array().map((err) => err.msg);
      return res.status(400).json({ errors });
    }

    const { name, username, password, profilePictureUrl } = req.body;
    if (!profilePictureUrl)
      return res
        .status(400)
        .json({ errors: ["Profile picture URL is required"] });

    try {
      const salt = await bcrypt.genSalt();
      const hashed = await bcrypt.hash(password, salt);
      const userCreated = await queries.createUser(
        name,
        username,
        hashed,
        profilePictureUrl,
      );
      if (!userCreated)
        return res.status(409).json({ errors: ["Username already taken"] });
      const user = await queries.getUserByName(username);
      const { password: pass, tokens, ...safeUser } = user;
      return res.status(201).json(safeUser);
    } catch {
      return res.status(500).json({ errors: ["Error creating account"] });
    }
  },
];

exports.login = [
  loginValidator,
  async (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors = errors.array().map((err) => err.msg);
      return res.status(400).json({ errors });
    }

    try {
      const { username, password } = req.body;
      const user = await queries.getUserByName(username);
      let isPasswordCorrect = false;
      if (user)
        isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!(user && isPasswordCorrect)) {
        return res
          .status(401)
          .json({ errors: ["Invalid username or password"] });
      }
      const { password: pass, tokens, ...safeUser } = user;

      const token = createAccessToken(safeUser);
      const refresh = createRefreshToken(safeUser);
      const refreshHash = hashToken(refresh);
      await queries.saveRefreshToken(
        refreshHash,
        safeUser.id,
        new Date(Date.now() + 7 * 24 * 3600 * 1000),
      );
      res.cookie("refreshToken", refresh, {
        httpOnly: true,
        sameSite: true,
        secure: true,
      });
      res.status(200).json({ token });
    } catch {
      return res.status(500).json({ errors: ["Error logging in"] });
    }
  },
];

exports.refresh = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(401);

  try {
    const hashed = hashToken(token);
    const stored = await queries.getToken(hashed);
    if (!stored || stored.revoked) return res.sendStatus(401);

    jwt.verify(token, process.env.REFRESH_SECRET, async (err) => {
      if (err) return res.sendStatus(401);

      const { user } = stored;
      const { password: pass, tokens, ...safeUser } = user;

      await queries.revokeToken(hashed);

      const newAccessToken = createAccessToken(safeUser);
      const newRefresh = createRefreshToken(safeUser);
      const newRefreshHash = hashToken(newRefresh);
      await queries.saveRefreshToken(
        newRefreshHash,
        safeUser.id,
        new Date(Date.now() + 7 * 24 * 3600 * 1000),
      );
      res.cookie("refreshToken", newRefresh, {
        httpOnly: true,
        sameSite: true,
        secure: true,
      });
      res.json({ token: newAccessToken });
    });
  } catch {
    return res.status(500).json({ errors: ["Error refreshing token"] });
  }
};

exports.logout = [
  exports.verifyToken,
  async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    try {
      const token = req.cookies.refreshToken;
      if (token) {
        const hashed = hashToken(token);
        await queries.revokeToken(hashed);
      }
      res.clearCookie("refreshToken");
      res.sendStatus(204);
    } catch {
      return res.status(500).json({ errors: ["Error logging out"] });
    }
  },
];
