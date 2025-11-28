#!/bin/bash
#
# Aurigraph DLT - Development Environment Validator
# ==================================================
# Usage: ./scripts/validate-dev-env.sh
#
# This script validates that the development environment is correctly configured.
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Counters
PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

# Logging functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS_COUNT++))
}

check_warn() {
    echo -e "${YELLOW}!${NC} $1"
    ((WARN_COUNT++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL_COUNT++))
}

section() {
    echo ""
    echo -e "${CYAN}━━━ $1 ━━━${NC}"
}

# Header
print_header() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║     Aurigraph DLT - Development Environment Validator            ║"
    echo "║                      Version 1.0.0                               ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
}

# Check Java
check_java() {
    section "Java Environment"

    if command -v java &> /dev/null; then
        java_version=$(java -version 2>&1 | head -1 | cut -d'"' -f2)
        java_major=$(echo "$java_version" | cut -d'.' -f1)

        if [ "$java_major" -ge 21 ]; then
            check_pass "Java $java_version (21+ required)"
        else
            check_fail "Java $java_version found (21+ required)"
        fi
    else
        check_fail "Java not found"
    fi

    if [ -n "$JAVA_HOME" ]; then
        check_pass "JAVA_HOME set: $JAVA_HOME"
    else
        check_warn "JAVA_HOME not set (recommended)"
    fi
}

