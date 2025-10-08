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

  static async paginate({ limit, offset }) {
    return UserDAO.paginate({ limit, offset });
  }

  static async deleteById(id) {
    return UserDAO.deleteById(id);
  }
}

module.exports = UserRepository;
