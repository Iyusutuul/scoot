import dotenv from 'dotenv';
import mysql from 'mysql2';

// Load environment variables from .env file
dotenv.config({ path: './.env' });

// Log the environment variables to verify they are loaded
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);

// Create the database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,        
    user: process.env.DB_USER,         
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME  
});

// Test the connection
db.connect(function (err) {
    if (err) {
        return console.error('error: ' + err.message);
    }

    console.log('Connected to the MySQL server.');
});

// Export the database connection
export default db;

