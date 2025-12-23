#!/bin/bash

# Aurigraph V11 Enterprise Portal Deployment Script
# Release 2 - AV11-137

echo "================================================"
echo "Aurigraph V11 Enterprise Portal Deployment"
echo "Release 2.0.0 - AV11-137"
echo "================================================"

# Check Node.js version
NODE_VERSION=$(node --version)
echo "Node.js version: $NODE_VERSION"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the portal
echo "Building enterprise portal..."
npm run build

# Create Docker image
echo "Creating Docker image..."
cat > Dockerfile << EOF
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

# Create nginx config
cat > nginx.conf << EOF
server {
    listen 80;
    server_name portal.dlt.aurigraph.io;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass https://dlt.aurigraph.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Build Docker image
docker build -t aurigraph-enterprise-portal:2.0.0 .

# Deploy to production
echo "Deploying to production..."
docker run -d \
  --name enterprise-portal \
  --restart always \
  -p 3000:80 \
  aurigraph-enterprise-portal:2.0.0

echo "================================================"
echo "Deployment Complete!"
echo "Access the portal at: http://localhost:3000"
echo "Production URL: https://portal.dlt.aurigraph.io"
echo "================================================"