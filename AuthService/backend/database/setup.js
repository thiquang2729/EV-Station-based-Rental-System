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

const initializeDatabase = async () => {
  await ensureUsersTable();
};

module.exports = {
  initializeDatabase,
};
