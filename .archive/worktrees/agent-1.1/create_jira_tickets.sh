#!/bin/bash

# JIRA Ticket Creation for AUR3 Project
# Using credentials from Important.env

JIRA_URL="https://aurigraphdlt.atlassian.net"
JIRA_USER="${JIRA_USER:-yogesh@aurigraph.io}"
JIRA_TOKEN="${JIRA_TOKEN:-YOUR_JIRA_TOKEN_HERE}"

echo "Creating JIRA tickets in AUR3 project..."

# Create Epic for Enterprise Portal
curl -X POST \
  -H "Authorization: Basic $(echo -n $JIRA_USER:$JIRA_TOKEN | base64)" \
  -H "Content-Type: application/json" \
  "$JIRA_URL/rest/api/3/issue" \
  -d '{
    "fields": {
      "project": {"key": "AUR3"},
      "summary": "Enterprise Portal v3.0 Development",
      "description": {
        "type": "doc",
        "version": 1,
        "content": [
          {
            "type": "paragraph",
            "content": [
              {
                "type": "text",
                "text": "Develop and deploy Aurex Enterprise Portal v3.0 with integrated GNN platform, LCA/PCF computation, and AI agent orchestration."
              }
            ]
          }
        ]
      },
      "issuetype": {"name": "Epic"}
    }
  }'

echo ""

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
      "issuetype": {"name": "Story"},
      "customfield_10026": 34
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
      "issuetype": {"name": "Story"},
      "customfield_10026": 55
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
      "issuetype": {"name": "Story"},
      "customfield_10026": 34
    }
  }'

echo ""
echo "JIRA tickets created in AUR3 project!"
echo "View board: https://aurigraphdlt.atlassian.net/jira/software/projects/AUR3/boards/888"