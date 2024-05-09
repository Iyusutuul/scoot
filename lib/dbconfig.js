const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    })
           
    db.connect(function (err) {
        if (err) {
        return console.error('error: ' + err.message);
        }
        
        console.log('Connected to the MySQL server.');
        })

    module.exports = (db)
 