import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Load environment variables from .env file
dotenv.config({ path: './.env' });

// Log the environment variables to verify they are loaded
console.log('TIDB_HOST:', process.env.TIDB_HOST);
console.log('TIDB_USER:', process.env.TIDB_USER);
console.log('TIDB_PASSWORD:', process.env.TIDB_PASSWORD);
console.log('TIDB_DATABASE:', process.env.TIDB_DATABASE);

// Create the database connection pool with proper port and SSL if needed
const pool = mysql.createPool({
  host: process.env.TIDB_HOST,
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE,
  port: Number(process.env.TIDB_PORT) || 4000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: true,  // Needed for TiDB Cloud
  },
});

// Test the connection asynchronously
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to the MySQL server.');
    connection.release();
  } catch (err) {
    console.error('Error connecting to MySQL:', err.message);
  }
}

testConnection();
// Export the database connection
export default pool;

