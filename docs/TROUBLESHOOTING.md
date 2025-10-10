# Troubleshooting Guide

This guide covers common issues and their solutions when working with Fast Azure.

## Table of Contents

- [Authentication Issues](#authentication-issues)
- [Database Connection Issues](#database-connection-issues)
- [CORS Issues](#cors-issues)
- [Port Conflicts](#port-conflicts)
- [Environment Variables](#environment-variables)
- [Frontend Issues](#frontend-issues)
- [Backend Issues](#backend-issues)
- [Docker Issues](#docker-issues)

---

## Authentication Issues

### Error: "AADSTS900144: The request body must contain the following parameter: 'client_id'"

**Symptoms:**
- Login page shows error about missing `client_id`
- Authentication fails immediately

**Cause:**
Azure AD is enabled but credentials are not configured in `.env` file.

**Solution:**

**Option 1: Use Development Mode (Recommended for local dev)**

```bash
# Edit .env file
VITE_DEV_NO_AUTH=true

# Restart frontend
cd frontend
npm run dev
```

This will auto-login with a mock "Dev User" and bypass Azure AD completely.

**Option 2: Configure Azure AD**

Follow the complete guide in [AZURE_AD_SETUP.md](./AZURE_AD_SETUP.md) to:
1. Create an Azure AD app registration
2. Configure redirect URIs
3. Set environment variables in `.env`:

```env
VITE_AZURE_CLIENT_ID=your-client-id-here
VITE_AZURE_TENANT_ID=your-tenant-id-here
VITE_AZURE_API_SCOPE=api://your-app-id/access_as_user
VITE_DEV_NO_AUTH=false
```

### Error: "AADSTS65001: The user or administrator has not consented to use the application"

**Cause:**
The Azure AD app requires admin consent for API permissions.

**Solution:**
1. Go to Azure Portal → Azure Active Directory → App registrations
2. Select your app
3. Go to "API permissions"
4. Click "Grant admin consent for [Your Organization]"

---

## Database Connection Issues

### Error: "Failed to connect to MongoDB" or "ServerSelectionTimeoutError"

**Symptoms:**
- Backend fails to start
- Error mentions `mongo:27017` or `localhost:27017`

**Cause:**
MongoDB is not running or connection string is incorrect.

**Solution:**

**For Local Development:**

```bash
# Ensure .env has correct URI
MONGODB_URI=mongodb://localhost:27017

# Start MongoDB with Docker
docker-compose up mongo

# Verify MongoDB is running
docker-compose ps
```

**For Docker:**

```bash
# Ensure .env has correct URI for Docker network
MONGODB_URI=mongodb://mongo:27017

# Start all services
docker-compose up --build
```

**Verify MongoDB is accessible:**

```bash
# From local machine
docker-compose exec mongo mongosh --eval "db.serverStatus().ok"

# Should return 1
```

### Error: "Authentication failed" (MongoDB)

**Cause:**
MongoDB credentials are incorrect or authentication is enabled when it shouldn't be.

**Solution:**

For development, we disable MongoDB authentication:

```yaml
# docker-compose.yml already has this:
command: mongod --noauth
```

If you need authentication in production, update `.env`:

```env
MONGODB_URI=mongodb://username:password@mongo:27017
```

---

## CORS Issues

### Error: "Access to fetch at 'http://localhost:8000/api/...' has been blocked by CORS policy"

**Symptoms:**
- API calls fail with CORS error in browser console
- Backend shows no error, but frontend can't access response

**Cause:**
Backend CORS configuration doesn't include the frontend URL.

**Solution:**

**For Local Development (Vite on port 5173):**

```env
# .env file
BACKEND_CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**For Docker (Nginx on port 3000):**

```env
# .env file
BACKEND_CORS_ORIGINS=http://localhost:3000
```

**After changing:**
```bash
# Restart backend
# Local: Stop (Ctrl+C) and restart uvicorn
# Docker: docker-compose restart backend
```

**Debug CORS:**

```bash
# Test with curl
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://localhost:8000/api/projects \
     -v

# Should see "Access-Control-Allow-Origin" in response
```

---

## Port Conflicts

### Error: "Port 8000 already in use" or "Port 5173 already in use"

**Cause:**
Another process is using the port.

**Solution:**

**Find what's using the port:**

```bash
# On Linux/Mac
lsof -i :8000
lsof -i :5173

# Kill the process
kill -9 <PID>
```

**Use a different port:**

```bash
# Backend (temporary)
cd backend
uv run uvicorn backend.main:app --reload --port 8001

# Update .env
VITE_API_BASE_URL=http://localhost:8001

# Frontend (temporary)
cd frontend
npm run dev -- --port 5174

# Update any references to 5173 → 5174
```

**Check Docker containers:**

```bash
# Stop all Docker containers
docker-compose down

# Remove orphaned containers
docker-compose down --remove-orphans
```

---

## Environment Variables

### Frontend environment variables not loading

**Symptoms:**
- `import.meta.env.VITE_*` is undefined
- App uses default values instead of .env values

**Cause:**
- Environment variables must be prefixed with `VITE_`
- Dev server needs restart after .env changes
- .env file is not in project root

**Solution:**

```bash
# 1. Ensure .env is in project root (not in frontend/)
ls -la .env

# 2. Ensure variables are prefixed with VITE_
# ✅ Good:
VITE_API_BASE_URL=http://localhost:8000
# ❌ Bad:
API_BASE_URL=http://localhost:8000

# 3. Restart dev server
cd frontend
# Stop with Ctrl+C
npm run dev

# 4. Verify in browser console
console.log(import.meta.env.VITE_API_BASE_URL)
```

### Backend environment variables not loading

**Cause:**
Backend reads `.env` file from project root using `python-dotenv`.

**Solution:**

```bash
# 1. Ensure .env is in project root
ls -la .env

# 2. Verify backend can read it
cd backend
python -c "from backend.config import settings; print(settings.MONGODB_URI)"

# 3. Restart backend
uv run uvicorn backend.main:app --reload
```

---

## Frontend Issues

### Error: "net::ERR_INSUFFICIENT_RESOURCES" (infinite loop)

**Symptoms:**
- Browser console shows hundreds of identical API requests
- Browser becomes unresponsive

**Cause:**
`useEffect` dependency array causes re-renders, triggering more API calls.

**Solution:**

```tsx
// ❌ Bad: function reference changes every render
useEffect(() => {
  api.list();
}, [api.list]);  // list reference changes → infinite loop

// ✅ Good: empty array = run once
useEffect(() => {
  api.list();
}, []);

// ✅ Good: only re-run when specific value changes
useEffect(() => {
  api.getById(id);
}, [id]);
```

### Frontend shows blank page

**Cause:**
JavaScript error or API not responding.

**Solution:**

```bash
# 1. Open browser DevTools (F12)
# 2. Check Console tab for errors
# 3. Check Network tab for failed API calls

# 4. Verify backend is running
curl http://localhost:8000/docs

# 5. Clear browser cache
# Chrome: Cmd/Ctrl + Shift + R

# 6. Check for TypeScript errors
cd frontend
npm run build
```

### TypeScript errors in build

**Cause:**
Type mismatches or unused imports.

**Solution:**

```bash
# Check errors
cd frontend
npm run build

# Common fixes:
# - Remove unused imports
# - Cast types: `value as Type`
# - Add index signature: `[key: string]: any`

# For strict type checking:
npm run type-check
```

---

## Backend Issues

### Error: "ModuleNotFoundError: No module named 'X'"

**Cause:**
Python dependency not installed.

**Solution:**

```bash
cd backend

# Sync dependencies
uv sync

# If uv.lock is outdated
uv lock
uv sync

# Verify installation
uv run python -c "import motor; import pymongo"
```

### Error: "pydantic_core._pydantic_core.ValidationError"

**Cause:**
API request body doesn't match Pydantic model schema.

**Solution:**

```bash
# 1. Check the error message for which field is invalid
# Example: "board_id Field required"

# 2. Check the Pydantic model
# backend/models/card.py, etc.

# 3. Ensure frontend sends correct field names
# Use camelCase if model uses serialization_alias

# 4. Test with API docs
open http://localhost:8000/docs
# Use the "Try it out" feature to test endpoints
```

### Error: "'ObjectId' object is not iterable" or "Object of type ObjectId is not JSON serializable"

**Cause:**
MongoDB `ObjectId` cannot be directly serialized to JSON.

**Solution:**

Already handled by Pydantic models with custom `ObjectIdStr` type:

```python
# backend/models/base.py
from bson import ObjectId

class ObjectIdStr(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str):
            return v
        raise TypeError('Invalid ObjectId')
```

If you see this error, ensure routes use `response_model` with Pydantic models:

```python
@router.get("/boards/{board_id}", response_model=BoardPublic)
async def get_board(board_id: str):
    # ...
```

---

## Docker Issues

### Error: "Cannot connect to Docker daemon"

**Cause:**
Docker is not running.

**Solution:**

```bash
# Start Docker Desktop (Mac/Windows)
# Or start Docker service (Linux)
sudo systemctl start docker

# Verify
docker ps
```

### Error: "no configuration file provided: not found"

**Cause:**
Not in the correct directory.

**Solution:**

```bash
# Ensure you're in the project root
cd /path/to/fast_azure
ls -la docker-compose.yml

# Then run
docker-compose up
```

### Error: "Cannot start service: port is already allocated"

**Cause:**
Port is already in use by another Docker container or process.

**Solution:**

```bash
# Stop all containers
docker-compose down

# Remove all stopped containers
docker container prune

# Find process using port
lsof -i :3000
lsof -i :8000
lsof -i :27017

# Kill if needed
kill -9 <PID>

# Restart
docker-compose up
```

### Docker build fails with "COPY failed"

**Cause:**
Files referenced in Dockerfile don't exist or `.dockerignore` excludes them.

**Solution:**

```bash
# Check Dockerfile paths
cat backend/Dockerfile
cat frontend/Dockerfile

# Check .dockerignore
cat .dockerignore

# Ensure required files exist
ls backend/pyproject.toml
ls frontend/package.json

# Rebuild
docker-compose build --no-cache
```

### Containers exit immediately after starting

**Cause:**
Application error or misconfiguration.

**Solution:**

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Run container interactively to debug
docker-compose run backend /bin/bash
docker-compose run frontend /bin/sh

# Check environment variables inside container
docker-compose exec backend env | grep MONGODB
docker-compose exec frontend env | grep VITE
```

---

## Performance Issues

### Slow API responses

**Solution:**

```bash
# 1. Check MongoDB indexes
docker-compose exec mongo mongosh
> use appdb
> db.projects.getIndexes()
> db.cards.getIndexes()

# 2. Enable backend logging
# Add to backend/main.py middleware

# 3. Check for N+1 queries
# Use MongoDB profiler

# 4. Add caching for hot paths
```

### Slow frontend build

**Solution:**

```bash
cd frontend

# Clean cache
rm -rf node_modules/.vite

# Optimize dependencies
npm run build -- --analyze

# Use faster package manager
npm i -g pnpm
pnpm install
pnpm dev
```

---

## Getting Help

If your issue isn't covered here:

1. **Check logs:**
   ```bash
   # Backend
   docker-compose logs backend
   # or local:
   # Check terminal where uvicorn is running

   # Frontend
   # Check browser console (F12)
   ```

2. **Enable debug mode:**
   ```bash
   # Backend: add to .env
   DEBUG=true

   # Frontend: check browser console
   console.log(import.meta.env)
   ```

3. **Test in isolation:**
   - Test backend endpoints with http://localhost:8000/docs
   - Test MongoDB with `mongosh`
   - Test frontend API client with `console.log()`

4. **Review documentation:**
   - [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)
   - [DOCKER_SETUP.md](./DOCKER_SETUP.md)
   - [AZURE_AD_SETUP.md](./AZURE_AD_SETUP.md)

5. **Check recent changes:**
   ```bash
   git log --oneline -10
   git diff HEAD~1
   ```

---

**Last Updated:** October 2, 2025

