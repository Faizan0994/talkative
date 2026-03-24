const { validationResult, body } = require("express-validator");
const bcrypt = require("bcryptjs");
const queries = require("../lib/queries");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const validator = [
  body("name")
    .trim()
    .matches(/^[A-Za-z\s]+$/) // Only letters and spaces
    .withMessage("Name must contain only letters and spaces")
    .isLength({ min: 3, max: 25 })
    .withMessage("Name must be between 3 and 25 characters long"),
  body("username")
    .trim()
    .isLength({ min: 3, max: 25 })
    .withMessage("username must be between 3 and 25 characters long"),
  body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .isLength({ max: 50 })
    .withMessage("Password must not be more than 50 characters long"),
  body("confirm")
    .trim()
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
    .isLength({ max: 25 })
    .withMessage("username must be less than 25 characters long"),
  body("password")
    .trim()
    .isLength({ max: 50 })
    .withMessage("Password must not be more than 50 characters long"),
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

// Verify token
exports.verifyToken = (req, res, next) => {
  // Get auth header value
  const bearerHeader = req.headers["authorization"];
  if (bearerHeader) {
    const token = bearerHeader.split(" ")[1];
    // set token
    let isValid = false;
    jwt.verify(token, process.env.ACCESS_SECRET, (err, authData) => {
      if (err) return res.sendStatus(401);
      else {
        isValid = true;
        req.user = authData.user;
      }
    });

    if (isValid) next();
  } else {
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
      //TODO: Test this
      errors = errors.array().map((err) => {
        return { msg: err.msg };
      });
      return res.status(400).json({ errors: errors });
    }

    const { name, username, password, profilePictureUrl } = req.body;
    if (!profilePictureUrl)
      return res
        .status(400)
        .json({ errors: ["Profile picture URL is required"] });
    const salt = await bcrypt.genSalt();
    const hashed = await bcrypt.hash(password, salt);
    const userCreated = await queries.createUser(
      name,
      username,
      hashed,
      profilePictureUrl,
    );
    if (!userCreated)
      return res.status(409).json({ errors: ["Username already Taken"] });
    const user = await queries.getUserByName(username);
    const { password: pass, tokens, ...safeUser } = user; // Remove password from user object before sending
    return res.status(201).json(safeUser);
  },
];

exports.login = [
  loginValidator,
  async (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      //TODO: Test this
      errors = errors.array().map((err) => {
        return { msg: err.msg };
      });
      return res.status(400).json({ errors: errors });
    }

    const { username, password } = req.body;
    const user = await queries.getUserByName(username);
    let isPasswordCorrect = false;
    if (user) isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!(user && isPasswordCorrect)) {
      return res.status(401).json({ errors: ["invalid username or password"] });
    }
    const { password: pass, tokens, ...safeUser } = user; // Remove password from user object before sending

    const token = createAccessToken(safeUser);
    const refresh = createRefreshToken(safeUser);
    const refreshHash = hashToken(refresh);
    await queries.saveRefreshToken(
      refreshHash,
      safeUser.id,
      new Date(Date.now() + 7 * 24 * 3600 * 1000),
    ); // 7d
    res.cookie("refreshToken", refresh, {
      httpOnly: true,
      sameSite: true,
      secure: true,
    });
    res.status(200).json({ token });
  },
];

exports.refresh = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(401);
  const hashed = hashToken(token);
  const stored = await queries.getToken(hashed);
  if (!stored || stored.revoked) return res.sendStatus(401);
  const { user } = stored;
  const { password: pass, tokens, ...safeUser } = user;
  jwt.verify(token, process.env.REFRESH_SECRET, async (err, payload) => {
    if (err) return res.sendStatus(401);

    const newAccessToken = createAccessToken(safeUser);
    res.json({ token: newAccessToken });
  });
};

exports.logout = [
  this.verifyToken,
  async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const token = req.cookies.refreshToken;
    const hashed = hashToken(token);

    await queries.revokeToken(hashed);
    res.clearCookie("refreshToken");
    res.sendStatus(204);
  },
];
