import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('vitalflow.db');

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    blood_group TEXT NOT NULL,
    address TEXT NOT NULL,
    role TEXT CHECK(role IN ('donor', 'hospital', 'admin')) DEFAULT 'donor'
  );

  CREATE TABLE IF NOT EXISTS blood_stock (
    blood_group TEXT PRIMARY KEY,
    quantity_ml INTEGER NOT NULL DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL,
    requester_name TEXT NOT NULL,
    blood_group_needed TEXT NOT NULL,
    quantity_ml INTEGER NOT NULL,
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(requester_id) REFERENCES users(id)
  );
`);

// Seed Blood Stock if empty
const stockCount = db.prepare('SELECT COUNT(*) as count FROM blood_stock').get() as { count: number };
if (stockCount.count === 0) {
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const insertStock = db.prepare('INSERT INTO blood_stock (blood_group, quantity_ml) VALUES (?, ?)');
  bloodGroups.forEach(bg => insertStock.run(bg, Math.floor(Math.random() * 5000) + 1000));
}

// Seed admin if not exists
const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin') as { count: number };
if (adminCount.count === 0) {
  db.prepare('INSERT INTO users (name, email, password, blood_group, address, role) VALUES (?, ?, ?, ?, ?, ?)')
    .run('Global Admin', 'admin@vitalflow.org', 'admin123', 'O+', 'Headquarters', 'admin');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post('/api/register', (req, res) => {
    const { name, email, password, blood_group, address, role } = req.body;
    try {
      const stmt = db.prepare('INSERT INTO users (name, email, password, blood_group, address, role) VALUES (?, ?, ?, ?, ?, ?)');
      const info = stmt.run(name, email, password, blood_group, address, role || 'donor');
      res.json({ id: info.lastInsertRowid, name, email, blood_group, address, role: role || 'donor' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.get('/api/inventory', (req, res) => {
    const stock = db.prepare('SELECT * FROM blood_stock').all();
    res.json(stock);
  });

  app.patch('/api/inventory', (req, res) => {
    const { blood_group, quantity_ml, action } = req.body; // action: 'add' or 'subtract'
    const current = db.prepare('SELECT quantity_ml FROM blood_stock WHERE blood_group = ?').get(blood_group) as { quantity_ml: number };
    
    if (!current) return res.status(404).json({ error: 'Blood group not found' });

    let newQuantity = current.quantity_ml;
    if (action === 'add') newQuantity += quantity_ml;
    else if (action === 'subtract') newQuantity = Math.max(0, current.quantity_ml - quantity_ml);

    db.prepare('UPDATE blood_stock SET quantity_ml = ?, last_updated = CURRENT_TIMESTAMP WHERE blood_group = ?')
      .run(newQuantity, blood_group);
    
    res.json({ blood_group, quantity_ml: newQuantity });
  });

  app.get('/api/requests', (req, res) => {
    const userId = req.query.userId;
    let requests;
    if (userId) {
      requests = db.prepare('SELECT * FROM requests WHERE requester_id = ? ORDER BY created_at DESC').all(userId);
    } else {
      requests = db.prepare('SELECT * FROM requests ORDER BY created_at DESC').all();
    }
    res.json(requests);
  });

  app.post('/api/requests', (req, res) => {
    const { requester_id, requester_name, blood_group_needed, quantity_ml } = req.body;
    try {
      const stmt = db.prepare('INSERT INTO requests (requester_id, requester_name, blood_group_needed, quantity_ml) VALUES (?, ?, ?, ?)');
      const info = stmt.run(requester_id, requester_name, blood_group_needed, quantity_ml);
      res.json({ id: info.lastInsertRowid, status: 'pending' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/requests/:id', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    if (status === 'approved') {
      const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(id) as any;
      const stock = db.prepare('SELECT quantity_ml FROM blood_stock WHERE blood_group = ?').get(request.blood_group_needed) as { quantity_ml: number };
      
      if (stock.quantity_ml < request.quantity_ml) {
        return res.status(400).json({ error: 'Insufficient blood stock' });
      }

      db.prepare('UPDATE blood_stock SET quantity_ml = quantity_ml - ? WHERE blood_group = ?')
        .run(request.quantity_ml, request.blood_group_needed);
    }

    db.prepare('UPDATE requests SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
