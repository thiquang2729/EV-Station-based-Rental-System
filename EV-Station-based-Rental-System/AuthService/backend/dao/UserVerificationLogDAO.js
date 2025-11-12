const pool = require("../config/db");

class UserVerificationLogDAO {
  static async create(logData) {
    const sql = `
      INSERT INTO user_verification_logs (
        id,
        user_id,
        staff_id,
        station_id,
        note,
        evidence_urls,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      logData.id,
      logData.userId,
      logData.staffId,
      logData.stationId,
      logData.note,
      logData.evidenceUrls,
    ];

    const [result] = await pool.execute(sql, values);
    return result.insertId;
  }

  static async findById(id) {
    const sql = `
      SELECT 
        uvl.id,
        uvl.user_id AS userId,
        uvl.staff_id AS staffId,
        uvl.station_id AS stationId,
        uvl.note,
        uvl.evidence_urls AS evidenceUrls,
        uvl.created_at AS createdAt,
        u.full_name AS userName,
        u.email AS userEmail,
        s.full_name AS staffName,
        s.email AS staffEmail
      FROM user_verification_logs uvl
      LEFT JOIN users u ON uvl.user_id = u.id
      LEFT JOIN users s ON uvl.staff_id = s.id
      WHERE uvl.id = ?
    `;

    const [rows] = await pool.execute(sql, [id]);
    return rows[0] || null;
  }

  static async findByUserId(userId) {
    const sql = `
      SELECT 
        uvl.id,
        uvl.user_id AS userId,
        uvl.staff_id AS staffId,
        uvl.station_id AS stationId,
        uvl.note,
        uvl.evidence_urls AS evidenceUrls,
        uvl.created_at AS createdAt,
        u.full_name AS userName,
        u.email AS userEmail,
        s.full_name AS staffName,
        s.email AS staffEmail
      FROM user_verification_logs uvl
      LEFT JOIN users u ON uvl.user_id = u.id
      LEFT JOIN users s ON uvl.staff_id = s.id
      WHERE uvl.user_id = ?
      ORDER BY uvl.created_at DESC
    `;

    const [rows] = await pool.execute(sql, [userId]);
    return rows;
  }

  static async findByStaffId(staffId) {
    const sql = `
      SELECT 
        uvl.id,
        uvl.user_id AS userId,
        uvl.staff_id AS staffId,
        uvl.station_id AS stationId,
        uvl.note,
        uvl.evidence_urls AS evidenceUrls,
        uvl.created_at AS createdAt,
        u.full_name AS userName,
        u.email AS userEmail,
        s.full_name AS staffName,
        s.email AS staffEmail
      FROM user_verification_logs uvl
      LEFT JOIN users u ON uvl.user_id = u.id
      LEFT JOIN users s ON uvl.staff_id = s.id
      WHERE uvl.staff_id = ?
      ORDER BY uvl.created_at DESC
    `;

    const [rows] = await pool.execute(sql, [staffId]);
    return rows;
  }

  static async findAll({ limit = 10, offset = 0, staffId = null, userId = null } = {}) {
    // Ensure limit and offset are integers
    limit = parseInt(limit, 10) || 10;
    offset = parseInt(offset, 10) || 0;
    
    // Ensure limit and offset are positive numbers
    if (limit < 0) limit = 10;
    if (offset < 0) offset = 0;
    
    let sql = `
      SELECT 
        uvl.id,
        uvl.user_id AS userId,
        uvl.staff_id AS staffId,
        uvl.station_id AS stationId,
        uvl.note,
        uvl.evidence_urls AS evidenceUrls,
        uvl.created_at AS createdAt,
        u.full_name AS userName,
        u.email AS userEmail,
        s.full_name AS staffName,
        s.email AS staffEmail
      FROM user_verification_logs uvl
      LEFT JOIN users u ON uvl.user_id = u.id
      LEFT JOIN users s ON uvl.staff_id = s.id
    `;

    const conditions = [];
    const values = [];

    if (staffId && staffId !== null && staffId !== undefined) {
      conditions.push("uvl.staff_id = ?");
      values.push(staffId);
    }

    if (userId && userId !== null && userId !== undefined) {
      conditions.push("uvl.user_id = ?");
      values.push(userId);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY uvl.created_at DESC LIMIT ? OFFSET ?";
    values.push(limit, offset);

    const [rows] = await pool.execute(sql, values);
    return rows;
  }

  static async count({ staffId = null, userId = null } = {}) {
    let sql = "SELECT COUNT(*) as total FROM user_verification_logs uvl";
    const conditions = [];
    const values = [];

    if (staffId) {
      conditions.push("uvl.staff_id = ?");
      values.push(staffId);
    }

    if (userId) {
      conditions.push("uvl.user_id = ?");
      values.push(userId);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    const [rows] = await pool.execute(sql, values);
    return rows[0]?.total || 0;
  }

  static async updateById(id, updateData) {
    const fields = [];
    const values = [];

    if (updateData.stationId !== undefined) {
      fields.push("station_id = ?");
      values.push(updateData.stationId);
    }

    if (updateData.note !== undefined) {
      fields.push("note = ?");
      values.push(updateData.note);
    }

    if (updateData.evidenceUrls !== undefined) {
      fields.push("evidence_urls = ?");
      values.push(updateData.evidenceUrls);
    }

    if (fields.length === 0) {
      return false;
    }

    values.push(id);

    const sql = `UPDATE user_verification_logs SET ${fields.join(", ")} WHERE id = ?`;
    const [result] = await pool.execute(sql, values);

    return result.affectedRows > 0;
  }

  static async deleteById(id) {
    const sql = "DELETE FROM user_verification_logs WHERE id = ?";
    const [result] = await pool.execute(sql, [id]);

    return result.affectedRows > 0;
  }
}

module.exports = UserVerificationLogDAO;
