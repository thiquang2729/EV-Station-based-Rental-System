const UserVerificationLogDAO = require("../dao/UserVerificationLogDAO");

class UserVerificationLogRepository {
  static async create(logData) {
    return await UserVerificationLogDAO.create(logData);
  }

  static async findById(id) {
    return await UserVerificationLogDAO.findById(id);
  }

  static async findByUserId(userId) {
    return await UserVerificationLogDAO.findByUserId(userId);
  }

  static async findByStaffId(staffId) {
    return await UserVerificationLogDAO.findByStaffId(staffId);
  }

  static async findAll(options = {}) {
    return await UserVerificationLogDAO.findAll(options);
  }

  static async count(options = {}) {
    return await UserVerificationLogDAO.count(options);
  }

  static async updateById(id, updateData) {
    return await UserVerificationLogDAO.updateById(id, updateData);
  }

  static async deleteById(id) {
    return await UserVerificationLogDAO.deleteById(id);
  }
}

module.exports = UserVerificationLogRepository;
