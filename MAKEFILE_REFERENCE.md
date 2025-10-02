# Makefile Quick Reference

Fast commands for Docker Compose operations in the Fast Azure project.

## 📋 Table of Contents

- [Development](#development)
- [Production](#production)
- [Logs & Monitoring](#logs--monitoring)
- [Shell Access](#shell-access)
- [Cleanup](#cleanup)
- [Service Management](#service-management)
- [Common Workflows](#common-workflows)

---

## 🚀 Development

### Start Local Development (Recommended)

```bash
make dev
```

**What it does:**
- Starts MongoDB in Docker
- Shows commands to run backend and frontend locally
- Fastest for development (hot-reload enabled)

**Then run in separate terminals:**
```bash
# Terminal 1: Backend
cd backend
uv run uvicorn backend.main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 🏭 Production

### Build and Run All Services

```bash
# Quick start (uses cached layers)
make build
make up

# Production build (no cache, optimized)
make prod
```

### Detailed Commands

```bash
make build           # Build all Docker images
make prod-build      # Build with --no-cache for production
make up              # Start all services in background
make up-logs         # Start all services with logs visible
make prod            # Build and start in production mode
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📊 Logs & Monitoring

### View Logs

```bash
make logs            # All services (live tail)
make logs-backend    # Backend only
make logs-frontend   # Frontend only
make logs-mongo      # MongoDB only
```

**Tip:** Press `Ctrl+C` to stop tailing logs.

### Check Status

```bash
make ps              # List all running containers
make health          # Check if services are responding
```

**Example output:**
```
✓ Backend is healthy
✓ Frontend is healthy
✓ MongoDB is healthy
```

---

## 💻 Shell Access

### Access Container Shells

```bash
make shell-backend   # Open shell in backend container
make shell-frontend  # Open shell in frontend container
make shell-mongo     # Open MongoDB shell (mongosh)
```

### Common Shell Commands

**Backend shell:**
```bash
make shell-backend
# Inside container:
python --version
pip list
ls -la
exit
```

**MongoDB shell:**
```bash
make shell-mongo
# Inside mongosh:
show dbs
use appdb
show collections
db.projects.find().pretty()
exit
```

---

## 🧹 Cleanup

### Stop Services

```bash
make down            # Stop all services (keeps data)
```

### Remove Everything

```bash
make clean           # Stop services (data persists)
make clean-volumes   # Stop services + delete data (WARNING)
make clean-images    # Remove built images
make clean-all       # Nuclear option: removes everything
```

**⚠️ Warning:** `make clean-volumes` and `make clean-all` will **delete all database data**!

---

## 🔄 Service Management

### Restart Services

```bash
make restart              # Restart all services
make restart-backend      # Restart backend only
make restart-frontend     # Restart frontend only
make restart-mongo        # Restart MongoDB only
```

### Rebuild Services

```bash
make rebuild-backend      # Rebuild and restart backend
make rebuild-frontend     # Rebuild and restart frontend
```

**Use when:**
- You changed Dockerfile
- You changed dependencies (requirements.txt, package.json)
- Backend/frontend not picking up changes

---

## 🧪 Testing

```bash
make test            # Run backend tests in container
```

---

## 🎯 Common Workflows

### Workflow 1: Local Development (Daily Work)

```bash
# Start MongoDB only
make dev

# In separate terminals:
cd backend && uv run uvicorn backend.main:app --reload
cd frontend && npm run dev

# When done:
make down
```

**Why?** Fastest iteration, hot-reload enabled, easy debugging.

---

### Workflow 2: Full Stack Testing (Docker)

```bash
# Start everything
make build
make up

# View logs
make logs

# Test in browser:
# http://localhost:3000

# When done:
make down
```

**Why?** Test production-like environment, verify Docker build works.

---

### Workflow 3: Fresh Start (Clean State)

```bash
# Remove everything
make clean-volumes

# Rebuild from scratch
make prod-build
make up

# Check status
make ps
make health
```

**Why?** Debugging issues, testing fresh database, clean slate.

---

### Workflow 4: Backend Changes

```bash
# Option A: Local (fast)
cd backend
uv run uvicorn backend.main:app --reload
# Make changes, auto-reloads

# Option B: Docker (production-like)
make rebuild-backend
make logs-backend
```

**Why?** Test your backend changes.

---

### Workflow 5: Frontend Changes

```bash
# Option A: Local (fast)
cd frontend
npm run dev
# Make changes, auto-reloads

# Option B: Docker (production-like)
make rebuild-frontend
make logs-frontend
```

**Why?** Test your frontend changes.

---

### Workflow 6: Database Inspection

```bash
# Open MongoDB shell
make shell-mongo

# Inside mongosh:
use appdb
show collections
db.projects.find().pretty()
db.boards.countDocuments()

# Or check from backend:
make shell-backend
python -c "from backend.clients.mongo_db import get_db; print(get_db())"
```

**Why?** Inspect data, debug queries, verify seed data.

---

### Workflow 7: Troubleshooting

```bash
# Check what's running
make ps

# View recent logs
make logs-backend    # Check for errors
make logs-frontend   # Check for build errors
make logs-mongo      # Check for connection issues

# Check health
make health

# Access container to debug
make shell-backend
make shell-frontend
```

**Why?** Find and fix issues.

---

## 📝 Command Cheat Sheet

### Development
| Command | Description |
|---------|-------------|
| `make dev` | Start MongoDB, show local dev commands |
| `make build` | Build all Docker images |
| `make up` | Start all services (background) |
| `make up-logs` | Start all services (with logs) |
| `make down` | Stop all services |

### Monitoring
| Command | Description |
|---------|-------------|
| `make logs` | View all logs (live) |
| `make logs-backend` | View backend logs only |
| `make logs-frontend` | View frontend logs only |
| `make logs-mongo` | View MongoDB logs only |
| `make ps` | List running containers |
| `make health` | Check service health |

### Shell Access
| Command | Description |
|---------|-------------|
| `make shell-backend` | Open backend container shell |
| `make shell-frontend` | Open frontend container shell |
| `make shell-mongo` | Open MongoDB shell (mongosh) |

### Service Control
| Command | Description |
|---------|-------------|
| `make restart` | Restart all services |
| `make restart-backend` | Restart backend only |
| `make restart-frontend` | Restart frontend only |
| `make restart-mongo` | Restart MongoDB only |
| `make rebuild-backend` | Rebuild & restart backend |
| `make rebuild-frontend` | Rebuild & restart frontend |

### Cleanup
| Command | Description |
|---------|-------------|
| `make clean` | Stop services (keep data) |
| `make clean-volumes` | Stop services + delete data ⚠️ |
| `make clean-images` | Remove built images |
| `make clean-all` | Remove everything ⚠️ |

### Production
| Command | Description |
|---------|-------------|
| `make prod` | Build & run in production mode |
| `make prod-build` | Build with --no-cache |

### Testing
| Command | Description |
|---------|-------------|
| `make test` | Run backend tests |

---

## 🔍 Quick Tips

### 1. View All Available Commands
```bash
make help
```

### 2. Parallel Terminals
Keep 3-4 terminals open:
- **Terminal 1:** Services (`make logs`)
- **Terminal 2:** Backend (`cd backend && uv run uvicorn...`)
- **Terminal 3:** Frontend (`cd frontend && npm run dev`)
- **Terminal 4:** Commands (`make health`, `git status`, etc.)

### 3. Docker Desktop Alternative
All commands work with Docker Engine or Docker Desktop.

### 4. Port Conflicts
If ports are in use:
```bash
# Check what's using the port
lsof -i :8000
lsof -i :3000
lsof -i :27017

# Stop Docker services
make down

# Or kill specific process
kill -9 <PID>
```

### 5. MongoDB Data Location
Data persists in Docker volume `fast_azure_mongodb_data`.

To view volumes:
```bash
docker volume ls
docker volume inspect fast_azure_mongodb_data
```

### 6. Image Sizes
Check built image sizes:
```bash
docker images | grep fast_azure
```

### 7. Container Resource Usage
```bash
docker stats
```

---

## 🆚 Make Commands vs Docker Compose Commands

| Make Command | Equivalent Docker Compose Command |
|--------------|-----------------------------------|
| `make up` | `docker-compose up -d` |
| `make down` | `docker-compose down` |
| `make logs` | `docker-compose logs -f` |
| `make ps` | `docker-compose ps` |
| `make restart` | `docker-compose restart` |
| `make build` | `docker-compose build` |
| `make shell-backend` | `docker-compose exec backend sh` |

**Why use Make?** Shorter commands, easier to remember, customizable workflows.

---

## 📚 Related Documentation

- **[QUICK_START.md](./QUICK_START.md)** - 5-minute local setup guide
- **[LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)** - Detailed development guide
- **[DOCKER_SETUP.md](./DOCKER_SETUP.md)** - Docker configuration details
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and fixes
- **[infrastructure/Makefile](./infrastructure/Makefile)** - Azure deployment commands

---

## 🎓 Learning Makefile

The project's Makefile is simple and readable. View it:

```bash
cat Makefile
```

**Key concepts:**
- `.PHONY:` - Declares targets that aren't files
- `@echo` - Prints to console
- `docker-compose` - All commands wrap docker-compose
- `||` - "Or" operator (continues if command fails)

**Customize it:**
Add your own shortcuts by editing the Makefile!

---

## 🤔 Which Should I Use?

### Use `make dev` when:
- ✅ Daily development work
- ✅ Need hot-reload
- ✅ Debugging in IDE
- ✅ Running tests locally

### Use `make up` (Docker) when:
- ✅ Testing production build
- ✅ Verifying Dockerfiles
- ✅ Sharing environment with team
- ✅ CI/CD testing
- ✅ Deploying to server

---

## 💡 Pro Tips

1. **Create aliases** in your `~/.zshrc` or `~/.bashrc`:
   ```bash
   alias mdev="make dev"
   alias mup="make up"
   alias mdown="make down"
   alias mlogs="make logs"
   ```

2. **Use tab completion** in your shell:
   ```bash
   make <TAB><TAB>  # Shows all available targets
   ```

3. **Chain commands** with `&&`:
   ```bash
   make clean && make build && make up
   ```

4. **Background logs** with `&`:
   ```bash
   make logs &
   # Now you can run other commands in the same terminal
   ```

5. **Save logs to file**:
   ```bash
   make logs > logs.txt 2>&1
   ```

---

**Need Help?** Run `make help` or see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

