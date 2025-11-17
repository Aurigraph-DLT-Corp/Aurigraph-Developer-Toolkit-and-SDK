#!/bin/bash

###############################################################################
# Multi-Agent Environment Initialization Script
# Automatically sets up development environment for all Claude Code agents
# Usage: ./init-agent-environment.sh [agent-id] [all|clean]
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_ROOT="/Users/subbujois/subbuworkingdir/Aurigraph-DLT"
WORKTREES_DIR="${REPO_ROOT}/worktrees"
V11_STANDALONE="${REPO_ROOT}/aurigraph-av10-7/aurigraph-v11-standalone"

# Agent list
AGENTS=(
  "agent-1.1:feature/1.1-rest-grpc-bridge"
  "agent-1.2:feature/1.2-consensus-grpc"
  "agent-1.3:feature/1.3-contract-grpc"
  "agent-1.4:feature/1.4-crypto-grpc"
  "agent-1.5:feature/1.5-storage-grpc"
  "agent-2.1:feature/2.1-traceability-grpc"
  "agent-2.2:feature/2.2-secondary-token"
  "agent-2.3:feature/2.3-composite-creation"
  "agent-2.4:feature/2.4-contract-binding"
  "agent-2.5:feature/2.5-merkle-registry"
  "agent-2.6:feature/2.6-portal-integration"
  "agent-db:detached"
  "agent-tests:detached"
  "agent-frontend:detached"
  "agent-ws:detached"
)

###############################################################################
# Functions
###############################################################################

print_header() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${YELLOW}→ $1${NC}"
}

# Initialize a single agent's environment
init_single_agent() {
  local agent_dir="$1"
  local branch="$2"

  if [ ! -d "$agent_dir" ]; then
    print_error "Agent directory not found: $agent_dir"
    return 1
  fi

  cd "$agent_dir"
  print_info "Initializing $(basename $agent_dir)..."

  # Ensure we're on the correct branch
  if [ "$branch" != "detached" ]; then
    git fetch origin 2>/dev/null || true
    git checkout "$branch" 2>/dev/null || git checkout -b "$branch" 2>/dev/null || true
    git pull origin "$branch" 2>/dev/null || true
  fi

  # Create .claude-agent-context.md if it doesn't exist
  if [ ! -f ".claude-agent-context.md" ]; then
    create_agent_context "$agent_dir" "$branch"
  fi

  print_success "$(basename $agent_dir) initialized"
}

# Create agent context file
create_agent_context() {
  local agent_dir="$1"
  local branch="$2"
  local agent_name=$(basename "$agent_dir")

  cat > "$agent_dir/.claude-agent-context.md" <<'EOF'
# Claude Agent Context

## Agent Information
- **Name**: AGENT_NAME
- **Branch**: BRANCH_NAME
- **Worktree**: WORKTREE_PATH
- **Status**: Active
- **Last Synced**: TIMESTAMP

## Current Task
See AGENT-ASSIGNMENT-PLAN-SPRINT-14.md for current sprint assignment.

## Development Setup
### Build Commands
```bash
# From worktree root, build V11
cd ../../aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean compile     # Fast compile check
./mvnw clean package     # Full build
./mvnw test              # Run tests
```

### Dev Mode
```bash
cd ../../aurigraph-av10-7/aurigraph-v11-standalone
./mvnw quarkus:dev      # Start dev server with hot reload
```

### Git Commands
```bash
# View changes
git status
git diff

# Commit changes
git add .
git commit -m "feat: description"

# Push to remote
git push origin BRANCH_NAME

# Keep in sync with main
git fetch origin
git rebase origin/main
```

## Code Review Checklist
Before creating a PR:
- [ ] Code compiles without errors (`mvnw clean compile`)
- [ ] All tests pass (`mvnw test`)
- [ ] Test coverage ≥80% for new code
- [ ] Follow existing code style (Lombok, Java conventions)
- [ ] Update documentation if APIs changed
- [ ] Commit messages are descriptive

## Important Files
- `AGENT-ASSIGNMENT-PLAN-SPRINT-14.md` - Sprint assignments
- `MULTI-AGENT-COORDINATION-GUIDE.md` - Coordination rules
- `aurigraph-av10-7/CLAUDE.md` - V11 development guide
- `ARCHITECTURE.md` - System architecture

## Common Issues & Fixes

### Maven Build Issues
```bash
# Clean rebuild
./mvnw clean
./mvnw clean package -DskipTests

# If Lombok issues occur
./mvnw clean compile -e -DskipTests
```

### Port Conflicts
```bash
# Check what's using port 9003
lsof -i :9003
kill -9 <PID>
```

### Git Conflicts
```bash
# If rebase conflicts occur
git rebase --abort              # Abort and try again
# OR
git status                      # See conflicted files
# ... edit files to resolve ...
git add <resolved-files>
git rebase --continue
```

## Next Steps
1. Review AGENT-ASSIGNMENT-PLAN-SPRINT-14.md for your specific task
2. Follow development setup instructions above
3. Implement assigned feature
4. Run tests and ensure coverage
5. Create PR when complete

## Questions or Blockers?
- Check MULTI-AGENT-COORDINATION-GUIDE.md for protocols
- Review previous sprint reports for context
- Check git log for recent changes
- Contact sprint lead via TODO.md

---
**Auto-generated**: TIMESTAMP
**Context Version**: 1.0
EOF

  # Replace placeholders
  sed -i "" "s|AGENT_NAME|$agent_name|g" "$agent_dir/.claude-agent-context.md"
  sed -i "" "s|BRANCH_NAME|$branch|g" "$agent_dir/.claude-agent-context.md"
  sed -i "" "s|WORKTREE_PATH|$agent_dir|g" "$agent_dir/.claude-agent-context.md"
  sed -i "" "s|TIMESTAMP|$(date -u +'%Y-%m-%d %H:%M:%S UTC')|g" "$agent_dir/.claude-agent-context.md"

  print_success "Created context file: $agent_dir/.claude-agent-context.md"
}

