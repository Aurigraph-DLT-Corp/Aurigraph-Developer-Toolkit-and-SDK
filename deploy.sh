#!/bin/bash
set -e

# ==============================================================================
# Aurigraph-DLT Unified Deployment Script
#
# This script handles the deployment of the Aurigraph-DLT platform to a remote
# server. It supports different environments and versions.
#
# Usage:
#   ./deploy.sh --env <env> --version <ver> [options]
#
# Environments:
#   - staging: Deploys the staging environment.
#   - production: Deploys the full production environment.
#
# Versions:
#   - v11: Deploys the V11 application.
#   - v12: Deploys the V12 application.
#
# Options:
#   --skip-upload: Skips the file upload step.
#   --help:        Displays this help message.
# ==============================================================================

# --- Configuration ---
REMOTE_USER="subbu"
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_PORT="22"
REMOTE_BASE="/opt/DLT"
DOCKER_REGISTRY="" # Optional: e.g., "your-registry.com/"

# --- Script Arguments ---
ENVIRONMENT=""
VERSION=""
SKIP_UPLOAD=false

# --- Helper Functions ---
function show_help() {
  echo "Usage: ./deploy.sh --env <env> --version <ver> [options]"
  echo ""
  echo "Environments:"
  echo "  - staging:    Deploys the staging environment."
  echo "  - production: Deploys the full production environment."
  echo ""
  echo "Versions:"
  echo "  - v11: Deploys the V11 application."
  echo "  - v12: Deploys the V12 application."
  echo ""
  echo "Options:"
  echo "  --skip-upload: Skips the file upload step."
  echo "  --help:        Displays this help message."
}

# --- Argument Parsing ---
while [[ $# -gt 0 ]]; do
  key=""
  case $key in
    --env)
      ENVIRONMENT="$2"
      shift; shift
      ;;
    --version)
      VERSION="$2"
      shift; shift
      ;;
    --skip-upload)
      SKIP_UPLOAD=true
      shift
      ;;
    --help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: "
      show_help
      exit 1
      ;;
  esac
done

# --- Validation ---
if [[ -z "$ENVIRONMENT" || -z "$VERSION" ]]; then
  echo "Error: Environment and version must be specified."
  show_help
  exit 1
fi

if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
  echo "Error: Invalid environment '$ENVIRONMENT'."
  show_help
  exit 1
fi

if [[ "$VERSION" != "v11" && "$VERSION" != "v12" ]]; then
  echo "Error: Invalid version '$VERSION'."
  show_help
  exit 1
fi

IMAGE_NAME="${DOCKER_REGISTRY}aurigraph-dlt:${VERSION}"

echo "=================================================="
echo "AURIGRAPH DLT UNIFIED DEPLOYMENT"
echo "=================================================="
echo "📋 Configuration:"
echo "  Environment:   $ENVIRONMENT"
echo "  Version:       $VERSION"
echo "  Image:         $IMAGE_NAME"
echo "  Remote Host:   ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PORT}"
echo "  Remote Path:   ${REMOTE_BASE}"
echo "  Skip Upload:   $SKIP_UPLOAD"
echo "=================================================="
echo ""

# --- Main Deployment Logic ---

echo "🚀 Deployment for environment '$ENVIRONMENT' version '$VERSION' started."
echo ""

# 1. Build V12 Docker image if deploying V12
if [ "$VERSION" = "v12" ]; then
  echo "🔧 Building V12 application and Docker image..."
  
  # Build the JAR using Maven
  (cd aurigraph-av10-7/aurigraph-v11-standalone && ./mvnw clean package -DskipTests)
  
  # Build the Docker image
  docker build -t "$IMAGE_NAME" aurigraph-av10-7/aurigraph-v11-standalone
  
  if [ -n "$DOCKER_REGISTRY" ]; then
    echo " pushing image to registry..."
    docker push "$IMAGE_NAME"
  fi
  
  echo "✅ V12 Docker image built successfully."
  echo ""
