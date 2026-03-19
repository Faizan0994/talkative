const { Router } = require("express");
const controller = require("../controllers/auth-controller");

const router = Router();

router.post("/login", controller.login);
router.post("/signup", controller.signup);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);

module.exports = router;
