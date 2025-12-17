const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = 'eduagri-secret-key-2025'; // Change this in production

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the frontend (parent) directory
app.use(express.static(path.join(__dirname, '../')));

// Database initialization
const dbPath = path.join(__dirname, 'eduagri_final.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database open error:', err);
  else console.log('Connected to SQLite database at ' + dbPath);
});

// Initialize tables
function initializeDB() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'customer',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_title TEXT NOT NULL,
        course_img TEXT,
        enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, course_title)
      )
    `);
  });
}

initializeDB();

// Middleware: Verify JWT
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Routes

// Register
app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing username, email, or password' });
  }
  const hashedPassword = bcryptjs.hashSync(password, 8);
  db.run(
    'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
    [username, email, hashedPassword, req.body.role || 'customer'],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }
      const token = jwt.sign({ userId: this.lastID, username, role: req.body.role || 'customer' }, SECRET_KEY, { expiresIn: '7d' });
      res.json({ success: true, token, userId: this.lastID, username, role: req.body.role || 'customer' });
    }
  );
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }
  db.get('SELECT id, username, password, role FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });
    const validPassword = bcryptjs.compareSync(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid username or password' });
    const token = jwt.sign({ userId: user.id, username: user.username, role: user.role || 'customer' }, SECRET_KEY, { expiresIn: '7d' });
    res.json({ success: true, token, userId: user.id, username: user.username, role: user.role || 'customer' });
  });
});

// Get current user
app.get('/api/me', verifyToken, (req, res) => {
  db.get('SELECT id, username, role FROM users WHERE id = ?', [req.userId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(401).json({ error: 'User not found' });
    res.json({ userId: row.id, username: row.username, role: row.role });
  });
});

// Get user enrollments
app.get('/api/enrollments', verifyToken, (req, res) => {
  db.all('SELECT id, course_title, course_img FROM enrollments WHERE user_id = ?', [req.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows || []);
  });
});

// Enroll in a course
app.post('/api/enroll', verifyToken, (req, res) => {
  const { courseTitle, courseImg } = req.body;
  if (!courseTitle) return res.status(400).json({ error: 'Missing courseTitle' });
  db.run(
    'INSERT INTO enrollments (user_id, course_title, course_img) VALUES (?, ?, ?)',
    [req.userId, courseTitle, courseImg || null],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Already enrolled in this course' });
        }
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true, id: this.lastID, courseTitle, courseImg });
    }
  );
});

// Unenroll from a course
app.delete('/api/enrollments/:courseTitle', verifyToken, (req, res) => {
  const { courseTitle } = req.params;
  db.run('DELETE FROM enrollments WHERE user_id = ? AND course_title = ?', [req.userId, courseTitle], function (err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ success: true });
  });
});

// Start server with error handling (use env PORT when available)
const server = app.listen(PORT, () => {
  console.log(`EduAgri server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please free the port or set PORT to a different value.`);
    console.error('To find and kill the process (Windows PowerShell):');
    console.error('  netstat -ano | findstr :' + PORT);
    console.error('  taskkill /PID <PID> /F');
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});
