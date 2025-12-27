# Phase 1: Setup Guide & Environment Configuration

**Phase**: 1 (Days 1-5)
**Status**: Ready to Execute
**Created**: December 26, 2025

---

## 🚀 Quick Start Commands

### 1. DNS Configuration

```bash
# Update your DNS provider (GoDaddy, Route53, CloudFlare, etc.)

# Add A Records:
aurigraph.io           A  <PORTAL_SERVER_IP>
dlt.aurigraph.io       A  <PLATFORM_SERVER_IP>

# Example (AWS Route53):
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123ABC456DEF \
  --change-batch file://dns-changes.json

# Verify DNS propagation
nslookup aurigraph.io
nslookup dlt.aurigraph.io

# Wait for DNS to propagate (5-30 minutes)
```

### 2. Local Development Setup

```bash
# Navigate to portal
cd enterprise-portal/enterprise-portal/frontend

# Install dependencies
npm install

# Install additional CRM dependencies (if not present)
npm install antd recharts axios react-query redux @reduxjs/toolkit

# Start development server
npm run dev
# Portal available at http://localhost:3000

# In another terminal, test API connectivity
curl http://localhost:9003/api/v11/health
```

### 3. Environment Configuration

Create `.env.development`:
```properties
VITE_API_BASE_URL=http://localhost:9003
VITE_GRAPHQL_ENDPOINT=http://localhost:9003/graphql
VITE_WS_ENDPOINT=ws://localhost:9003/ws
VITE_PORTAL_URL=http://localhost:3000
VITE_ENV=development
VITE_LOG_LEVEL=debug
```

Create `.env.staging`:
```properties
VITE_API_BASE_URL=https://staging-dlt.aurigraph.io/api/v11
VITE_GRAPHQL_ENDPOINT=https://staging-dlt.aurigraph.io/graphql
VITE_WS_ENDPOINT=wss://staging-dlt.aurigraph.io/ws
VITE_PORTAL_URL=https://staging.aurigraph.io
VITE_ENV=staging
VITE_LOG_LEVEL=info
```

Create `.env.production`:
```properties
VITE_API_BASE_URL=https://dlt.aurigraph.io/api/v11
VITE_GRAPHQL_ENDPOINT=https://dlt.aurigraph.io/graphql
VITE_WS_ENDPOINT=wss://dlt.aurigraph.io/ws
VITE_PORTAL_URL=https://aurigraph.io
VITE_ENV=production
VITE_LOG_LEVEL=warn
```

### 4. Create API Configuration File

Create `src/config/api.ts`:
```typescript
/**
 * API Configuration for domain separation
 * V11 Platform APIs at dlt.aurigraph.io
 * Portal at aurigraph.io
 */

export const API_CONFIG = {
  // V11 Platform API endpoints
  baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:9003',
  graphqlEndpoint: process.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:9003/graphql',
  wsEndpoint: process.env.VITE_WS_ENDPOINT || 'ws://localhost:9003/ws',

  // Portal URLs
  portalURL: process.env.VITE_PORTAL_URL || 'http://localhost:3000',

  // API Configuration
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,

  // CRM Endpoints (all under dlt.aurigraph.io/api/v11/crm/)
  crm: {
    leads: '/api/v11/crm/leads',
    demos: '/api/v11/crm/demos',
    opportunities: '/api/v11/crm/opportunities',
    communications: '/api/v11/crm/communications',
    interactions: '/api/v11/crm/interactions',
  },

  // Headers
  headers: {
    'Content-Type': 'application/json',
    'X-Portal-Version': '5.0',
  },
};

/**
 * Security Headers Configuration
 */
export const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};
```

### 5. Update Vite Configuration

Update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { API_CONFIG } from './src/config/api';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
    strictPort: false,
    proxy: {
      '/api/v11': {
        target: 'http://localhost:9003',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/graphql': {
        target: 'http://localhost:9003',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:9003',
        ws: true,
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['antd', '@ant-design/icons'],
          'charts': ['recharts'],
          'state': ['redux', '@reduxjs/toolkit', 'react-query'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },

  define: {
    __API_CONFIG__: JSON.stringify(API_CONFIG),
  },
});
```

### 6. Nginx Configuration

Create `nginx.conf`:
```nginx
# Upstream servers
upstream portal_backend {
    server localhost:3000;
}

upstream v11_platform {
    server localhost:9003;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name aurigraph.io *.aurigraph.io dlt.aurigraph.io;
    return 301 https://$server_name$request_uri;
}

