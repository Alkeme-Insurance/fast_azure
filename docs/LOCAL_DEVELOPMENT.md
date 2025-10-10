# Local Development Guide

This guide explains how to run Fast Azure locally without Docker for faster development iteration.

## Prerequisites

- Python 3.11+ with `uv` installed
- Node.js 20+ with npm
- MongoDB running (can use Docker for just MongoDB)

## Quick Start

### 1. Start MongoDB

Use Docker Compose to run only MongoDB:

```bash
docker-compose up mongo
```

Or use a local MongoDB installation:

```bash
mongod --dbpath ./data/db
```

### 2. Configure Environment

The `.env` file should already be configured for local development:

```env
# MongoDB - use localhost for local dev
MONGODB_URI=mongodb://localhost:27017

# Frontend - use Vite dev server port
VITE_AZURE_REDIRECT_URI=http://localhost:5173
VITE_AZURE_POST_LOGOUT_REDIRECT_URI=http://localhost:5173

# Dev mode enabled (bypass Azure AD)
VITE_DEV_NO_AUTH=true
```

### 3. Start Backend

```bash
cd backend
uv sync                    # Install dependencies (first time only)
uv run uvicorn backend.main:app --reload --port 8000
```

Backend will be available at: http://localhost:8000

API Docs: http://localhost:8000/docs

### 4. Start Frontend

In a new terminal:

```bash
cd frontend
npm install                # Install dependencies (first time only)
npm run dev
```

Frontend will be available at: http://localhost:5173

### 5. Verify Setup

1. Open http://localhost:5173
2. You should see the app with "Dev User" auto-logged in
3. Navigate to different pages (Projects, Board, Dashboard)
4. Check browser console for errors

## Development Workflow

### Backend Changes

The backend runs with `--reload` flag, so changes to Python files automatically restart the server.

**Watch for:**
- Syntax errors in terminal
- API errors in http://localhost:8000/docs
- MongoDB connection issues

### Frontend Changes

Vite provides Hot Module Replacement (HMR), so changes appear instantly.

**Watch for:**
- TypeScript errors in terminal
- Console errors in browser DevTools
- Network errors in DevTools Network tab

### Database Changes

MongoDB data persists between restarts. To reset:

```bash
# Stop MongoDB
docker-compose stop mongo

# Remove volume (CAUTION: deletes all data)
docker-compose down -v

# Restart MongoDB (will re-seed on backend startup)
docker-compose up mongo
```

## Troubleshooting

### Error: "AADSTS900144: The request body must contain the following parameter: 'client_id'"

**Cause:** `VITE_DEV_NO_AUTH` is not set or is `false`, but Azure AD credentials are missing.

**Fix:**
```bash
# Edit .env file
VITE_DEV_NO_AUTH=true

# Restart frontend
cd frontend
npm run dev
```

### Error: "Failed to connect to MongoDB"

**Cause:** MongoDB is not running or using wrong port.

**Fix:**
```bash
# Check if MongoDB is running
docker-compose ps

# Or check local MongoDB
ps aux | grep mongod

# Verify connection string in .env
MONGODB_URI=mongodb://localhost:27017
```

### Error: "CORS error" when calling API

**Cause:** Backend CORS not configured for Vite dev server.

**Fix:**
```bash
# Check .env has both ports
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Restart backend
cd backend
uv run uvicorn backend.main:app --reload
```

### Error: "Port 8000 already in use"

**Cause:** Another process is using port 8000 (maybe Docker backend still running).

**Fix:**
```bash
# Stop Docker services
docker-compose down

# Or use a different port
uv run uvicorn backend.main:app --reload --port 8001

# Update .env
VITE_API_BASE_URL=http://localhost:8001
```

### Error: Environment variables not loading in frontend

**Cause:** Vite only loads env vars prefixed with `VITE_`.

**Fix:**
- Ensure all frontend env vars start with `VITE_`
- Restart the dev server after changing .env
- Clear browser cache if needed

### Frontend shows blank page

**Cause:** JavaScript error or API not responding.

**Fix:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed API calls
4. Verify backend is running: `curl http://localhost:8000/docs`

## Environment Variables Reference

### Backend Variables

| Variable | Local Dev Value | Description |
|----------|----------------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017` | Local MongoDB |
| `BACKEND_CORS_ORIGINS` | `http://localhost:3000,http://localhost:5173` | Allow both ports |

### Frontend Variables (Vite)

| Variable | Local Dev Value | Description |
|----------|----------------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API |
| `VITE_DEV_NO_AUTH` | `true` | Bypass Azure AD |
| `VITE_AZURE_REDIRECT_URI` | `http://localhost:5173` | Vite dev server |
| `VITE_METRICS_SOURCE` | `synth` | Use synthetic data |

## Tips & Best Practices

### 1. Use Multiple Terminals

Keep these running in separate terminals:
- Terminal 1: MongoDB (`docker-compose up mongo`)
- Terminal 2: Backend (`uv run uvicorn backend.main:app --reload`)
- Terminal 3: Frontend (`npm run dev`)

### 2. Enable Browser DevTools

Always have DevTools open during development:
- Console: See errors and logs
- Network: Debug API calls
- Application: Check localStorage/sessionStorage

### 3. Use API Docs

Test backend endpoints at http://localhost:8000/docs:
- Try endpoints before integrating in frontend
- See request/response schemas
- Debug backend issues

### 4. Hot Reload Best Practices

**Backend:**
- Save Python files to trigger reload
- Watch terminal for syntax errors
- Reload takes ~1-2 seconds

**Frontend:**
- Changes appear instantly (HMR)
- If HMR fails, page will full reload
- Some changes require manual refresh

### 5. Database Inspection

Use MongoDB Compass or mongosh to inspect data:

```bash
# Connect with mongosh
docker-compose exec mongo mongosh

# List databases
show dbs

# Use appdb
use appdb

# List collections
show collections

# Query projects
db.projects.find().pretty()
```

### 6. Git Workflow

```bash
# Check status
git status

# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "Add my feature"

# Push to remote
git push origin feature/my-feature
```

## IDE Setup

### VS Code

Recommended extensions:
- Python (Microsoft)
- Pylance (Microsoft)
- ESLint (Microsoft)
- Prettier (Prettier)
- Tailwind CSS IntelliSense (Tailwind Labs)

### Cursor

The project is already configured for Cursor AI. Use:
- Cmd/Ctrl+K for inline AI assistance
- Cmd/Ctrl+L for chat
- Select code and ask questions

## Performance Tips

### Backend

```bash
# Use uvicorn workers for better performance (production)
uv run uvicorn backend.main:app --workers 4

# Profile slow endpoints
# Add timing logs in backend/main.py middleware
```

### Frontend

```bash
# Build and preview production bundle
npm run build
npm run preview

# Analyze bundle size
npm run build -- --analyze
```

## Next Steps

Once local development is working:

1. **Test Docker build** to ensure it works in production:
   ```bash
   docker-compose up --build
   ```

2. **Set up GitHub Actions** for CI/CD (see below)

3. **Configure Azure AD** for real authentication (see AZURE_AD_SETUP.md)

## Related Documentation

- [AZURE_AD_SETUP.md](./AZURE_AD_SETUP.md) - Set up real authentication
- [DOCKER_SETUP.md](./DOCKER_SETUP.md) - Docker deployment
- [METRICS_MODEL.md](./METRICS_MODEL.md) - Understanding metrics
- [README.md](./README.md) - Main documentation

---

**Happy coding! 🚀**

