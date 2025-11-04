const UserDAO = require("../dao/UserDAO");

class UserRepository {
  static async create(userData) {
    return UserDAO.createUser(userData);
  }

  static async findByEmail(email) {
    return UserDAO.findByEmail(email);
  }

  static async findById(id) {
    return UserDAO.findById(id);
  }

  static async findByRefreshToken(refreshToken) {
    return UserDAO.findByRefreshToken(refreshToken);
  }

  static async updateRefreshToken(userId, refreshToken) {
    return UserDAO.updateRefreshToken(userId, refreshToken);
  }

  static async clearRefreshToken(userId) {
    return UserDAO.clearRefreshToken(userId);
  }

  static async paginate({ limit, offset, riskStatus, search, role, verificationStatus, dateFrom, dateTo }) {
    return UserDAO.paginate({ limit, offset, riskStatus, search, role, verificationStatus, dateFrom, dateTo });
  }

  static async update(id, data) {
    return UserDAO.update(id, data);
  }

  static async deleteById(id) {
    return UserDAO.deleteById(id);
  }

  static async getStats() {
    return UserDAO.getStats();
  }

  static async getRegistrationStatsByDate(days) {
    return UserDAO.getRegistrationStatsByDate(days);
  }

  static async updateVerificationStatus(userId, verificationStatus) {
    return UserDAO.updateVerificationStatus(userId, verificationStatus);
  }
}

module.exports = UserRepository;
