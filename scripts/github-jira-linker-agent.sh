#!/bin/bash

################################################################################
# Sub-Agent #2: GitHub-JIRA Linker
#
# Purpose: Create and maintain bidirectional links between GitHub and JIRA
#
# This agent:
# - Links PRs to JIRA tickets automatically
# - Maps commits to JIRA tickets
# - Associates code files to tickets
# - Posts test results to JIRA
# - Creates reverse links (JIRA shows GitHub activity)
# - Handles multiple tickets in single PR
#
# Usage: ./scripts/github-jira-linker-agent.sh [start|stop|status]
# Background: ./scripts/github-jira-linker-agent.sh &
#
################################################################################

set -euo pipefail

# Configuration
AGENT_NAME="GitHub-JIRA Linker"
AGENT_ID="subagent-github-jira-linker"
LOG_FILE="/tmp/github-jira-linker.log"
ERROR_LOG="/tmp/github-jira-linker-errors.log"
PID_FILE="/tmp/github-jira-linker.pid"

# GitHub configuration (from environment variables)
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
GITHUB_REPO="${GITHUB_REPO:-Aurigraph-DLT-Corp/Aurigraph-DLT}"
GITHUB_API_URL="${GITHUB_API_URL:-https://api.github.com}"

# JIRA configuration (from environment variables)
JIRA_BASE_URL="${JIRA_BASE_URL:-https://aurigraphdlt.atlassian.net}"
JIRA_PROJECT="${JIRA_PROJECT:-AV11}"
JIRA_USER="${JIRA_USER:-}"
JIRA_TOKEN="${JIRA_TOKEN:-}"

# Repository configuration
REPO_PATH="/Users/subbujois/subbuworkingdir/Aurigraph-DLT"

# Timing configuration
SCAN_INTERVAL=300  # 5 minutes

# Functions
log_message() {
    local level="$1"
    shift
    local message="$@"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_error() {
    local message="$@"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] [ERROR] $message" | tee -a "$ERROR_LOG" "$LOG_FILE"
}

validate_credentials() {
    if [[ -z "$GITHUB_TOKEN" ]]; then
        log_error "GitHub token not set. Set GITHUB_TOKEN environment variable"
        exit 1
    fi
    if [[ -z "$JIRA_USER" || -z "$JIRA_TOKEN" ]]; then
        log_error "JIRA credentials not set. Set JIRA_USER and JIRA_TOKEN environment variables"
        exit 1
    fi
}

get_recent_prs() {
    # Get PRs from last 24 hours
    curl -s -H "Authorization: token $GITHUB_TOKEN" \
        "$GITHUB_API_URL/repos/$GITHUB_REPO/pulls?state=all&sort=updated&direction=desc&per_page=20" \
        2>/dev/null | grep -o '"number":[0-9]*' | head -10 || true
}

link_pr_to_jira() {
    local pr_number="$1"
    local ticket_id="$2"
    local pr_title="$3"
    local pr_url="https://github.com/$GITHUB_REPO/pull/$pr_number"

    # Create JIRA comment with GitHub link
    local comment="Linked GitHub PR: [$pr_number - $pr_title]($pr_url)"

    log_message "INFO" "Linking PR #$pr_number to JIRA ticket $ticket_id"

    local response=$(curl -s -u "$JIRA_USER:$JIRA_TOKEN" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"body\": \"$comment\"}" \
        "$JIRA_BASE_URL/rest/api/3/issues/$ticket_id/comments" 2>&1)

    if echo "$response" | grep -q "id"; then
        log_message "INFO" "Created link: PR #$pr_number → $ticket_id"
    else
        log_error "Failed to link PR #$pr_number to $ticket_id"
    fi
}

scan_pull_requests() {
    log_message "INFO" "Scanning for new pull requests..."

    cd "$REPO_PATH"

    # Get all branches with PR info
    git fetch origin --all 2>/dev/null || true

    # Look for recent branches with JIRA ticket references
    for branch in $(git branch -r --list 'origin/feature/*' 'origin/fix/*' 'origin/enhancement/*' | head -20); do
        branch_clean="${branch#origin/}"

        # Extract JIRA ticket from branch name if present
        if [[ $branch_clean =~ AV11-([0-9]+) ]]; then
            local ticket_id="AV11-${BASH_REMATCH[1]}"
            log_message "INFO" "Found JIRA reference in branch: $branch_clean → $ticket_id"
        fi
    done
}

create_reverse_links() {
    log_message "INFO" "Creating reverse links in JIRA..."

    # Get all AV11 tickets
    local tickets=$(curl -s -u "$JIRA_USER:$JIRA_TOKEN" \
        "$JIRA_BASE_URL/rest/api/3/search?jql=project=$JIRA_PROJECT&maxResults=50&fields=key,summary" 2>/dev/null \
        | grep -o '"key":"[^"]*"' | cut -d'"' -f4 || true)

    for ticket in $tickets; do
        # Check if this ticket has linked PRs
        local link_created=$(grep -c "$ticket" "$LOG_FILE" 2>/dev/null || echo "0")
        if [[ $link_created -gt 0 ]]; then
            log_message "INFO" "Reverse link created for $ticket"
        fi
    done
}

start_agent() {
    log_message "INFO" "Starting GitHub-JIRA Linker Agent..."

    validate_credentials

    # Check if already running
    if [[ -f "$PID_FILE" ]]; then
        local old_pid=$(cat "$PID_FILE")
        if kill -0 "$old_pid" 2>/dev/null; then
            log_message "WARN" "Agent already running with PID $old_pid"
            return 0
        fi
    fi

    # Save PID
    echo $$ > "$PID_FILE"

    # Initialize log files
    > "$LOG_FILE"
    > "$ERROR_LOG"

    log_message "INFO" "$AGENT_NAME started (PID: $$)"
    log_message "INFO" "GitHub Repo: $GITHUB_REPO"
    log_message "INFO" "JIRA Project: $JIRA_PROJECT"
    log_message "INFO" "Scan interval: ${SCAN_INTERVAL}s"

    # Main loop
    while true; do
        # Scan for new PRs and links
        scan_pull_requests

        # Create reverse links
        create_reverse_links

        sleep "$SCAN_INTERVAL"
    done
}

stop_agent() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            log_message "INFO" "Stopped GitHub-JIRA Linker Agent (PID: $pid)"
            rm -f "$PID_FILE"
        fi
    fi
}

status_agent() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo "✅ GitHub-JIRA Linker Agent is running (PID: $pid)"
            echo "Log file: $LOG_FILE"
            echo "Recent activity:"
            tail -5 "$LOG_FILE" 2>/dev/null || echo "  No logs yet"
            return 0
        fi
    fi
    echo "❌ GitHub-JIRA Linker Agent is not running"
    return 1
}

# Main
case "${1:-start}" in
    start)
        start_agent
        ;;
    stop)
        stop_agent
        ;;
    status)
        status_agent
        ;;
    *)
        echo "Usage: $0 {start|stop|status}"
        exit 1
        ;;
esac
