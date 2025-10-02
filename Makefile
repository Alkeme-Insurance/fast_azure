.PHONY: help build up down restart logs clean test dev prod

# Default target
help:
	@echo "Fast Azure - Docker Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Run services locally (recommended for development)"
	@echo "  make build        - Build all Docker images"
	@echo "  make up           - Start all services"
	@echo "  make down         - Stop all services"
	@echo "  make restart      - Restart all services"
	@echo ""
	@echo "Logs & Monitoring:"
	@echo "  make logs         - View logs from all services"
	@echo "  make logs-backend - View backend logs"
	@echo "  make logs-frontend- View frontend logs"
	@echo "  make logs-mongo   - View MongoDB logs"
	@echo "  make ps           - List running containers"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean        - Remove containers, networks, and volumes"
	@echo "  make clean-images - Remove built images"
	@echo "  make clean-all    - Remove everything (including volumes)"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Build and run in production mode"
	@echo "  make prod-build   - Build production images"
	@echo ""
	@echo "Utilities:"
	@echo "  make shell-backend - Open backend shell"
	@echo "  make shell-frontend- Open frontend shell"
	@echo "  make shell-mongo  - Open MongoDB shell"
	@echo "  make test         - Run tests"
	@echo ""
	@echo "📖 For detailed command reference, see MAKEFILE_REFERENCE.md"
	@echo "📖 For Azure deployment commands, see infrastructure/Makefile"

# Development - run services locally
dev:
	@echo "Starting MongoDB with Docker..."
	docker-compose up -d mongo
	@echo ""
	@echo "MongoDB is running. Now start backend and frontend locally:"
	@echo "  Terminal 1: cd backend && uv run uvicorn backend.main:app --reload"
	@echo "  Terminal 2: cd frontend && npm run dev"

# Build all images
build:
	docker-compose build

# Start all services
up:
	docker-compose up -d

# Start with logs
up-logs:
	docker-compose up

# Stop all services
down:
	docker-compose down

# Restart all services
restart:
	docker-compose restart

# Restart specific service
restart-backend:
	docker-compose restart backend

restart-frontend:
	docker-compose restart frontend

restart-mongo:
	docker-compose restart mongo

# View logs
logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-mongo:
	docker-compose logs -f mongo

# List running containers
ps:
	docker-compose ps

# Clean up
clean:
	docker-compose down

clean-volumes:
	docker-compose down -v

clean-images:
	docker rmi fast_azure_backend fast_azure_frontend || true

clean-all: clean-volumes clean-images
	docker system prune -f

# Production
prod: prod-build
	docker-compose up -d

prod-build:
	docker-compose build --no-cache

# Shell access
shell-backend:
	docker-compose exec backend sh

shell-frontend:
	docker-compose exec frontend sh

shell-mongo:
	docker-compose exec mongo mongosh

# Tests
test:
	docker-compose run --rm backend pytest

# Rebuild specific service
rebuild-backend:
	docker-compose up -d --build backend

rebuild-frontend:
	docker-compose up -d --build frontend

# Health check
health:
	@echo "Checking service health..."
	@curl -f http://localhost:8000/docs > /dev/null 2>&1 && echo "✓ Backend is healthy" || echo "✗ Backend is down"
	@curl -f http://localhost:3000 > /dev/null 2>&1 && echo "✓ Frontend is healthy" || echo "✗ Frontend is down"
	@docker-compose exec mongo mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1 && echo "✓ MongoDB is healthy" || echo "✗ MongoDB is down"

