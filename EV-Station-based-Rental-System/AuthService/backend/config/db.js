const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  // Thêm các cấu hình để xử lý lỗi và reconnect tốt hơn
  acquireTimeout: 60000, // Timeout khi lấy connection từ pool (60s)
  timeout: 60000, // Timeout cho query (60s)
  enableKeepAlive: true, // Giữ kết nối sống
  keepAliveInitialDelay: 0, // Bắt đầu keep-alive ngay lập tức
  reconnect: true, // Tự động reconnect khi mất kết nối
});

// Xử lý lỗi connection pool
pool.on("connection", (connection) => {
  console.log("New MySQL connection established");
  
  // Xử lý lỗi cho từng connection
  connection.on("error", (err) => {
    console.error("MySQL connection error:", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET") {
      console.log("MySQL connection lost, will reconnect automatically");
    }
  });
});

// Xử lý lỗi cho pool
pool.on("error", (err) => {
  console.error("MySQL pool error:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET") {
    console.log("MySQL pool connection lost, connections will be recreated");
  }
});

// Helper function để thực thi query với retry logic
const executeWithRetry = async (queryFn, maxRetries = 3, retryDelay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error;
      
      // Chỉ retry cho các lỗi connection
      if (
        error.code === "PROTOCOL_CONNECTION_LOST" ||
        error.code === "ECONNRESET" ||
        error.code === "ER_ACCESS_DENIED_ERROR" ||
        error.errno === 1045
      ) {
        if (attempt < maxRetries) {
          console.log(`Query failed, retrying (${attempt}/${maxRetries})...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
          continue;
        }
      }
      
      // Nếu không phải lỗi connection hoặc đã hết retry, throw error
      throw error;
    }
  }
  
  throw lastError;
};

// Wrap pool methods với retry logic
const originalQuery = pool.query.bind(pool);
const originalExecute = pool.execute.bind(pool);

pool.query = async function (...args) {
  return executeWithRetry(() => originalQuery(...args));
};

pool.execute = async function (...args) {
  return executeWithRetry(() => originalExecute(...args));
};

module.exports = pool;
