const { v4: uuidv4 } = require("uuid");
const CustomerComplaintRepository = require("../repositories/CustomerComplaintRepository");
const UserRepository = require("../repositories/UserRepository");
const { sendSuccess, sendError } = require("../utils/response");

const DEFAULT_PAGE_SIZE = 10;

const customerComplaintController = {
  // CREATE COMPLAINT (Any authenticated user)
  async createComplaint(req, res) {
    try {
      const { renterId, details } = req.body;
      const reporterId = req.user.id;
      const reporterRole = req.user.role;

      // Nếu user tự tạo complaint về chính họ, renterId = user.id
      // Nếu là STAFF/ADMIN tạo complaint cho người khác, cần có renterId
      const finalRenterId = renterId || req.user.id;

      if (!details) {
        return sendError(res, {
          status: 400,
          message: "Thiếu thông tin: details là bắt buộc.",
          code: "MISSING_FIELDS",
        });
      }

      // Nếu là STAFF/ADMIN tạo complaint cho người khác
      if (renterId && renterId !== req.user.id) {
        // Chỉ STAFF/ADMIN mới được tạo complaint cho người khác
        if (reporterRole !== "STAFF" && reporterRole !== "ADMIN") {
          return sendError(res, {
            status: 403,
            message: "Bạn không có quyền tạo khiếu nại cho người khác.",
            code: "FORBIDDEN",
          });
        }

        // Verify renter exists
        const renter = await UserRepository.findById(renterId);
        if (!renter) {
          return sendError(res, {
            status: 404,
            message: "Người dùng không tồn tại.",
            code: "NOT_FOUND",
          });
        }
      }

      const complaintData = {
        id: uuidv4(),
        renterId: finalRenterId,
        reporterId,
        details,
        status: "OPEN",
      };

      const complaint = await CustomerComplaintRepository.create(complaintData);

      return sendSuccess(res, {
        status: 201,
        message: "Tạo khiếu nại thành công.",
        data: complaint,
      });
    } catch (error) {
      console.error("createComplaint error", error);
      return sendError(res, {
        message: "Không thể tạo khiếu nại.",
      });
    }
  },

  // GET ALL COMPLAINTS (STAFF/ADMIN only)
  async getAllComplaints(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const status = req.query.status || null;
      const limit = DEFAULT_PAGE_SIZE;
      const offset = (page - 1) * limit;

      const { complaints, totalItems } = await CustomerComplaintRepository.findAll({
        limit,
        offset,
        status,
      });

      const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

      return sendSuccess(res, {
        message: "Lấy danh sách khiếu nại thành công.",
        data: complaints,
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          limit,
        },
      });
    } catch (error) {
      console.error("getAllComplaints error", error);
      return sendError(res, {
        message: "Không thể lấy danh sách khiếu nại.",
      });
    }
  },

  // GET COMPLAINT BY ID (STAFF/ADMIN only)
  async getComplaintById(req, res) {
    try {
      const complaint = await CustomerComplaintRepository.findById(req.params.id);
      if (!complaint) {
        return sendError(res, {
          status: 404,
          message: "Khiếu nại không tồn tại.",
          code: "NOT_FOUND",
        });
      }

      return sendSuccess(res, {
        message: "Lấy thông tin khiếu nại thành công.",
        data: complaint,
      });
    } catch (error) {
      console.error("getComplaintById error", error);
      return sendError(res, {
        message: "Không thể lấy thông tin khiếu nại.",
      });
    }
  },

  // GET COMPLAINTS BY RENTER ID (User can see their own, STAFF/ADMIN can see all)
  async getComplaintsByRenterId(req, res) {
    try {
      const { renterId } = req.params;
      const requestingUserId = req.user.id;
      const requestingUserRole = req.user.role;

      // User chỉ có thể xem complaints của chính họ, trừ khi là STAFF/ADMIN
      if (
        requestingUserId !== renterId &&
        requestingUserRole !== "ADMIN" &&
        requestingUserRole !== "STAFF"
      ) {
        return sendError(res, {
          status: 403,
          message: "Bạn không có quyền xem khiếu nại của người khác.",
          code: "FORBIDDEN",
        });
      }

      const complaints = await CustomerComplaintRepository.findByRenterId(renterId);

      return sendSuccess(res, {
        message: "Lấy danh sách khiếu nại của người dùng thành công.",
        data: complaints,
      });
    } catch (error) {
      console.error("getComplaintsByRenterId error", error);
      return sendError(res, {
        message: "Không thể lấy danh sách khiếu nại của người dùng.",
      });
    }
  },

  // UPDATE COMPLAINT (STAFF/ADMIN only)
  async updateComplaint(req, res) {
    try {
      const { id } = req.params;
      const { details, status } = req.body;

      const existingComplaint = await CustomerComplaintRepository.findById(id);
      if (!existingComplaint) {
        return sendError(res, {
          status: 404,
          message: "Khiếu nại không tồn tại.",
          code: "NOT_FOUND",
        });
      }

      const updateData = {};
      if (details !== undefined) updateData.details = details;
      if (status !== undefined) {
        const validStatuses = ["OPEN", "RESOLVED", "CLOSED"];
        if (!validStatuses.includes(status)) {
          return sendError(res, {
            status: 400,
            message: "Status không hợp lệ. Phải là: OPEN, RESOLVED, hoặc CLOSED.",
            code: "INVALID_STATUS",
          });
        }
        updateData.status = status;
      }

      const success = await CustomerComplaintRepository.update(id, updateData);
      if (!success) {
        return sendError(res, {
          message: "Không thể cập nhật khiếu nại.",
        });
      }

      const updatedComplaint = await CustomerComplaintRepository.findById(id);

      return sendSuccess(res, {
        message: "Cập nhật khiếu nại thành công.",
        data: updatedComplaint,
      });
    } catch (error) {
      console.error("updateComplaint error", error);
      return sendError(res, {
        message: "Không thể cập nhật khiếu nại.",
      });
    }
  },

  // DELETE COMPLAINT (ADMIN only)
  async deleteComplaint(req, res) {
    try {
      const success = await CustomerComplaintRepository.deleteById(req.params.id);
      if (!success) {
        return sendError(res, {
          status: 404,
          message: "Khiếu nại không tồn tại.",
          code: "NOT_FOUND",
        });
      }

      return sendSuccess(res, {
        message: "Xóa khiếu nại thành công.",
        data: null,
      });
    } catch (error) {
      console.error("deleteComplaint error", error);
      return sendError(res, {
        message: "Không thể xóa khiếu nại.",
      });
    }
  },

  // GET COMPLAINT STATISTICS (STAFF/ADMIN only)
  async getComplaintStats(req, res) {
    try {
      const stats = await CustomerComplaintRepository.getStats();

      return sendSuccess(res, {
        message: "Lấy thống kê khiếu nại thành công.",
        data: stats,
      });
    } catch (error) {
      console.error("getComplaintStats error", error);
      return sendError(res, {
        message: "Không thể lấy thống kê khiếu nại.",
      });
    }
  },
};

module.exports = customerComplaintController;