fi

# 2. Prepare local configuration files
echo "🔧 Preparing local configuration..."
BUILD_DIR="deployment/build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

cp "deployment/docker-compose.yml" "$BUILD_DIR/"
cp "deployment/environments/${VERSION}/${ENVIRONMENT}/docker-compose.override.yml" "$BUILD_DIR/"
cp "deployment/config/nginx.conf" "$BUILD_DIR/"
cp "deployment/config/prometheus.yml" "$BUILD_DIR/"

# Create a .env file for docker-compose
echo "IMAGE_NAME=${IMAGE_NAME}" > "$BUILD_DIR/.env"

echo "✅ Local configuration prepared in '$BUILD_DIR'."
echo ""

# 3. Upload files to remote server
if [ "$SKIP_UPLOAD" = false ]; then
  echo "📤 Uploading configuration to remote server..."
  scp -P "$REMOTE_PORT" -r "$BUILD_DIR"/* "${REMOTE_USER}@${REMOTE_HOST}:/tmp/"
  echo "✅ Configuration uploaded."
  echo ""
else
  echo "ℹ️ Skipping file upload as requested."
  echo ""
fi

# 4. Execute remote deployment
echo "🚀 Executing remote deployment..."
ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" 'bash -s' <<'END_OF_REMOTE_SCRIPT'
  set -e

  REMOTE_BASE="/opt/DLT"
  TIMESTAMP=$(date +%Y%m%d-%H%M%S)

  echo "========================================="
  echo "REMOTE: Aurigraph-DLT Deployment"
  echo "========================================="
  echo ""

  # 1. Backup existing configuration
  echo "💾 Backing up existing configuration..."
  if [ -f "${REMOTE_BASE}/docker-compose.yml" ]; then
    BACKUP_DIR="${REMOTE_BASE}/backups/${TIMESTAMP}"
    mkdir -p "$BACKUP_DIR"
    mv "${REMOTE_BASE}/docker-compose.yml" "$BACKUP_DIR/"
    mv "${REMOTE_BASE}/docker-compose.override.yml" "$BACKUP_DIR/" 2>/dev/null || true
    mv "${REMOTE_BASE}/.env" "$BACKUP_DIR/" 2>/dev/null || true
    echo "✅ Backup created in '$BACKUP_DIR'."
  fi
  echo ""

  # 2. Stop old containers
  echo "🛑 Stopping old containers..."
  cd "$REMOTE_BASE"
  docker-compose down --remove-orphans 2>/dev/null || true
  echo "✅ Old containers stopped."
  echo ""

  # 3. Deploy new configuration
  echo "📋 Deploying new configuration..."
  mv /tmp/docker-compose.yml "$REMOTE_BASE/"
  mv /tmp/docker-compose.override.yml "$REMOTE_BASE/"
  mv /tmp/.env "$REMOTE_BASE/"
  mkdir -p "${REMOTE_BASE}/config"
  mv /tmp/nginx.conf "${REMOTE_BASE}/config/"
  mv /tmp/prometheus.yml "${REMOTE_BASE}/config/"
  echo "✅ New configuration deployed."
  echo ""

  # 4. Pull new Docker image
  echo "🐳 Pulling new Docker image..."
  source .env
  docker pull "$IMAGE_NAME"
  echo "✅ Image pulled."
  echo ""

  # 5. Start new services
  echo "🚀 Starting new services..."
  cd "$REMOTE_BASE"
  docker-compose up -d
  echo "✅ Services started."
  echo ""

  # 6. Health checks and status
  echo "⏳ Waiting for services to become healthy..."
  # (Health check logic will be added here)
  sleep 10 # Placeholder
  echo "✅ Services are up."
  echo ""

  echo "📊 Service Status:"
  docker-compose ps
  echo ""

  echo "========================================="
  echo "✅ Remote Deployment Complete!"
  echo "========================================="
END_OF_REMOTE_SCRIPT

echo "🎉 Deployment finished successfully!"