# Enterprise Portal (aurigraph.io)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name aurigraph.io www.aurigraph.io;

    # SSL Configuration
    ssl_certificate /opt/aurigraph/certs/server-cert.pem;
    ssl_certificate_key /opt/aurigraph/certs/server-key.pem;
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256';
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Portal Frontend
    location / {
        proxy_pass http://portal_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# V11 Platform (dlt.aurigraph.io)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dlt.aurigraph.io;

    # SSL Configuration (same certs)
    ssl_certificate /opt/aurigraph/certs/server-cert.pem;
    ssl_certificate_key /opt/aurigraph/certs/server-key.pem;
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256';
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    # V11 Platform API
    location /api/v11/ {
        proxy_pass http://v11_platform/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for long-running operations
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # GraphQL endpoint
    location /graphql {
        proxy_pass http://v11_platform/graphql;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket upgrade
    location /ws {
        proxy_pass http://v11_platform/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Health check
    location /health {
        proxy_pass http://v11_platform/q/health;
        access_log off;
    }
}
```

### 7. Generate SSL Certificates

```bash
# Create certificate directory
mkdir -p /opt/aurigraph/certs
cd /opt/aurigraph/certs

# Generate private key
openssl genrsa -out server-key.pem 2048

# Create certificate signing request
openssl req -new -key server-key.pem \
  -out server.csr \
  -subj "/C=US/ST=California/L=San Francisco/O=Aurigraph/CN=aurigraph.io"

# Self-sign certificate (valid 365 days)
openssl x509 -req -in server.csr \
  -signkey server-key.pem \
  -out server-cert.pem \
  -days 365 \
  -extfile <(printf "subjectAltName=DNS:aurigraph.io,DNS:*.aurigraph.io,DNS:dlt.aurigraph.io")

# Set permissions
chmod 600 server-key.pem
chmod 644 server-cert.pem

# Verify certificate
openssl x509 -in server-cert.pem -text -noout | grep -A2 "Subject Alt Name"

# Test HTTPS
curl -k https://localhost:443/health
```

### 8. Docker Setup (Optional but Recommended)

Create `Dockerfile`:
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/certs /opt/aurigraph/certs

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
# Build image
docker build -t aurigraph-portal:v5.0 .

# Run container
docker run -d \
  -p 80:80 \
  -p 443:443 \
  -v /opt/aurigraph/certs:/opt/aurigraph/certs:ro \
  --name aurigraph-portal \
  aurigraph-portal:v5.0

# Verify running
docker ps | grep aurigraph-portal
docker logs aurigraph-portal

# Test endpoints
curl http://localhost
curl https://localhost (will have cert warning - expected)
```

### 9. Verification Checklist

```bash
# ✅ DNS Propagation
nslookup aurigraph.io
# Should show your portal server IP

# ✅ HTTPS/TLS Working
curl -I https://aurigraph.io
# Should return 200 with SSL info

# ✅ API Connectivity
curl https://dlt.aurigraph.io/api/v11/health
# Should return health check JSON

# ✅ Portal Frontend
curl https://aurigraph.io
# Should return HTML (React app)

# ✅ Environment Variables
cat .env.production
# Verify all URLs are correct

# ✅ Nginx Configuration
nginx -t
# Should show "test is successful"

# ✅ SSL Certificate Valid
openssl x509 -in server-cert.pem -noout -dates
# Check expiration date

# ✅ Security Headers Present
curl -I https://aurigraph.io | grep -i "strict-transport"
# Should show HSTS header
```

---

## 📋 Phase 1 Completion Checklist

- [ ] DNS configured for aurigraph.io and dlt.aurigraph.io
- [ ] Local development environment running (npm run dev)
- [ ] Environment files (.env.development, .env.staging, .env.production) created
- [ ] API configuration file (src/config/api.ts) created
- [ ] Vite configuration updated with proper proxy settings
- [ ] Nginx configuration deployed with security headers
- [ ] SSL/TLS certificates generated
- [ ] Docker container built and tested (if using Docker)
- [ ] All verification checks passing
- [ ] Portal accessible at https://aurigraph.io
- [ ] V11 Platform accessible at https://dlt.aurigraph.io/api/v11/health
- [ ] Team can access development portal locally

---

## 🎯 Success Criteria for Phase 1

✅ Portal running at aurigraph.io with TLS
✅ Platform running at dlt.aurigraph.io with TLS
✅ CORS properly configured between domains
✅ Security headers in place
✅ Local development environment working
✅ Team can start Phase 2 development

---

**Phase 1 Status**: ✅ Ready to Execute
**Next**: Phase 2 - CRM Backend Development
