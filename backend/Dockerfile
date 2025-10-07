# Backend Dockerfile
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy pyproject.toml and install dependencies from backend/
COPY backend/pyproject.toml .
COPY backend/uv.lock* ./

# Install uv
RUN pip install uv

# Install dependencies
RUN uv sync --frozen --no-cache

# Copy application code (context is root, copy backend/ to backend/ subdirectory for module structure)
COPY backend/ ./backend/

# Expose port
EXPOSE 80

# Run the application
CMD ["uv", "run", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "80"]

