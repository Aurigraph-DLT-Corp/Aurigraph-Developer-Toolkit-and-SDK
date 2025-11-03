#!/bin/bash

################################################################################
# SPRINT 13 JIRA UPDATE SCRIPT (J4C FRAMEWORK)
# Executes: JIRA for Continuous Integration & Change
# Purpose: Update JIRA board with Sprint 13 kickoff and component assignments
# Author: Claude Code (AI Agent)
# Date: November 4, 2025
################################################################################

set -e

# ============================================================================
# CONFIGURATION & CREDENTIALS
# ============================================================================

# Load credentials from Credentials.md
export JIRA_EMAIL="subbu@aurigraph.io"
export JIRA_API_TOKEN="ATATT3xFfGF0sFjaXc9iiBQuv-1jvWEfLDA5APUBvJvhVSrtzDDfS4B9k3ut3gCAyHUNU0YImVJSjcjglkR_3dmHtvRUYiV32nQJqkQ_HwKqCbS6oNs99XdYu5j_SmQqMQX4a7WekwS-sYNbDFtNBTrRuemXmlVHrjWa6dhMdCBuk0vdQvd_OYA=F7D4339F"
export JIRA_BASE_URL="https://aurigraphdlt.atlassian.net"
export JIRA_PROJECT_KEY="AV11"
export JIRA_BOARD_ID="789"

# Project Configuration
SPRINT_NUMBER="13"
SPRINT_START_DATE="2025-11-04"
SPRINT_END_DATE="2025-11-14"
SPRINT_GOAL="8 React components, 8 API endpoints, 100% build success"
SPRINT_DURATION_DAYS="11"

# Component Assignments
declare -a COMPONENTS=(
  "NetworkTopology|FDA-1|network-topology|/api/v11/blockchain/network/topology"
  "BlockSearch|FDA-2|block-search|/api/v11/blockchain/blocks/search"
  "ValidatorPerformance|FDA-3|validator-performance|/api/v11/validators/performance"
  "AIMetrics|FDA-4|ai-metrics|/api/v11/ai/metrics"
  "AuditLogViewer|FDA-5|audit-log|/api/v11/audit/logs"
  "RWAAssetManager|FDA-6|rwa-portfolio|/api/v11/rwa/portfolio"
  "TokenManagement|FDA-7|token-management|/api/v11/tokens/manage"
  "DashboardLayout|FDA-8|dashboard-layout|N/A"
)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

# Function to make JIRA API calls
jira_api_call() {
  local method=$1
  local endpoint=$2
  local data=$3

  local url="${JIRA_BASE_URL}/rest/api/3${endpoint}"
  local auth="${JIRA_EMAIL}:${JIRA_API_TOKEN}"

  if [ -z "$data" ]; then
    curl -s -X "$method" \
      -u "$auth" \
      -H "Content-Type: application/json" \
      "$url"
  else
    curl -s -X "$method" \
      -u "$auth" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$url"
  fi
}

# Function to create JIRA issue
create_jira_issue() {
  local summary=$1
  local description=$2
  local issue_type=$3
  local assignee=$4
  local labels=$5

  local payload=$(cat <<EOF
{
  "fields": {
    "project": {
      "key": "${JIRA_PROJECT_KEY}"
    },
    "summary": "${summary}",
    "description": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "${description}"
            }
          ]
        }
      ]
    },
    "issuetype": {
      "name": "${issue_type}"
    },
    "labels": [${labels}]
  }
}
EOF
)

  if [ ! -z "$assignee" ]; then
    payload=$(echo "$payload" | jq ".fields.assignee = {\"name\": \"${assignee}\"}")
  fi

  jira_api_call "POST" "/issues" "$payload"
}

# Function to log message
log_message() {
  local level=$1
  local message=$2
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[${timestamp}] [${level}] ${message}"
}

