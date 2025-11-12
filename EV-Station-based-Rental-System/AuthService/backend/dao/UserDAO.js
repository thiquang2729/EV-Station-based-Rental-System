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

  static async paginate({ limit = 10, offset = 0, riskStatus, search, role, verificationStatus, dateFrom, dateTo }) {
    const parsedLimit = Number(limit);
    const parsedOffset = Number(offset);

    const safeLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
    const safeOffset = Number.isInteger(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;

    // Build WHERE clause với multiple conditions
    const conditions = [];
    
    // Risk status filter
    if (riskStatus) {
      conditions.push(`UPPER(risk_status) = UPPER(${pool.escape(riskStatus)})`);
    }
    
    // Role filter
    if (role) {
      conditions.push(`UPPER(role) = UPPER(${pool.escape(role)})`);
    }
    
    // Verification status filter
    if (verificationStatus) {
      conditions.push(`UPPER(verification_status) = UPPER(${pool.escape(verificationStatus)})`);
    }
    
    // Date range filter
    if (dateFrom) {
      conditions.push(`created_at >= ${pool.escape(dateFrom)}`);
    }
    if (dateTo) {
      conditions.push(`created_at <= ${pool.escape(dateTo)}`);
    }
    
    // Search filter - tìm kiếm trong full_name, email, phone_number
    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(`(
        LOWER(full_name) LIKE LOWER(${pool.escape(searchPattern)}) OR 
        LOWER(email) LIKE LOWER(${pool.escape(searchPattern)}) OR 
        LOWER(phone_number) LIKE LOWER(${pool.escape(searchPattern)})
      )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const listSql = `
      SELECT
        id,
        full_name AS fullName,
        email,
        phone_number AS phoneNumber,
        role,
        verification_status AS verificationStatus,
        risk_status AS riskStatus,
        created_at AS createdAt
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;
    const countSql = `SELECT COUNT(*) AS total FROM users ${whereClause}`;

    const [userResult, countResult] = await Promise.all([
      pool.query(listSql),
      pool.query(countSql),
    ]);

    const [userRows] = userResult;
    const [countRowsArray] = countResult;
    const totalItems = countRowsArray?.[0]?.total || 0;

    return {
      users: userRows,
      totalItems,
    };
  }

  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.fullName !== undefined) {
      fields.push("full_name = ?");
      values.push(data.fullName);
    }
    if (data.phoneNumber !== undefined) {
      fields.push("phone_number = ?");
      values.push(data.phoneNumber);
    }
    if (data.role !== undefined) {
      fields.push("role = ?");
      values.push(data.role);
    }
    if (data.verificationStatus !== undefined) {
      fields.push("verification_status = ?");
      values.push(data.verificationStatus);
    }
    if (data.riskStatus !== undefined) {
      fields.push("risk_status = ?");
      values.push(data.riskStatus);
    }

    if (fields.length === 0) {
      return true; // Nothing to update
    }

    fields.push("updated_at = NOW()");
    values.push(id);

    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
    const [result] = await pool.execute(sql, values);
    return result.affectedRows > 0;
  }

  static async deleteById(id) {
    const sql = `DELETE FROM users WHERE id = ?`;
    const [result] = await pool.execute(sql, [id]);
    return result.affectedRows > 0;
  }

  static async getStats() {
    const totalSql = `SELECT COUNT(*) AS totalUsers FROM users`;
    const statusSql = `
      SELECT
        verification_status AS verificationStatus,
        COUNT(*) AS count
      FROM users
      GROUP BY verification_status
    `;

    const [[totalRows], [statusRows]] = await Promise.all([
      pool.execute(totalSql),
      pool.query(statusSql),
    ]);

    const totalUsers = totalRows?.[0]?.totalUsers || 0;
    const statusBreakdown = (statusRows || []).map((row) => ({
      verificationStatus: row.verificationStatus,
      count: Number(row.count) || 0,
    }));

    const verifiedUsers =
      statusBreakdown
        .filter((item) => (item.verificationStatus || "").toUpperCase() === "VERIFIED")
        .reduce((sum, item) => sum + item.count, 0) || 0;

    const unverifiedUsers =
      statusBreakdown
        .filter((item) => (item.verificationStatus || "").toUpperCase() !== "VERIFIED")
        .reduce((sum, item) => sum + item.count, 0) || 0;

    return {
      totalUsers,
      verifiedUsers,
      unverifiedUsers,
      statusBreakdown,
    };
  }

  // GET USER REGISTRATION STATISTICS BY DATE
  static async getRegistrationStatsByDate(days) {
    const sql = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const [rows] = await pool.execute(sql, [days]);
    
    // Đảm bảo có dữ liệu cho tất cả các ngày trong khoảng thời gian
    const result = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const existingData = rows.find(row => row.date.toISOString().split('T')[0] === dateStr);
      result.push({
        date: dateStr,
        count: existingData ? Number(existingData.count) : 0
      });
    }
    
    return result;
  }

  static async updateVerificationStatus(userId, verificationStatus) {
    const sql = `
      UPDATE users 
      SET verification_status = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    const [result] = await pool.execute(sql, [verificationStatus, userId]);
    return result.affectedRows > 0;
  }
}

module.exports = UserDAO;
