const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Use data directory for Railway persistence
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'linktree.db');

let db = null;

// Save database to file
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);

    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(dbPath, buffer);
  }
}

// Initialize database
async function initialize() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  try {
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
      console.log('Database loaded from file');
    } else {
      db = new SQL.Database();
      console.log('New database created');
    }
  } catch (error) {
    console.error('Error loading database:', error);
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT DEFAULT 'My Links',
      bio TEXT DEFAULT 'Welcome to my link page',
      avatar_url TEXT DEFAULT '',
      background_color TEXT DEFAULT '#667eea',
      text_color TEXT DEFAULT '#ffffff',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
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
    )
  `);

  // Create default admin user if not exists
  const adminResult = get("SELECT id FROM users WHERE username = ?", ['admin']);
  if (!adminResult) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    run('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
    console.log('Default admin user created (username: admin, password: admin123)');
  }

  // Create default profile if not exists
  const profileResult = get('SELECT id FROM profile');
  if (!profileResult) {
    run("INSERT INTO profile (name, bio) VALUES (?, ?)", ['My Links', 'Welcome to my link page']);
  }

  // Add some sample links if none exist
  const linksResult = get('SELECT id FROM links LIMIT 1');
  if (!linksResult) {
    const sampleLinks = [
      { title: 'GitHub', url: 'https://github.com', icon: 'github' },
      { title: 'Twitter', url: 'https://twitter.com', icon: 'twitter' },
      { title: 'LinkedIn', url: 'https://linkedin.com', icon: 'linkedin' }
    ];

    sampleLinks.forEach((link, index) => {
      run('INSERT INTO links (title, url, icon, sort_order) VALUES (?, ?, ?, ?)',
        [link.title, link.url, link.icon, index]);
    });
    console.log('Sample links created');
  }

  saveDatabase();
  console.log('Database initialized successfully');
}

// Database query helpers
function run(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const result = stmt.getAsObject();
    stmt.free();
    return result;
  }
  stmt.free();
  return null;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function getLastInsertRowId() {
  const result = db.exec('SELECT last_insert_rowid() as id');
  return result[0].values[0][0];
}

module.exports = {
  initialize,
  run,
  get,
  all,
  getLastInsertRowId,
  saveDatabase
};