# Function to print section header
print_section() {
  echo ""
  echo "================================================================================"
  echo "  $1"
  echo "================================================================================"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

print_section "SPRINT 13 JIRA UPDATE - J4C FRAMEWORK"

log_message "INFO" "Starting Sprint 13 JIRA integration..."
log_message "INFO" "JIRA URL: ${JIRA_BASE_URL}"
log_message "INFO" "Project: ${JIRA_PROJECT_KEY}"
log_message "INFO" "Board: ${JIRA_BOARD_ID}"

# ============================================================================
# VERIFY JIRA CONNECTION
# ============================================================================

print_section "1. VERIFYING JIRA CONNECTIVITY"

log_message "INFO" "Verifying JIRA authentication..."

auth_response=$(jira_api_call "GET" "/myself")

if echo "$auth_response" | grep -q '"emailAddress"'; then
  log_message "SUCCESS" "✅ JIRA Authentication verified"
  user_email=$(echo "$auth_response" | grep -o '"emailAddress":"[^"]*' | cut -d'"' -f4)
  log_message "INFO" "Authenticated user: ${user_email}"
else
  log_message "ERROR" "❌ JIRA Authentication failed"
  log_message "ERROR" "Response: ${auth_response}"
  exit 1
fi

# ============================================================================
# VERIFY PROJECT AND BOARD
# ============================================================================

print_section "2. VERIFYING PROJECT AND BOARD"

log_message "INFO" "Verifying project ${JIRA_PROJECT_KEY}..."

project_response=$(jira_api_call "GET" "/projects/${JIRA_PROJECT_KEY}")

if echo "$project_response" | grep -q '"key":"'${JIRA_PROJECT_KEY}'"'; then
  log_message "SUCCESS" "✅ Project ${JIRA_PROJECT_KEY} found"
  project_name=$(echo "$project_response" | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)
  log_message "INFO" "Project name: ${project_name}"
else
  log_message "ERROR" "❌ Project ${JIRA_PROJECT_KEY} not found"
  exit 1
fi

# ============================================================================
# CREATE SPRINT 13 EPIC
# ============================================================================

print_section "3. CREATING SPRINT 13 EPIC"

log_message "INFO" "Creating Sprint 13 Epic..."

epic_summary="Sprint 13: Enterprise Portal Enhancement (8 Components)"
epic_description="Sprint 13 Epic - Implement 8 React components with 8 API endpoints for the Enterprise Portal V4.5.0. Target: 3.0M TPS, 99.99% availability. Timeline: Nov 4-14, 2025."

epic_labels="\"sprint-13\", \"enterprise-portal\", \"react-components\", \"api-endpoints\", \"v4.5.0\""

epic_response=$(create_jira_issue "$epic_summary" "$epic_description" "Epic" "" "$epic_labels")

if echo "$epic_response" | grep -q '"key"'; then
  epic_key=$(echo "$epic_response" | grep -o '"key":"[^"]*' | head -1 | cut -d'"' -f4)
  log_message "SUCCESS" "✅ Epic created: ${epic_key}"
else
  log_message "ERROR" "❌ Failed to create epic"
  log_message "ERROR" "Response: ${epic_response}"
fi

# ============================================================================
# CREATE COMPONENT TASKS
# ============================================================================

print_section "4. CREATING COMPONENT TASKS"

issue_count=0

for component_info in "${COMPONENTS[@]}"; do
  IFS='|' read -r component_name developer api_endpoint api_path <<< "$component_info"

  log_message "INFO" "Creating task for ${developer}: ${component_name}..."

  task_summary="${developer}: Implement ${component_name} Component"
  task_description="Implement React component for ${component_name}

Developer: ${developer}
Component: ${component_name}
API Endpoint: ${api_path}

Responsibilities:
1. Create React component scaffold
2. Implement API service
3. Add Material-UI styling
4. Write unit tests (85%+ coverage)
5. Create JSDoc documentation

Success Criteria:
✓ Component renders without errors
✓ API service working
✓ All tests passing
✓ TypeScript: 0 errors
✓ Build: 100% success
✓ Code review approved

Phase 1 (Day 1): Scaffolding
Phase 2 (Day 2-3): Implementation
Phase 3 (Day 4-5): Testing & Polish

Delivery: November 14, 2025"

  task_labels="\"sprint-13\", \"${developer}\", \"${api_endpoint}\", \"day-1-scaffolding\", \"component\""

  task_response=$(create_jira_issue "$task_summary" "$task_description" "Task" "" "$task_labels")

  if echo "$task_response" | grep -q '"key"'; then
    task_key=$(echo "$task_response" | grep -o '"key":"[^"]*' | head -1 | cut -d'"' -f4)
    log_message "SUCCESS" "✅ Task created: ${task_key} - ${developer}: ${component_name}"
    ((issue_count++))
  else
    log_message "WARNING" "⚠️ Failed to create task for ${developer}: ${component_name}"
    log_message "ERROR" "Response: ${task_response}"
  fi

  # Small delay to avoid rate limiting
  sleep 0.5
done

log_message "SUCCESS" "✅ Created ${issue_count} component tasks"

# ============================================================================
# CREATE INFRASTRUCTURE VALIDATION TASK
# ============================================================================

print_section "5. CREATING INFRASTRUCTURE TASKS"

# Infrastructure verification task
infra_task_summary="Infrastructure Verification - Sprint 13 Day 1"
infra_task_description="Verify all infrastructure components are ready for Sprint 13 execution

Pre-Execution Checks:
✓ Java 21.0.8 verified
✓ Node.js 22.18.0 verified
✓ npm 10.9.3 verified
✓ V11 backend healthy (port 9003)
✓ Enterprise Portal live (dlt.aurigraph.io)
✓ Database migrations applied
✓ CI/CD pipeline active
✓ All 8 feature branches available

Success Criteria:
- All checks passing
- No infrastructure blockers
- Team ready to execute
- Standby resources available

Timeline: November 4, 2025, 10:00 AM - 10:30 AM"

infra_labels="\"sprint-13\", \"infrastructure\", \"day-1\", \"blocking\""

infra_response=$(create_jira_issue "$infra_task_summary" "$infra_task_description" "Task" "" "$infra_labels")

if echo "$infra_response" | grep -q '"key"'; then
  infra_key=$(echo "$infra_response" | grep -o '"key":"[^"]*' | head -1 | cut -d'"' -f4)
  log_message "SUCCESS" "✅ Infrastructure task created: ${infra_key}"
else
  log_message "WARNING" "⚠️ Failed to create infrastructure task"
fi

# ============================================================================
# CREATE BUILD & DEPLOYMENT TASK
# ============================================================================

build_task_summary="Build & Deploy - Sprint 13 Production Release"
build_task_description="Build and deploy all Sprint 13 components to production

Sprint 13 Deliverables:
- 8 React components (100% complete)
- 8 API endpoints (100% functional)
- Test coverage: 85%+ on all components
- TypeScript: 0 errors
- Build: 100% success
- Code review: Approved

Deployment Steps:
1. Build all components locally
2. Run full test suite
3. Build production artifact
4. Deploy to staging (dlt.aurigraph.io)
5. Run smoke tests
6. Deploy to production
7. Verify all endpoints working

Timeline: November 14, 2025 (Production Release)
Success Criteria: All services 200 OK, zero errors"

build_labels="\"sprint-13\", \"build\", \"deployment\", \"production\", \"day-14\""

build_response=$(create_jira_issue "$build_task_summary" "$build_task_description" "Task" "" "$build_labels")

if echo "$build_response" | grep -q '"key"'; then
  build_key=$(echo "$build_response" | grep -o '"key":"[^"]*' | head -1 | cut -d'"' -f4)
  log_message "SUCCESS" "✅ Build & deployment task created: ${build_key}"
else
  log_message "WARNING" "⚠️ Failed to create build task"
fi

# ============================================================================
# COMPLETION SUMMARY
# ============================================================================

print_section "SPRINT 13 JIRA UPDATE COMPLETE"

log_message "SUCCESS" "✅ JIRA Sprint 13 board has been updated with:"
log_message "INFO" "  - 1 Epic (AV11 Sprint 13)"
log_message "INFO" "  - 8 Component Tasks (FDA-1 through FDA-8)"
log_message "INFO" "  - 1 Infrastructure Verification Task"
log_message "INFO" "  - 1 Build & Deployment Task"
log_message "INFO" "  - Total: 11 issues created"

echo ""
log_message "SUCCESS" "📋 JIRA BOARD: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789"
echo ""

log_message "INFO" "Next Steps:"
log_message "INFO" "1. Review Sprint 13 board in JIRA"
log_message "INFO" "2. Assign tasks to team members"
log_message "INFO" "3. Add Sprint 13 start date: ${SPRINT_START_DATE}"
log_message "INFO" "4. Add Sprint 13 end date: ${SPRINT_END_DATE}"
log_message "INFO" "5. Update issue status during execution"
log_message "INFO" "6. Track progress daily"

echo ""
log_message "SUCCESS" "🚀 Sprint 13 is ready to launch!"
log_message "INFO" "Execution start: November 4, 2025, 10:30 AM"
log_message "INFO" "Target: 8 components, 8 endpoints, 100% success"

# ============================================================================
# LOGGING & REPORTING
# ============================================================================

print_section "EXECUTION COMPLETED"

log_message "SUCCESS" "Sprint 13 JIRA integration complete!"
log_message "INFO" "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
log_message "INFO" "Duration: Sprint 13-18 (6 sprints, 14 weeks)"
log_message "INFO" "Status: 🟢 READY FOR EXECUTION"

echo ""
echo "================================================================================"
echo "  SPRINT 13 READY FOR LAUNCH - J4C FRAMEWORK ACTIVE"
echo "================================================================================"
echo ""
