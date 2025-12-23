#!/bin/bash

###############################################################################
# Sprint 13-15 GitHub Feature Branch Creation Script
# Purpose: Create and push all 15 feature branches for Sprint 13-15 execution
# Usage: ./create-feature-branches.sh
# Date: November 1, 2025
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRANCH_LIST=(
    # Sprint 13 - Phase 1 Components
    "feature/sprint-13-network-topology"
    "feature/sprint-13-block-search"
    "feature/sprint-13-validator-performance"
    "feature/sprint-13-ai-metrics"
    "feature/sprint-13-audit-log"
    "feature/sprint-13-rwa-portfolio"
    "feature/sprint-13-token-management"
    "feature/sprint-13-dashboard-layout"

    # Sprint 14 - Phase 2 Components
    "feature/sprint-14-block-explorer"
    "feature/sprint-14-realtime-analytics"
    "feature/sprint-14-consensus-monitor"
    "feature/sprint-14-network-events"
    "feature/sprint-14-bridge-analytics"
    "feature/sprint-14-oracle-dashboard"
    "feature/sprint-14-websocket-wrapper"
    "feature/sprint-14-realtime-sync"
    "feature/sprint-14-performance-monitor"
    "feature/sprint-14-system-health"
    "feature/sprint-14-config-manager"

    # Sprint 15 - QA & Release
    "feature/sprint-15-e2e-tests"
    "feature/sprint-15-performance-tests"
    "feature/sprint-15-integration-tests"
    "feature/sprint-15-documentation"
)

###############################################################################
# Functions
###############################################################################

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check git is installed
    if ! command -v git &> /dev/null; then
        log_error "git is not installed"
        exit 1
    fi
    log_success "git is installed"

    # Check we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        exit 1
    fi
    log_success "In a git repository"

    # Check we're on main branch
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [ "$current_branch" != "main" ]; then
        log_warning "Currently on branch '$current_branch', switching to main"
        git checkout main
    fi
    log_success "On main branch"

    # Verify clean working directory
    if ! git diff-index --quiet HEAD --; then
        log_error "Working directory has uncommitted changes. Please commit or stash them."
        exit 1
    fi
    log_success "Working directory is clean"
}

fetch_latest() {
    log_info "Fetching latest from origin..."
    git fetch origin
    git pull origin main
    log_success "Fetched latest from origin"
}

create_branches() {
    log_info "Creating feature branches..."

    total=${#BRANCH_LIST[@]}
    created=0
    already_exist=0

    for branch in "${BRANCH_LIST[@]}"; do
        # Check if branch already exists locally
        if git rev-parse --verify "$branch" > /dev/null 2>&1; then
            log_warning "Branch '$branch' already exists locally"
            ((already_exist++))
        else
            # Create new branch from main
            git checkout -b "$branch" main
            log_success "Created branch: $branch"
            ((created++))
        fi
    done

    log_info "Created: $created, Already exist: $already_exist, Total: $total"
}

push_branches() {
    log_info "Pushing branches to origin..."

    total=${#BRANCH_LIST[@]}
    pushed=0
    already_pushed=0

    for branch in "${BRANCH_LIST[@]}"; do
        # Check if branch already exists on origin
        if git rev-parse --verify "origin/$branch" > /dev/null 2>&1; then
            log_warning "Branch '$branch' already exists on origin"
            ((already_pushed++))
        else
            # Push new branch to origin
            git push origin "$branch"
            log_success "Pushed branch: $branch"
            ((pushed++))
        fi
    done

    log_info "Pushed: $pushed, Already on origin: $already_pushed, Total: $total"
}

verify_branches() {
    log_info "Verifying branches..."

    local_branches=$(git branch | wc -l)
    remote_branches=$(git branch -r | wc -l)

    log_info "Local branches: $local_branches"
    log_info "Remote branches: $remote_branches"

    # List created branches
    echo -e "\n${BLUE}Feature branches created:${NC}"
    for branch in "${BRANCH_LIST[@]}"; do
        if git rev-parse --verify "$branch" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} $branch"
        else
            echo -e "  ${RED}✗${NC} $branch (missing)"
        fi
    done
}

cleanup() {
    log_info "Cleaning up..."
    git checkout main
    log_success "Returned to main branch"
}

###############################################################################
# Main Execution
###############################################################################

main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Sprint 13-15 Feature Branch Creation${NC}"
    echo -e "${BLUE}========================================${NC}\n"

    check_prerequisites
    fetch_latest
    create_branches
    push_branches
    verify_branches
    cleanup

    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ All feature branches created!${NC}"
    echo -e "${GREEN}========================================${NC}\n"

    log_info "Next steps:"
    echo "  1. Create JIRA Epic and Sprints (SPRINT-13-15-JIRA-SETUP-SCRIPT.md)"
    echo "  2. Create 23 JIRA tickets"
    echo "  3. Assign team members to branches"
    echo "  4. Run team training (Nov 2)"
    echo "  5. Sprint 13 kickoff (Nov 4)"
}

# Run main function
main "$@"
