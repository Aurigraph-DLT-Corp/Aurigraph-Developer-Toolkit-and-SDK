#!/bin/bash

# Deployment script for Composite Token System on Remote Server
# Server: dlt.aurigraph.io

echo "🚀 Aurigraph V11 - Composite Token Remote Deployment"
echo "===================================================="
echo ""

# Configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PORT="2235"
REMOTE_DIR="/home/subbu/aurigraph-v11"
LOCAL_PROJECT_DIR="aurigraph-av10-7/aurigraph-v11-standalone"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}📍 Target Server: ${REMOTE_HOST}${NC}"
echo -e "${GREEN}👤 User: ${REMOTE_USER}${NC}"
echo -e "${GREEN}📂 Deployment Directory: ${REMOTE_DIR}${NC}"
echo ""

# Function to execute remote commands
remote_exec() {
    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "$1"
}

# Function to copy files to remote
remote_copy() {
    scp -P ${REMOTE_PORT} -r "$1" ${REMOTE_USER}@${REMOTE_HOST}:"$2"
}

# Step 1: Check remote server connectivity
echo -e "${YELLOW}🔗 Step 1: Checking server connectivity...${NC}"
if ssh -p ${REMOTE_PORT} -o ConnectTimeout=5 ${REMOTE_USER}@${REMOTE_HOST} "echo 'Connected successfully'" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to server. Please check SSH configuration.${NC}"
    exit 1
fi

# Step 2: Check remote server environment
echo -e "${YELLOW}🔍 Step 2: Checking remote server environment...${NC}"
remote_exec "
echo 'System Information:'
echo '-------------------'
uname -a
echo ''
echo 'Java Version:'
java --version 2>&1 | head -n 1 || echo 'Java not installed'
echo ''
echo 'Docker Version:'
docker --version 2>&1 || echo 'Docker not installed'
echo ''
echo 'Available Disk Space:'
df -h / | tail -n 1
echo ''
echo 'Available Memory:'
free -h | grep Mem
"

# Step 3: Create deployment directory structure
echo -e "${YELLOW}📁 Step 3: Creating deployment directory structure...${NC}"
remote_exec "
mkdir -p ${REMOTE_DIR}/{src,config,scripts,logs,data}
mkdir -p ${REMOTE_DIR}/src/main/java/io/aurigraph/v11/contracts/composite
mkdir -p ${REMOTE_DIR}/src/test/java/io/aurigraph/v11/contracts/composite
echo 'Directory structure created'
"

# Step 4: Build the project locally
echo -e "${YELLOW}🔨 Step 4: Building project locally...${NC}"
cd ${LOCAL_PROJECT_DIR}

# Check if Maven wrapper exists
if [ -f "mvnw" ]; then
    echo "Building with Maven wrapper..."
    ./mvnw clean package -DskipTests
else
    echo "Building with system Maven..."
    mvn clean package -DskipTests
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

cd -

# Step 5: Copy artifacts to remote server
echo -e "${YELLOW}📤 Step 5: Copying artifacts to remote server...${NC}"

# Copy JAR file
echo "Copying JAR file..."
remote_copy "${LOCAL_PROJECT_DIR}/target/*.jar" "${REMOTE_DIR}/"

# Copy source files
echo "Copying source files..."
remote_copy "${LOCAL_PROJECT_DIR}/src/main/java/io/aurigraph/v11/contracts/composite/*.java" \
            "${REMOTE_DIR}/src/main/java/io/aurigraph/v11/contracts/composite/"

remote_copy "${LOCAL_PROJECT_DIR}/src/main/java/io/aurigraph/v11/api/CompositeTokenResource.java" \
            "${REMOTE_DIR}/src/main/java/io/aurigraph/v11/api/"

# Copy configuration files
echo "Copying configuration files..."
remote_copy "${LOCAL_PROJECT_DIR}/src/main/resources/application.properties" \
            "${REMOTE_DIR}/config/"

# Step 6: Create Docker deployment files
echo -e "${YELLOW}🐳 Step 6: Creating Docker deployment configuration...${NC}"

# Create Dockerfile on remote
remote_exec "cat > ${REMOTE_DIR}/Dockerfile << 'EOF'
FROM openjdk:21-slim

WORKDIR /app

# Copy JAR file
COPY *.jar app.jar

# Copy configuration
COPY config/application.properties /app/config/application.properties

# Expose ports
EXPOSE 9003 9004

# JVM options for production
ENV JAVA_OPTS=\"-Xmx2g -Xms1g \
    -XX:+UseG1GC \
    -XX:MaxGCPauseMillis=200 \
    -XX:+UseStringDeduplication \
    -Djava.net.preferIPv4Stack=true\"

