const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt'); // For password hashing

const app = express();
app.use(cors());
app.use(express.json());

// 1. Connect to XAMPP MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // Default XAMPP user
    password: '',      // Default XAMPP password is empty
    database: 'bycylo'
});

db.connect(err => {
    if (err) console.log('Database connection failed: ' + err.stack);
    else console.log('Connected to MySQL Database');
});

// --- ROUTES ---

// 1. Register User (Example)
app.post('/register', async (req, res) => {
    const { email, password, firstName, lastName, phone, nic } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = `${firstName} ${lastName}`;

    const sql = "INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, 'owner')";
    
    db.query(sql, [email, hashedPassword, fullName], (err, result) => {
        if (err) return res.status(500).json(err);
        
        const userId = result.insertId;
        
        // Add to owner_applications
        const appSql = "INSERT INTO owner_applications (user_id, nic_number, phone, status) VALUES (?, ?, ?, 'pending')";
        db.query(appSql, [userId, nic, phone], (err, appResult) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Registration successful" });
        });
    });
});

// 2. Get Universities
app.get('/universities', (req, res) => {
    db.query('SELECT * FROM universities', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});