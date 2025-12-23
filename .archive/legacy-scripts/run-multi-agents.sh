#!/bin/bash
################################################################################
# Multi-Agent J4C Execution Script
# Runs multiple AI agents in parallel across Git worktrees
#
# Usage:
#   ./run-multi-agents.sh [agent-count]
#   ./run-multi-agents.sh 5  # Run 5 agents
#   ./run-multi-agents.sh    # Run all available agents
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
MAX_AGENTS="${1:-15}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKTREE_DIR="$PROJECT_ROOT/worktrees"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Multi-Agent J4C Execution - Aurigraph DLT Development         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Detect available agents
echo -e "${CYAN}📊 Detecting Available Agents...${NC}"
AGENTS=($(ls -d $WORKTREE_DIR/agent-* 2>/dev/null | xargs -n1 basename | sort))
AGENT_COUNT=${#AGENTS[@]}

if [ $AGENT_COUNT -eq 0 ]; then
    echo -e "${RED}❌ No agent worktrees found in $WORKTREE_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found $AGENT_COUNT agents${NC}"
echo ""

# Limit to requested count
if [ $MAX_AGENTS -lt $AGENT_COUNT ]; then
    AGENTS=("${AGENTS[@]:0:$MAX_AGENTS}")
    AGENT_COUNT=$MAX_AGENTS
fi

# Display agents
echo -e "${CYAN}🤖 Agent Configuration:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for i in "${!AGENTS[@]}"; do
    AGENT="${AGENTS[$i]}"
    BRANCH=$(cd "$WORKTREE_DIR/$AGENT" && git branch --show-current 2>/dev/null || echo "detached")
    printf "%2d. %-20s Branch: %s\n" $((i+1)) "$AGENT" "$BRANCH"
done
echo ""

# Create agent context files
echo -e "${CYAN}📝 Creating Agent Context Files...${NC}"
for AGENT in "${AGENTS[@]}"; do
    AGENT_DIR="$WORKTREE_DIR/$AGENT"
    CONTEXT_FILE="$AGENT_DIR/.claude-agent-context.md"
    
    cat > "$CONTEXT_FILE" << EOF
# Claude Agent Context: $AGENT

## Agent Information
- **Name**: $AGENT
- **Branch**: $(cd "$AGENT_DIR" && git branch --show-current)
- **Worktree**: $AGENT_DIR
- **Status**: Active
- **Last Synced**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

## Current Task
Review AGENT-ASSIGNMENT-PLAN-SPRINT-14.md for your assigned tasks.

## Quick Commands
\`\`\`bash
# Navigate to worktree
cd $AGENT_DIR

# Build V11 backend
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean package -DskipTests

# Run tests
./mvnw test

# Dev mode (hot reload)
./mvnw quarkus:dev

# Git operations
git status
git add .
git commit -m "feat($AGENT): description"
git push origin $(cd "$AGENT_DIR" && git branch --show-current)
\`\`\`

## Important Files
- AGENT-ASSIGNMENT-PLAN-SPRINT-14.md - Task assignments
- MULTI-AGENT-COORDINATION-GUIDE.md - Coordination rules
- AGENT_QUICKSTART.md - Quick reference

## Agent Coordination
- Daily Standup: Document progress
- Integration: Merge to integration branch daily
- Communication: Update shared docs

## Next Steps
1. Review your assigned task in AGENT-ASSIGNMENT-PLAN-SPRINT-14.md
2. Sync with main: \`git fetch origin && git rebase origin/main\`
3. Start development
4. Run tests before committing
5. Push to feature branch
EOF

    echo -e "${GREEN}✓${NC} Created context for $AGENT"
done
echo ""

# Agent status summary
echo -e "${CYAN}📋 Agent Status Summary:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Agent Count:     $AGENT_COUNT"
echo "Worktree Dir:    $WORKTREE_DIR"
echo "Project Root:    $PROJECT_ROOT"
echo ""

# Show git status for each agent
echo -e "${CYAN}🔍 Git Status Check:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for AGENT in "${AGENTS[@]}"; do
    cd "$WORKTREE_DIR/$AGENT"
    CHANGES=$(git status --short | wc -l | tr -d ' ')
    BRANCH=$(git branch --show-current)
    AHEAD=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")
    
    printf "%-20s │ %-30s │ Changes: %-3s │ Ahead: %s\n" \
        "$AGENT" "$BRANCH" "$CHANGES" "$AHEAD"
done
cd "$PROJECT_ROOT"
echo ""

# Instructions
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  MULTI-AGENT EXECUTION READY                     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ All $AGENT_COUNT agents initialized and ready${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Each agent can now work independently in their worktree"
echo "  2. Navigate to an agent: cd worktrees/agent-1.1"
echo "  3. Review context: cat .claude-agent-context.md"
echo "  4. Start development in that worktree"
echo ""
echo -e "${YELLOW}Parallel Development Commands:${NC}"
echo "  # To view agent assignments:"
echo "  cat AGENT-ASSIGNMENT-PLAN-SPRINT-14.md"
echo ""
echo "  # To sync an agent with main:"
echo "  cd worktrees/agent-1.1 && git fetch origin && git rebase origin/main"
echo ""
echo "  # To build in an agent worktree:"
echo "  cd worktrees/agent-1.1/aurigraph-av10-7/aurigraph-v11-standalone"
echo "  ./mvnw clean package"
echo ""
echo -e "${CYAN}📍 Agent Worktrees Location:${NC}"
echo "  $WORKTREE_DIR"
echo ""
echo -e "${GREEN}🚀 Ready for parallel development!${NC}"
echo ""

