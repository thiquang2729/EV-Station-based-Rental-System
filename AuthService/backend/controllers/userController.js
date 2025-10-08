const UserRepository = require("../repositories/UserRepository");
const { sendSuccess, sendError } = require("../utils/response");

const userController = {
  //GET ALL USER
  getAllUsers: async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
      const offset = (page - 1) * limit;

      const { users, totalItems } = await UserRepository.paginate({ limit, offset });
      const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

      return sendSuccess(res, {
        message: "Lấy danh sách khách hàng thành công.",
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
        message: "Không thể lấy danh sách khách hàng.",
      });
    }
  },

  //DELETE A USER
  deleteUser: async (req, res) => {
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
