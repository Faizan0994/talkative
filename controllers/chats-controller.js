const queries = require("../lib/queries");
const { verifyToken } = require("./auth-controller");
const { body, validationResult } = require("express-validator");

const createChatValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 15 })
    .withMessage("Name must be between 3 and 15 characters long"),
  body("userIds").isArray().notEmpty().withMessage("Invalid User list"),
];

const updateChatNameValidator = [
  body("name")
    .trim()
    .isLength({ min: 3, max: 15 })
    .withMessage("Name must be between 3 and 15 characters long"),
];

const addChatParticipantsValidator = [
  body("userIds").isArray().notEmpty().withMessage("Invalid User list"),
];

exports.createChat = [
  verifyToken,
  createChatValidator,
  async (req, res) => {
    const user = req.user;

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors = errors.array().map((err) => {
        return err.msg;
      });
      return res.status(400).json({ errors: errors });
    }

    const { name, userIds } = req.body;
    userIds.push(user.id); // Add the creator to the list of participants
    const isValidList = await queries.doUsersExist(userIds);
    if (!isValidList)
      return res
        .status(400)
        .json({ errors: ["Some users in the list do not exist"] });

    try {
      if (userIds.length === 2) {
        const chat = await queries.createChat(userIds);
        return res.status(201).json({ chat });
      } else {
        const chat = await queries.createGroupChat(name, userIds);
        return res.status(201).json({ chat });
      }
    } catch (err) {
      return res.status(500).json({ errors: ["Error creating chat"] });
    }
  },
];

exports.getChat = [
  verifyToken,
  async (req, res) => {
    const user = req.user;
    const id = +req.params.id;
    const limit = +req.query.limit;

    try {
      const chat = limit
        ? await queries.getChat(id, limit)
        : await queries.getChat(id);
      if (!chat) return res.sendStatus(404);

      // Check if user is a participant in the chat
      const isParticipant = chat.participants.some((p) => p.id === user.id);
      if (!isParticipant) return res.sendStatus(403); // Users can only access their own chats
      return res.status(200).json({ chat });
    } catch (err) {
      return res.status(500).json({ errors: ["Error retrieving chat"] });
    }
  },
];

exports.markChatRead = [
  verifyToken,
  async (req, res) => {
    const user = req.user;
    const id = +req.params.id;

    try {
      const chat = await queries.getChat(id);
      if (!chat) return res.sendStatus(404);

      // Check if user is a participant in the chat
      const isParticipant = chat.participants.some((p) => p.id === user.id);
      if (!isParticipant) return res.sendStatus(403); // Users can only access their own chats

      await queries.markChatAsRead(id, user.id);
      return res.sendStatus(200);
    } catch (err) {
      return res.status(500).json({ errors: ["Error marking chat as read"] });
    }
  },
];

exports.getUnreadCount = [
  verifyToken,
  async (req, res) => {
    const user = req.user;
    const id = +req.params.id;

    try {
      const unreadCount = await queries.unreadMessagesCount(id, user.id);
      return res.status(200).json({ unreadCount });
    } catch (err) {
      return res
        .status(500)
        .json({ errors: ["Error retrieving unread count"] });
    }
  },
];

exports.leaveChat = [
  verifyToken,
  async (req, res) => {
    const user = req.user;
    const id = +req.params.id;
    try {
      await queries.removeChatParticipant(id, user.id);
      return res.sendStatus(200);
    } catch (err) {
      return res.status(500).json({ errors: ["Error leaving chat"] });
    }
  },
];

exports.getUserChats = [
  verifyToken,
  async (req, res) => {
    const user = req.user;

    try {
      const chats = await queries.getChatsForUser(user.id);
      return res.status(200).json({ chats });
    } catch (err) {
      return res.status(500).json({ errors: ["Error retrieving user chats"] });
    }
  },
];

exports.updateChatName = [
  verifyToken,
  updateChatNameValidator,
  async (req, res) => {
    const user = req.user;
    const id = +req.params.id;

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      //TODO: Test this
      errors = errors.array().map((err) => {
        return err.msg;
      });
      return res.status(400).json({ errors: errors });
    }

    const { name } = req.body;

    try {
      // Check if chat exists and user is a participant
      const chat = await queries.getChat(id);
      if (!chat) return res.sendStatus(404);

      const isParticipant = chat.participants.some((p) => p.id === user.id);
      if (!isParticipant) return res.sendStatus(403);

      await queries.updateChatName(id, name);
      return res.sendStatus(200);
    } catch (err) {
      return res.status(500).json({ errors: ["Error updating chat name"] });
    }
  },
];

exports.addChatParticipants = [
  verifyToken,
  addChatParticipantsValidator,
  async (req, res) => {
    const user = req.user;
    const id = +req.params.id;

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors = errors.array().map((err) => {
        return err.msg;
      });
      return res.status(400).json({ errors: errors });
    }

    const { userIds } = req.body;
    const isValidList = await queries.doUsersExist(userIds);
    if (!isValidList)
      return res
        .status(400)
        .json({ errors: ["Some users in the list do not exist"] });

    try {
      // Check if chat exists and user is a participant
      const chat = await queries.getChat(id);
      if (!chat) return res.sendStatus(404);

      const isParticipant = chat.participants.some((p) => p.id === user.id);
      if (!isParticipant) return res.sendStatus(403);

      await queries.addChatParticipants(id, userIds);
      return res.sendStatus(200);
    } catch (err) {
      return res
        .status(500)
        .json({ errors: ["Error adding chat participants"] });
    }
  },
];
