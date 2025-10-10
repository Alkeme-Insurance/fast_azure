# Fast Azure

A modern full-stack application built with FastAPI (backend) and React + TypeScript (frontend), featuring project management, Kanban boards, and KPI dashboards.

## 🚀 Features

- **Project Management**: Track projects with status, owners, stakeholders, OKRs, and milestones
- **Kanban Boards**: Drag-and-drop task management with rich card features
- **KPI Dashboard**: Visualize project metrics with interactive charts and sparklines
- **Real-time Ticker**: Stock-ticker style metrics bar with live updates
- **Task Management**: Aggregate view of all tasks sorted by due date
- **Azure AD Authentication**: Secure authentication with Microsoft identity platform

## 🛠️ Tech Stack

- **Backend**: FastAPI, Python 3.11, Motor (async MongoDB driver)
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, dnd-kit
- **Database**: MongoDB 7
- **Authentication**: Azure AD (MSAL.js)
- **Deployment**: Docker + Docker Compose

## ⚙️ Configuration Management

All Azure and deployment configuration is managed through environment variables:

```bash
# Copy the example file
cp .env.example .env

# Edit with your values
nano .env

# Sync configuration to GitHub secrets
./scripts/sync-github-secrets.sh
```

See [`.env.example`](.env.example) for all available configuration options.

## 📋 Quick Start

### Option 1: Using the Setup Script (Recommended)

```bash
# Run the interactive setup
./setup-env.sh

# Build and start all services
docker-compose up --build
```

### Option 2: Manual Setup

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env with your configuration (optional for dev mode)
nano .env

# 3. Start with Docker
docker-compose up --build

# OR using Makefile
make build
make up
```

### Option 3: Local Development (Fastest, without Docker)

For rapid development with hot-reload:

```bash
# Terminal 1: Start MongoDB
docker-compose up mongo

# Terminal 2: Backend
cd backend
uv sync
uv run uvicorn backend.main:app --reload

# Terminal 3: Frontend
cd frontend
npm install
npm run dev

# Open http://localhost:5173
```

**📖 For detailed local development guide**, see [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)

## 🌐 Access URLs

### Docker (Production-like)
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **MongoDB**: localhost:27017

### Local Development
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **MongoDB**: localhost:27017

## 🔐 Azure AD Authentication

The application supports two authentication modes:

### Development Mode (Default)

Auto-login with a mock user (no Azure AD required):

```env
VITE_DEV_NO_AUTH=true
```

### Production Mode (Azure AD)

Configure Azure AD credentials in `.env`:

```env
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_AZURE_API_SCOPE=api://your-app-id/access_as_user
VITE_DEV_NO_AUTH=false
```

**📖 For detailed Azure AD setup instructions**, see [AZURE_AD_SETUP.md](./AZURE_AD_SETUP.md)

## 📚 Documentation

### Getting Started
- **[QUICK_START.md](./QUICK_START.md)** - ⚡ **5-minute setup** for local development
- **[LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)** - 🔥 Detailed local development workflow
- **[MAKEFILE_REFERENCE.md](./MAKEFILE_REFERENCE.md)** - Quick reference for Makefile commands
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions

### Configuration & Deployment
- **[DOCKER_SETUP.md](./DOCKER_SETUP.md)** - Complete Docker configuration guide
- **[AZURE_AD_SETUP.md](./AZURE_AD_SETUP.md)** - Azure AD authentication setup
- **[infrastructure/AZURE_DEPLOYMENT.md](./infrastructure/AZURE_DEPLOYMENT.md)** - Deploy to Azure (ACR + AKS + Cosmos DB + Key Vault)
- **[infrastructure/KEY_VAULT_GUIDE.md](./infrastructure/KEY_VAULT_GUIDE.md)** - Azure Key Vault secret management
- **[infrastructure/GITHUB_OIDC_GUIDE.md](./infrastructure/GITHUB_OIDC_GUIDE.md)** - GitHub Actions with Azure OIDC (passwordless CI/CD)
- **[infrastructure/QUICK_REFERENCE.md](./infrastructure/QUICK_REFERENCE.md)** - Quick Azure deployment commands

### Features & Metrics
- **[METRICS_MODEL.md](./METRICS_MODEL.md)** - Metrics formulas and calculations (Revenue, Cost, Profit, etc.)
- **[TICKER_README.md](./TICKER_README.md)** - Stock ticker feature documentation
- **[KPI_DASHBOARD_README.md](./KPI_DASHBOARD_README.md)** - KPI Dashboard guide

## 🎯 Project Structure

```
fast_azure/
├── backend/                  # FastAPI backend
│   ├── clients/             # MongoDB client
│   ├── models/              # Pydantic models
│   ├── routers/             # API routes
│   ├── services/            # Business logic
│   ├── utils/               # Utilities (seed, indexes)
│   └── main.py              # Application entry point
├── frontend/                # React frontend
│   ├── src/
│   │   ├── api/            # API clients
│   │   ├── auth/           # Authentication (MSAL)
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Main app component
│   ├── Dockerfile          # Frontend Docker build
│   └── nginx.conf          # Nginx configuration
├── docker-compose.yml       # Multi-service orchestration
├── .env.example            # Environment variables template
├── setup-env.sh            # Interactive setup script
└── Makefile                # Convenient Docker commands
```

## 🐳 Docker Commands

Using the Makefile:

```bash
make help          # Show all commands
make build         # Build all images
make up            # Start all services
make down          # Stop all services
make logs          # View logs
make ps            # List containers
make clean         # Clean up containers
make health        # Health check
```

Using docker-compose directly:

```bash
docker-compose build              # Build images
docker-compose up -d              # Start in background
docker-compose logs -f            # Follow logs
docker-compose ps                 # Status
docker-compose down               # Stop all
docker-compose down -v            # Stop and remove volumes
```

## 🔧 Development Workflow

### Local Development (Recommended)

Run only MongoDB in Docker, develop backend and frontend locally for faster iteration:

```bash
make dev
# OR
docker-compose up mongo

