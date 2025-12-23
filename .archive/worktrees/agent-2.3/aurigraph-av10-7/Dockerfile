# Aurigraph V10 - Default Configuration (Classical CPU/GPU Version)
# This is the default Docker configuration using the Classical version
# which doesn't require quantum hardware and runs on standard servers

FROM nvidia/cuda:12.3.0-runtime-ubuntu22.04 AS builder

# Install Node.js 20
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    python3 \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .
COPY tsconfig.classical.json .

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ src/

# Build classical version
RUN npm run build:classical

# Production stage
FROM nvidia/cuda:12.3.0-runtime-ubuntu22.04

# Install Node.js 20 and CUDA libraries
RUN apt-get update && apt-get install -y \
    curl \
    libcudnn8 \
    libcublas-12-3 \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json .
COPY package-lock.json .

# Install production dependencies only
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist-classical ./dist-classical

# Environment variables
ENV NODE_ENV=production
ENV CUDA_VISIBLE_DEVICES=all
ENV TF_FORCE_GPU_ALLOW_GROWTH=true
ENV PORT=3100

# Labels
LABEL version="10.35.0-classical"
LABEL description="Aurigraph V10 - Classical CPU/GPU Version (Default)"
LABEL maintainer="Aurigraph DLT Corp"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3100/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

EXPOSE 3100

# Default command runs classical version
CMD ["node", "dist-classical/index-classical.js"]