const userController = require("../controllers/userController");
const {
  verifyTokenAndAdmin,
  verifyTokenAndUserAuthorization,
} = require("../controllers/verifyToken");

const router = require("express").Router();
//GET ALL USERS
router.get("/", verifyTokenAndAdmin, userController.getAllUsers);

//USER STATISTICS
router.get("/stats", verifyTokenAndAdmin, userController.getUserStats);

//GET USER BY ID
router.get("/:id", verifyTokenAndUserAuthorization, userController.getUserById);

//UPDATE USER
router.put("/:id", verifyTokenAndAdmin, userController.updateUser);

//DELETE USER
router.delete("/:id", verifyTokenAndUserAuthorization, userController.deleteUser);

module.exports = router;
