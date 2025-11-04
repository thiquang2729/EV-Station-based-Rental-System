const pool = require("../config/db");

const ensureUsersTable = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      phone_number VARCHAR(20),
      role ENUM('RENTER', 'STAFF', 'ADMIN') NOT NULL DEFAULT 'RENTER',
      verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
      risk_status ENUM('NONE', 'WARNED', 'BANNED') NOT NULL DEFAULT 'NONE',
      refreshToken VARCHAR(512),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  await pool.execute(createTableSql);
  console.log("Ensured users table exists");
};

const ensureUserDocumentsTable = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS user_documents (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      document_type ENUM('DRIVER_LICENSE', 'NATIONAL_ID') NOT NULL,
      file_url VARCHAR(512) NOT NULL,
      status ENUM('PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_status (status)
    )
  `;

  await pool.execute(createTableSql);
  console.log("Ensured user_documents table exists");
};

const ensureUserVerificationLogsTable = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS user_verification_logs (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      staff_id VARCHAR(36),
      station_id VARCHAR(100) NOT NULL,
      note TEXT,
      evidence_urls TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_user_id (user_id),
      INDEX idx_staff_id (staff_id)
    )
  `;

  await pool.execute(createTableSql);
  console.log("Ensured user_verification_logs table exists");
};

const ensureCustomerComplaintsTable = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS customer_complaints (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      renter_id VARCHAR(36) NOT NULL,
      reporter_id VARCHAR(36) NOT NULL,
      details TEXT NOT NULL,
      status ENUM('OPEN', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (renter_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_renter_id (renter_id),
      INDEX idx_reporter_id (reporter_id),
      INDEX idx_status (status)
    )
  `;

  await pool.execute(createTableSql);
  console.log("Ensured customer_complaints table exists");
};

const initializeDatabase = async () => {
  await ensureUsersTable();
  await ensureUserDocumentsTable();
  await ensureUserVerificationLogsTable();
  await ensureCustomerComplaintsTable();
};

module.exports = {
  initializeDatabase,
};
