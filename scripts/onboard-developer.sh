#!/bin/bash
#
# Aurigraph DLT - Developer Onboarding Script
# ============================================
# Usage: ./scripts/onboard-developer.sh <name> <agent-id>
# Example: ./scripts/onboard-developer.sh "John Doe" agent-1.1
#
# This script sets up a new developer's environment for Aurigraph DLT development.
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Header
print_header() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║        Aurigraph DLT - Developer Onboarding Script               ║"
    echo "║                      Version 1.0.0                               ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    local missing=0

    # Java 21
    if command -v java &> /dev/null; then
        java_version=$(java -version 2>&1 | head -1 | cut -d'"' -f2 | cut -d'.' -f1)
        if [ "$java_version" -ge 21 ]; then
            log_success "Java $java_version found"
        else
            log_error "Java 21+ required (found $java_version)"
            missing=1
        fi
    else
        log_error "Java not found"
        missing=1
    fi

    # Maven
    if command -v mvn &> /dev/null; then
        mvn_version=$(mvn -version 2>&1 | head -1 | grep -oE '[0-9]+\.[0-9]+')
        log_success "Maven $mvn_version found"
    else
        log_error "Maven not found"
        missing=1
    fi

    # Docker
    if command -v docker &> /dev/null; then
        if docker info &> /dev/null; then
            log_success "Docker found and running"
        else
            log_warn "Docker found but not running"
        fi
    else
        log_error "Docker not found"
        missing=1
    fi

    # Node.js
    if command -v node &> /dev/null; then
        node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -ge 18 ]; then
            log_success "Node.js v$node_version found"
        else
            log_warn "Node.js 18+ recommended (found v$node_version)"
        fi
    else
        log_warn "Node.js not found (optional for backend-only development)"
    fi

    # Git
    if command -v git &> /dev/null; then
        log_success "Git found"
    else
        log_error "Git not found"
        missing=1
    fi

    if [ $missing -eq 1 ]; then
        log_error "Missing prerequisites. Please install them and run again."
        echo ""
        echo "Installation guides:"
        echo "  Java 21:  brew install openjdk@21 (macOS) or apt install openjdk-21-jdk (Ubuntu)"
        echo "  Maven:    brew install maven (macOS) or apt install maven (Ubuntu)"
        echo "  Docker:   https://docs.docker.com/get-docker/"
        echo "  Node.js:  brew install node@20 (macOS) or nvm install 20 (nvm)"
        exit 1
    fi

    echo ""
}

# Setup credentials
setup_credentials() {
    log_info "Setting up credentials..."

    if [ -f "$REPO_ROOT/doc/Credentials.md" ]; then
        log_warn "Credentials.md already exists"
    else
        if [ -f "$REPO_ROOT/doc/Credentials.md.example" ]; then
            cp "$REPO_ROOT/doc/Credentials.md.example" "$REPO_ROOT/doc/Credentials.md"
            log_success "Created doc/Credentials.md from template"
            log_warn "Please edit doc/Credentials.md with your actual credentials"
        else
            log_warn "Credentials template not found"
        fi
    fi

    if [ -f "$REPO_ROOT/.env" ]; then
        log_warn ".env already exists"
    else
        if [ -f "$REPO_ROOT/.env.example" ]; then
            cp "$REPO_ROOT/.env.example" "$REPO_ROOT/.env"
            log_success "Created .env from template"
        fi
    fi

    echo ""
}

# Setup git worktree for agent
setup_worktree() {
    local agent_id=$1

    if [ -z "$agent_id" ]; then
        log_info "No agent ID specified, skipping worktree setup"
        return
    fi

    log_info "Setting up git worktree for $agent_id..."

    local worktree_path="$REPO_ROOT/worktrees/$agent_id"
    local branch_name="feature/$agent_id-development"

    # Check if worktree already exists
    if [ -d "$worktree_path" ]; then
        log_warn "Worktree already exists at $worktree_path"
        return
    fi

    # Create branch if it doesn't exist
    if ! git rev-parse --verify "$branch_name" &> /dev/null; then
        log_info "Creating branch $branch_name..."
        git branch "$branch_name" V12 2>/dev/null || git branch "$branch_name" main
    fi

    # Create worktree
    mkdir -p "$REPO_ROOT/worktrees"
    git worktree add "$worktree_path" "$branch_name"
    log_success "Created worktree at $worktree_path"

    echo ""
}

# Build project
build_project() {
    log_info "Building the project (this may take a few minutes)..."

    cd "$REPO_ROOT/aurigraph-av10-7/aurigraph-v11-standalone"

    if ./mvnw clean compile -DskipTests -q; then
        log_success "Project built successfully"
    else
        log_error "Build failed. Check the output above for errors."
        log_info "You can try running: ./mvnw clean compile -DskipTests"
        return 1
    fi

    cd "$REPO_ROOT"
    echo ""
}

