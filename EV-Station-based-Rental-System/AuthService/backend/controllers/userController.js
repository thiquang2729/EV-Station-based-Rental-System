const UserRepository = require("../repositories/UserRepository");
const UserVerificationLogRepository = require("../repositories/UserVerificationLogRepository");
const { sendSuccess, sendError } = require("../utils/response");
const { v4: uuidv4 } = require("uuid");

const DEFAULT_PAGE_SIZE = 10;

const userController = {
  // GET USERS WITH PAGINATION AND ADVANCED FILTERS
  async getAllUsers(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const riskStatus = (req.query.riskStatus || "").trim() || null;
      const search = (req.query.search || "").trim() || null;
      
      // Advanced filters
      const role = (req.query.role || "").trim() || null;
      const verificationStatus = (req.query.verificationStatus || "").trim() || null;
      const dateFrom = req.query.dateFrom || null;
      const dateTo = req.query.dateTo || null;
      
      const limit = DEFAULT_PAGE_SIZE;
      const offset = (page - 1) * limit;

      const { users, totalItems } = await UserRepository.paginate({ 
        limit, 
        offset, 
        riskStatus, 
        search,
        role,
        verificationStatus,
        dateFrom,
        dateTo
      });
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

  // GET USER REGISTRATION STATISTICS BY DATE
  async getUserRegistrationStats(req, res) {
    try {
      const { period = '7d' } = req.query;
      
      // Validate period parameter
      const validPeriods = ['7d', '30d', '90d'];
      if (!validPeriods.includes(period)) {
        return sendError(res, {
          status: 400,
          message: "Khoảng thời gian không hợp lệ. Chỉ chấp nhận: 7d, 30d, 90d",
          code: "INVALID_PERIOD",
        });
      }

      // Map period to days
      const daysMap = {
        '7d': 7,
        '30d': 30,
        '90d': 90
      };
      const days = daysMap[period];

      const stats = await UserRepository.getRegistrationStatsByDate(days);
      
      return sendSuccess(res, {
        message: "Lấy thống kê đăng ký theo ngày thành công.",
        data: stats,
        period: period,
        totalDays: days
      });
    } catch (error) {
      console.error("getUserRegistrationStats error", error);
      return sendError(res, {
        message: "Không thể lấy thống kê đăng ký theo ngày.",
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
      const { fullName, phoneNumber, role, verificationStatus, riskStatus } = req.body;
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
      if (fullName !== undefined) updateData.fullName = fullName;
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

  // VERIFY USER ONSITE (STAFF/ADMIN)
  async verifyUserOnsite(req, res) {
    try {
      const { id: userId } = req.params;
      const { stationId, note, evidenceUrls } = req.body;
      const staffId = req.user.id;
      const normalizedStationId =
        typeof stationId === "string" ? stationId.trim() : stationId;

      if (!normalizedStationId) {
        return sendError(res, {
          status: 400,
          message: "Thiếu thông tin: stationId là bắt buộc.",
          code: "MISSING_FIELDS",
        });
      }

      // Verify user exists
      const user = await UserRepository.findById(userId);
      if (!user) {
        return sendError(res, {
          status: 404,
          message: "Người dùng không tồn tại.",
          code: "NOT_FOUND",
        });
      }

      const sanitizedNote =
        typeof note === "string" && note.trim().length > 0 ? note.trim() : null;

      let normalizedEvidence = null;
      if (Array.isArray(evidenceUrls)) {
        const cleanedEvidence = evidenceUrls
          .map((url) => (typeof url === "string" ? url.trim() : ""))
          .filter((url) => url.length > 0);

        if (cleanedEvidence.length > 0) {
          normalizedEvidence = JSON.stringify(cleanedEvidence);
        }
      } else if (typeof evidenceUrls === "string" && evidenceUrls.trim()) {
        normalizedEvidence = JSON.stringify([evidenceUrls.trim()]);
      } else if (
        evidenceUrls &&
        typeof evidenceUrls === "object" &&
        !Array.isArray(evidenceUrls)
      ) {
        normalizedEvidence = JSON.stringify(evidenceUrls);
      }

      let updatedVerificationStatus = user.verificationStatus;
      if ((user.verificationStatus || "").toUpperCase() !== "VERIFIED") {
        const verificationUpdated = await UserRepository.updateVerificationStatus(
          userId,
          "VERIFIED"
        );

        if (!verificationUpdated) {
          return sendError(res, {
            status: 500,
            message: "Khong the cap nhat trang thai xac thuc.",
          });
        }

        updatedVerificationStatus = "VERIFIED";
      }

      // Create verification log
      const logData = {
        id: uuidv4(),
        userId,
        staffId,
        stationId: normalizedStationId,
        note: sanitizedNote,
        evidenceUrls: normalizedEvidence,
      };

      await UserVerificationLogRepository.create(logData);

      return sendSuccess(res, {
        status: 201,
        message: "Xác thực tại điểm thành công.",
        data: {
          userId,
          stationId: normalizedStationId,
          verifiedBy: staffId,
          verificationStatus: updatedVerificationStatus,
        },
      });
    } catch (error) {
      console.error("verifyUserOnsite error", error);
      return sendError(res, {
        message: "Không thể xác thực người dùng tại điểm.",
      });
    }
  },

  // GET USER VERIFICATION LOGS
  async getUserVerificationLogs(req, res) {
    try {
      const { id: userId } = req.params;
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = DEFAULT_PAGE_SIZE;
      const offset = (page - 1) * limit;

      // Verify user exists
      const user = await UserRepository.findById(userId);
      if (!user) {
        return sendError(res, {
          status: 404,
          message: "Người dùng không tồn tại.",
          code: "NOT_FOUND",
        });
      }

      // Use findByUserId instead of findAll for simplicity
      const logs = await UserVerificationLogRepository.findByUserId(userId);
      const normalizedLogs = logs.map((log) => {
        const stationValue = log.stationId || log.station_id || "N/A";

        let parsedEvidence = null;
        const rawEvidence =
          log.evidenceUrls !== undefined ? log.evidenceUrls : log.evidence_urls;

        if (Array.isArray(rawEvidence)) {
          parsedEvidence = rawEvidence;
        } else if (typeof rawEvidence === "string" && rawEvidence.trim()) {
          try {
            parsedEvidence = JSON.parse(rawEvidence);
          } catch (parseError) {
            parsedEvidence = rawEvidence;
          }
        }

        return {
          id: log.id,
          userId: log.userId || log.user_id,
          staffId: log.staffId || log.staff_id,
          stationId: stationValue,
          stationName: stationValue,
          note: log.note || null,
          evidenceUrls: parsedEvidence,
          createdAt: log.createdAt || log.created_at,
          staffName: log.staffName || log.staff_name || null,
          staffEmail: log.staffEmail || log.staff_email || null,
        };
      });

      const totalItems = await UserVerificationLogRepository.count({ userId });
      const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

      return sendSuccess(res, {
        message: "Lấy lịch sử xác thực thành công.",
        data: normalizedLogs,
      });
    } catch (error) {
      console.error("getUserVerificationLogs error", error);
      return sendError(res, {
        message: "Không thể lấy lịch sử xác thực.",
      });
    }
  },

  // UPDATE CURRENT USER PROFILE (for users to update their own info)
  async updateCurrentUserProfile(req, res) {
    try {
      const { fullName, phoneNumber } = req.body;
      const userId = req.user.id; // Get user ID from token

      // Check if user exists
      const existingUser = await UserRepository.findById(userId);
      if (!existingUser) {
        return sendError(res, {
          status: 404,
          message: "Người dùng không tồn tại.",
          code: "NOT_FOUND",
        });
      }

      // Update user profile (only allow fullName and phoneNumber)
      const updateData = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

      if (Object.keys(updateData).length === 0) {
        return sendError(res, {
          status: 400,
          message: "Không có dữ liệu để cập nhật.",
          code: "NO_DATA_TO_UPDATE",
        });
      }

      const success = await UserRepository.update(userId, updateData);
      if (!success) {
        return sendError(res, {
          message: "Không thể cập nhật thông tin cá nhân.",
        });
      }

      // Get updated user
      const updatedUser = await UserRepository.findById(userId);
      const { passwordHash, refreshToken, ...safeUser } = updatedUser;

      return sendSuccess(res, {
        message: "Cập nhật thông tin cá nhân thành công.",
        data: safeUser,
      });
    } catch (error) {
      console.error("updateCurrentUserProfile error", error);
      return sendError(res, {
        message: "Không thể cập nhật thông tin cá nhân.",
      });
    }
  },
};

module.exports = userController;


