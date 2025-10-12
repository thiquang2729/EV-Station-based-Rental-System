const UserRepository = require("../repositories/UserRepository");
const { sendSuccess, sendError } = require("../utils/response");

const DEFAULT_PAGE_SIZE = 10;

const userController = {
  // GET USERS WITH PAGINATION
  async getAllUsers(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = DEFAULT_PAGE_SIZE;
      const offset = (page - 1) * limit;

      const { users, totalItems } = await UserRepository.paginate({ limit, offset });
      const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

      return sendSuccess(res, {
        message: "Lấy danh sách người dùng thành công.",
        data: users,
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          limit,
        },
      });
    } catch (error) {
      console.error("getAllUsers error", error);
      return sendError(res, {
        message: "Không thể lấy danh sách người dùng.",
      });
    }
  },

  async getUserStats(req, res) {
    try {
      const stats = await UserRepository.getStats();
      return sendSuccess(res, {
        message: "Lấy thống kê người dùng thành công.",
        data: stats,
      });
    } catch (error) {
      console.error("getUserStats error", error);
      return sendError(res, {
        message: "Không thể lấy thống kê người dùng.",
      });
    }
  },

  // GET USER BY ID
  async getUserById(req, res) {
    try {
      const user = await UserRepository.findById(req.params.id);
      if (!user) {
        return sendError(res, {
          status: 404,
          message: "Người dùng không tồn tại.",
          code: "NOT_FOUND",
        });
      }

      // Remove sensitive data
      const { passwordHash, refreshToken, ...safeUser } = user;

      return sendSuccess(res, {
        message: "Lấy thông tin người dùng thành công.",
        data: safeUser,
      });
    } catch (error) {
      console.error("getUserById error", error);
      return sendError(res, {
        message: "Không thể lấy thông tin người dùng.",
      });
    }
  },

  // UPDATE USER
  async updateUser(req, res) {
    try {
      const { phoneNumber, role, verificationStatus, riskStatus } = req.body;
      const userId = req.params.id;

      // Check if user exists
      const existingUser = await UserRepository.findById(userId);
      if (!existingUser) {
        return sendError(res, {
          status: 404,
          message: "Người dùng không tồn tại.",
          code: "NOT_FOUND",
        });
      }

      // Update user
      const updateData = {};
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
      if (role !== undefined) updateData.role = role;
      if (verificationStatus !== undefined) updateData.verificationStatus = verificationStatus;
      if (riskStatus !== undefined) updateData.riskStatus = riskStatus;

      const success = await UserRepository.update(userId, updateData);
      if (!success) {
        return sendError(res, {
          message: "Không thể cập nhật người dùng.",
        });
      }

      // Get updated user
      const updatedUser = await UserRepository.findById(userId);
      const { passwordHash, refreshToken, ...safeUser } = updatedUser;

      return sendSuccess(res, {
        message: "Cập nhật người dùng thành công.",
        data: safeUser,
      });
    } catch (error) {
      console.error("updateUser error", error);
      return sendError(res, {
        message: "Không thể cập nhật người dùng.",
      });
    }
  },

  // DELETE USER
  async deleteUser(req, res) {
    try {
      const success = await UserRepository.deleteById(req.params.id);
      if (!success) {
        return sendError(res, {
          status: 404,
          message: "Người dùng không tồn tại.",
          code: "NOT_FOUND",
        });
      }

      return sendSuccess(res, {
        message: "Xóa người dùng thành công.",
        data: null,
      });
    } catch (error) {
      console.error("deleteUser error", error);
      return sendError(res, {
        message: "Không thể xóa người dùng.",
      });
    }
  },
};

module.exports = userController;
