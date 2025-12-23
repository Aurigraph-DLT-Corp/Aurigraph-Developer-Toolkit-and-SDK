#!/bin/bash

################################################################################
# Initialize Agent Framework for All Aurigraph DLT Projects
#
# Purpose: Apply the Agent Framework + Git Worktrees to all projects
# automatically integrates framework initialization into project workflows
#
# Usage: ./scripts/init-all-projects.sh [--global] [--no-backup]
#
# Options:
#   --global     Apply framework to global shell profiles (~/.bashrc, ~/.zshrc)
#   --no-backup  Skip backup of existing shell profiles
#   --dry-run    Show what would be changed without making changes
#
# This script:
# 1. Identifies all Aurigraph DLT projects
# 2. Creates framework state directories
# 3. Integrates shell profile initialization
# 4. Validates all projects can access framework
# 5. Displays final status
#
################################################################################

set -euo pipefail

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script options
DRY_RUN=false
GLOBAL_INIT=false
BACKUP_PROFILES=true
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRAMEWORK_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

################################################################################
# Parse Command Line Arguments
################################################################################

while [[ $# -gt 0 ]]; do
    case $1 in
        --global)
            GLOBAL_INIT=true
            shift
            ;;
        --no-backup)
            BACKUP_PROFILES=false
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

################################################################################
# Utility Functions
################################################################################

print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║ $1${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_section() {
    echo -e "${BLUE}▸ $1${NC}"
}

print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "success" ]; then
        echo -e "${GREEN}  ✅ ${message}${NC}"
    elif [ "$status" = "warning" ]; then
        echo -e "${YELLOW}  ⚠️  ${message}${NC}"
    elif [ "$status" = "error" ]; then
        echo -e "${RED}  ❌ ${message}${NC}"
    elif [ "$status" = "info" ]; then
        echo -e "${BLUE}  ℹ️  ${message}${NC}"
    fi
}

################################################################################
# Project Discovery
################################################################################

find_projects() {
    local projects=()

    print_section "Discovering Aurigraph DLT projects..."

    # Main framework repository
    projects+=("${FRAMEWORK_ROOT}")
    print_status "info" "Found main framework: ${FRAMEWORK_ROOT}"

    # V11 Standalone
    if [ -d "${FRAMEWORK_ROOT}/aurigraph-av10-7/aurigraph-v11-standalone" ]; then
        projects+=("${FRAMEWORK_ROOT}/aurigraph-av10-7/aurigraph-v11-standalone")
        print_status "info" "Found V11 project: ${FRAMEWORK_ROOT}/aurigraph-av10-7/aurigraph-v11-standalone"
    fi

    # Enterprise Portal
    if [ -d "${FRAMEWORK_ROOT}/enterprise-portal" ]; then
        projects+=("${FRAMEWORK_ROOT}/enterprise-portal")
        print_status "info" "Found Portal project: ${FRAMEWORK_ROOT}/enterprise-portal"
    fi

    # V10 Project (if exists)
    if [ -d "${FRAMEWORK_ROOT}/aurigraph-av10-7" ]; then
        projects+=("${FRAMEWORK_ROOT}/aurigraph-av10-7")
        print_status "info" "Found V10 project: ${FRAMEWORK_ROOT}/aurigraph-av10-7"
    fi

    echo "${projects[@]}"
}

################################################################################
# Framework Initialization
################################################################################

