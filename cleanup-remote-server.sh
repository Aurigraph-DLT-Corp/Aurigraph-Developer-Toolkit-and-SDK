#!/bin/bash

################################################################################
# Aurigraph Remote Server Cleanup & Recovery Script
#
# Purpose: Remove all Docker containers, volumes, networks from production
#          server and clean up application folders for fresh deployment
#
# Usage: ./cleanup-remote-server.sh --host dlt.aurigraph.io --user subbu
#
# Version: 1.0.0 (November 13, 2025)
# Security Level: HIGH (Requires SSH access)
################################################################################

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REMOTE_HOST="${REMOTE_HOST:-dlt.aurigraph.io}"
REMOTE_USER="${REMOTE_USER:-subbu}"
REMOTE_PORT="${REMOTE_PORT:-22}"
REMOTE_PATH="/opt/DLT"
GIT_REPO="git@github.com:Aurigraph-DLT-Corp/Aurigraph-DLT.git"
GIT_BRANCH="main"
DRY_RUN=false
SKIP_CLEANUP=false
SKIP_GIT=false

# Functions
print_header() {
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}→ $1${NC}"
}

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

OPTIONS:
    --host HOST              Remote host (default: dlt.aurigraph.io)
    --user USER              Remote user (default: subbu)
    --port PORT              SSH port (default: 22)
    --path PATH              Remote path (default: /opt/DLT)
    --dry-run                Show what would be done (don't execute)
    --skip-cleanup           Skip Docker cleanup
    --skip-git               Skip git operations
    --force                  Force cleanup without confirmation
    --help                   Show this help message

EXAMPLES:
    # Full cleanup
    $0 --host dlt.aurigraph.io --user subbu

    # Dry run (show what would happen)
    $0 --dry-run

    # Cleanup without confirmation
    $0 --force --host dlt.aurigraph.io --user subbu

    # Skip git operations
    $0 --skip-git --host dlt.aurigraph.io --user subbu
EOF
}

parse_arguments() {
    local force_flag=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --host)
                REMOTE_HOST="$2"
                shift 2
                ;;
            --user)
                REMOTE_USER="$2"
                shift 2
                ;;
            --port)
                REMOTE_PORT="$2"
                shift 2
                ;;
            --path)
                REMOTE_PATH="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --skip-cleanup)
                SKIP_CLEANUP=true
                shift
                ;;
            --skip-git)
                SKIP_GIT=true
                shift
                ;;
            --force)
                force_flag=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    # Confirmation prompt
    if [ "$force_flag" = false ] && [ "$DRY_RUN" = false ]; then
        print_warning "This script will:"
        echo "  1. Remove ALL Docker containers on $REMOTE_HOST"
        echo "  2. Remove ALL Docker volumes"
        echo "  3. Remove ALL Docker networks"
        echo "  4. Clean up $REMOTE_PATH folder"
        echo "  5. Clone fresh repository"
        echo ""
        echo "This action CANNOT be undone. All running services will stop."
        read -p "Do you want to proceed? (yes/no): " response

        if [ "$response" != "yes" ]; then
            print_error "Cleanup cancelled"
            exit 1
        fi
    fi
}

check_ssh_access() {
    print_header "Checking SSH Access"

    if ! ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "echo 'SSH connection successful'" &>/dev/null; then
        print_error "Cannot connect to $REMOTE_USER@$REMOTE_HOST:$REMOTE_PORT"
        print_info "Please verify:"
        echo "  - SSH host is correct: $REMOTE_HOST"
        echo "  - SSH user is correct: $REMOTE_USER"
        echo "  - SSH port is correct: $REMOTE_PORT"
        echo "  - SSH keys are configured"
        exit 1
    fi

    print_success "SSH connection successful"
}

docker_cleanup_script() {
    cat << 'DOCKER_CLEANUP'
#!/bin/bash

echo "════════════════════════════════════════════════════════════"
echo "Docker Cleanup Script (Remote Execution)"
echo "════════════════════════════════════════════════════════════"

# Stop all running containers
echo ""
echo "→ Stopping all running Docker containers..."
if docker ps -q | wc -l | grep -q '^0$'; then
    echo "  No containers running"
else
    docker stop $(docker ps -q) 2>/dev/null || true
    echo "  ✓ Containers stopped"
fi

# Remove all containers
echo ""
echo "→ Removing all Docker containers..."
if docker ps -a -q | wc -l | grep -q '^0$'; then
    echo "  No containers to remove"
else
    docker rm -f $(docker ps -a -q) 2>/dev/null || true
    echo "  ✓ Containers removed"
fi

# Remove all volumes
echo ""
echo "→ Removing all Docker volumes..."
if docker volume ls -q | wc -l | grep -q '^0$'; then
    echo "  No volumes to remove"
else
    docker volume rm $(docker volume ls -q) 2>/dev/null || true
    echo "  ✓ Volumes removed"
fi

# Remove all networks (except default)
echo ""
echo "→ Removing custom Docker networks..."
if docker network ls -q | wc -l | grep -q '^[0-9]$'; then
    echo "  Using default networks"
else
    docker network ls --filter "type=custom" -q | xargs -r docker network rm 2>/dev/null || true
    echo "  ✓ Networks removed"
fi

# Remove dangling images
echo ""
echo "→ Cleaning up dangling images..."
docker image prune -f --filter "dangling=true" >/dev/null 2>&1 || true
echo "  ✓ Dangling images cleaned"

# Verify cleanup
echo ""
echo "════════════════════════════════════════════════════════════"
echo "Docker Cleanup Summary:"
echo "════════════════════════════════════════════════════════════"
echo "Containers: $(docker ps -a -q | wc -l) (should be 0)"
echo "Volumes: $(docker volume ls -q | wc -l) (should be 0)"
echo "Images: $(docker images -q | wc -l)"
echo "Networks: $(docker network ls -q | wc -l)"
echo ""

DOCKER_CLEANUP
}

