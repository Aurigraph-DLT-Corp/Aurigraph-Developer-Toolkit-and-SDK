#!/bin/bash

# JIRA Update Script - Phase 1 Complete, Phase 2 Started
# Project: AV11-DEMO-MOBILE-2025
# Date: October 9, 2025

set -e

# JIRA Configuration
JIRA_URL="https://aurigraphdlt.atlassian.net"
JIRA_EMAIL="subbu@aurigraph.io"
JIRA_API_TOKEN="ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
PROJECT_KEY="AV11"

# Colors for output
GREEN='\033[0.32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}JIRA Update: Phase 1 Complete, Phase 2 Started${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to make JIRA API calls
jira_api() {
    local method=$1
    local endpoint=$2
    local data=$3

    curl -s -X "$method" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
        "${JIRA_URL}/rest/api/3${endpoint}" \
        ${data:+-d "$data"}
}

# 1. Create Epic for Enterprise Portal Mobile Integration
echo -e "${YELLOW}Creating Epic: Enterprise Portal Mobile Integration...${NC}"

EPIC_DATA=$(cat <<EOF
{
  "fields": {
    "project": {
      "key": "$PROJECT_KEY"
    },
    "summary": "Enterprise Portal Mobile Integration (Demo App)",
    "description": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Integrate the existing Real-Time Node Visualization Demo App (5,362 LOC) into the enterprise portal and build Flutter/React Native mobile applications."
            }
          ]
        },
        {
          "type": "heading",
          "attrs": { "level": 3 },
          "content": [
            {
              "type": "text",
              "text": "Scope"
            }
          ]
        },
        {
          "type": "bulletList",
          "content": [
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Phase 1: Planning & Architecture (5 days) - COMPLETE"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Phase 2: Enterprise Portal Integration (10 days) - IN PROGRESS"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Phase 3: Flutter Mobile App (12 days)"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Phase 4: React Native Mobile App (12 days)"
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "type": "heading",
          "attrs": { "level": 3 },
          "content": [
            {
              "type": "text",
              "text": "Goals"
            }
          ]
        },
        {
          "type": "bulletList",
          "content": [
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Embed demo app permanently in enterprise portal for all future releases"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Build mobile apps (Flutter + React Native) with 4 node types, 2 dashboards, 3 external feeds"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Achieve 2M+ TPS performance target with real-time visualization"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    "issuetype": {
      "name": "Epic"
    },
    "customfield_10011": "AV11-DEMO-MOBILE-2025"
  }
}
EOF
)

EPIC_RESPONSE=$(jira_api "POST" "/issue" "$EPIC_DATA")
EPIC_KEY=$(echo "$EPIC_RESPONSE" | grep -o '"key":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$EPIC_KEY" ]; then
    echo -e "${GREEN}✅ Epic created: $EPIC_KEY${NC}"
else
    echo -e "${RED}❌ Failed to create epic${NC}"
    EPIC_KEY="AV11-XXX"  # Fallback
fi

echo ""

# 2. Create Phase 1 Story (Complete)
echo -e "${YELLOW}Creating Phase 1 Story: Planning & Architecture...${NC}"

PHASE1_DATA=$(cat <<EOF
{
  "fields": {
    "project": {
      "key": "$PROJECT_KEY"
    },
    "parent": {
      "key": "$EPIC_KEY"
    },
    "summary": "Phase 1: Planning & Architecture",
    "description": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Complete planning and architecture for enterprise portal integration and mobile apps."
            }
          ]
        },
        {
          "type": "heading",
          "attrs": { "level": 3 },
          "content": [
            {
              "type": "text",
              "text": "Deliverables (All Complete ✅)"
            }
          ]
        },
        {
          "type": "bulletList",
          "content": [
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Demo App Architecture Analysis (1,127 lines)"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Mobile App Requirements (1,466 lines)"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "API Integration Plan (1,908 lines)"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Enterprise Portal Integration Architecture (1,900+ lines)"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Database Schema Design (1,900+ lines)"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Technology Stack Confirmation (1,380 lines)"
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Total: 10,681+ lines of comprehensive documentation."
            }
          ]
        }
      ]
    },
    "issuetype": {
      "name": "Story"
    },
    "labels": ["phase1", "planning", "architecture", "complete"]
  }
}
EOF
)

