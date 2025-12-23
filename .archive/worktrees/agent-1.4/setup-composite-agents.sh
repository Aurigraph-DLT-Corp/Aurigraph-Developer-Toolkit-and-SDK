#!/bin/bash

# Composite Token Agents Worktree Setup Script
# Creates 6 git worktrees for parallel Composite Token development (Phase 2)

set -e

REPO_ROOT="/Users/subbujois/subbuworkingdir/Aurigraph-DLT"
WORKTREES_DIR="$REPO_ROOT/worktrees"
BASE_BRANCH="main"
BASE_COMMIT="35007b11"  # Latest commit with all Composite Token documentation

echo "=========================================="
echo "Composite Token Agent Worktree Setup"
echo "=========================================="
echo ""

# Define agents as arrays
AGENT_IDS=("2.1" "2.2" "2.3" "2.4" "2.5" "2.6")
MODULES=("Primary Token Enhancement" "Secondary Token Framework" "Composite Token Creation" "Contract Binding" "Merkle Registry Integration" "Portal Integration")
FEATURES=("primary-token" "secondary-token" "composite-creation" "contract-binding" "merkle-registry" "portal-integration")
EFFORTS=("285" "420" "480" "420" "360" "320")
WEEKS=("3" "4" "5" "6" "7" "8")

echo "Configuration:"
echo "  Repository: $REPO_ROOT"
echo "  Worktrees Directory: $WORKTREES_DIR"
echo "  Base Branch: $BASE_BRANCH"
echo "  Base Commit: $BASE_COMMIT"
echo ""

# Ensure worktrees directory exists
mkdir -p "$WORKTREES_DIR"

# Create each agent's worktree
for idx in "${!AGENT_IDS[@]}"; do
  AGENT_ID="${AGENT_IDS[$idx]}"
  MODULE_NAME="${MODULES[$idx]}"
  FEATURE_NAME="${FEATURES[$idx]}"
  EFFORT="${EFFORTS[$idx]}"
  WEEK="${WEEKS[$idx]}"

  AGENT_DIR="$WORKTREES_DIR/agent-$AGENT_ID"
  FEATURE_BRANCH="feature/$AGENT_ID-$FEATURE_NAME"

  echo "Setting up Agent $AGENT_ID: $MODULE_NAME"
  echo "  Directory: $AGENT_DIR"
  echo "  Branch: $FEATURE_BRANCH"
  echo "  Effort: $EFFORT hours"
  echo "  Timeline: Weeks 1-$WEEK"

  # Check if worktree already exists
  if [ -d "$AGENT_DIR" ]; then
    echo "  ⚠️  Worktree already exists, removing..."
    git worktree remove "$AGENT_DIR" --force 2>/dev/null || true
  fi

  # Create new worktree and branch
  echo "  Creating worktree..."
  git worktree add "$AGENT_DIR" -b "$FEATURE_BRANCH" "$BASE_COMMIT" 2>/dev/null

  # Verify worktree creation
  if [ -d "$AGENT_DIR" ]; then
    echo "  ✓ Worktree created successfully"

    # Navigate to worktree and install dependencies
    cd "$AGENT_DIR"

    # Check if npm dependencies need to be installed
    if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
      echo "  Installing npm dependencies... (this may take a few minutes)"
      npm install --silent 2>/dev/null || echo "  ⚠️  npm install skipped"
      echo "  ✓ Dependencies handled"
    fi

    # Create agent-specific metadata file
    cat > ".agent-metadata.json" << EOF
{
  "agent_id": "$AGENT_ID",
  "agent_name": "Agent $AGENT_ID",
  "module": "$MODULE_NAME",
  "feature_branch": "$FEATURE_BRANCH",
  "effort_hours": $EFFORT,
  "timeline_weeks": $WEEK,
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "ready_for_development",
  "responsibilities": [
    "Implement $MODULE_NAME module",
    "Write unit tests (60-95 tests target)",
    "Create REST API endpoints",
    "Develop React components",
    "Submit PR for code review"
  ]
}
EOF
    echo "  ✓ Agent metadata created"

    # Return to repo root
    cd "$REPO_ROOT"
    echo "  ✓ Agent $AGENT_ID ready for development"
  else
    echo "  ✗ Failed to create worktree"
    exit 1
  fi

  echo ""
done

echo "=========================================="
echo "Worktree Setup Summary"
echo "=========================================="
echo ""

# Display worktree list for Composite Token agents
echo "Composite Token Agent Worktrees:"
git worktree list | grep "agent-2\." || echo "  No composite agent worktrees found"

echo ""
echo "All Composite Token Agents Created:"
echo ""

for idx in "${!AGENT_IDS[@]}"; do
  AGENT_ID="${AGENT_IDS[$idx]}"
  MODULE_NAME="${MODULES[$idx]}"
  FEATURE_NAME="${FEATURES[$idx]}"
  EFFORT="${EFFORTS[$idx]}"
  WEEK="${WEEKS[$idx]}"

  echo "  Agent $AGENT_ID: $MODULE_NAME"
  echo "    Location: $WORKTREES_DIR/agent-$AGENT_ID"
  echo "    Branch: feature/$AGENT_ID-$FEATURE_NAME"
  echo "    Effort: $EFFORT hours (${WEEK} weeks)"
  echo ""
done

echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "1. Verify all 6 agent worktrees are created:"
echo "   git worktree list | grep 'agent-2'"
echo ""
echo "2. Review Agent 2.1 initial setup (Primary Token):"
echo "   cd $WORKTREES_DIR/agent-2.1"
echo "   cat .agent-metadata.json"
echo ""
echo "3. Review development guidelines:"
echo "   cat J4C_LAUNCH_GUIDE.md"
echo ""
echo "4. Check git status in Agent 2.1:"
echo "   cd $WORKTREES_DIR/agent-2.1"
echo "   git log --oneline -5"
echo "   git status"
echo ""
echo "5. Review progress dashboard:"
echo "   cat AGENT_COORDINATION_DASHBOARD.md"
echo ""
echo "=========================================="
echo "✓ Composite Token Agent Worktrees Ready!"
echo "=========================================="
