# Docker Setup Guide

This guide explains how to run the Fast Azure application using Docker and Docker Compose.

## Architecture

The application consists of three services:

1. **MongoDB** - Database (port 27017)
2. **FastAPI Backend** - Python API server (port 8000)
3. **React Frontend** - Nginx-served static site (port 3000)

All services run in a shared Docker network for internal communication.

## Prerequisites

- Docker (20.10+)
- Docker Compose (2.0+)

## Quick Start

### 1. Clone and navigate to the repository

```bash
cd /home/jharris/workspace/fast_azure
```

### 2. Create environment file (optional)

Create a `.env` file in the project root:

```env
# MongoDB
MONGO_INITDB_ROOT_USERNAME=mongo
MONGO_INITDB_ROOT_PASSWORD=mongo

# Backend
MONGODB_URI=mongodb://mongo:27017
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Frontend (build-time)
VITE_API_BASE_URL=http://localhost:8000
VITE_METRICS_SOURCE=synth
VITE_WS_BASE=ws://localhost:8000
```

### 3. Build and start all services

```bash
docker-compose up --build
```

Or run in detached mode:

```bash
docker-compose up -d --build
```

### 4. Access the application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **MongoDB**: localhost:27017

### 5. Stop the application

```bash
docker-compose down
```

To also remove volumes (clears database):

```bash
docker-compose down -v
```

## Service Details

### MongoDB

- **Image**: `mongo:7`
- **Port**: `27017:27017`
- **Volume**: `mongo_data:/data/db` (persistent storage)
- **Healthcheck**: Pings MongoDB every 10s

### Backend (FastAPI)

- **Build Context**: Project root
- **Dockerfile**: `backend/Dockerfile`
- **Port**: `8000:80`
- **Base Image**: `python:3.11-slim`
- **Dependencies**: Installed via `uv`
- **Depends On**: MongoDB (waits for healthcheck)
- **Entry Point**: `uvicorn backend.main:app --host 0.0.0.0 --port 80`

### Frontend (React + Vite)

- **Build Context**: `./frontend`
- **Dockerfile**: `frontend/Dockerfile`
- **Port**: `3000:80`
- **Build**: Multi-stage (Node.js → Nginx)
- **Base Images**: 
  - Builder: `node:20-alpine`
  - Production: `nginx:alpine`
- **Depends On**: Backend
- **Entry Point**: Nginx serving static files

## Docker Commands

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongo
```

### Restart a service

```bash
docker-compose restart backend
```

### Rebuild a service

```bash
docker-compose up -d --build backend
```

### Execute commands in a container

```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# MongoDB shell
docker-compose exec mongo mongosh
```

### View running containers

```bash
docker-compose ps
```

### Remove all containers and networks

```bash
docker-compose down
```

## Development Workflow

### Local Development (Recommended)

For faster development, run services locally:

```bash
# Terminal 1: MongoDB only
docker-compose up mongo

# Terminal 2: Backend
cd backend
uv run uvicorn backend.main:app --reload

# Terminal 3: Frontend
cd frontend
npm run dev
```

This provides:
- Hot reload for backend
- Hot module replacement (HMR) for frontend
- Faster iteration cycle

### Production Testing

Test the full Docker setup:

```bash
docker-compose up --build
```

## Dockerfile Details

### Backend Dockerfile

Located at `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim
WORKDIR /app

# Install uv and dependencies
RUN pip install uv
COPY pyproject.toml .
RUN uv sync --frozen

# Copy application
COPY backend/ ./backend/

# Run server
CMD ["uv", "run", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "80"]
```

### Frontend Dockerfile

Located at `frontend/Dockerfile`:

**Stage 1 (Builder)**:
- Uses Node.js 20 Alpine
- Installs dependencies (`npm ci`)
- Builds Vite app (`npm run build`)
- Injects environment variables at build time

**Stage 2 (Production)**:
- Uses Nginx Alpine
- Copies built assets from builder
- Serves via Nginx with custom config

### Nginx Configuration

Located at `frontend/nginx.conf`:

- SPA fallback (serves `index.html` for all routes)
- Gzip compression
- Static asset caching (1 year)
- Security headers

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://mongo:27017` | MongoDB connection string |
| `BACKEND_CORS_ORIGINS` | `http://localhost:3000,http://localhost:5173` | Allowed CORS origins |

### Frontend (Build-time)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API URL |
| `VITE_WS_BASE` | `ws://localhost:8000` | WebSocket base URL |
| `VITE_METRICS_SOURCE` | `synth` | Metrics data source (static/synth/ws) |
| `VITE_AZURE_CLIENT_ID` | - | Azure AD Application (Client) ID |
| `VITE_AZURE_TENANT_ID` | - | Azure AD Directory (Tenant) ID |
| `VITE_AZURE_REDIRECT_URI` | `http://localhost:3000` | Redirect URI after login |
| `VITE_AZURE_POST_LOGOUT_REDIRECT_URI` | `http://localhost:3000` | Redirect URI after logout |
| `VITE_AZURE_API_SCOPE` | - | Azure API scope (e.g., `api://xxx/access_as_user`) |
| `VITE_DEV_NO_AUTH` | `true` | Bypass Azure AD auth in dev mode |

