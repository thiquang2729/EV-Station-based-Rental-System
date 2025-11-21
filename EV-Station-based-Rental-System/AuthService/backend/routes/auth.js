const authController = require("../controllers/authController");
const { verifyToken } = require("../controllers/verifyToken");

const router = require("express").Router();

//REGISTER
router.post("/register", authController.registerUser);

//REFRESH TOKEN
router.post("/refresh", authController.requestRefreshToken);
//LOG IN
router.post("/login", authController.loginUser);
//LOG OUT
router.post("/logout", authController.logOut);

// INTROSPECT (for API Gateway auth_request)
router.get("/introspect", verifyToken, (req, res) => {
  return res.json({
    active: true,
    user: { 
      id: req.user.id, 
      role: req.user.role,
      fullName: req.user.fullName || null
    },
  });
});

module.exports = router;
