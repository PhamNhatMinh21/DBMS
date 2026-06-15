const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '187926837723Xeno#',
    database: process.env.DB_NAME || 'F1_Championship_Management',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true
});

// Test connection on startup
pool.getConnection()
    .then(conn => {
        console.log(`✅ MySQL Connected Successfully to: ${process.env.DB_NAME}`);
        conn.release();
    })
    .catch(err => {
        console.error('❌ MySQL Connection Failed:', err.message);
    });

module.exports = pool;
