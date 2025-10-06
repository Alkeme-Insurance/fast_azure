# Backend Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy pyproject.toml and install dependencies
COPY pyproject.toml .
COPY uv.lock* ./

# Install uv
RUN pip install uv

# Install dependencies
RUN uv sync --frozen --no-cache

# Copy application code (context is backend/, copy to backend/ subdirectory for module structure)
COPY . ./backend/

# Expose port
EXPOSE 80

# Run the application
CMD ["uv", "run", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "80"]