PHASE1_RESPONSE=$(jira_api "POST" "/issue" "$PHASE1_DATA")
PHASE1_KEY=$(echo "$PHASE1_RESPONSE" | grep -o '"key":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$PHASE1_KEY" ]; then
    echo -e "${GREEN}✅ Phase 1 story created: $PHASE1_KEY${NC}"

    # Transition to Done
    echo -e "${YELLOW}   Transitioning $PHASE1_KEY to Done...${NC}"

    # Get transition ID for "Done" (usually 31 or 41)
    TRANSITIONS=$(jira_api "GET" "/issue/$PHASE1_KEY/transitions")
    DONE_TRANSITION_ID=$(echo "$TRANSITIONS" | grep -o '"name":"Done"[^}]*"id":"[0-9]*"' | grep -o '[0-9]*')

    if [ -n "$DONE_TRANSITION_ID" ]; then
        TRANSITION_DATA=$(cat <<EOF
{
  "transition": {
    "id": "$DONE_TRANSITION_ID"
  }
}
EOF
)
        jira_api "POST" "/issue/$PHASE1_KEY/transitions" "$TRANSITION_DATA" > /dev/null
        echo -e "${GREEN}   ✅ Transitioned to Done${NC}"
    fi
else
    echo -e "${RED}❌ Failed to create Phase 1 story${NC}"
fi

echo ""

# 3. Create Phase 2 Story (In Progress)
echo -e "${YELLOW}Creating Phase 2 Story: Enterprise Portal Integration...${NC}"

PHASE2_DATA=$(cat <<EOF
{
  "fields": {
    "project": {
      "key": "$PROJECT_KEY"
    },
    "parent": {
      "key": "$EPIC_KEY"
    },
    "summary": "Phase 2: Enterprise Portal Integration",
    "description": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Integrate the Real-Time Node Visualization Demo App (5,362 LOC) into the React-based enterprise portal."
            }
          ]
        },
        {
          "type": "heading",
          "attrs": { "level": 3 },
          "content": [
            {
              "type": "text",
              "text": "Tasks (10 days, 21 story points)"
            }
          ]
        },
        {
          "type": "bulletList",
          "content": [
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "✅ 2.1: Development environment setup (Vite, TypeScript, ESLint)"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "🔄 2.2: Create React project structure"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "⏳ 2.3: Implement Redux Toolkit state management"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "⏳ 2.4: Integrate V11 Backend API (REST + WebSocket)"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "⏳ 2.5: Create demo app React components (nodes, dashboards, charts)"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "⏳ 2.6: Integrate external feeds (Alpaca, Weather, X/Twitter)"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "⏳ 2.7: Configure Docker deployment (multi-stage build + nginx)"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "⏳ 2.8: Testing and validation (unit, component, integration)"
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "type": "heading",
          "attrs": { "level": 3 },
          "content": [
            {
              "type": "text",
              "text": "Technology Stack"
            }
          ]
        },
        {
          "type": "bulletList",
          "content": [
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "React 18.2 + TypeScript 5.0 + Vite 5.0"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Redux Toolkit 1.9 + React Query 5.8"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Ant Design 5.11 + Recharts 2.10"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Docker + nginx (reverse proxy)"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    "issuetype": {
      "name": "Story"
    },
    "labels": ["phase2", "enterprise-portal", "react", "in-progress"]
  }
}
EOF
)

