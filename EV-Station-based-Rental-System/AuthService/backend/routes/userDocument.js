const userDocumentController = require("../controllers/userDocumentController");
const {
  verifyTokenAndAdmin,
  verifyTokenAndUserAuthorization,
  verifyToken,
} = require("../controllers/verifyToken");

const router = require("express").Router();

// GET ALL PENDING DOCUMENTS (Admin only)
router.get("/pending", verifyTokenAndAdmin, userDocumentController.getAllPendingDocuments);

// GET DOCUMENT STATISTICS (Admin only)
router.get("/stats", verifyTokenAndAdmin, userDocumentController.getDocumentStats);

// GET DOCUMENTS BY USER ID
router.get("/user/:userId", verifyToken, userDocumentController.getDocumentsByUserId);

// GET DOCUMENT BY ID
router.get("/:id", verifyToken, userDocumentController.getDocumentById);

// CREATE DOCUMENT
router.post("/", verifyToken, userDocumentController.createDocument);

// UPDATE DOCUMENT STATUS (Admin only)
router.patch("/:id/status", verifyTokenAndAdmin, userDocumentController.updateDocumentStatus);

// DELETE DOCUMENT
router.delete("/:id", verifyTokenAndUserAuthorization, userDocumentController.deleteDocument);

module.exports = router;

