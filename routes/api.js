const express = require('express');
const router = express.Router();
const { db } = require('../database/db');

// Get all active links (public)
router.get('/links', (req, res) => {
  try {
    const links = db.prepare(`
      SELECT id, title, url, icon, background_color, text_color, sort_order
      FROM links
      WHERE is_active = 1
      ORDER BY sort_order ASC
    `).all();
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get profile (public)
router.get('/profile', (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM profile LIMIT 1').get();
    res.json(profile || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track link click
router.post('/links/:id/click', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE links SET clicks = clicks + 1 WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update link order (for drag and drop)
router.put('/links/reorder', (req, res) => {
  try {
    const { orders } = req.body; // Array of { id, sort_order }
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

module.exports = router;
