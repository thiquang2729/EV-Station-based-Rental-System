const CustomerComplaintDAO = require("../dao/CustomerComplaintDAO");

class CustomerComplaintRepository {
  static async create(complaintData) {
    return CustomerComplaintDAO.create(complaintData);
  }

  static async findById(id) {
    return CustomerComplaintDAO.findById(id);
  }

  static async findAll({ limit, offset, status } = {}) {
    return CustomerComplaintDAO.findAll({ limit, offset, status });
  }

  static async findByRenterId(renterId) {
    return CustomerComplaintDAO.findByRenterId(renterId);
  }

  static async updateStatus(id, status) {
    return CustomerComplaintDAO.updateStatus(id, status);
  }

  static async update(id, data) {
    return CustomerComplaintDAO.update(id, data);
  }

  static async deleteById(id) {
    return CustomerComplaintDAO.deleteById(id);
  }

  static async getStats() {
    return CustomerComplaintDAO.getStats();
  }
}

module.exports = CustomerComplaintRepository;

