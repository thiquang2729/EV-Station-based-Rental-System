const { randomUUID } = require("crypto");
const UserDocumentRepository = require("../repositories/UserDocumentRepository");
const { sendSuccess, sendError } = require("../utils/response");

const uploadController = {
  // Upload single document
  async uploadDocument(req, res) {
    try {
      if (!req.file) {
        return sendError(res, {
          status: 400,
          message: "Không có file được tải lên.",
          code: "NO_FILE",
        });
      }

      const { documentType } = req.body;
      const userId = req.user.id;

      if (!documentType) {
        return sendError(res, {
          status: 400,
          message: "Loại giấy tờ là bắt buộc.",
          code: "MISSING_DOCUMENT_TYPE",
        });
      }

      const validTypes = ["DRIVER_LICENSE", "NATIONAL_ID"];
      if (!validTypes.includes(documentType)) {
        return sendError(res, {
          status: 400,
          message: "Loại giấy tờ không hợp lệ. Phải là DRIVER_LICENSE hoặc NATIONAL_ID.",
          code: "INVALID_DOCUMENT_TYPE",
        });
      }

      // Save document info to database
      const documentData = {
        id: randomUUID(),
        userId: userId,
        documentType: documentType,
        fileUrl: req.file.location, // S3 URL
        status: "PENDING",
      };

      const document = await UserDocumentRepository.create(documentData);

      return sendSuccess(res, {
        status: 201,
        message: "Tải giấy tờ lên thành công.",
        data: {
          document,
          fileUrl: req.file.location,
          fileSize: req.file.size,
          fileName: req.file.originalname,
        },
      });
    } catch (error) {
      console.error("uploadDocument error", error);
      return sendError(res, {
        message: "Không thể tải giấy tờ lên.",
      });
    }
  },
};

module.exports = uploadController;

