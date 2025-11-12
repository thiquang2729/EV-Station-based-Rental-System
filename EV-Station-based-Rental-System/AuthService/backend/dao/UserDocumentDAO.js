const pool = require("../config/db");

class UserDocumentDAO {
  static async create(document) {
    const sql = `
      INSERT INTO user_documents (
        id,
        user_id,
        document_type,
        file_url,
        status,
        uploaded_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      document.id,
      document.userId,
      document.documentType,
      document.fileUrl,
      document.status || "PENDING",
    ];

    await pool.execute(sql, params);
    return this.findById(document.id);
  }

  static async findById(id) {
    const sql = `
      SELECT
        id,
        user_id AS userId,
        document_type AS documentType,
        file_url AS fileUrl,
        status,
        uploaded_at AS uploadedAt
      FROM user_documents
      WHERE id = ?
      LIMIT 1
    `;

    const [rows] = await pool.execute(sql, [id]);
    return rows[0] || null;
  }

  static async findByUserId(userId) {
    const sql = `
      SELECT
        id,
        user_id AS userId,
        document_type AS documentType,
        file_url AS fileUrl,
        status,
        uploaded_at AS uploadedAt
      FROM user_documents
      WHERE user_id = ?
      ORDER BY uploaded_at DESC
    `;

    const [rows] = await pool.execute(sql, [userId]);
    return rows;
  }

  static async findByUserIdAndType(userId, documentType) {
    const sql = `
      SELECT
        id,
        user_id AS userId,
        document_type AS documentType,
        file_url AS fileUrl,
        status,
        uploaded_at AS uploadedAt
      FROM user_documents
      WHERE user_id = ? AND document_type = ?
      ORDER BY uploaded_at DESC
      LIMIT 1
    `;

    const [rows] = await pool.execute(sql, [userId, documentType]);
    return rows[0] || null;
  }

  static async updateStatus(id, status) {
    const sql = `
      UPDATE user_documents
      SET status = ?
      WHERE id = ?
    `;
    
    const [result] = await pool.execute(sql, [status, id]);
    return result.affectedRows > 0;
  }

  static async deleteById(id) {
    const sql = `DELETE FROM user_documents WHERE id = ?`;
    const [result] = await pool.execute(sql, [id]);
    return result.affectedRows > 0;
  }

  static async deleteByUserId(userId) {
    const sql = `DELETE FROM user_documents WHERE user_id = ?`;
    const [result] = await pool.execute(sql, [userId]);
    return result.affectedRows;
  }

  static async getAllPendingDocuments() {
    const sql = `
      SELECT
        d.id,
        d.user_id AS userId,
        d.document_type AS documentType,
        d.file_url AS fileUrl,
        d.status,
        d.uploaded_at AS uploadedAt,
        u.full_name AS userName,
        u.email AS userEmail
      FROM user_documents d
      INNER JOIN users u ON d.user_id = u.id
      WHERE d.status = 'PENDING'
      ORDER BY d.uploaded_at ASC
    `;

    const [rows] = await pool.query(sql);
    return rows;
  }

  static async getDocumentStats() {
    const sql = `
      SELECT
        status,
        COUNT(*) AS count
      FROM user_documents
      GROUP BY status
    `;

    const [rows] = await pool.query(sql);
    return rows;
  }
}

module.exports = UserDocumentDAO;

