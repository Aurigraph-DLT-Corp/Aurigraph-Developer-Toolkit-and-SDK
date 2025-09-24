# Aurex Main - Development Dockerfile (Multi-stage for Frontend + Backend)
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Install frontend dependencies
COPY package*.json ./
RUN npm ci

# Copy frontend source
COPY . .

# Expose frontend port for development with hot reload
EXPOSE 3001

# Python backend stage
FROM python:3.11-slim AS backend

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ .

# Expose backend port
EXPOSE 8001

# Development stage - runs both frontend and backend
FROM node:18-alpine AS development

WORKDIR /app

# Install Python in Node Alpine
RUN apk add --no-cache python3 py3-pip gcc musl-dev python3-dev

# Copy frontend files
COPY --from=frontend-builder /app/frontend /app/frontend

# Copy backend files and install dependencies
COPY backend/ ./backend/
RUN pip3 install --break-system-packages -r backend/requirements.txt

# Install supervisor to run both services
RUN apk add --no-cache supervisor

# Create supervisor config
RUN mkdir -p /etc/supervisor/conf.d
COPY supervisord.conf /etc/supervisor/conf.d/

EXPOSE 3001 8001

CMD ["supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]