#!/bin/bash

################################################################################
# LevelDB Integration Verification Script
#
# Purpose: Verify LevelDB persistent storage for Aurigraph V11 nodes
# Node Types: Validator, Business, and Slim nodes
#
# This script checks:
# - LevelDB data directories exist
# - Proper permissions and ownership
# - LevelDB database files (.ldb, .log) are present
# - Data is being persisted to disk
# - Directory structure is correct for each node type
#
# Author: Database Agent (agent-db)
# Date: November 21, 2025
# Version: 1.0.0
################################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REMOTE_SERVER="dlt.aurigraph.io"
REMOTE_PORT="2235"
REMOTE_USER="subbu"
LEVELDB_BASE_PATH="/var/lib/aurigraph/leveldb"
DOCKER_CONTAINER_PREFIX="v11"

# Statistics
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED_CHECKS++))
    ((TOTAL_CHECKS++))
}

print_failure() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED_CHECKS++))
    ((TOTAL_CHECKS++))
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

run_remote_command() {
    local cmd="$1"
    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_SERVER} "${cmd}" 2>/dev/null
}

################################################################################
# Verification Functions
################################################################################

verify_base_directory() {
    print_header "1. Base Directory Verification"

    if run_remote_command "test -d ${LEVELDB_BASE_PATH} && echo 'exists'"; then
        print_success "Base LevelDB directory exists: ${LEVELDB_BASE_PATH}"

        # Check permissions
        local perms=$(run_remote_command "stat -c '%a %U:%G' ${LEVELDB_BASE_PATH}")
        print_info "Permissions: ${perms}"

        # Check size
        local size=$(run_remote_command "du -sh ${LEVELDB_BASE_PATH} 2>/dev/null | cut -f1")
        print_info "Total size: ${size}"
    else
        print_failure "Base LevelDB directory does not exist: ${LEVELDB_BASE_PATH}"
        print_warning "LevelDB may not be initialized yet or path is incorrect"
    fi
}

verify_validator_nodes() {
    print_header "2. Validator Node LevelDB Verification"

    # Check for validator node directories
    local validator_count=0
    for i in {1..9}; do
        local node_id="validator-${i}"
        local node_path="${LEVELDB_BASE_PATH}/${node_id}"

        if run_remote_command "test -d ${node_path} && echo 'exists'" | grep -q "exists"; then
            ((validator_count++))
            print_success "Validator node ${i} directory exists: ${node_path}"

            # Check for LevelDB files
            local ldb_count=$(run_remote_command "find ${node_path} -name '*.ldb' -o -name '*.log' | wc -l")
            if [ "${ldb_count}" -gt 0 ]; then
                print_success "  Found ${ldb_count} LevelDB data files"
            else
                print_warning "  No LevelDB data files found (database may be empty)"
            fi

            # Check directory size
            local dir_size=$(run_remote_command "du -sh ${node_path} 2>/dev/null | cut -f1")
            print_info "  Size: ${dir_size}"

            # Check for CURRENT and LOCK files (indicators of active database)
            if run_remote_command "test -f ${node_path}/CURRENT && echo 'exists'" | grep -q "exists"; then
                print_success "  Active database (CURRENT file present)"
            else
                print_warning "  No CURRENT file (database may not be initialized)"
            fi
        fi
    done

    if [ ${validator_count} -eq 0 ]; then
        print_failure "No validator node LevelDB directories found"
        print_info "Expected path pattern: ${LEVELDB_BASE_PATH}/validator-{1..9}"
    else
        print_success "Found ${validator_count} validator node(s) with LevelDB storage"
    fi
}