# Setup IDE
setup_ide() {
    log_info "Setting up IDE configuration..."

    # VS Code settings
    mkdir -p "$REPO_ROOT/.vscode"

    if [ ! -f "$REPO_ROOT/.vscode/settings.json" ]; then
        cat > "$REPO_ROOT/.vscode/settings.json" << 'EOF'
{
    "java.configuration.runtimes": [
        {
            "name": "JavaSE-21",
            "path": "${env:JAVA_HOME}",
            "default": true
        }
    ],
    "java.compile.nullAnalysis.mode": "automatic",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.organizeImports": "explicit"
    },
    "java.project.sourcePaths": [
        "aurigraph-av10-7/aurigraph-v11-standalone/src/main/java",
        "aurigraph-av10-7/aurigraph-v11-standalone/src/test/java"
    ],
    "files.exclude": {
        "**/target": true,
        "**/.git": true,
        "**/node_modules": true
    }
}
EOF
        log_success "Created VS Code settings"
    fi

    # Extensions recommendations
    if [ ! -f "$REPO_ROOT/.vscode/extensions.json" ]; then
        cat > "$REPO_ROOT/.vscode/extensions.json" << 'EOF'
{
    "recommendations": [
        "redhat.java",
        "vscjava.vscode-java-pack",
        "redhat.vscode-quarkus",
        "zxh404.vscode-proto3",
        "ms-azuretools.vscode-docker",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
    ]
}
EOF
        log_success "Created VS Code extension recommendations"
    fi

    echo ""
}

# Print summary
print_summary() {
    local name=$1
    local agent_id=$2

    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                    Onboarding Complete!                          ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Welcome to Aurigraph DLT, $name!"
    echo ""
    echo "Next Steps:"
    echo "───────────────────────────────────────────────────────────────────"
    echo "1. Edit credentials:     nano doc/Credentials.md"
    echo "2. Start dev server:     cd aurigraph-av10-7/aurigraph-v11-standalone && ./mvnw quarkus:dev"
    echo "3. Test health:          curl http://localhost:9003/api/v11/health"
    echo ""

    if [ -n "$agent_id" ]; then
        echo "Your Worktree:"
        echo "───────────────────────────────────────────────────────────────────"
        echo "  Path:   worktrees/$agent_id"
        echo "  Branch: feature/$agent_id-development"
        echo "  Switch: cd worktrees/$agent_id"
        echo ""
    fi

    echo "Useful Commands:"
    echo "───────────────────────────────────────────────────────────────────"
    echo "  Build:    ./mvnw clean package -DskipTests"
    echo "  Test:     ./mvnw test"
    echo "  Dev:      ./mvnw quarkus:dev"
    echo "  Validate: ./scripts/validate-dev-env.sh"
    echo ""
    echo "Documentation:"
    echo "───────────────────────────────────────────────────────────────────"
    echo "  Handbook:     doc/DEVELOPER_HANDBOOK.md"
    echo "  Team:         doc/TEAM_MEMBERS.md"
    echo "  Projects:     doc/PROJECT_REGISTRY.md"
    echo "  Access:       doc/ACCESS_CONTROL_MATRIX.md"
    echo ""
    echo "Need help? Ask in Slack #aurigraph-help"
    echo ""
}

# Main function
main() {
    print_header

    # Parse arguments
    local name="${1:-Developer}"
    local agent_id="${2:-}"

    if [ "$#" -lt 1 ]; then
        echo "Usage: $0 <name> [agent-id]"
        echo ""
        echo "Arguments:"
        echo "  name       Your name (e.g., \"John Doe\")"
        echo "  agent-id   Optional agent ID (e.g., agent-1.1)"
        echo ""
        echo "Example:"
        echo "  $0 \"John Doe\" agent-1.1"
        echo ""
        exit 1
    fi

    log_info "Onboarding: $name"
    if [ -n "$agent_id" ]; then
        log_info "Agent ID: $agent_id"
    fi
    echo ""

    # Run setup steps
    check_prerequisites
    setup_credentials

    if [ -n "$agent_id" ]; then
        setup_worktree "$agent_id"
    fi

    setup_ide

    # Ask if user wants to build
    read -p "Build the project now? [Y/n] " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        build_project
    else
        log_info "Skipping build. Run: cd aurigraph-av10-7/aurigraph-v11-standalone && ./mvnw clean compile"
    fi

    print_summary "$name" "$agent_id"
}

# Run main function
main "$@"
