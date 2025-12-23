#!/bin/bash

################################################################################
# Shell Profile Integration Script
#
# This script should be sourced from ~/.bashrc or ~/.zshrc to auto-initialize
# the Agent Framework on every new shell session
#
# Installation:
# 1. Add to ~/.bashrc: source /path/to/Aurigraph-DLT/scripts/shell-profile-integration.sh
# 2. Or add to ~/.zshrc: source /path/to/Aurigraph-DLT/scripts/shell-profile-integration.sh
#
# This will automatically:
# - Initialize framework on session start
# - Check for daily reminder
# - Validate worktrees
# - Make agents available
#
################################################################################

# Auto-detect Aurigraph DLT repository
if [ -z "${AURIGRAPH_DLT_ROOT}" ]; then
    # Try to find it by looking for the characteristic files
    for potential_root in \
        "/Users/subbujois/subbuworkingdir/Aurigraph-DLT" \
        "${HOME}/Aurigraph-DLT" \
        "${HOME}/projects/Aurigraph-DLT" \
        "./"; do

        if [ -f "${potential_root}/.env.agent-framework" ]; then
            export AURIGRAPH_DLT_ROOT="${potential_root}"
            break
        fi
    done
fi

# Only initialize if in an Aurigraph DLT project
if [ -n "${AURIGRAPH_DLT_ROOT}" ] && [ -f "${AURIGRAPH_DLT_ROOT}/.env.agent-framework" ]; then
    # Source the agent framework environment
    source "${AURIGRAPH_DLT_ROOT}/.env.agent-framework" 2>/dev/null || true

    # Only initialize framework once per session
    if [ -z "${AURIGRAPH_FRAMEWORK_INITIALIZED_IN_SESSION}" ]; then
        export AURIGRAPH_FRAMEWORK_INITIALIZED_IN_SESSION=true

        # Silently source the session initialization (redirect to /dev/null to avoid spam)
        if [ -f "${AURIGRAPH_DLT_ROOT}/scripts/agent-framework-session-init.sh" ]; then
            source "${AURIGRAPH_DLT_ROOT}/scripts/agent-framework-session-init.sh" 2>/dev/null || true
        fi
    fi
fi

# Create convenience aliases for framework commands
alias agent-framework-init='source "${AURIGRAPH_DLT_ROOT}/scripts/agent-framework-session-init.sh"'
alias agent-framework-status='cat ~/.aurigraph-framework/session-state.json 2>/dev/null || echo "Framework not initialized"'
alias agent-framework-logs='tail -f ~/.aurigraph-framework/framework.log'
alias worktree-list='git worktree list'
alias worktree-gRPC='cd "${AURIGRAPH_DLT_ROOT}/../Aurigraph-DLT-grpc"'
alias worktree-perf='cd "${AURIGRAPH_DLT_ROOT}/../Aurigraph-DLT-perf"'
alias worktree-tests='cd "${AURIGRAPH_DLT_ROOT}/../Aurigraph-DLT-tests"'
alias worktree-monitoring='cd "${AURIGRAPH_DLT_ROOT}/../Aurigraph-DLT-monitoring"'

# Add scripts to PATH
if [[ ":$PATH:" != *":${AURIGRAPH_DLT_ROOT}/scripts:"* ]]; then
    export PATH="${AURIGRAPH_DLT_ROOT}/scripts:${PATH}"
fi

# Shell Profile Integration Complete
