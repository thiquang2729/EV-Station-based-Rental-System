const customerComplaintController = require("../controllers/customerComplaintController");
const {
  verifyTokenAndStaff,
  verifyTokenAndAdmin,
  verifyToken,
} = require("../controllers/verifyToken");

const router = require("express").Router();

// CREATE COMPLAINT (any authenticated user can create)
router.post("/", verifyToken, customerComplaintController.createComplaint);

// COMPLAINT STATISTICS (staff & admin) - phải đặt trước GET /
router.get("/stats", verifyTokenAndStaff, customerComplaintController.getComplaintStats);

// GET COMPLAINTS BY RENTER ID (user can see their own, staff/admin can see all) - phải đặt trước GET /:id
router.get("/renter/:renterId", verifyToken, customerComplaintController.getComplaintsByRenterId);

// GET ALL COMPLAINTS (staff & admin)
router.get("/", verifyTokenAndStaff, customerComplaintController.getAllComplaints);

// GET COMPLAINT BY ID (staff & admin)
router.get("/:id", verifyTokenAndStaff, customerComplaintController.getComplaintById);

// UPDATE COMPLAINT (staff & admin)
router.put("/:id", verifyTokenAndStaff, customerComplaintController.updateComplaint);

// DELETE COMPLAINT (admin only)
router.delete("/:id", verifyTokenAndAdmin, customerComplaintController.deleteComplaint);

module.exports = router;

