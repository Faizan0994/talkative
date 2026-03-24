const queries = require("../lib/queries");
const { verifyToken } = require("./auth-controller");
const { body, validationResult } = require("express-validator");

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
  body("profilePictureUrl")
    .trim()
    .isURL()
    .withMessage("Invalid profile picture URL"),
];

exports.searchUsers = [
  verifyToken,
  async (req, res) => {
    const searchFor = req.query.search;
    if (!req.query.search) {
      return res.status(200).json({ users: [] });
    }
    const users = await queries.searchUsers(searchFor);
    const filteredUsers = users.filter((u) => u.id !== req.user.id); // Remove self from search results

    if (filteredUsers.length === 0) return res.sendStatus(404);

    return res.status(200).json({ users: filteredUsers });
  },
];

exports.getUser = [
  verifyToken,
  async (req, res) => {
    const user = req.user;
    const id = +req.params.id;
    let isSelf = false; // flag for frontend to know if this is the user's own profile or not

    if (user.id === id) isSelf = true;

    const requestedUser = await queries.getUser(id);
    if (!requestedUser) return res.sendStatus(404);
    const { password: pass, tokens, ...safeUser } = requestedUser; // Remove password from user object before sending
    return res.status(200).json({ user: safeUser, isSelf: isSelf });
  },
];

exports.updateUser = [
  verifyToken,
  validator,
  async (req, res) => {
    const user = req.user; // Only allow user to update their own profile, not anyone else's

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      //TODO: Test this
      errors = errors.array().map((err) => {
        return { msg: err.msg };
      });
      return res.status(400).json({ errors: errors });
    }

    const { name, username, profilePictureUrl } = req.body;

    await queries.updateUser(user.id, name, username, profilePictureUrl);

    return res.sendStatus(200);
  },
];

exports.deleteUser = [
  verifyToken,
  async (req, res) => {
    const user = req.user; // Only allow user to delete their own profile, not anyone else's
    try {
      await queries.deleteUser(user.id);
    } catch (err) {
      return res.status(500).json({ errors: ["Error deleting user"] });
    }
    return res.sendStatus(204);
  },
];