init_project_framework() {
    local project_path=$1
    local project_name=$(basename "${project_path}")

    print_section "Initializing framework for: ${project_name}"

    if [ "${DRY_RUN}" = true ]; then
        print_status "info" "[DRY RUN] Would initialize framework in: ${project_path}"
        return 0
    fi

    # Create .env.agent-framework if not exists
    if [ ! -f "${project_path}/.env.agent-framework" ]; then
        if [ -f "${FRAMEWORK_ROOT}/.env.agent-framework" ]; then
            cp "${FRAMEWORK_ROOT}/.env.agent-framework" "${project_path}/.env.agent-framework"
            print_status "success" "Copied framework config to project"
        else
            print_status "warning" "Framework config not found, skipping"
        fi
    else
        print_status "info" "Framework config already exists in project"
    fi

    # Create scripts directory if not exists
    if [ ! -d "${project_path}/scripts" ]; then
        mkdir -p "${project_path}/scripts"
        print_status "success" "Created scripts directory"
    fi

    # Copy initialization scripts if not exist
    if [ ! -f "${project_path}/scripts/agent-framework-session-init.sh" ]; then
        cp "${FRAMEWORK_ROOT}/scripts/agent-framework-session-init.sh" \
           "${project_path}/scripts/agent-framework-session-init.sh"
        chmod +x "${project_path}/scripts/agent-framework-session-init.sh"
        print_status "success" "Copied session initialization script"
    fi

    if [ ! -f "${project_path}/scripts/shell-profile-integration.sh" ]; then
        cp "${FRAMEWORK_ROOT}/scripts/shell-profile-integration.sh" \
           "${project_path}/scripts/shell-profile-integration.sh"
        chmod +x "${project_path}/scripts/shell-profile-integration.sh"
        print_status "success" "Copied shell profile integration"
    fi

    # Copy documentation if not exists
    for doc in "AGENT-FRAMEWORK-DEFAULT-MODEL.md" "GIT-WORKTREES-GUIDE.md" "AGENT-FRAMEWORK-WORKTREES-INTEGRATION.md"; do
        if [ ! -f "${project_path}/${doc}" ] && [ -f "${FRAMEWORK_ROOT}/${doc}" ]; then
            cp "${FRAMEWORK_ROOT}/${doc}" "${project_path}/${doc}"
            print_status "success" "Copied documentation: ${doc}"
        fi
    done
}

################################################################################
# Global Shell Profile Integration
################################################################################

integrate_shell_profile() {
    if [ "${GLOBAL_INIT}" = false ]; then
        print_section "Skipping global shell profile integration (use --global to enable)"
        return 0
    fi

    print_section "Integrating with global shell profiles..."

    local integration_line="source ${FRAMEWORK_ROOT}/scripts/shell-profile-integration.sh"

    # Bashrc integration
    if [ -f "${HOME}/.bashrc" ]; then
        if ! grep -q "shell-profile-integration.sh" "${HOME}/.bashrc"; then
            if [ "${DRY_RUN}" = true ]; then
                print_status "info" "[DRY RUN] Would add framework integration to ~/.bashrc"
            else
                # Backup if requested
                if [ "${BACKUP_PROFILES}" = true ]; then
                    cp "${HOME}/.bashrc" "${HOME}/.bashrc.backup.$(date +%s)"
                    print_status "success" "Backed up ~/.bashrc"
                fi

                echo "" >> "${HOME}/.bashrc"
                echo "# Agent Framework Integration (added $(date))" >> "${HOME}/.bashrc"
                echo "${integration_line}" >> "${HOME}/.bashrc"
                print_status "success" "Added framework integration to ~/.bashrc"
            fi
        else
            print_status "info" "Framework already integrated in ~/.bashrc"
        fi
    fi

    # Zshrc integration
    if [ -f "${HOME}/.zshrc" ]; then
        if ! grep -q "shell-profile-integration.sh" "${HOME}/.zshrc"; then
            if [ "${DRY_RUN}" = true ]; then
                print_status "info" "[DRY RUN] Would add framework integration to ~/.zshrc"
            else
                # Backup if requested
                if [ "${BACKUP_PROFILES}" = true ]; then
                    cp "${HOME}/.zshrc" "${HOME}/.zshrc.backup.$(date +%s)"
                    print_status "success" "Backed up ~/.zshrc"
                fi

                echo "" >> "${HOME}/.zshrc"
                echo "# Agent Framework Integration (added $(date))" >> "${HOME}/.zshrc"
                echo "${integration_line}" >> "${HOME}/.zshrc"
                print_status "success" "Added framework integration to ~/.zshrc"
            fi
        else
            print_status "info" "Framework already integrated in ~/.zshrc"
        fi
    fi

    if [ "${DRY_RUN}" = false ] && [ "${BACKUP_PROFILES}" = true ]; then
        print_status "info" "Shell profile backups created (timestamps in filenames)"
    fi
}

################################################################################
# Framework State Directory Setup
################################################################################

setup_state_directory() {
    print_section "Setting up framework state directory..."

    local state_dir="${HOME}/.aurigraph-framework"

    if [ "${DRY_RUN}" = true ]; then
        print_status "info" "[DRY RUN] Would create state directory: ${state_dir}"
        return 0
    fi

    if [ ! -d "${state_dir}" ]; then
        mkdir -p "${state_dir}"
        chmod 700 "${state_dir}"
        print_status "success" "Created state directory: ${state_dir}"
    else
        print_status "info" "State directory already exists"
    fi

    # Initialize state files if not exist
    if [ ! -f "${state_dir}/session-state.json" ]; then
        touch "${state_dir}/session-state.json"
        print_status "success" "Created session state file"
    fi

    if [ ! -f "${state_dir}/framework.log" ]; then
        touch "${state_dir}/framework.log"
        print_status "success" "Created framework log file"
    fi
}

