# 🚀 Quick Start - Fast Azure

Get up and running in **5 minutes** for local development.

## Prerequisites Check

```bash
# Check if you have the required tools
python --version    # Need 3.11+
node --version      # Need 20+
docker --version    # Any recent version
```

## Step 1: Clone & Configure (30 seconds)

```bash
# Clone (if you haven't already)
git clone <your-repo>
cd fast_azure

# Verify .env exists (should already be there)
cat .env | head -5
```

Your `.env` should have:
```env
VITE_DEV_NO_AUTH=true  # ← This bypasses Azure AD
MONGODB_URI=mongodb://localhost:27017
VITE_API_BASE_URL=http://localhost:8000
```

✅ **If these are set, you're ready to go!**

## Step 2: Start MongoDB (1 minute)

```bash
# Start MongoDB in Docker
docker-compose up mongo

# Leave this terminal running
# You should see: "Waiting for connections"
```

## Step 3: Start Backend (1 minute)

Open a **new terminal**:

```bash
cd fast_azure/backend

# Install dependencies (first time only, ~30 seconds)
uv sync

# Start server
uv run uvicorn backend.main:app --reload

# You should see: "Application startup complete"
# Backend is ready at: http://localhost:8000
```

## Step 4: Start Frontend (2 minutes)

Open a **third terminal**:

```bash
cd fast_azure/frontend

# Install dependencies (first time only, ~90 seconds)
npm install

# Start dev server
npm run dev

# You should see: "Local: http://localhost:5173"
```

## Step 5: Open App (10 seconds)

Open your browser to: **http://localhost:5173**

You should see:
- ✅ No login screen (auto-logged in as "Dev User")
- ✅ Project Ticker scrolling at top
- ✅ Projects Panel and Board Panel
- ✅ Navigation bar with Home, Projects, Board, Dashboard

## Verify Everything Works

Click through the app:

1. **Home** (/) - See panels with projects and boards
2. **Projects** (/projects) - See list of sample projects
3. **Board** (/board) - See list of boards
4. **Click a board** - See Kanban board with columns and cards
5. **Dashboard** (/kpi) - See metrics charts

**Try creating:**
- New project (Projects page → "Add Project")
- New board (Board page → "Add Board")
- New card (Board detail → "Add Card")

**Try drag & drop:**
- Drag a card between columns on the board

## Troubleshooting

### "AADSTS900144: client_id required"

**Fix:** Ensure `.env` has `VITE_DEV_NO_AUTH=true`

```bash
# Check current value
grep VITE_DEV_NO_AUTH .env

# Update if needed
sed -i 's/VITE_DEV_NO_AUTH=false/VITE_DEV_NO_AUTH=true/' .env

# Restart frontend (Ctrl+C, then npm run dev)
```

### "Failed to connect to MongoDB"

**Fix:** Ensure MongoDB is running

```bash
# Check if running
docker-compose ps

# If not running
docker-compose up mongo
```

### "Port already in use"

**Fix:** Stop other services

```bash
# Stop Docker
docker-compose down

# Find process
lsof -i :8000  # Backend
lsof -i :5173  # Frontend

# Kill if needed
kill -9 <PID>
```

### Still having issues?

Run the diagnostic:

```bash
./test-local-setup.sh
```

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more help.

## What's Next?

Now that you're running locally:

- **Learn the codebase:** [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)
- **Understand metrics:** [METRICS_MODEL.md](./METRICS_MODEL.md)
- **Set up real auth:** [AZURE_AD_SETUP.md](./AZURE_AD_SETUP.md)
- **Deploy with Docker:** [DOCKER_SETUP.md](./DOCKER_SETUP.md)

## Development Tips

### Hot Reload is Enabled

- **Backend:** Edit Python files → auto-reloads
- **Frontend:** Edit React/TS files → instant updates

### API Documentation

Test backend endpoints at: **http://localhost:8000/docs**

### Browser DevTools

Press **F12** to:
- See console logs
- Debug network requests
- Inspect React components

### MongoDB Shell

Access database:

```bash
docker-compose exec mongo mongosh
> use appdb
> show collections
> db.projects.find().pretty()
```

---

**🎉 You're all set! Happy coding!**

For questions, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or ask in your team chat.