# Run the application
ENTRYPOINT [\"java\", \"-jar\", \"/app/app.jar\"]
EOF"

# Create docker-compose.yml on remote
remote_exec "cat > ${REMOTE_DIR}/docker-compose.yml << 'EOF'
version: '3.8'

services:
  composite-token-api:
    build: .
    container_name: aurigraph-composite-tokens
    ports:
      - \"9003:9003\"  # REST API
      - \"9004:9004\"  # gRPC
    environment:
      - QUARKUS_PROFILE=prod
      - QUARKUS_HTTP_PORT=9003
      - QUARKUS_GRPC_SERVER_PORT=9004
      - CONSENSUS_TARGET_TPS=2000000
      - AI_OPTIMIZATION_ENABLED=true
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    networks:
      - aurigraph-network
    restart: unless-stopped
    healthcheck:
      test: [\"CMD\", \"curl\", \"-f\", \"http://localhost:9003/q/health\"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    container_name: aurigraph-postgres
    environment:
      - POSTGRES_DB=aurigraph_v11
      - POSTGRES_USER=aurigraph
      - POSTGRES_PASSWORD=AurigraphSecure2025
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - aurigraph-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: aurigraph-redis
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - aurigraph-network
    restart: unless-stopped

networks:
  aurigraph-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
EOF"

# Step 7: Create startup script
echo -e "${YELLOW}📝 Step 7: Creating startup scripts...${NC}"

remote_exec "cat > ${REMOTE_DIR}/start-composite-tokens.sh << 'EOF'
#!/bin/bash

echo \"Starting Aurigraph Composite Token System...\"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo \"Docker is not running. Starting Docker...\"
    sudo systemctl start docker
fi

# Build and start containers
docker-compose build
docker-compose up -d

# Wait for services to be healthy
echo \"Waiting for services to start...\"
sleep 10

# Check service health
echo \"Checking service health...\"
curl -s http://localhost:9003/q/health | jq .

echo \"\"
echo \"✅ Composite Token System Started!\"
echo \"\"
echo \"📍 Endpoints:\"
echo \"   REST API: http://dlt.aurigraph.io:9003/api/v11/composite-tokens\"
echo \"   Health: http://dlt.aurigraph.io:9003/q/health\"
echo \"   Metrics: http://dlt.aurigraph.io:9003/q/metrics\"
echo \"\"
echo \"📊 View logs: docker logs -f aurigraph-composite-tokens\"
EOF

chmod +x ${REMOTE_DIR}/start-composite-tokens.sh
"

# Step 8: Create monitoring script
echo -e "${YELLOW}📊 Step 8: Creating monitoring script...${NC}"

remote_exec "cat > ${REMOTE_DIR}/monitor-composite-tokens.sh << 'EOF'
#!/bin/bash

while true; do
    clear
    echo \"========================================\"
    echo \"  Composite Token System Monitor\"
    echo \"  \$(date)\"
    echo \"========================================\"
    echo \"\"
    
    # Container status
    echo \"📦 Container Status:\"
    docker ps --format \"table {{.Names}}\t{{.Status}}\t{{.Ports}}\" | grep aurigraph
    echo \"\"
    
    # Memory usage
    echo \"💾 Memory Usage:\"
    docker stats --no-stream --format \"table {{.Container}}\t{{.MemUsage}}\t{{.CPUPerc}}\" | grep aurigraph
    echo \"\"
    
    # API Health
    echo \"🏥 API Health:\"
    curl -s http://localhost:9003/q/health | jq -r '.status' 2>/dev/null || echo \"API not responding\"
    echo \"\"
    
    # Recent logs
    echo \"📜 Recent Logs:\"
    docker logs --tail 5 aurigraph-composite-tokens 2>&1
    echo \"\"
    
    echo \"Press Ctrl+C to exit\"
    sleep 5
done
EOF

chmod +x ${REMOTE_DIR}/monitor-composite-tokens.sh
"

# Step 9: Install Java 21 if needed
echo -e "${YELLOW}☕ Step 9: Checking Java installation...${NC}"
remote_exec "
if ! java --version 2>&1 | grep -q '21'; then
    echo 'Installing Java 21...'
    sudo apt-get update
    sudo apt-get install -y openjdk-21-jdk
else
    echo 'Java 21 is already installed'
fi
"

# Step 10: Start the services
echo -e "${YELLOW}🚀 Step 10: Starting Composite Token System...${NC}"
remote_exec "cd ${REMOTE_DIR} && ./start-composite-tokens.sh"

# Summary
echo ""
echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}===============================================${NC}"
echo ""
echo "📍 Server: ${REMOTE_HOST}"
echo "📂 Location: ${REMOTE_DIR}"
echo ""
echo "🔗 Access Points:"
echo "   REST API: http://dlt.aurigraph.io:9003/api/v11/composite-tokens"
echo "   Health: http://dlt.aurigraph.io:9003/q/health"
echo "   Metrics: http://dlt.aurigraph.io:9003/q/metrics"
echo ""
echo "📋 Useful Commands:"
echo "   SSH to server: ssh -p${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST}"
echo "   View logs: docker logs -f aurigraph-composite-tokens"
echo "   Monitor: ${REMOTE_DIR}/monitor-composite-tokens.sh"
echo "   Restart: cd ${REMOTE_DIR} && docker-compose restart"
echo ""
echo "🎯 Next Steps:"
echo "   1. Test API endpoints"
echo "   2. Configure production database"
echo "   3. Set up SSL/TLS certificates"
echo "   4. Configure monitoring alerts"
echo "   5. Implement remaining sprints"
echo ""