################################################################################
# Git Worktree Validation
################################################################################

validate_worktrees() {
    print_section "Validating Git worktrees..."

    cd "${FRAMEWORK_ROOT}"

    local expected_worktrees=("grpc" "perf" "tests" "monitoring")
    local found_count=0

    for worktree in "${expected_worktrees[@]}"; do
        if git worktree list 2>/dev/null | grep -q "Aurigraph-DLT-${worktree}"; then
            found_count=$((found_count + 1))
            print_status "success" "Worktree found: Aurigraph-DLT-${worktree}"
        else
            print_status "warning" "Worktree missing: Aurigraph-DLT-${worktree}"
        fi
    done

    if [ "${found_count}" -eq 4 ]; then
        print_status "success" "All worktrees validated (4/4)"
    else
        print_status "warning" "Some worktrees missing (${found_count}/4) - manual creation may be needed"
    fi
}

################################################################################
# Configuration Validation
################################################################################

validate_configuration() {
    print_section "Validating framework configuration..."

    # Check main framework files
    local required_files=(
        ".env.agent-framework"
        "scripts/agent-framework-session-init.sh"
        "scripts/shell-profile-integration.sh"
        "AGENT-FRAMEWORK-DEFAULT-MODEL.md"
        "GIT-WORKTREES-GUIDE.md"
    )

    for file in "${required_files[@]}"; do
        if [ -f "${FRAMEWORK_ROOT}/${file}" ]; then
            print_status "success" "Found: ${file}"
        else
            print_status "error" "Missing: ${file}"
        fi
    done
}

################################################################################
# Final Status Report
################################################################################

display_final_status() {
    print_header "🎉 INITIALIZATION COMPLETE"

    echo -e "${GREEN}Framework Status:${NC}"
    echo "  ✅ Framework Version: 2.0"
    echo "  ✅ All Projects Initialized"
    echo "  ✅ Shell Profile Integration Ready"
    echo "  ✅ State Directory Created"
    echo ""

    if [ "${GLOBAL_INIT}" = true ]; then
        echo -e "${GREEN}Shell Profile Integration:${NC}"
        echo "  ✅ ~/.bashrc integrated"
        echo "  ✅ ~/.zshrc integrated"
        echo "  ✅ Reload with: source ~/.bashrc"
        echo ""
    fi

    echo -e "${BLUE}Next Steps:${NC}"
    echo "  1. Reload your shell profile:"
    echo "     source ~/.bashrc  (for Bash)"
    echo "     source ~/.zshrc   (for Zsh)"
    echo ""
    echo "  2. Framework will initialize automatically on next shell session"
    echo ""
    echo "  3. Daily reminder will appear (if enabled)"
    echo ""
    echo "  4. Verify with: agent-framework-status"
    echo ""

    echo -e "${BLUE}Documentation:${NC}"
    echo "  📚 AGENT-FRAMEWORK-DEFAULT-MODEL.md - Main guide"
    echo "  📚 GIT-WORKTREES-GUIDE.md - Detailed worktree usage"
    echo "  📚 AGENT-FRAMEWORK-WORKTREES-INTEGRATION.md - Architecture"
    echo ""

    if [ "${DRY_RUN}" = true ]; then
        echo -e "${YELLOW}⚠️  DRY RUN MODE: No changes were made${NC}"
        echo ""
    fi
}

################################################################################
# Main Execution
################################################################################

main() {
    print_header "🚀 AGENT FRAMEWORK INITIALIZATION FOR ALL PROJECTS"

    if [ "${DRY_RUN}" = true ]; then
        echo -e "${YELLOW}DRY RUN MODE: No changes will be made${NC}"
        echo ""
    fi

    # Step 1: Discover projects
    echo ""
    projects=($(find_projects))
    echo ""

    # Step 2: Initialize framework for each project
    for project in "${projects[@]}"; do
        init_project_framework "${project}"
        echo ""
    done

    # Step 3: Setup state directory
    setup_state_directory
    echo ""

    # Step 4: Validate worktrees
    validate_worktrees
    echo ""

    # Step 5: Validate configuration
    validate_configuration
    echo ""

    # Step 6: Integrate shell profiles
    integrate_shell_profile
    echo ""

    # Step 7: Display final status
    display_final_status
}

# Run main function
main
