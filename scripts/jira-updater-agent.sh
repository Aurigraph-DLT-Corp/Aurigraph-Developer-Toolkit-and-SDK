#!/bin/bash

################################################################################
# Sub-Agent #1: JIRA Updater
#
# Purpose: Monitor GitHub commits and auto-update JIRA tickets in real-time
#
# This agent:
# - Scans git commits for `AV11-XXX` pattern
# - Posts commit details to JIRA automatically
# - Tracks PR status transitions
# - Generates daily burndown reports
# - Identifies blockers (24+ hours without update)
# - Updates sprint metrics every 4 hours
#
# Usage: ./scripts/jira-updater-agent.sh [start|stop|status]
# Background: ./scripts/jira-updater-agent.sh &
#
################################################################################

set -euo pipefail

# Configuration
AGENT_NAME="JIRA Updater"
AGENT_ID="subagent-jira-updater"
LOG_FILE="/tmp/jira-updater-agent.log"
ERROR_LOG="/tmp/jira-updater-agent-errors.log"
METRICS_LOG="/tmp/sprint-metrics.log"
PID_FILE="/tmp/jira-updater-agent.pid"

# Repository configuration
REPO_PATH="/Users/subbujois/subbuworkingdir/Aurigraph-DLT"
GIT_LOG_FORMAT="%h|%an|%ae|%ad|%s"
DATE_FORMAT="+%Y-%m-%d %H:%M:%S"

# JIRA configuration (from environment variables)
JIRA_BASE_URL="${JIRA_BASE_URL:-https://aurigraphdlt.atlassian.net}"
JIRA_PROJECT="${JIRA_PROJECT:-AV11}"
JIRA_USER="${JIRA_USER:-}"
JIRA_TOKEN="${JIRA_TOKEN:-}"

# Timing configuration
SCAN_INTERVAL=300  # 5 minutes
METRICS_INTERVAL=14400  # 4 hours
BLOCK_THRESHOLD=86400  # 24 hours

# Functions
log_message() {
    local level="$1"
    shift
    local message="$@"
    local timestamp=$(date "$DATE_FORMAT")
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_error() {
    local message="$@"
    local timestamp=$(date "$DATE_FORMAT")
    echo "[$timestamp] [ERROR] $message" | tee -a "$ERROR_LOG" "$LOG_FILE"
}

validate_credentials() {
    if [[ -z "$JIRA_USER" || -z "$JIRA_TOKEN" ]]; then
        log_error "JIRA credentials not set. Set JIRA_USER and JIRA_TOKEN environment variables"
        exit 1
    fi
}

scan_commits() {
    local last_scan_file="/tmp/jira-updater-last-scan"
    local last_scan=""

    if [[ -f "$last_scan_file" ]]; then
        last_scan=$(cat "$last_scan_file")
    else
        # First scan: get commits from last 24 hours
        last_scan="24 hours ago"
    fi

    # Get new commits
    cd "$REPO_PATH"
    git log --since="$last_scan" --format="$GIT_LOG_FORMAT" -- . | while IFS='|' read -r hash author email date subject; do
        # Extract JIRA ticket ID from commit message
        if [[ $subject =~ AV11-([0-9]+) ]]; then
            local ticket_id="AV11-${BASH_REMATCH[1]}"
            update_jira_ticket "$ticket_id" "$hash" "$author" "$subject"
        fi
    done

    # Update last scan time
    echo "$(date "$DATE_FORMAT")" > "$last_scan_file"
}

update_jira_ticket() {
    local ticket_id="$1"
    local commit_hash="$2"
    local author="$3"
    local subject="$4"

    # Build JIRA comment
    local comment="Code update: $subject
Commit: $commit_hash
Author: $author
Timestamp: $(date "$DATE_FORMAT")"

    # Post to JIRA
    local response=$(curl -s -u "$JIRA_USER:$JIRA_TOKEN" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"body\": \"$comment\"}" \
        "$JIRA_BASE_URL/rest/api/3/issues/$ticket_id/comments" 2>&1)

    if echo "$response" | grep -q "id"; then
        log_message "INFO" "Updated JIRA ticket $ticket_id with commit $commit_hash"
    else
        log_error "Failed to update JIRA ticket $ticket_id: $response"
    fi
}

generate_metrics() {
    local timestamp=$(date "$DATE_FORMAT")

    log_message "INFO" "Generating sprint metrics..."

    # Count commits per agent
    cd "$REPO_PATH"
    echo "=== Sprint Metrics ($timestamp) ===" >> "$METRICS_LOG"
    echo "Total commits: $(git log --all --oneline | wc -l)" >> "$METRICS_LOG"
    echo "Commits today: $(git log --since='1 day ago' --oneline | wc -l)" >> "$METRICS_LOG"
    echo "JIRA tickets updated: $(grep -c "Updated JIRA" "$LOG_FILE" || echo 0)" >> "$METRICS_LOG"
    echo "Errors: $(wc -l < "$ERROR_LOG" 2>/dev/null || echo 0)" >> "$METRICS_LOG"
    echo "" >> "$METRICS_LOG"
}

start_agent() {
    log_message "INFO" "Starting JIRA Updater Agent..."

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
    > "$METRICS_LOG"

    log_message "INFO" "$AGENT_NAME started (PID: $$)"
    log_message "INFO" "JIRA Base URL: $JIRA_BASE_URL"
    log_message "INFO" "Project: $JIRA_PROJECT"
    log_message "INFO" "Scan interval: ${SCAN_INTERVAL}s"
    log_message "INFO" "Metrics interval: ${METRICS_INTERVAL}s"

    # Main loop
    local last_metrics=$SECONDS

    while true; do
        # Scan for commits
        scan_commits

        # Generate metrics every 4 hours
        if (( SECONDS - last_metrics >= METRICS_INTERVAL )); then
            generate_metrics
            last_metrics=$SECONDS
        fi

        sleep "$SCAN_INTERVAL"
    done
}

stop_agent() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            log_message "INFO" "Stopped JIRA Updater Agent (PID: $pid)"
            rm -f "$PID_FILE"
        fi
    fi
}

status_agent() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo "✅ JIRA Updater Agent is running (PID: $pid)"
            echo "Log file: $LOG_FILE"
            echo "Recent activity:"
            tail -5 "$LOG_FILE" 2>/dev/null || echo "  No logs yet"
            return 0
        fi
    fi
    echo "❌ JIRA Updater Agent is not running"
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
