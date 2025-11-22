import mysql from 'mysql2/promise';

let pool;

export const initWhitehouseConnection = async () => {
  if (!process.env.WHITEHOUSE_DATABASE_URL) {
    console.warn('WHITEHOUSE_DATABASE_URL is not set. Skipping Whitehouse connection.');
    return;
  }
  try {
    pool = mysql.createPool(process.env.WHITEHOUSE_DATABASE_URL);
    await pool.query('SELECT 1');
    console.log('Connected to Whitehouse Database');
  } catch (error) {
    console.error('Failed to connect to Whitehouse Database:', error.message);
  }
};

export const getWhitehouseData = async (query, params = []) => {
  if (!pool) throw new Error('Whitehouse DB not connected');
  const [rows] = await pool.execute(query, params);
  return rows;
};

export const getAggregatedStats = async () => {
  // Example query - adjust based on actual schema
  // Assuming a simple schema for now or just checking connection
  try {
    const [rows] = await pool.query('SHOW TABLES');
    return { tables: rows };
  } catch (e) {
    return { error: e.message };
  }
};
