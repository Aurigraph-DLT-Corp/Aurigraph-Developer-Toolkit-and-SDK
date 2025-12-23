#!/bin/bash

################################################################################
# J4C Agents Parallel Execution - Setup Script
#
# This script initializes git worktrees for 5 parallel development agents
# Each agent works independently on a different feature module
#
# Usage: ./setup-j4c-agents.sh
################################################################################

set -e

echo "════════════════════════════════════════════════════════════════"
echo "  J4C Agents Parallel Execution - Setup"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Detect current directory
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKTREES_DIR="$REPO_ROOT/worktrees"

echo "📂 Repository Root: $REPO_ROOT"
echo "📂 Worktrees Directory: $WORKTREES_DIR"
echo ""

# Ensure we're in a git repository
if [ ! -d "$REPO_ROOT/.git" ]; then
    echo "❌ ERROR: Not a git repository. Please run this script from the repo root."
    exit 1
fi

# Check git version (git worktree requires 2.7.0+)
GIT_VERSION=$(git --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
echo "✓ Git version: $GIT_VERSION"
echo ""

# Create worktrees directory
if [ ! -d "$WORKTREES_DIR" ]; then
    mkdir -p "$WORKTREES_DIR"
    echo "✓ Created worktrees directory: $WORKTREES_DIR"
fi

# Fetch latest from origin
echo "📥 Fetching latest from origin..."
cd "$REPO_ROOT"
git fetch origin --quiet
echo "✓ Fetch complete"
echo ""

# Function to create a worktree
create_worktree() {
    local agent_num=$1
    local agent_name=$2
    local feature_name=$3
    local worktree_path="$WORKTREES_DIR/agent-$agent_num"
    local branch_name="feature/$feature_name"

    echo "────────────────────────────────────────────────────────────────"
    echo "📦 Agent $agent_num: $agent_name"
    echo "────────────────────────────────────────────────────────────────"
    echo "Branch: $branch_name"
    echo "Path: $worktree_path"
    echo ""

    # Check if worktree already exists
    if [ -d "$worktree_path" ]; then
        echo "⚠️  Worktree already exists: $worktree_path"
        echo "   Skipping creation..."
        echo ""
        return 0
    fi

    # Check if branch exists on origin
    if git rev-parse --verify "origin/$branch_name" >/dev/null 2>&1; then
        echo "✓ Branch already exists on origin"
        echo "  Creating worktree from existing branch..."
        git worktree add --track "$worktree_path" "origin/$branch_name"
    else
        echo "✓ Creating new branch from main"
        echo "  Creating worktree from main..."
        git worktree add --track -b "$branch_name" "$worktree_path" origin/main
    fi

    # Install dependencies
    echo ""
    echo "📦 Installing npm dependencies..."
    cd "$worktree_path/enterprise-portal/enterprise-portal/frontend"
    npm install --silent 2>/dev/null || npm install

    cd "$REPO_ROOT"
    echo "✓ Setup complete for Agent $agent_num"
    echo ""
}

# Create all 5 worktrees
echo "🚀 Creating Git Worktrees..."
echo ""

create_worktree "1.1" "Asset Registry" "1.1-asset-registry"
create_worktree "1.2" "Ricardian Contracts" "1.2-ricardian-contracts"
create_worktree "1.3" "ActiveContracts" "1.3-active-contracts"
create_worktree "1.4" "Token Management" "1.4-token-management"
create_worktree "1.5" "Portal Integration" "1.5-portal-integration"

# Verify all worktrees
echo "════════════════════════════════════════════════════════════════"
echo "✓ Worktree Creation Complete"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "📋 Worktree Status:"
git worktree list

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ Setup Complete!"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "📝 Next Steps:"
echo ""
echo "1. Each agent should navigate to their worktree:"
echo ""
echo "   Agent 1.1 (Asset Registry):"
echo "   $ cd $WORKTREES_DIR/agent-1.1/enterprise-portal/enterprise-portal/frontend"
echo "   $ npm run dev"
echo ""
echo "   Agent 1.2 (Ricardian Contracts):"
echo "   $ cd $WORKTREES_DIR/agent-1.2/enterprise-portal/enterprise-portal/frontend"
echo "   $ npm run dev"
echo ""
echo "   Agent 1.3 (ActiveContracts):"
echo "   $ cd $WORKTREES_DIR/agent-1.3/enterprise-portal/enterprise-portal/frontend"
echo "   $ npm run dev"
echo ""
echo "   Agent 1.4 (Token Management):"
echo "   $ cd $WORKTREES_DIR/agent-1.4/enterprise-portal/enterprise-portal/frontend"
echo "   $ npm run dev"
echo ""
echo "   Agent 1.5 (Portal Integration):"
echo "   $ cd $WORKTREES_DIR/agent-1.5/enterprise-portal/enterprise-portal/frontend"
echo "   $ npm run dev"
echo ""
echo "2. Each agent can commit to their feature branch:"
echo "   $ git add ."
echo "   $ git commit -m 'feat: Your feature'"
echo "   $ git push origin feature/X.X-module-name"
echo ""
echo "3. Create Pull Requests to develop branch when complete"
echo ""
echo "4. Lead reviews and merges PRs to develop"
echo ""
echo "5. Daily standups at 9:00 AM UTC"
echo ""
echo "📚 Documentation:"
echo "   - WBS Plan: RWA_FEATURES_WBS_AND_UX_PLAN.md"
echo "   - Execution Plan: J4C_PARALLEL_EXECUTION_PLAN.md"
echo ""

# Create per-agent setup scripts
echo ""
echo "📜 Creating per-agent setup scripts..."

create_agent_script() {
    local agent_num=$1
    local agent_name=$2
    local script_path="$REPO_ROOT/agent-${agent_num}-setup.sh"

    cat > "$script_path" << 'EOF'
#!/bin/bash

AGENT_NUM="$1"
AGENT_NAME="$2"
WORKTREE_PATH="$3"
AGENT_DIR="$WORKTREE_PATH/enterprise-portal/enterprise-portal/frontend"

echo "🚀 Setting up Agent $AGENT_NUM: $AGENT_NAME"
echo ""

cd "$AGENT_DIR"

echo "✓ Current directory: $(pwd)"
echo "✓ Branch: $(git branch | grep '*')"
echo ""

echo "📦 Dependencies Status:"
if [ -d "node_modules" ]; then
    echo "✓ Dependencies already installed"
else
    echo "📥 Installing dependencies..."
    npm install
fi

echo ""
echo "✅ Agent setup complete!"
echo ""
echo "Start development:"
echo "  npm run dev"
echo ""
echo "Build for production:"
echo "  npm run build"
echo ""
echo "Run tests:"
echo "  npm test"
echo ""
echo "Commit when ready:"
echo "  git add ."
echo "  git commit -m 'feat: description'"
echo "  git push origin $(git branch | grep '*' | sed 's/* //')"
echo ""
EOF
    chmod +x "$script_path"
    echo "   ✓ Created: $script_path"
}

create_agent_script "1.1" "Asset Registry Agent" "$WORKTREES_DIR/agent-1.1"
create_agent_script "1.2" "Ricardian Contracts Agent" "$WORKTREES_DIR/agent-1.2"
create_agent_script "1.3" "ActiveContracts Agent" "$WORKTREES_DIR/agent-1.3"
create_agent_script "1.4" "Token Management Agent" "$WORKTREES_DIR/agent-1.4"
create_agent_script "1.5" "Portal Integration Agent" "$WORKTREES_DIR/agent-1.5"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🎉 J4C Parallel Execution Setup Complete!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Your 5 agents are ready to start work on their feature modules."
echo "Each agent has their own git worktree for isolated development."
echo ""
