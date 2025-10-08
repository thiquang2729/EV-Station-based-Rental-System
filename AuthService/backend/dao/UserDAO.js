const pool = require("../config/db");

class UserDAO {
  static async createUser(user) {
    const sql = `
      INSERT INTO users (
        id,
        full_name,
        email,
        password_hash,
        phone_number,
        role,
        verification_status,
        risk_status,
        refreshToken,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const params = [
      user.id,
      user.fullName,
      user.email,
      user.passwordHash,
      user.phoneNumber || null,
      user.role,
      user.verificationStatus,
      user.riskStatus,
      user.refreshToken || null,
    ];

    await pool.execute(sql, params);
    return this.findById(user.id);
  }

  static async findByEmail(email) {
    const sql = `
      SELECT
        id,
        full_name AS fullName,
        email,
        password_hash AS passwordHash,
        phone_number AS phoneNumber,
        role,
        verification_status AS verificationStatus,
        risk_status AS riskStatus,
        refreshToken,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM users
      WHERE email = ?
      LIMIT 1
    `;

    const [rows] = await pool.execute(sql, [email]);
    return rows[0] || null;
  }

  static async findById(id) {
    const sql = `
      SELECT
        id,
        full_name AS fullName,
        email,
        password_hash AS passwordHash,
        phone_number AS phoneNumber,
        role,
        verification_status AS verificationStatus,
        risk_status AS riskStatus,
        refreshToken,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM users
      WHERE id = ?
      LIMIT 1
    `;

    const [rows] = await pool.execute(sql, [id]);
    return rows[0] || null;
  }

  static async updateRefreshToken(userId, refreshToken) {
    const sql = `
      UPDATE users
      SET refreshToken = ?, updated_at = NOW()
      WHERE id = ?
    `;
    await pool.execute(sql, [refreshToken, userId]);
  }

  static async findByRefreshToken(refreshToken) {
    const sql = `
      SELECT
        id,
        full_name AS fullName,
        email,
        password_hash AS passwordHash,
        phone_number AS phoneNumber,
        role,
        verification_status AS verificationStatus,
        risk_status AS riskStatus,
        refreshToken,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM users
      WHERE refreshToken = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(sql, [refreshToken]);
    return rows[0] || null;
  }

  static async clearRefreshToken(userId) {
    await this.updateRefreshToken(userId, null);
  }

  static async paginate({ limit, offset }) {
    const parsedLimit = Number(limit);
    const parsedOffset = Number(offset);
    const safeLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
    const safeOffset = Number.isInteger(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;

    const listSql = `
      SELECT
        id,
        full_name AS fullName,
        email,
        verification_status AS verificationStatus,
        risk_status AS riskStatus
      FROM users
      ORDER BY created_at DESC
      LIMIT ${safeLimit}
      OFFSET ${safeOffset}
    `;
    const countSql = `SELECT COUNT(*) AS total FROM users`;

    const [listResult, countResult] = await Promise.all([
      pool.query(listSql),
      pool.execute(countSql),
    ]);

    const [users] = listResult;
    const [countRows] = countResult;

    const totalItems = countRows[0]?.total || 0;

    return {
      users,
      totalItems,
    };
  }

  static async deleteById(id) {
    const sql = `DELETE FROM users WHERE id = ?`;
    const [result] = await pool.execute(sql, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = UserDAO;