PHASE2_RESPONSE=$(jira_api "POST" "/issue" "$PHASE2_DATA")
PHASE2_KEY=$(echo "$PHASE2_RESPONSE" | grep -o '"key":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$PHASE2_KEY" ]; then
    echo -e "${GREEN}✅ Phase 2 story created: $PHASE2_KEY${NC}"

    # Transition to In Progress
    echo -e "${YELLOW}   Transitioning $PHASE2_KEY to In Progress...${NC}"

    TRANSITIONS=$(jira_api "GET" "/issue/$PHASE2_KEY/transitions")
    IN_PROGRESS_TRANSITION_ID=$(echo "$TRANSITIONS" | grep -o '"name":"In Progress"[^}]*"id":"[0-9]*"' | grep -o '[0-9]*')

    if [ -n "$IN_PROGRESS_TRANSITION_ID" ]; then
        TRANSITION_DATA=$(cat <<EOF
{
  "transition": {
    "id": "$IN_PROGRESS_TRANSITION_ID"
  }
}
EOF
)
        jira_api "POST" "/issue/$PHASE2_KEY/transitions" "$TRANSITION_DATA" > /dev/null
        echo -e "${GREEN}   ✅ Transitioned to In Progress${NC}"
    fi
else
    echo -e "${RED}❌ Failed to create Phase 2 story${NC}"
fi

echo ""

# 4. Create sub-tasks for Phase 2
echo -e "${YELLOW}Creating Phase 2 sub-tasks...${NC}"

SUBTASKS=(
    "2.1 Development Environment Setup:DONE"
    "2.2 Create React Project Structure:IN_PROGRESS"
    "2.3 Implement Redux State Management:TODO"
    "2.4 Integrate V11 Backend API:TODO"
    "2.5 Create Demo App Components:TODO"
    "2.6 Integrate External Feeds:TODO"
    "2.7 Configure Docker Deployment:TODO"
    "2.8 Testing and Validation:TODO"
)

for subtask in "${SUBTASKS[@]}"; do
    IFS=':' read -r task_name task_status <<< "$subtask"

    SUBTASK_DATA=$(cat <<EOF
{
  "fields": {
    "project": {
      "key": "$PROJECT_KEY"
    },
    "parent": {
      "key": "$PHASE2_KEY"
    },
    "summary": "$task_name",
    "issuetype": {
      "name": "Sub-task"
    }
  }
}
EOF
)

    SUBTASK_RESPONSE=$(jira_api "POST" "/issue" "$SUBTASK_DATA")
    SUBTASK_KEY=$(echo "$SUBTASK_RESPONSE" | grep -o '"key":"[^"]*' | head -1 | cut -d'"' -f4)

    if [ -n "$SUBTASK_KEY" ]; then
        echo -e "${GREEN}   ✅ Created sub-task: $SUBTASK_KEY - $task_name${NC}"

        # Transition based on status
        if [ "$task_status" == "DONE" ]; then
            TRANSITIONS=$(jira_api "GET" "/issue/$SUBTASK_KEY/transitions")
            DONE_ID=$(echo "$TRANSITIONS" | grep -o '"name":"Done"[^}]*"id":"[0-9]*"' | grep -o '[0-9]*')

            if [ -n "$DONE_ID" ]; then
                TRANSITION_DATA='{"transition":{"id":"'$DONE_ID'"}}'
                jira_api "POST" "/issue/$SUBTASK_KEY/transitions" "$TRANSITION_DATA" > /dev/null
                echo -e "${GREEN}      → Marked as Done${NC}"
            fi
        elif [ "$task_status" == "IN_PROGRESS" ]; then
            TRANSITIONS=$(jira_api "GET" "/issue/$SUBTASK_KEY/transitions")
            IN_PROGRESS_ID=$(echo "$TRANSITIONS" | grep -o '"name":"In Progress"[^}]*"id":"[0-9]*"' | grep -o '[0-9]*')

            if [ -n "$IN_PROGRESS_ID" ]; then
                TRANSITION_DATA='{"transition":{"id":"'$IN_PROGRESS_ID'"}}'
                jira_api "POST" "/issue/$SUBTASK_KEY/transitions" "$TRANSITION_DATA" > /dev/null
                echo -e "${YELLOW}      → Marked as In Progress${NC}"
            fi
        fi
    else
        echo -e "${RED}   ❌ Failed to create sub-task: $task_name${NC}"
    fi
done

echo ""

# Summary
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}JIRA Update Complete${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${GREEN}✅ Epic Created:${NC} $EPIC_KEY - Enterprise Portal Mobile Integration"
echo -e "${GREEN}✅ Phase 1 Story:${NC} $PHASE1_KEY - Planning & Architecture (Done)"
echo -e "${GREEN}✅ Phase 2 Story:${NC} $PHASE2_KEY - Enterprise Portal Integration (In Progress)"
echo -e "${GREEN}✅ Sub-tasks:${NC} 8 sub-tasks created"
echo ""
echo -e "${BLUE}View in JIRA: ${JIRA_URL}/browse/$EPIC_KEY${NC}"
echo ""
