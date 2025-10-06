# Frontend Dockerfile - Multi-stage build
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for environment variables
# API Configuration
ARG VITE_API_BASE_URL=http://localhost:8000
ARG VITE_AZURE_API_SCOPE
ARG VITE_METRICS_SOURCE=synth
ARG VITE_WS_BASE=ws://localhost:8000
ARG VITE_METRICS_SOURCE=synth

# Azure AD Configuration
ARG VITE_AZURE_CLIENT_ID
ARG VITE_AZURE_TENANT_ID
ARG VITE_AZURE_REDIRECT_URI=http://localhost:3000
ARG VITE_AZURE_POST_LOGOUT_REDIRECT_URI=http://localhost:3000
ARG VITE_AZURE_API_SCOPE

# Development Mode
ARG VITE_DEV_NO_AUTH=true

# Set environment variables for build (Vite reads these at build time)
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_BASE=$VITE_WS_BASE
ENV VITE_METRICS_SOURCE=$VITE_METRICS_SOURCE
ENV VITE_AZURE_CLIENT_ID=$VITE_AZURE_CLIENT_ID
ENV VITE_AZURE_TENANT_ID=$VITE_AZURE_TENANT_ID
ENV VITE_AZURE_REDIRECT_URI=$VITE_AZURE_REDIRECT_URI
ENV VITE_AZURE_POST_LOGOUT_REDIRECT_URI=$VITE_AZURE_POST_LOGOUT_REDIRECT_URI
ENV VITE_AZURE_API_SCOPE=$VITE_AZURE_API_SCOPE
ENV VITE_DEV_NO_AUTH=$VITE_DEV_NO_AUTH

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (optional)
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

