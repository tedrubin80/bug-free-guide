# Linktree Clone

A Linktree-style link website with drag-and-drop functionality and an admin panel.

## Features

- **Public Homepage**: Display your links with a customizable profile
- **Drag & Drop**: Reorder links by dragging on the homepage
- **Admin Dashboard**: Manage links, profile, and view analytics
- **SQLite Database**: Lightweight, file-based database
- **Railway Ready**: Configured for easy deployment

## Quick Start

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create the data directory:
   ```bash
   mkdir -p data
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser:
   - Homepage: http://localhost:3000
   - Admin: http://localhost:3000/admin

### Default Admin Credentials

- **Username**: admin
- **Password**: admin123

**Important**: Change these credentials after first login!

## Deployment on Railway

1. Push this code to a GitHub repository

2. Create a new project on [Railway](https://railway.app)

3. Connect your GitHub repository

4. Add a volume for persistent storage:
   - Go to your service settings
   - Add a volume mounted at `/app/data`

5. Set environment variables:
   ```
   DATABASE_PATH=/app/data/linktree.db
   SESSION_SECRET=your-secure-random-string
   NODE_ENV=production
   ```

6. Deploy!

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `DATABASE_PATH` | SQLite database path | ./data/linktree.db |
| `SESSION_SECRET` | Session encryption key | (random string) |
| `NODE_ENV` | Environment mode | development |

## Project Structure

```
├── server.js           # Express server entry point
├── database/
│   └── db.js          # SQLite database setup
├── routes/
│   ├── api.js         # Public API routes
│   └── admin.js       # Admin API and pages
├── public/
│   ├── index.html     # Public homepage
│   └── admin/
│       ├── index.html # Admin dashboard
│       └── login.html # Admin login
├── data/              # SQLite database storage
├── package.json
├── railway.json       # Railway configuration
└── Procfile          # Process configuration
```

## API Endpoints

### Public

- `GET /api/links` - Get all active links
- `GET /api/profile` - Get profile information
- `POST /api/links/:id/click` - Track link click
- `PUT /api/links/reorder` - Reorder links (drag & drop)

### Admin (requires authentication)

- `POST /admin/api/login` - Login
- `POST /admin/api/logout` - Logout
- `GET /admin/api/links` - Get all links
- `POST /admin/api/links` - Create link
- `PUT /admin/api/links/:id` - Update link
- `DELETE /admin/api/links/:id` - Delete link
- `PUT /admin/api/links/reorder` - Reorder links
- `GET /admin/api/profile` - Get profile
- `PUT /admin/api/profile` - Update profile
- `PUT /admin/api/password` - Change password
- `GET /admin/api/analytics` - Get analytics

## License

MIT