**Note**: Frontend env vars are baked into the build at compile time.

**For Azure AD Setup**: See [AZURE_AD_SETUP.md](./AZURE_AD_SETUP.md) for detailed configuration instructions.

## Networking

All services run in a custom bridge network: `fast_azure_network`

**Internal DNS**:
- Backend can reach MongoDB via hostname `mongo`
- Frontend can reach backend via hostname `backend` (during build)
- External access via published ports

## Volumes

### Persistent Volumes

- `mongo_data`: MongoDB data directory (`/data/db`)
  - Survives container restarts
  - Removed with `docker-compose down -v`

### Bind Mounts (Development)

For live code updates, add bind mounts to `docker-compose.yml`:

```yaml
backend:
  volumes:
    - ./backend:/app/backend
    
frontend:
  volumes:
    - ./frontend/src:/app/src
```

**Not recommended for production!**

## Troubleshooting

### Backend can't connect to MongoDB

**Symptom**: `pymongo.errors.ServerSelectionTimeoutError`

**Solutions**:
- Ensure MongoDB is healthy: `docker-compose ps`
- Check logs: `docker-compose logs mongo`
- Verify network: `docker network ls`
- Use correct hostname: `mongo` (not `localhost`)

### Frontend can't reach backend

**Symptom**: CORS errors or network failures

**Solutions**:
- Check `BACKEND_CORS_ORIGINS` includes `http://localhost:3000`
- Verify backend is running: `curl http://localhost:8000/docs`
- Check `VITE_API_BASE_URL` is set correctly
- Rebuild frontend: `docker-compose up -d --build frontend`

### Port already in use

**Symptom**: `Error: port is already allocated`

**Solutions**:
- Stop conflicting service
- Change port in `docker-compose.yml`:
  ```yaml
  ports:
    - "3001:80"  # Use 3001 instead of 3000
  ```

### Build fails with "command not found"

**Symptom**: `sh: uv: not found` or `sh: npm: not found`

**Solutions**:
- Clear Docker build cache: `docker-compose build --no-cache`
- Update Docker and Docker Compose
- Check Dockerfile syntax

### MongoDB data persists after restart

**Expected Behavior**: Volume `mongo_data` persists data

**To reset**:
```bash
docker-compose down -v
docker-compose up -d
```

## Production Deployment

### Build for Production

```bash
docker-compose -f docker-compose.yml build
```

### Environment Variables

Create a `.env.production`:

```env
MONGODB_URI=mongodb://mongo:27017/production
BACKEND_CORS_ORIGINS=https://yourdomain.com
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Run with Production Config

```bash
docker-compose --env-file .env.production up -d
```

### Health Checks

Add health checks to `docker-compose.yml`:

```yaml
backend:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### Resource Limits

Add resource constraints:

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '1.0'
        memory: 1G
      reservations:
        cpus: '0.5'
        memory: 512M
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push Docker Images

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build images
        run: docker-compose build
      - name: Run tests
        run: docker-compose run backend pytest
```

### Docker Hub Push

```bash
# Tag images
docker tag fast_azure_backend:latest yourusername/fast_azure_backend:v1.0.0
docker tag fast_azure_frontend:latest yourusername/fast_azure_frontend:v1.0.0

# Push images
docker push yourusername/fast_azure_backend:v1.0.0
docker push yourusername/fast_azure_frontend:v1.0.0
```

## Performance Optimization

### Multi-stage Build Benefits

- **Smaller images**: Production image only contains runtime dependencies
- **Faster deployments**: Less data to transfer
- **Better security**: No build tools in production

### Build Cache

Speed up rebuilds:

```bash
# Use BuildKit
DOCKER_BUILDKIT=1 docker-compose build

# Cache from registry
docker-compose build --build-arg BUILDKIT_INLINE_CACHE=1
```

### Layer Caching

Dependencies are cached separately from code:
- Changing code → Fast rebuild (only app layer)
- Changing dependencies → Slower rebuild (dependency + app layers)

## Security Best Practices

1. **Don't commit `.env`** - Add to `.gitignore`
2. **Use secrets** - For production passwords
3. **Run as non-root** - Add `USER` directive in Dockerfile
4. **Scan images** - Use `docker scan` or Trivy
5. **Update base images** - Regularly rebuild with latest patches
6. **Limit exposed ports** - Only expose what's needed
7. **Use Docker secrets** - For sensitive data in production

## Cleanup

### Remove unused images

```bash
docker image prune
```

### Remove all stopped containers

```bash
docker container prune
```

### Remove unused volumes

```bash
docker volume prune
```

### Complete cleanup

```bash
docker system prune -a --volumes
```

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify health: `docker-compose ps`
3. Review this guide
4. Check Docker documentation