# Check Maven
check_maven() {
    section "Maven Build Tool"

    if command -v mvn &> /dev/null; then
        mvn_version=$(mvn -version 2>&1 | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
        check_pass "Maven $mvn_version found"
    else
        check_fail "Maven not found"
    fi

    # Check Maven wrapper
    if [ -f "$REPO_ROOT/aurigraph-av10-7/aurigraph-v11-standalone/mvnw" ]; then
        check_pass "Maven wrapper (mvnw) present"
    else
        check_warn "Maven wrapper not found"
    fi
}

# Check Docker
check_docker() {
    section "Docker Environment"

    if command -v docker &> /dev/null; then
        docker_version=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
        check_pass "Docker $docker_version found"

        if docker info &> /dev/null; then
            check_pass "Docker daemon running"
        else
            check_fail "Docker daemon not running"
        fi
    else
        check_fail "Docker not found"
    fi

    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        check_pass "Docker Compose available"
    else
        check_warn "Docker Compose not found"
    fi
}

# Check Node.js
check_node() {
    section "Node.js Environment"

    if command -v node &> /dev/null; then
        node_version=$(node -v | cut -d'v' -f2)
        node_major=$(echo "$node_version" | cut -d'.' -f1)

        if [ "$node_major" -ge 18 ]; then
            check_pass "Node.js v$node_version (18+ required for portal)"
        else
            check_warn "Node.js v$node_version (18+ recommended)"
        fi
    else
        check_warn "Node.js not found (optional for backend-only)"
    fi

    if command -v npm &> /dev/null; then
        npm_version=$(npm -v)
        check_pass "npm $npm_version found"
    else
        check_warn "npm not found"
    fi
}

# Check Git
check_git() {
    section "Git Configuration"

    if command -v git &> /dev/null; then
        git_version=$(git --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
        check_pass "Git $git_version found"
    else
        check_fail "Git not found"
    fi

    # Check git user config
    git_user=$(git config --global user.name 2>/dev/null || echo "")
    git_email=$(git config --global user.email 2>/dev/null || echo "")

    if [ -n "$git_user" ]; then
        check_pass "Git user: $git_user"
    else
        check_warn "Git user.name not configured"
    fi

    if [ -n "$git_email" ]; then
        check_pass "Git email: $git_email"
    else
        check_warn "Git user.email not configured"
    fi

    # Check if in a git repo
    if git rev-parse --git-dir &> /dev/null; then
        current_branch=$(git branch --show-current)
        check_pass "In git repository (branch: $current_branch)"
    else
        check_fail "Not in a git repository"
    fi

    # Check worktrees
    worktree_count=$(git worktree list 2>/dev/null | wc -l)
    if [ "$worktree_count" -gt 1 ]; then
        check_pass "$worktree_count git worktrees configured"
    fi
}

# Check Repository Structure
check_repo_structure() {
    section "Repository Structure"

    # Key directories
    local dirs=(
        "aurigraph-av10-7/aurigraph-v11-standalone"
        "enterprise-portal"
        "deployment"
        "doc"
        "scripts"
        ".github/workflows"
    )

    for dir in "${dirs[@]}"; do
        if [ -d "$REPO_ROOT/$dir" ]; then
            check_pass "Directory: $dir"
        else
            check_warn "Directory missing: $dir"
        fi
    done
}

# Check Configuration Files
check_config_files() {
    section "Configuration Files"

    # Key files
    local files=(
        "aurigraph-av10-7/aurigraph-v11-standalone/pom.xml"
        "aurigraph-av10-7/aurigraph-v11-standalone/src/main/resources/application.properties"
        "CODEOWNERS"
        "doc/DEVELOPER_HANDBOOK.md"
        "doc/TEAM_MEMBERS.md"
    )

    for file in "${files[@]}"; do
        if [ -f "$REPO_ROOT/$file" ]; then
            check_pass "File: $file"
        else
            check_warn "File missing: $file"
        fi
    done

    # Check credentials
    if [ -f "$REPO_ROOT/doc/Credentials.md" ]; then
        check_pass "Credentials.md configured"
    else
        check_warn "doc/Credentials.md not found (copy from Credentials.md.example)"
    fi

    # Check .env
    if [ -f "$REPO_ROOT/.env" ]; then
        check_pass ".env configured"
    else
        check_warn ".env not found (copy from .env.example)"
    fi
}

# Check Ports
check_ports() {
    section "Port Availability"

    local ports=(
        "9003:Backend HTTP"
        "9004:gRPC"
        "3000:Frontend Dev"
        "5432:PostgreSQL"
        "6379:Redis"
        "9090:Prometheus"
        "3001:Grafana"
    )

    for port_info in "${ports[@]}"; do
        port=$(echo "$port_info" | cut -d':' -f1)
        name=$(echo "$port_info" | cut -d':' -f2)

        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            check_warn "Port $port in use ($name)"
        else
            check_pass "Port $port available ($name)"
        fi
    done
}

# Check Network
check_network() {
    section "Network Connectivity"

    # GitHub
    if curl -s --connect-timeout 5 https://github.com > /dev/null; then
        check_pass "GitHub reachable"
    else
        check_fail "Cannot reach GitHub"
    fi

    # Maven Central
    if curl -s --connect-timeout 5 https://repo.maven.apache.org > /dev/null; then
        check_pass "Maven Central reachable"
    else
        check_warn "Cannot reach Maven Central"
    fi

    # Docker Hub
    if curl -s --connect-timeout 5 https://hub.docker.com > /dev/null; then
        check_pass "Docker Hub reachable"
    else
        check_warn "Cannot reach Docker Hub"
    fi
}

# Check Build
check_build() {
    section "Build Verification"

    local standalone_dir="$REPO_ROOT/aurigraph-av10-7/aurigraph-v11-standalone"

    if [ -d "$standalone_dir" ]; then
        # Check if target exists (previous build)
        if [ -d "$standalone_dir/target" ]; then
            check_pass "Previous build exists (target/)"
        else
            check_warn "No previous build (run: ./mvnw clean package)"
        fi

        # Check for runner JAR
        if ls "$standalone_dir"/target/*.jar &> /dev/null; then
            jar_file=$(ls "$standalone_dir"/target/*-runner.jar 2>/dev/null | head -1)
            if [ -n "$jar_file" ]; then
                check_pass "Runner JAR: $(basename "$jar_file")"
            fi
        fi
    fi
}

# Check Remote Server (optional)
check_remote() {
    section "Remote Server (Optional)"

    # Try SSH connection (non-blocking)
    if timeout 5 ssh -o BatchMode=yes -o ConnectTimeout=3 subbu@dlt.aurigraph.io exit 2>/dev/null; then
        check_pass "SSH to production server works"
    else
        check_warn "Cannot SSH to production (may require VPN/credentials)"
    fi

    # Check production API
    if curl -s --connect-timeout 5 https://dlt.aurigraph.io/api/v11/health > /dev/null 2>&1; then
        check_pass "Production API reachable"
    else
        check_warn "Production API not reachable"
    fi
}

# Print summary
print_summary() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                      Validation Summary                          ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "  ${GREEN}Passed:${NC}   $PASS_COUNT"
    echo -e "  ${YELLOW}Warnings:${NC} $WARN_COUNT"
    echo -e "  ${RED}Failed:${NC}   $FAIL_COUNT"
    echo ""

    if [ $FAIL_COUNT -eq 0 ]; then
        if [ $WARN_COUNT -eq 0 ]; then
            echo -e "${GREEN}Environment is fully configured!${NC}"
        else
            echo -e "${YELLOW}Environment is ready with minor issues.${NC}"
            echo "Review warnings above for optional improvements."
        fi
        exit 0
    else
        echo -e "${RED}Environment has critical issues.${NC}"
        echo "Please fix the failed checks before continuing."
        exit 1
    fi
}

# Main function
main() {
    print_header

    cd "$REPO_ROOT"

    check_java
    check_maven
    check_docker
    check_node
    check_git
    check_repo_structure
    check_config_files
    check_ports
    check_network
    check_build
    check_remote

    print_summary
}

# Run main function
main "$@"