# Then in separate terminals:
cd backend && uv run uvicorn backend.main:app --reload
cd frontend && npm run dev
```

### Full Docker Development

Test the complete Docker setup:

```bash
make build
make up
make logs
```

## 🧪 Testing

```bash
# Backend tests (when implemented)
docker-compose run --rm backend pytest

# Frontend tests
cd frontend
npm test
```

## 🚢 Production Deployment

1. **Update Azure AD App Registration** with production URLs
2. **Create `.env.production`** with production values:
   ```env
   VITE_AZURE_CLIENT_ID=your-prod-client-id
   VITE_AZURE_TENANT_ID=your-tenant-id
   VITE_AZURE_REDIRECT_URI=https://yourdomain.com
   VITE_API_BASE_URL=https://api.yourdomain.com
   VITE_DEV_NO_AUTH=false
   MONGODB_URI=mongodb://user:pass@mongo:27017/appdb?authSource=admin
   ```

3. **Build with production config**:
   ```bash
   docker-compose --env-file .env.production build
   docker-compose --env-file .env.production up -d
   ```

## 🔒 Security

- `.env` files are in `.gitignore` - **never commit secrets!**
- MongoDB runs without authentication in dev mode
- For production, enable MongoDB authentication
- Use HTTPS in production (required for Azure AD)
- Implement proper CORS configuration
- Use Azure Key Vault for production secrets

## 🐛 Troubleshooting

### MongoDB Connection Issues

```bash
# Check MongoDB is healthy
docker-compose ps

# View MongoDB logs
docker-compose logs mongo

# Restart MongoDB
docker-compose restart mongo
```

### Frontend Build Errors

```bash
# Clear cache and rebuild
docker-compose down
docker system prune -f
docker-compose build --no-cache frontend
```

### Azure AD Authentication Issues

See [AZURE_AD_SETUP.md](./AZURE_AD_SETUP.md) for detailed troubleshooting.

### Backend Not Starting

```bash
# Check backend logs
docker-compose logs backend

# Rebuild backend
docker-compose up -d --build backend
```

## 📊 Features Overview

### Project Management
- Create, update, and delete projects
- Track status (idea, discovery, in-progress, blocked, done)
- Assign owners and stakeholders
- Set OKRs, milestones, and timelines
- Track risks, blockers, and next actions

### Kanban Boards
- Multiple boards per project
- Drag-and-drop cards between columns
- Rich card features:
  - Title, description, assignees
  - Labels with colors
  - Due dates with color-coding
  - Checklists with progress
  - Attachments and comments count

### KPI Dashboard
- Visualize project metrics over time
- Multiple metric types (Index, Profit, Time Saved, Signals)
- Multi-series line charts (pure SVG)
- Timeframe filtering (7, 14, 30 days)
- Per-project sparklines and stats

### Stock Ticker
- Auto-scrolling metrics bar
- Pause on hover
- Real-time updates (synthetic data)
- Configurable data sources (static/synthetic/WebSocket)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with FastAPI, React, and MongoDB
- Authentication via Azure AD (Microsoft Identity Platform)
- UI inspiration from KendoReact Project Tracker
- Drag-and-drop powered by dnd-kit

## 📞 Support

For issues or questions:
- Check the documentation in this repository
- Review the troubleshooting sections
- Check backend logs: `docker-compose logs backend`
- Check frontend logs: `docker-compose logs frontend`

---

**Made with ❤️ using FastAPI, React, and Docker**


