const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// Use data directory for Railway persistence
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'linktree.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function initialize() {
  // Create tables
  db.exec(`
    -- Users table for admin authentication
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Profile settings
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT DEFAULT 'My Links',
      bio TEXT DEFAULT 'Welcome to my link page',
      avatar_url TEXT DEFAULT '',
      background_color TEXT DEFAULT '#667eea',
      text_color TEXT DEFAULT '#ffffff',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Links table
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      icon TEXT DEFAULT '',
      background_color TEXT DEFAULT '#ffffff',
      text_color TEXT DEFAULT '#333333',
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create default admin user if not exists
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run('admin', hashedPassword);
    console.log('Default admin user created (username: admin, password: admin123)');
  }

  // Create default profile if not exists
  const profileExists = db.prepare('SELECT id FROM profile').get();
  if (!profileExists) {
    db.prepare('INSERT INTO profile (name, bio) VALUES (?, ?)').run('My Links', 'Welcome to my link page');
  }

  // Add some sample links if none exist
  const linksExist = db.prepare('SELECT id FROM links LIMIT 1').get();
  if (!linksExist) {
    const sampleLinks = [
      { title: 'GitHub', url: 'https://github.com', icon: 'github' },
      { title: 'Twitter', url: 'https://twitter.com', icon: 'twitter' },
      { title: 'LinkedIn', url: 'https://linkedin.com', icon: 'linkedin' }
    ];

    const insert = db.prepare('INSERT INTO links (title, url, icon, sort_order) VALUES (?, ?, ?, ?)');
    sampleLinks.forEach((link, index) => {
      insert.run(link.title, link.url, link.icon, index);
    });
    console.log('Sample links created');
  }

  console.log('Database initialized successfully');
}

module.exports = {
  db,
  initialize
};
