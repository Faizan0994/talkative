const { Router } = require("express");
const controller = require("../controllers/messages-controller");
const router = Router();

router.delete("/:id", controller.deleteMessage);
router.patch("/:id/read", controller.markMessageRead);

module.exports = router;
