import dotenv from 'dotenv';
import mysql from 'mysql2';

// Load environment variables from .env file
dotenv.config({ path: './.env' });

// Log the environment variables to verify they are loaded
console.log('TIDB_HOST:', process.env.DB_HOST);
console.log('TIDB_USER:', process.env.DB_USER);
console.log('TIDB_PASSWORD:', process.env.DB_PASSWORD);
console.log('TIDB_DATABASE:', process.env.DB_NAME);

// Create the database connection
const pool = mysql.createConnection({
    host: process.env.TIDB_HOST,        
    user: process.env.TIDB_USER,         
    password: process.env.TIDB_PASSWORD, 
    database: process.env.TIDB_DATABASE  
});

// Test the connection
pool.connect(function (err) {
    if (err) {
        return console.error('error: ' + err.message);
    }

    console.log('Connected to the MySQL server.');
});

// Export the database connection
export default pool;

