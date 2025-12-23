#!/bin/bash

# JIRA Story Creation for AUR3 Project
# Direct story creation without epics

JIRA_URL="https://aurigraphdlt.atlassian.net"
JIRA_USER="${JIRA_USER:-yogesh@aurigraph.io}"
JIRA_TOKEN="${JIRA_TOKEN:-YOUR_JIRA_TOKEN_HERE}"

echo "Creating JIRA stories in AUR3 project..."

# Create Story for GNN Platform
curl -X POST \
  -H "Authorization: Basic $(echo -n $JIRA_USER:$JIRA_TOKEN | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_URL/rest/api/3/issue" \
  -d '{
    "fields": {
      "project": {"key": "AUR3"},
      "summary": "Deploy GNN Platform with 4 AI Models",
      "description": {
        "type": "doc",
        "version": 1,
        "content": [
          {
            "type": "paragraph",
            "content": [
              {
                "type": "text",
                "text": "Deploy Supply Chain, Water Management, Carbon Credit, and Forest Ecosystem GNN models"
              }
            ]
          }
        ]
      },
      "issuetype": {"name": "Task"}
    }
  }'

echo ""

# Create Story for LCA/PCF Engine
curl -X POST \
  -H "Authorization: Basic $(echo -n $JIRA_USER:$JIRA_TOKEN | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_URL/rest/api/3/issue" \
  -d '{
    "fields": {
      "project": {"key": "AUR3"},
      "summary": "Implement LCA/PCF Computation Engine",
      "description": {
        "type": "doc",
        "version": 1,
        "content": [
          {
            "type": "paragraph",
            "content": [
              {
                "type": "text",
                "text": "Build Life Cycle Assessment and Product Carbon Footprint calculation engine with 50,000+ emission factors"
              }
            ]
          }
        ]
      },
      "issuetype": {"name": "Task"}
    }
  }'

echo ""

# Create Story for AI Agents
curl -X POST \
  -H "Authorization: Basic $(echo -n $JIRA_USER:$JIRA_TOKEN | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_URL/rest/api/3/issue" \
  -d '{
    "fields": {
      "project": {"key": "AUR3"},
      "summary": "Deploy 15 AI Agents for Autonomous Operations",
      "description": {
        "type": "doc",
        "version": 1,
        "content": [
          {
            "type": "paragraph",
            "content": [
              {
                "type": "text",
                "text": "Configure and deploy AI agent fleet including Senior Architect, Security Ops, Neural Network Architect, and 12 other specialized agents"
              }
            ]
          }
        ]
      },
      "issuetype": {"name": "Task"}
    }
  }'

echo ""

# Create Story for Enterprise Portal
curl -X POST \
  -H "Authorization: Basic $(echo -n $JIRA_USER:$JIRA_TOKEN | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_URL/rest/api/3/issue" \
  -d '{
    "fields": {
      "project": {"key": "AUR3"},
      "summary": "Deploy Enterprise Portal v3.0",
      "description": {
        "type": "doc",
        "version": 1,
        "content": [
          {
            "type": "paragraph",
            "content": [
              {
                "type": "text",
                "text": "Deploy React-based enterprise portal with integrated dashboard, GNN interface, sustainability metrics, and AI agent control"
              }
            ]
          }
        ]
      },
      "issuetype": {"name": "Task"}
    }
  }'

echo ""
echo "JIRA tasks created in AUR3 project!"
echo "View board: https://aurigraphdlt.atlassian.net/jira/software/projects/AUR3/boards/888"