const { randomUUID } = require("crypto");
const UserDocumentRepository = require("../repositories/UserDocumentRepository");
const UserRepository = require("../repositories/UserRepository");
const { sendSuccess, sendError } = require("../utils/response");

const userDocumentController = {
  // GET DOCUMENTS BY USER ID
  async getDocumentsByUserId(req, res) {
    try {
      const userId = req.params.userId;
      const requestingUserId = req.user.id;
      const requestingUserRole = req.user.role;

      // User chỉ có thể xem documents của chính họ, trừ khi là admin hoặc staff
      if (requestingUserId !== userId && requestingUserRole !== "ADMIN" && requestingUserRole !== "STAFF") {
        return sendError(res, {
          status: 403,
          message: "Bạn không có quyền xem giấy tờ của người khác.",
          code: "FORBIDDEN",
        });
      }

      const documents = await UserDocumentRepository.findByUserId(userId);

      return sendSuccess(res, {
        message: "Lấy danh sách giấy tờ thành công.",
        data: documents,
      });
    } catch (error) {
      console.error("getDocumentsByUserId error", error);
      return sendError(res, {
        message: "Không thể lấy danh sách giấy tờ.",
      });
    }
  },

  // GET DOCUMENT BY ID
  async getDocumentById(req, res) {
    try {
      const document = await UserDocumentRepository.findById(req.params.id);
      if (!document) {
        return sendError(res, {
          status: 404,
          message: "Giấy tờ không tồn tại.",
          code: "NOT_FOUND",
        });
      }

      return sendSuccess(res, {
        message: "Lấy thông tin giấy tờ thành công.",
        data: document,
      });
    } catch (error) {
      console.error("getDocumentById error", error);
      return sendError(res, {
        message: "Không thể lấy thông tin giấy tờ.",
      });
    }
  },

  // CREATE DOCUMENT
  async createDocument(req, res) {
    try {
      const { userId, documentType, fileUrl } = req.body;

      if (!userId || !documentType || !fileUrl) {
        return sendError(res, {
          status: 400,
          message: "Thiếu thông tin bắt buộc: userId, documentType, fileUrl.",
          code: "MISSING_FIELDS",
        });
      }

      const documentData = {
        id: randomUUID(),
        userId,
        documentType,
        fileUrl,
        status: "PENDING",
      };

      const document = await UserDocumentRepository.create(documentData);

      return sendSuccess(res, {
        status: 201,
        message: "Tạo giấy tờ thành công.",
        data: document,
      });
    } catch (error) {
      console.error("createDocument error", error);
      return sendError(res, {
        message: "Không thể tạo giấy tờ.",
      });
    }
  },

  // UPDATE DOCUMENT STATUS
  async updateDocumentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return sendError(res, {
          status: 400,
          message: "Thiếu trường status.",
          code: "MISSING_FIELDS",
        });
      }

      const validStatuses = ["PENDING", "VERIFIED", "REJECTED"];
      if (!validStatuses.includes(status)) {
        return sendError(res, {
          status: 400,
          message: "Status không hợp lệ. Phải là: PENDING, VERIFIED, hoặc REJECTED.",
          code: "INVALID_STATUS",
        });
      }

      // Check if document exists
      const existingDocument = await UserDocumentRepository.findById(id);
      if (!existingDocument) {
        return sendError(res, {
          status: 404,
          message: "Giấy tờ không tồn tại.",
          code: "NOT_FOUND",
        });
      }

      const success = await UserDocumentRepository.updateStatus(id, status);
      if (!success) {
        return sendError(res, {
          message: "Không thể cập nhật trạng thái giấy tờ.",
        });
      }

      // Nếu document được verify, cũng update user verification status
      if (status === "VERIFIED") {
        try {
          await UserRepository.updateVerificationStatus(existingDocument.userId, "VERIFIED");
        } catch (userUpdateError) {
          console.error("Error updating user verification status:", userUpdateError);
          // Không throw error vì document đã được update thành công
        }
      }

      const updatedDocument = await UserDocumentRepository.findById(id);

      return sendSuccess(res, {
        message: "Cập nhật trạng thái giấy tờ thành công.",
        data: updatedDocument,
      });
    } catch (error) {
      console.error("updateDocumentStatus error", error);
      return sendError(res, {
        message: "Không thể cập nhật trạng thái giấy tờ.",
      });
    }
  },

  // DELETE DOCUMENT
  async deleteDocument(req, res) {
    try {
      const success = await UserDocumentRepository.deleteById(req.params.id);
      if (!success) {
        return sendError(res, {
          status: 404,
          message: "Giấy tờ không tồn tại.",
          code: "NOT_FOUND",
        });
      }

      return sendSuccess(res, {
        message: "Xóa giấy tờ thành công.",
        data: null,
      });
    } catch (error) {
      console.error("deleteDocument error", error);
      return sendError(res, {
        message: "Không thể xóa giấy tờ.",
      });
    }
  },

  // GET ALL PENDING DOCUMENTS (Admin)
  async getAllPendingDocuments(req, res) {
    try {
      const documents = await UserDocumentRepository.getAllPendingDocuments();

      return sendSuccess(res, {
        message: "Lấy danh sách giấy tờ chờ xác thực thành công.",
        data: documents,
      });
    } catch (error) {
      console.error("getAllPendingDocuments error", error);
      return sendError(res, {
        message: "Không thể lấy danh sách giấy tờ chờ xác thực.",
      });
    }
  },

  // GET DOCUMENT STATISTICS (Admin)
  async getDocumentStats(req, res) {
    try {
      const stats = await UserDocumentRepository.getDocumentStats();

      return sendSuccess(res, {
        message: "Lấy thống kê giấy tờ thành công.",
        data: stats,
      });
    } catch (error) {
      console.error("getDocumentStats error", error);
      return sendError(res, {
        message: "Không thể lấy thống kê giấy tờ.",
      });
    }
  },
};

module.exports = userDocumentController;

