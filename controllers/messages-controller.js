const queries = require("../lib/queries");
const { verifyToken } = require("./auth-controller");
const { body, validationResult } = require("express-validator");

exports.deleteMessage = [
  verifyToken,
  async (req, res) => {
    const user = req.user;
    const messageId = +req.params.id;

    try {
      const message = await queries.getMessage(messageId);
      if (!message) return res.sendStatus(404);
      if (message.senderId !== user.id) return res.sendStatus(403); // Users can only delete their own messages
      await queries.deleteMessage(messageId);
      return res.sendStatus(204);
    } catch (err) {
      return res.status(500).json({ errors: ["Error deleting message"] });
    }
  },
];

exports.markMessageRead = [
  verifyToken,
  async (req, res) => {
    const user = req.user;
    const id = +req.params.id;

    try {
      const message = await queries.getMessage(id);
      if (!message) return res.sendStatus(404);

      const chat = await queries.getChat(message.chatId);
      const isParticipant = chat.participants.some((p) => p.id === user.id);
      if (!isParticipant) return res.sendStatus(403);

      await queries.markMessageAsRead(id);
      return res.sendStatus(200);
    } catch (err) {
      return res
        .status(500)
        .json({ errors: ["Error marking message as read"] });
    }
  },
];
