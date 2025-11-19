const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const path = require('path');
const { db } = require('../database/db');

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  if (req.path === '/login' || req.path === '/api/login') {
    return next();
  }
  res.redirect('/admin/login');
}

// Serve admin login page
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'login.html'));
});

// Serve admin dashboard
router.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'index.html'));
});

// API: Login
router.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Logout
router.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// API: Check auth status
router.get('/api/auth', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({ authenticated: true, username: req.session.username });
  } else {
    res.json({ authenticated: false });
  }
});

// API: Get all links (including inactive)
router.get('/api/links', requireAuth, (req, res) => {
  try {
    const links = db.prepare('SELECT * FROM links ORDER BY sort_order ASC').all();
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Create link
router.post('/api/links', requireAuth, (req, res) => {
  try {
    const { title, url, icon, background_color, text_color, is_active } = req.body;
    const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM links').get();
    const sort_order = (maxOrder.max || 0) + 1;

    const result = db.prepare(`
      INSERT INTO links (title, url, icon, background_color, text_color, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, url, icon || '', background_color || '#ffffff', text_color || '#333333', is_active ? 1 : 0, sort_order);

    const link = db.prepare('SELECT * FROM links WHERE id = ?').get(result.lastInsertRowid);
    res.json(link);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Update link
router.put('/api/links/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, icon, background_color, text_color, is_active } = req.body;

    db.prepare(`
      UPDATE links
      SET title = ?, url = ?, icon = ?, background_color = ?, text_color = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, url, icon || '', background_color || '#ffffff', text_color || '#333333', is_active ? 1 : 0, id);

    const link = db.prepare('SELECT * FROM links WHERE id = ?').get(id);
    res.json(link);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Delete link
router.delete('/api/links/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM links WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Reorder links
router.put('/api/links/reorder', requireAuth, (req, res) => {
  try {
    const { orders } = req.body;
    const update = db.prepare('UPDATE links SET sort_order = ? WHERE id = ?');

    const updateMany = db.transaction((orders) => {
      for (const order of orders) {
        update.run(order.sort_order, order.id);
      }
    });

    updateMany(orders);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get profile
router.get('/api/profile', requireAuth, (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM profile LIMIT 1').get();
    res.json(profile || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Update profile
router.put('/api/profile', requireAuth, (req, res) => {
  try {
    const { name, bio, avatar_url, background_color, text_color } = req.body;

    db.prepare(`
      UPDATE profile
      SET name = ?, bio = ?, avatar_url = ?, background_color = ?, text_color = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(name, bio, avatar_url || '', background_color || '#667eea', text_color || '#ffffff');

    const profile = db.prepare('SELECT * FROM profile WHERE id = 1').get();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Change password
router.put('/api/password', requireAuth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);

    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, req.session.userId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get analytics
router.get('/api/analytics', requireAuth, (req, res) => {
  try {
    const links = db.prepare('SELECT id, title, clicks FROM links ORDER BY clicks DESC').all();
    const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
    res.json({ links, totalClicks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
