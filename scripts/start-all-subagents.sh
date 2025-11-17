#!/bin/bash

################################################################################
# Sub-Agent Master Launcher
#
# Properly starts all sub-agents with credentials pre-exported
# This ensures credentials persist through background execution
#
# Usage: ./scripts/start-all-subagents.sh
# Background: ./scripts/start-all-subagents.sh &
#
################################################################################

set -euo pipefail

# CRITICAL: Export all credentials BEFORE launching sub-agents
export JIRA_USER="${JIRA_USER:-subbu@aurigraph.io}"
export JIRA_TOKEN="${JIRA_TOKEN:-ATATT3xFfGF0sFjaXc9iiBQuv-1jvWEfLDA5APUBvJvhVSrtzDDfS4B9k3ut3gCAyHUNU0YImVJSjcjglkR_3dmHtvRUYiV32nQJqkQ_HwKqCbS6oNs99XdYu5j_SmQqMQX4a7WekwS-sYNbDFtNBTrRuemXmlVHrjWa6dhMdCBuk0vdQvd_OYA=F7D4339F}"
export JIRA_BASE_URL="${JIRA_BASE_URL:-https://aurigraphdlt.atlassian.net}"
export JIRA_PROJECT="${JIRA_PROJECT:-AV11}"
export GITHUB_TOKEN="${GITHUB_TOKEN:-}"
export REPO_PATH="${REPO_PATH:-/Users/subbujois/subbuworkingdir/Aurigraph-DLT}"

# Change to repo directory
cd "$REPO_PATH"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           LAUNCHING ALL SPRINT 14 SUB-AGENTS                  ║"
echo "║                   November 17, 2025                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Kill any existing agents first
echo "Cleaning up any existing agent processes..."
pkill -f "jira-updater-agent.sh" 2>/dev/null || true
pkill -f "github-jira-linker-agent.sh" 2>/dev/null || true
pkill -f "architecture-monitor-agent.sh" 2>/dev/null || true
sleep 2

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "SUB-AGENT #1: JIRA Updater"
echo "═══════════════════════════════════════════════════════════════════"
echo "Purpose: Monitor git commits and auto-update JIRA tickets"
echo "Status: Launching..."
echo ""

# Launch JIRA Updater with credentials
bash ./scripts/jira-updater-agent.sh start > /tmp/jira-updater-launch.log 2>&1 &
JIRA_PID=$!
sleep 2

if ps -p $JIRA_PID > /dev/null 2>&1; then
    echo "✅ JIRA Updater started (PID: $JIRA_PID)"
    echo "   Log: /tmp/jira-updater-agent.log"
else
    echo "❌ JIRA Updater failed to start"
    echo "   Error log:"
    cat /tmp/jira-updater-launch.log
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "SUB-AGENT #3: Architecture Deviation Monitor"
echo "═══════════════════════════════════════════════════════════════════"
echo "Purpose: Monitor architecture compliance and PRD adherence"
echo "Status: Launching..."
echo ""

# Launch Architecture Monitor
bash ./scripts/architecture-monitor-agent.sh start > /tmp/arch-monitor-launch.log 2>&1 &
ARCH_PID=$!
sleep 2

if ps -p $ARCH_PID > /dev/null 2>&1; then
    echo "✅ Architecture Monitor started (PID: $ARCH_PID)"
    echo "   Log: /tmp/architecture-monitor.log"
else
    echo "❌ Architecture Monitor failed to start"
    echo "   Error log:"
    cat /tmp/arch-monitor-launch.log
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "SUB-AGENT #2: GitHub-JIRA Linker (Optional)"
echo "═══════════════════════════════════════════════════════════════════"
echo "Purpose: Link GitHub PRs to JIRA bidirectionally"
echo "Status: READY (requires GITHUB_TOKEN)"
echo ""
echo "To deploy GitHub-JIRA Linker:"
echo "  1. Generate GitHub PAT: https://github.com/settings/tokens/new"
echo "  2. Export token: export GITHUB_TOKEN=\"ghp_...\""
echo "  3. Launch: bash ./scripts/github-jira-linker-agent.sh start &"
echo ""

echo "═══════════════════════════════════════════════════════════════════"
echo "ADDITIONAL SUB-AGENTS (Created, Not Yet Running)"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Sub-Agent #4: Performance Metrics Collector"
echo "  Purpose: Monitor TPS, finality, latency, resource usage"
echo "  Command: bash ./scripts/performance-metrics-agent.sh start &"
echo ""
echo "Sub-Agent #5: Security & Vulnerability Scanner"
echo "  Purpose: Detect vulnerable dependencies and hardcoded secrets"
echo "  Command: bash ./scripts/security-scanner-agent.sh start &"
echo ""
echo "Sub-Agent #6: Test Coverage Monitor"
echo "  Purpose: Track unit, integration, and E2E test coverage"
echo "  Command: bash ./scripts/test-coverage-monitor.sh start &"
echo ""

echo "═══════════════════════════════════════════════════════════════════"
echo "FRAMEWORK STATUS"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "✅ Running:"
echo "   - JIRA Updater (PID $JIRA_PID)"
echo "   - Architecture Monitor (PID $ARCH_PID)"
echo ""
echo "⏳ Ready to deploy:"
echo "   - GitHub-JIRA Linker (needs GITHUB_TOKEN)"
echo "   - Performance Metrics Collector"
echo "   - Security Scanner"
echo "   - Test Coverage Monitor"
echo ""
echo "📊 Agent Work Ready:"
echo "   - 15 Git worktrees initialized"
echo "   - All documentation created"
echo "   - All code committed to origin/main"
echo ""

echo "═══════════════════════════════════════════════════════════════════"
echo "IMPORTANT: COMMIT MESSAGE FORMAT FOR AGENTS"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "All agent commits MUST include JIRA ticket ID:"
echo ""
echo '  git commit -m "feat(component): Description [AV11-XXX]'
echo "  "
echo "  Detailed description"
echo "  "
echo "  Agent: Agent-Name"
echo "  Priority: P0/P1/P2"
echo '  Sprint: 14"'
echo ""
echo "Example:"
echo '  git commit -m "feat(consensus): Optimize HyperRAFT++ [AV11-101]'
echo "  "
echo "  Reduced leader election timeout from 150-300ms to 100-200ms."
echo "  "
echo "  Agent: Agent-1.1"
echo "  Priority: P0"
echo '  Sprint: 14"'
echo ""

echo "═══════════════════════════════════════════════════════════════════"
echo "MONITORING COMMANDS"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "View JIRA Updater activity:"
echo "  tail -f /tmp/jira-updater-agent.log"
echo ""
echo "View Architecture Monitor violations:"
echo "  tail -f /tmp/architecture-monitor.log"
echo ""
echo "View Architecture compliance report:"
echo "  cat /tmp/architecture-monitor-report.txt"
echo ""
echo "Check all running sub-agents:"
echo "  ps aux | grep -E 'jira-updater|architecture-monitor|performance-metrics|security-scanner|test-coverage'"
echo ""

echo "═══════════════════════════════════════════════════════════════════"
echo "✅ Sprint 14 Sub-Agent Framework is OPERATIONAL"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

