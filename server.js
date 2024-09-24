const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const validator = require('validator');

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Set up session middleware (for login session tracking)
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_code',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 }, // Session expires after 1 hour
}));

// Create a MySQL connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// Connect to the database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Database server connected successfully');

    // Create users table if it doesn't exist
    const userstable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            email VARCHAR(100) UNIQUE,
            username VARCHAR(100),
            password VARCHAR(255)
        )`;
    connection.query(userstable, (err) => {
        if (err) {
            console.error('Error creating users table:', err);
        } else {
            console.log('Users table created successfully.');
        }
    });

    // Create transactions table if it doesn't exist
    const expensestable = `
        CREATE TABLE IF NOT EXISTS transactions (
            id INT PRIMARY KEY AUTO_INCREMENT,
            amount DECIMAL(10, 2) NOT NULL,
            category VARCHAR(50),
            date DATE,
            notes VARCHAR(255)
        )`;
    connection.query(expensestable, (err) => {
        if (err) {
            console.error('Error creating transactions table:', err);
        } else {
            console.log('Transactions table created successfully.');
        }
    });
});

// POST Route: Register a new user
app.post('/register', (req, res) => {
    const { email, username, password } = req.body;

    // Validate input
    if (!validator.isEmail(email)) {
        return res.status(400).send('Invalid email format');
    }
    if (!validator.isStrongPassword(password, { minLength: 8 })) {
        return res.status(400).send('Password must be at least 8 characters long and contain a mix of letters, numbers, and symbols.');
    }

    // Check if user already exists
    const checkUserQuery = `SELECT * FROM users WHERE email = ?`;
    connection.query(checkUserQuery, [email], (err, results) => {
        if (err) {
            return res.status(500).send('Database error');
        }
        if (results.length > 0) {
            return res.status(400).send('User already exists');
        }

        // Hash the password before saving it
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                return res.status(500).send('Error hashing password');
            }

            const query = `INSERT INTO users (email, username, password) VALUES (?, ?, ?)`;
            connection.query(query, [email, username, hashedPassword], (err) => {
                if (err) {
                    return res.status(500).send('Error saving user');
                }
                res.send('User registered successfully!');
            });
        });
    });
});

// POST Route: Login a user
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const query = `SELECT * FROM users WHERE email = ?`;
    connection.query(query, [email], (err, results) => {
        if (err) {
            return res.status(500).send('Database error');
        }
        if (results.length === 0) {
            return res.status(401).send('User not found');
        }

        const user = results[0];

        // Compare the hashed password
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).send('Error comparing passwords');
            }
            if (!isMatch) {
                return res.status(401).send('Incorrect password');
            }

            // Create session and store the user ID
            req.session.userId = user.id;
            req.session.username = user.username;

            // Redirect the user to the expense tracker page (index.html)
            res.redirect('/index');
        });
    });
});

// Middleware to protect routes
function checkAuth(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login');  // Redirect to login page if not authenticated
    }
    next();
}

// GET Route: Expense Tracker (Protected)
app.get('/index', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET Route: Login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// GET Route: Register
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// GET Route: Logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('/login');
    });
});

// Start the server
app.listen(5000, () => {
    console.log('Server is running on port 5000...');
});
