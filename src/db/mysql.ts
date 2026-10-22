import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Read MySQL credentials from environment variables / AI Studio secrets
const DB_HOST = process.env.DBHOST || process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DBPORT || process.env.DB_PORT || process.env.MYSQL_PORT || '3306', 10);
const DB_USER = process.env.DBUSER || process.env.DB_USER || process.env.MYSQL_USER || process.env.USERNAME || 'root';
const DB_PASSWORD = process.env.DBPASSWORD || process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || process.env.PASSWORD || '';
const DB_NAME = process.env.DBNAME || process.env.DB_NAME || process.env.MYSQL_DATABASE || process.env.DATABASE || 'beyounge';

console.log(`[MySQL Config] Host: ${DB_HOST}, Port: ${DB_PORT}, User: ${DB_USER}, DB: ${DB_NAME}`);

// Create MySQL Connection Pool
export const dbPool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Helper function to execute queries safely
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const [results] = await dbPool.execute(sql, params);
  return results as T;
}

// Function to test the database connection
export async function initDatabase(): Promise<boolean> {
  let connection;
  try {
    connection = await dbPool.getConnection();
    console.log(`✅ Successfully connected to MySQL database: ${DB_NAME} at ${DB_HOST}:${DB_PORT}`);
    return true;
  } catch (error: any) {
    console.warn(`⚠️ MySQL Database Connection warning/failure (${DB_HOST}:${DB_PORT}):`, error.message || error);
    return false;
  } finally {
    if (connection) {
      try { connection.release(); } catch {}
    }
  }
}

export default dbPool;

