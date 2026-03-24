const { Router } = require("express");
const controller = require("../controllers/users-controller");
const router = Router();

router.get("/", controller.searchUsers);
router.get("/:id", controller.getUser);
router.put("/", controller.updateUser);
router.delete("/", controller.deleteUser);

module.exports = router;
