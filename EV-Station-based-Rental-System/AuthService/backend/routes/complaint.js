const customerComplaintController = require("../controllers/customerComplaintController");
const {
  verifyTokenAndStaff,
  verifyTokenAndAdmin,
  verifyToken,
} = require("../controllers/verifyToken");

const router = require("express").Router();

// Debug middleware to trace complaint routes
router.use((req, res, next) => {
  console.log("[ComplaintRoute]", {
    method: req.method,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    path: req.path,
  });
  next();
});

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