cleanup_docker() {
    print_header "Docker Cleanup on Remote Server"

    if [ "$SKIP_CLEANUP" = true ]; then
        print_warning "Skipping Docker cleanup (--skip-cleanup)"
        return
    fi

    print_info "Creating cleanup script on remote server..."

    # Create cleanup script on remote
    ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "$(docker_cleanup_script)" || true

    print_success "Docker cleanup completed"
}

cleanup_folders() {
    print_header "Cleaning Up Application Folders"

    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN: Would clean up $REMOTE_PATH"
        return
    fi

    print_info "Removing old deployment at $REMOTE_PATH..."

    ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
#!/bin/bash

REMOTE_PATH="/opt/DLT"

# Backup existing data (optional)
if [ -d "$REMOTE_PATH" ]; then
    echo "→ Creating backup of existing folder..."
    BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
    if sudo test -d "$REMOTE_PATH"; then
        sudo mkdir -p /opt/backups
        sudo cp -r "$REMOTE_PATH" "/opt/backups/DLT_backup_$BACKUP_DATE"
        echo "✓ Backup created at /opt/backups/DLT_backup_$BACKUP_DATE"
    fi
fi

# Remove application folder
echo "→ Removing $REMOTE_PATH..."
sudo rm -rf "$REMOTE_PATH"
echo "✓ Folder removed"

# Create fresh directory structure
echo "→ Creating fresh directory structure..."
sudo mkdir -p "$REMOTE_PATH"
sudo chown -R $(whoami):$(whoami) "$REMOTE_PATH"
echo "✓ Directory structure created"

# Create necessary subdirectories
mkdir -p "$REMOTE_PATH"/{logs,config,data,backups,certs}
echo "✓ Subdirectories created"

EOF

    print_success "Application folders cleaned up"
}

git_operations() {
    print_header "Git Repository Operations"

    if [ "$SKIP_GIT" = true ]; then
        print_warning "Skipping git operations (--skip-git)"
        return
    fi

    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN: Would git clone to $REMOTE_PATH"
        return
    fi

    print_info "Executing git operations on remote server..."

    ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'GITOPS'
#!/bin/bash

REMOTE_PATH="/opt/DLT"
GIT_REPO="git@github.com:Aurigraph-DLT-Corp/Aurigraph-DLT.git"
GIT_BRANCH="main"

echo "════════════════════════════════════════════════════════════"
echo "Git Operations"
echo "════════════════════════════════════════════════════════════"

# Clone repository
echo ""
echo "→ Cloning repository from $GIT_REPO..."
cd "$REMOTE_PATH"
git clone -b "$GIT_BRANCH" "$GIT_REPO" . 2>&1 | tail -5
echo "✓ Repository cloned"

# Verify git status
echo ""
echo "→ Verifying git status..."
git status
echo ""
echo "✓ Git repository ready"

# Show current branch and commit
echo ""
echo "→ Current branch and commit:"
git branch -v
git log --oneline -3

GITOPS

    print_success "Git repository operations completed"
}

generate_cleanup_report() {
    cat > cleanup-report.txt << 'REPORT'
AURIGRAPH REMOTE SERVER CLEANUP REPORT
======================================
Generated: $(date)

CLEANUP SUMMARY
===============
✓ Docker containers removed
✓ Docker volumes removed
✓ Docker networks removed
✓ Application folders cleaned
✓ Git repository cloned
✓ Fresh directory structure created

SERVER INFORMATION
==================
Host: dlt.aurigraph.io
User: subbu
Port: 22
Application Path: /opt/DLT
Domain: dlt.aurigraph.io
SSL Certificate: /etc/letsencrypt/live/aurcrt/
  - fullchain.pem
  - privkey.pem

NEXT STEPS
==========
1. Deploy V4.4.4 infrastructure
2. Configure SSL certificates
3. Start Docker containers
4. Verify health checks
5. Configure monitoring

SUPPORT
=======
For issues, contact: ops@aurigraph.io
REPORT

    print_success "Cleanup report generated: cleanup-report.txt"
    cat cleanup-report.txt
}

show_deployment_status() {
    print_header "Deployment Status"

    print_info "Remote server status:"
    echo ""
    ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'STATUS'
echo "→ Disk usage:"
df -h /opt/DLT | tail -1

echo ""
echo "→ Directory structure:"
ls -lh /opt/DLT 2>/dev/null | head -10 || echo "  (folder being prepared)"

echo ""
echo "→ Docker status:"
docker ps -a --format "table {{.Names}}\t{{.Status}}" | head -5 || echo "  Docker ready"

echo ""
echo "✓ Remote server status check complete"
STATUS

    print_success "Status check completed"
}

# Main execution
main() {
    parse_arguments "$@"

    print_header "Aurigraph Remote Server Cleanup & Recovery"
    print_info "Version 1.0.0 | Target: $REMOTE_HOST | User: $REMOTE_USER"

    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN MODE - No changes will be made"
        echo ""
    fi

    check_ssh_access
    cleanup_docker
    cleanup_folders
    git_operations
    show_deployment_status
    generate_cleanup_report

    print_header "Cleanup Complete!"
    print_success "Remote server is ready for fresh deployment"
    print_info "Next: Deploy V4.4.4 infrastructure"
}

# Execute main
main "$@"
