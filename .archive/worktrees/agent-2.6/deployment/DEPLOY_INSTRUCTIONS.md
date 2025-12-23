# Aurex V3 Deployment Instructions for dev4.aurigraph.io

## Manual Deployment Steps

1. **Copy the deployment package to server:**
   ```bash
   scp aurex-v3-deployment.tar.gz subbu@dev4.aurigraph.io:/tmp/
   ```

2. **SSH into the server:**
   ```bash
   ssh subbu@dev4.aurigraph.io
   ```

3. **Extract and setup:**
   ```bash
   # Create directory
   sudo mkdir -p /opt/aurex-v3
   sudo chown $USER:$USER /opt/aurex-v3

   # Extract files
   cd /opt/aurex-v3
   tar -xzf /tmp/aurex-v3-deployment.tar.gz

   # Start services
   docker-compose up -d
   ```

4. **Verify deployment:**
   ```bash
   # Check running containers
   docker ps

   # Test endpoints
   curl http://localhost:8300  # Portal
   curl http://localhost:8301/api/gnn/health  # GNN API
   curl http://localhost:8302/api/health  # Portal Backend
   ```

## Access Points

- **Portal**: http://dev4.aurigraph.io:8300
- **GNN API**: http://dev4.aurigraph.io:8301
- **Backend API**: http://dev4.aurigraph.io:8302

## Service Management

- **View logs**: `docker-compose logs -f`
- **Stop services**: `docker-compose down`
- **Restart services**: `docker-compose restart`
- **Update and restart**: `docker-compose pull && docker-compose up -d`
