const uploadController = require("../controllers/uploadController");
const { verifyToken } = require("../controllers/verifyToken");
const { uploadSingle } = require("../services/uploadService");

const router = require("express").Router();

// Upload document - requires authentication
router.post(
  "/document",
  verifyToken,
  uploadSingle,
  uploadController.uploadDocument
);

module.exports = router;