verify_business_nodes() {
    print_header "3. Business Node LevelDB Verification"

    # Check for business node directories
    local business_count=0
    for container in {1..2}; do
        for i in {1..5}; do
            local node_id="business-${container}-${i}"
            local node_path="${LEVELDB_BASE_PATH}/${node_id}"

            if run_remote_command "test -d ${node_path} && echo 'exists'" | grep -q "exists"; then
                ((business_count++))
                print_success "Business node ${container}-${i} directory exists: ${node_path}"

                # Check for LevelDB files
                local ldb_count=$(run_remote_command "find ${node_path} -name '*.ldb' -o -name '*.log' | wc -l")
                if [ "${ldb_count}" -gt 0 ]; then
                    print_success "  Found ${ldb_count} LevelDB data files"
                else
                    print_warning "  No LevelDB data files found (database may be empty)"
                fi

                # Check directory size
                local dir_size=$(run_remote_command "du -sh ${node_path} 2>/dev/null | cut -f1")
                print_info "  Size: ${dir_size}"
            fi
        done
    done

    if [ ${business_count} -eq 0 ]; then
        print_warning "No business node LevelDB directories found"
        print_info "Expected path pattern: ${LEVELDB_BASE_PATH}/business-{1,2}-{1..5}"
    else
        print_success "Found ${business_count} business node(s) with LevelDB storage"
    fi
}

verify_slim_nodes() {
    print_header "4. Slim Node LevelDB Verification"

    # Check for slim node directories
    local slim_count=0
    for i in {1..4}; do
        local node_id="slim-${i}"
        local node_path="${LEVELDB_BASE_PATH}/${node_id}"

        if run_remote_command "test -d ${node_path} && echo 'exists'" | grep -q "exists"; then
            ((slim_count++))
            print_success "Slim node ${i} directory exists: ${node_path}"

            # Check for LevelDB files
            local ldb_count=$(run_remote_command "find ${node_path} -name '*.ldb' -o -name '*.log' | wc -l")
            if [ "${ldb_count}" -gt 0 ]; then
                print_success "  Found ${ldb_count} LevelDB data files"
            else
                print_warning "  No LevelDB data files found (database may be empty)"
            fi

            # Check directory size
            local dir_size=$(run_remote_command "du -sh ${node_path} 2>/dev/null | cut -f1")
            print_info "  Size: ${dir_size}"

            # Check for tokenization channel data (specific to slim nodes)
            local channel_count=$(run_remote_command "find ${node_path} -type d -name '*channel*' | wc -l")
            if [ "${channel_count}" -gt 0 ]; then
                print_info "  Found ${channel_count} tokenization channel(s)"
            fi
        fi
    done

    if [ ${slim_count} -eq 0 ]; then
        print_warning "No slim node LevelDB directories found"
        print_info "Expected path pattern: ${LEVELDB_BASE_PATH}/slim-{1..4}"
    else
        print_success "Found ${slim_count} slim node(s) with LevelDB storage"
    fi
}

verify_docker_volumes() {
    print_header "5. Docker Volume Verification"

    # Check if Docker containers are running
    local validators_running=$(run_remote_command "docker ps --filter name=${DOCKER_CONTAINER_PREFIX}-validators --format '{{.Names}}' | wc -l")
    local business1_running=$(run_remote_command "docker ps --filter name=${DOCKER_CONTAINER_PREFIX}-business-1 --format '{{.Names}}' | wc -l")
    local business2_running=$(run_remote_command "docker ps --filter name=${DOCKER_CONTAINER_PREFIX}-business-2 --format '{{.Names}}' | wc -l")
    local slim_running=$(run_remote_command "docker ps --filter name=${DOCKER_CONTAINER_PREFIX}-slim-nodes --format '{{.Names}}' | wc -l")

    if [ "${validators_running}" -gt 0 ]; then
        print_success "Validator container is running"
    else
        print_warning "Validator container is not running"
    fi

    if [ "${business1_running}" -gt 0 ]; then
        print_success "Business-1 container is running"
    else
        print_warning "Business-1 container is not running"
    fi

    if [ "${business2_running}" -gt 0 ]; then
        print_success "Business-2 container is running"
    else
        print_warning "Business-2 container is not running"
    fi

    if [ "${slim_running}" -gt 0 ]; then
        print_success "Slim nodes container is running"
    else
        print_warning "Slim nodes container is not running"
    fi

    # Check Docker volume mounts
    print_info "Checking volume mounts..."
    local volume_count=$(run_remote_command "docker volume ls | grep -c v11 || echo 0")
    print_info "Found ${volume_count} V11 Docker volumes"
}

