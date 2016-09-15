var express = require("express");
var router = express.Router();
var usersController = require("../controllers/usersController.js");
// router.route();
router.route("/");
router.route("/:id")
  .get(usersController.showUser)
  .put(usersController.updateUser)
  .delete(usersController.destroyUser);
//Current User Log In / Out + Show User
router.get("/current", usersController.showCurrentUser);
router.get("/logout", usersController.logout);
router.post("/login", usersController.login);

// Facebook routes.
router.get("/auth/facebook", usersController.fbAuth);
router.get("/auth/facebook/callback", usersController.fbAuthCallback)
  .get(usersController.showUsers)
  .post(usersController.addUser);

module.exports = router;