# Check Java and Maven installation
check_prerequisites() {
  print_info "Checking prerequisites..."

  # Check Java
  if ! command -v java &> /dev/null; then
    print_error "Java is not installed or not in PATH"
    return 1
  fi
  JAVA_VERSION=$(java -version 2>&1 | grep -oP '(?<=version ")[^"]*' | head -1)
  print_success "Java $JAVA_VERSION found"

  # Check Maven
  if ! command -v mvn &> /dev/null; then
    print_info "Maven not found in PATH, checking for Maven wrapper..."
    if [ ! -f "$V11_STANDALONE/mvnw" ]; then
      print_error "Maven wrapper not found in $V11_STANDALONE"
      return 1
    fi
  else
    MVN_VERSION=$(mvn -v 2>&1 | head -1)
    print_success "$MVN_VERSION"
  fi

  # Check Git
  if ! command -v git &> /dev/null; then
    print_error "Git is not installed"
    return 1
  fi
  print_success "Git $(git --version | cut -d' ' -f3) found"

  return 0
}

# Initialize all agents
init_all_agents() {
  print_header "Initializing All Agent Environments"

  local success_count=0
  local failure_count=0

  for agent in "${AGENTS[@]}"; do
    IFS=':' read -r agent_name branch <<< "$agent"
    agent_dir="${WORKTREES_DIR}/${agent_name}"

    if init_single_agent "$agent_dir" "$branch"; then
      ((success_count++))
    else
      ((failure_count++))
    fi
  done

  echo ""
  print_header "Initialization Summary"
  echo "Total Agents: ${#AGENTS[@]}"
  print_success "Initialized: $success_count"
  if [ $failure_count -gt 0 ]; then
    print_error "Failed: $failure_count"
  fi
}

# Clean agent environments
clean_all_agents() {
  print_header "Cleaning Agent Environments"

  for agent in "${AGENTS[@]}"; do
    IFS=':' read -r agent_name branch <<< "$agent"
    agent_dir="${WORKTREES_DIR}/${agent_name}"

    if [ -d "$agent_dir" ]; then
      cd "$agent_dir"
      print_info "Cleaning $(basename $agent_dir)..."

      # Remove generated files but keep worktree
      git clean -fd 2>/dev/null || true
      git reset --hard HEAD 2>/dev/null || true

      print_success "Cleaned $(basename $agent_dir)"
    fi
  done
}

# Show agent status
show_agent_status() {
  print_header "Agent Status Report"

  for agent in "${AGENTS[@]}"; do
    IFS=':' read -r agent_name branch <<< "$agent"
    agent_dir="${WORKTREES_DIR}/${agent_name}"

    if [ -d "$agent_dir" ]; then
      cd "$agent_dir"
      current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
      commit_hash=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
      commit_msg=$(git log -1 --pretty=%B 2>/dev/null | head -1 || echo "unknown")

      echo -e "${BLUE}$agent_name${NC} ($current_branch)"
      echo "  Commit: $commit_hash - $commit_msg"
      echo "  Path: $agent_dir"
      echo ""
    fi
  done
}

###############################################################################
# Main
###############################################################################

main() {
  # Parse arguments
  mode="all"
  agent_filter=""

  if [ $# -gt 0 ]; then
    if [ "$1" == "clean" ]; then
      mode="clean"
    elif [ "$1" == "status" ]; then
      mode="status"
    elif [ "$1" == "all" ] || [ "$1" == "init" ]; then
      mode="all"
    else
      agent_filter="$1"
      mode="single"
    fi
  fi

  # Change to repo root
  cd "$REPO_ROOT"

  # Check prerequisites
  if ! check_prerequisites; then
    print_error "Prerequisites check failed"
    exit 1
  fi

  echo ""

  # Execute mode
  case "$mode" in
    "all")
      init_all_agents
      ;;
    "single")
      agent_dir="${WORKTREES_DIR}/${agent_filter}"
      # Find branch for this agent
      for agent in "${AGENTS[@]}"; do
        IFS=':' read -r agent_name branch <<< "$agent"
        if [ "$agent_name" == "$agent_filter" ]; then
          init_single_agent "$agent_dir" "$branch"
          break
        fi
      done
      ;;
    "clean")
      clean_all_agents
      ;;
    "status")
      show_agent_status
      ;;
    *)
      print_error "Unknown mode: $mode"
      exit 1
      ;;
  esac

  echo ""
  print_header "Done!"
  echo "Next steps:"
  echo "1. cd worktrees/<agent-name>"
  echo "2. Review .claude-agent-context.md"
  echo "3. Check AGENT-ASSIGNMENT-PLAN-SPRINT-14.md for your task"
  echo "4. Start development!"
}

# Run main
main "$@"
