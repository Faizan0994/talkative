const { Router } = require("express");
const controller = require("../controllers/chats-controller");
const router = Router();

router.get("/", controller.getUserChats);
router.post("/", controller.createChat);
router.get("/:id", controller.getChat);
router.put("/:id", controller.updateChatName);
router.post("/:id", controller.addChatParticipants);
//router.delete("/:id", controller.deleteChat); // Optional: Implement chat deletion if needed

module.exports = router;
