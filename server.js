const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Set up session middleware (for login session tracking)
app.use(session({
    secret: 'your secret code',
    resave: false,
    saveUninitialized: true,
}));

// Create a MySQL connection
const connection = mysql.createConnection({
    host: process.env.Hostname,
    user: process.env.Username,
    password: process.env.password,
});

// Connect to the database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Database server connected successfully');
    
    // Select the database
    connection.query('USE plp_users', (err) => {
        if (err) {
            console.error('Error selecting database:', err);
            return;
        }
        console.log('Database selected.');
    });

     // Create the table if it doesn't exist
     const userstable = `CREATE TABLE IF NOT EXISTS users (
         id INT PRIMARY KEY AUTO_INCREMENT,
         email VARCHAR(100) UNIQUE,
         username VARCHAR(100),
         password VARCHAR(255)
     )`;
    connection.query(userstable, (err, result) => {
        if (err) {
            console.error('Error creating table:', err);
             return;
        }
        console.log('Users table created successfully.');
    });
    const expensestable = `CREATE TABLE IF NOT EXISTS transactions(
        id INT PRIMARY KEY AUTO_INCREMENT,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(50),
        date DATE,
        notes VARCHAR(255)
    )`;
    connection.query(expensestable, (err,result)=>{
        if (err) return console.log(err);
         console.log("transactions table created Successfully")
    });

});

// POST Route: Register a new user
app.post('/register', (req, res) => {
    const { email, username, password } = req.body;

    // Hash the password before saving it
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).send('Error hashing password');
        }

        const query = `INSERT INTO users (email, username, password) VALUES (?, ?, ?)`;
        connection.query(query, [email, username, hashedPassword], (err, result) => {
            if (err) {
                return res.status(500).send('Error saving user');
            }
            res.send('User registered successfully!');
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

            // Redirect the user to the expense tracker page (index.html)
            res.redirect('/index');  // Redirect to the /index route which serves index.html
        });
    });
});


// Middleware to protect routes
function checkAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).send('Unauthorized access');
    }
    next();
}

// GET Route: Expense Tracker (Protected)
app.get('/index', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/login', (req,res)=>{
    res.sendFile(path.join(__dirname, 'public','login.html'));
});

app.get('/register', (req,res)=>{
    res.sendFile(path.join(__dirname, 'public','register.html'))
});

// Start the server
app.listen(5000, () => {
    console.log('Server is running on port 5000...');
});
