const UserDocumentDAO = require("../dao/UserDocumentDAO");

class UserDocumentRepository {
  static async create(documentData) {
    return UserDocumentDAO.create(documentData);
  }

  static async findById(id) {
    return UserDocumentDAO.findById(id);
  }

  static async findByUserId(userId) {
    return UserDocumentDAO.findByUserId(userId);
  }

  static async findByUserIdAndType(userId, documentType) {
    return UserDocumentDAO.findByUserIdAndType(userId, documentType);
  }

  static async updateStatus(id, status) {
    return UserDocumentDAO.updateStatus(id, status);
  }

  static async deleteById(id) {
    return UserDocumentDAO.deleteById(id);
  }

  static async deleteByUserId(userId) {
    return UserDocumentDAO.deleteByUserId(userId);
  }

  static async getAllPendingDocuments() {
    return UserDocumentDAO.getAllPendingDocuments();
  }

  static async getDocumentStats() {
    return UserDocumentDAO.getDocumentStats();
  }
}

module.exports = UserDocumentRepository;

