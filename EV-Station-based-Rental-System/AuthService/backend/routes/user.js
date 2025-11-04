const userController = require("../controllers/userController");
const {
  verifyTokenAndAdmin,
  verifyTokenAndUserAuthorization,
  verifyTokenAndStaff,
  verifyToken,
} = require("../controllers/verifyToken");

const router = require("express").Router();
//GET ALL USERS
router.get("/", verifyTokenAndStaff, userController.getAllUsers);

//USER STATISTICS
router.get("/stats", verifyTokenAndStaff, userController.getUserStats);

//USER REGISTRATION STATISTICS BY DATE
router.get("/registration-stats", verifyTokenAndStaff, userController.getUserRegistrationStats);

//GET USER BY ID
router.get("/:id", verifyTokenAndStaff, userController.getUserById);

//UPDATE USER
router.put("/:id", verifyTokenAndAdmin, userController.updateUser);

//UPDATE CURRENT USER PROFILE (for users to update their own info)
router.put("/profile/me", verifyToken, userController.updateCurrentUserProfile);

//DELETE USER
router.delete("/:id", verifyTokenAndUserAuthorization, userController.deleteUser);

//VERIFY USER ONSITE (STAFF/ADMIN)
router.post("/:id/verify-onsite", verifyTokenAndStaff, userController.verifyUserOnsite);

//GET USER VERIFICATION LOGS
router.get("/:id/verification-logs", verifyTokenAndStaff, userController.getUserVerificationLogs);

module.exports = router;
