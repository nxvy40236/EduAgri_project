const express = require('express');
const pool = require('./db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(express.json());

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Register
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length) return res.status(409).json({ error: 'username taken' });
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email || null, hash]);
    res.json({ id: result.insertId, username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Login (returns basic user object)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  try {
    const [rows] = await pool.query('SELECT id, password_hash FROM users WHERE username = ?', [username]);
    if (!rows.length) return res.status(401).json({ error: 'invalid credentials' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    res.json({ id: user.id, username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Enrollments
app.post('/api/enrollments', async (req, res) => {
  const { userId, title, img } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const [result] = await pool.query('INSERT INTO enrollments (user_id, title, img) VALUES (?, ?, ?)', [userId || null, title, img || null]);
    res.json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.get('/api/enrollments', async (req, res) => {
  const userId = req.query.userId;
  try {
    if (userId) {
      const [rows] = await pool.query('SELECT * FROM enrollments WHERE user_id = ? ORDER BY enrolled_at DESC', [userId]);
      return res.json(rows);
    }
    const [rows] = await pool.query('SELECT * FROM enrollments ORDER BY enrolled_at DESC LIMIT 100');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Farmer orders
app.post('/api/farmer-orders', async (req, res) => {
  const { userId, farmerName, items, total } = req.body || {};
  try {
    const itemsJson = JSON.stringify(items || []);
    const [result] = await pool.query('INSERT INTO farmer_orders (user_id, farmer_name, items, total) VALUES (?, ?, ?, ?)', [userId || null, farmerName || null, itemsJson, total || 0]);
    res.json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.get('/api/farmer-orders', async (req, res) => {
  const userId = req.query.userId;
  try {
    if (userId) {
      const [rows] = await pool.query('SELECT * FROM farmer_orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
      rows.forEach(r => { r.items = JSON.parse(r.items || '[]'); });
      return res.json(rows);
    }
    const [rows] = await pool.query('SELECT * FROM farmer_orders ORDER BY created_at DESC LIMIT 100');
    rows.forEach(r => { r.items = JSON.parse(r.items || '[]'); });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Customer orders
app.post('/api/customer-orders', async (req, res) => {
  const { userId, farmerName, items, total } = req.body || {};
  try {
    const itemsJson = JSON.stringify(items || []);
    const [result] = await pool.query('INSERT INTO customer_orders (user_id, farmer_name, items, total) VALUES (?, ?, ?, ?)', [userId || null, farmerName || null, itemsJson, total || 0]);
    res.json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.get('/api/customer-orders', async (req, res) => {
  const userId = req.query.userId;
  try {
    if (userId) {
      const [rows] = await pool.query('SELECT * FROM customer_orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
      rows.forEach(r => { r.items = JSON.parse(r.items || '[]'); });
      return res.json(rows);
    }
    const [rows] = await pool.query('SELECT * FROM customer_orders ORDER BY created_at DESC LIMIT 100');
    rows.forEach(r => { r.items = JSON.parse(r.items || '[]'); });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on :${port}`));
