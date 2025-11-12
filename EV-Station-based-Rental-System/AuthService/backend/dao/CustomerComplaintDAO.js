const pool = require("../config/db");

class CustomerComplaintDAO {
  static async create(complaint) {
    const sql = `
      INSERT INTO customer_complaints (
        id,
        renter_id,
        reporter_id,
        details,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      complaint.id,
      complaint.renterId,
      complaint.reporterId,
      complaint.details,
      complaint.status || "OPEN",
    ];

    await pool.execute(sql, params);
    return this.findById(complaint.id);
  }

  static async findById(id) {
    const sql = `
      SELECT
        c.id,
        c.renter_id AS renterId,
        c.reporter_id AS reporterId,
        c.details,
        c.status,
        c.created_at AS createdAt,
        c.updated_at AS updatedAt,
        r.full_name AS renterName,
        r.email AS renterEmail,
        rep.full_name AS reporterName,
        rep.email AS reporterEmail
      FROM customer_complaints c
      LEFT JOIN users r ON c.renter_id = r.id
      LEFT JOIN users rep ON c.reporter_id = rep.id
      WHERE c.id = ?
      LIMIT 1
    `;

    const [rows] = await pool.execute(sql, [id]);
    return rows[0] || null;
  }

  static async findAll({ limit = 10, offset = 0, status = null }) {
    const parsedLimit = Number(limit);
    const parsedOffset = Number(offset);

    const safeLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
    const safeOffset = Number.isInteger(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;

    let whereSql = "";
    const params = [];
    
    if (status) {
      whereSql = "WHERE c.status = ?";
      params.push(status);
    }

    const listSql = `
      SELECT
        c.id,
        c.renter_id AS renterId,
        c.reporter_id AS reporterId,
        c.details,
        c.status,
        c.created_at AS createdAt,
        c.updated_at AS updatedAt,
        r.full_name AS renterName,
        r.email AS renterEmail,
        rep.full_name AS reporterName,
        rep.email AS reporterEmail
      FROM customer_complaints c
      LEFT JOIN users r ON c.renter_id = r.id
      LEFT JOIN users rep ON c.reporter_id = rep.id
      ${whereSql}
      ORDER BY c.created_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;

    const countSql = `SELECT COUNT(*) AS total FROM customer_complaints c ${whereSql}`;

    const [complaintResult, countResult] = await Promise.all([
      params.length > 0 ? pool.execute(listSql, params) : pool.query(listSql),
      params.length > 0 ? pool.execute(countSql, params) : pool.query(countSql),
    ]);

    const [complaintRows] = complaintResult;
    const [countRowsArray] = countResult;
    const totalItems = countRowsArray?.[0]?.total || 0;

    return {
      complaints: complaintRows,
      totalItems,
    };
  }

  static async findByRenterId(renterId) {
    const sql = `
      SELECT
        c.id,
        c.renter_id AS renterId,
        c.reporter_id AS reporterId,
        c.details,
        c.status,
        c.created_at AS createdAt,
        c.updated_at AS updatedAt,
        r.full_name AS renterName,
        r.email AS renterEmail,
        rep.full_name AS reporterName,
        rep.email AS reporterEmail
      FROM customer_complaints c
      LEFT JOIN users r ON c.renter_id = r.id
      LEFT JOIN users rep ON c.reporter_id = rep.id
      WHERE c.renter_id = ?
      ORDER BY c.created_at DESC
    `;

    const [rows] = await pool.execute(sql, [renterId]);
    return rows;
  }

  static async updateStatus(id, status) {
    const sql = `
      UPDATE customer_complaints
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    const [result] = await pool.execute(sql, [status, id]);
    return result.affectedRows > 0;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];

    if (data.details !== undefined) {
      fields.push("details = ?");
      values.push(data.details);
    }
    if (data.status !== undefined) {
      fields.push("status = ?");
      values.push(data.status);
    }

    if (fields.length === 0) {
      return true;
    }

    fields.push("updated_at = NOW()");
    values.push(id);

    const sql = `UPDATE customer_complaints SET ${fields.join(", ")} WHERE id = ?`;
    const [result] = await pool.execute(sql, values);
    return result.affectedRows > 0;
  }

  static async deleteById(id) {
    const sql = `DELETE FROM customer_complaints WHERE id = ?`;
    const [result] = await pool.execute(sql, [id]);
    return result.affectedRows > 0;
  }

  static async getStats() {
    const sql = `
      SELECT
        status,
        COUNT(*) AS count
      FROM customer_complaints
      GROUP BY status
    `;

    const [rows] = await pool.query(sql);
    return rows;
  }
}

module.exports = CustomerComplaintDAO;