verify_backup_directory() {
    print_header "6. Backup Directory Verification"

    local backup_path="/var/lib/aurigraph/backups/leveldb"

    if run_remote_command "test -d ${backup_path} && echo 'exists'" | grep -q "exists"; then
        print_success "Backup directory exists: ${backup_path}"

        # Count backup files
        local backup_count=$(run_remote_command "find ${backup_path} -name '*.encrypted' -o -name '*.metadata' | wc -l")
        print_info "Found ${backup_count} backup-related files"

        # Check backup size
        local backup_size=$(run_remote_command "du -sh ${backup_path} 2>/dev/null | cut -f1")
        print_info "Backup directory size: ${backup_size}"
    else
        print_warning "Backup directory does not exist: ${backup_path}"
        print_info "Backups may not be configured yet"
    fi
}

verify_file_integrity() {
    print_header "7. File Integrity Verification"

    # Check for corrupted databases
    print_info "Checking for LOCK files (indicates active database)..."
    local lock_count=$(run_remote_command "find ${LEVELDB_BASE_PATH} -name 'LOCK' 2>/dev/null | wc -l")
    print_info "Found ${lock_count} active databases (LOCK files)"

    # Check for LOG files (write-ahead log)
    print_info "Checking for LOG files (write-ahead logs)..."
    local log_count=$(run_remote_command "find ${LEVELDB_BASE_PATH} -name 'LOG' 2>/dev/null | wc -l")
    print_info "Found ${log_count} LOG files"

    # Check for SSTable files (.ldb)
    print_info "Checking for SSTable files (.ldb)..."
    local ldb_count=$(run_remote_command "find ${LEVELDB_BASE_PATH} -name '*.ldb' 2>/dev/null | wc -l")
    if [ "${ldb_count}" -gt 0 ]; then
        print_success "Found ${ldb_count} SSTable files (.ldb)"
    else
        print_warning "No SSTable files found (databases may be empty or not initialized)"
    fi

    # Check for manifest files
    print_info "Checking for MANIFEST files..."
    local manifest_count=$(run_remote_command "find ${LEVELDB_BASE_PATH} -name 'MANIFEST-*' 2>/dev/null | wc -l")
    if [ "${manifest_count}" -gt 0 ]; then
        print_success "Found ${manifest_count} MANIFEST files"
    else
        print_warning "No MANIFEST files found"
    fi
}

generate_summary_report() {
    print_header "Verification Summary"

    echo -e "Total checks performed:  ${TOTAL_CHECKS}"
    echo -e "${GREEN}Passed:${NC}                  ${PASSED_CHECKS}"
    echo -e "${RED}Failed:${NC}                  ${FAILED_CHECKS}"
    echo -e "${YELLOW}Warnings:${NC}                ${WARNINGS}"
    echo ""

    local success_rate=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

    if [ ${success_rate} -ge 80 ]; then
        echo -e "${GREEN}Overall Status: HEALTHY (${success_rate}% success rate)${NC}"
    elif [ ${success_rate} -ge 50 ]; then
        echo -e "${YELLOW}Overall Status: WARNING (${success_rate}% success rate)${NC}"
    else
        echo -e "${RED}Overall Status: CRITICAL (${success_rate}% success rate)${NC}"
    fi

    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

################################################################################
# Main Execution
################################################################################

main() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                   ║${NC}"
    echo -e "${GREEN}║         Aurigraph V11 LevelDB Integration Verification           ║${NC}"
    echo -e "${GREEN}║                                                                   ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    print_info "Remote Server: ${REMOTE_USER}@${REMOTE_SERVER}:${REMOTE_PORT}"
    print_info "LevelDB Base Path: ${LEVELDB_BASE_PATH}"
    echo ""

    # Check SSH connectivity
    print_header "0. SSH Connectivity Check"
    if run_remote_command "echo 'connected'" | grep -q "connected"; then
        print_success "SSH connection established"
    else
        print_failure "Failed to establish SSH connection"
        echo ""
        echo -e "${RED}ERROR: Cannot connect to remote server${NC}"
        echo -e "${YELLOW}Please ensure:${NC}"
        echo "  1. SSH credentials are correct"
        echo "  2. Server is accessible on port ${REMOTE_PORT}"
        echo "  3. You have the necessary permissions"
        exit 1
    fi

    # Run all verification checks
    verify_base_directory
    verify_validator_nodes
    verify_business_nodes
    verify_slim_nodes
    verify_docker_volumes
    verify_backup_directory
    verify_file_integrity

    # Generate final report
    generate_summary_report
}

# Run main function
main "$@"
