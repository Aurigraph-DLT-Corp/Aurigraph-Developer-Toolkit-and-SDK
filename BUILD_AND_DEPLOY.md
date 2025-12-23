# Aurigraph DLT - Complete Platform Build and Deploy Guide

## Overview
This guide covers building and deploying the complete Aurigraph DLT platform to the remote server at `dlt.aurigraph.io`.

## Components to Deploy
1. **V11 Backend** - Blockchain node backend (port 9004)
2. **Enterprise Portal** - Frontend application (ports 80/443 via NGINX)
3. **PostgreSQL** - Database (port 5432)
4. **Redis** - Cache (port 6379)
5. **Traefik** - Reverse proxy (ports 80/443)

## Step-by-Step Deployment

### Phase 1: Local Build

#### Build Backend (Native)
```bash
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean package -Pnative -DskipTests -B
```

#### Build Frontend
```bash
cd enterprise-portal/enterprise-portal/frontend
npm install
npm run build
```

### Phase 2: Remote Deployment

#### Deploy via Docker Compose
```bash
# From project root
./DEPLOYMENT-SCRIPT-E2E.sh option-b subbu dlt.aurigraph.io 22
```

OR manual deployment:

#### Upload Docker Compose
```bash
scp docker-compose.yml subbu@dlt.aurigraph.io:~/
scp .env.example subbu@dlt.aurigraph.io:~/.env
```

#### SSH and Deploy
```bash
ssh subbu@dlt.aurigraph.io

# On remote server
docker-compose down
docker-compose pull
docker-compose up -d

# Verify
docker-compose ps
docker logs aurigraph-v11-service
```

### Phase 3: Verification

#### Health Checks
```bash
curl https://dlt.aurigraph.io/api/v11/health
curl https://dlt.aurigraph.io/api/v11/stats
```

#### Portal Access
- https://dlt.aurigraph.io (Portal)
- https://dlt.aurigraph.io/api/v11 (API)

### Troubleshooting

#### Check logs
```bash
ssh subbu@dlt.aurigraph.io "docker logs aurigraph-v11-service --tail 100"
ssh subbu@dlt.aurigraph.io "docker logs traefik --tail 100"
```

#### Restart services
```bash
ssh subbu@dlt.aurigraph.io "docker-compose restart"
```
