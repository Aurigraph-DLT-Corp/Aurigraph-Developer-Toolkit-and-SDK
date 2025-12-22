#!/bin/bash
# Add JIRA credentials to GitHub Secrets
# Requires GitHub CLI (gh) to be installed and authenticated
# SECURITY: Prompts for credentials instead of hardcoding

set -e

echo "========================================="
echo "Adding JIRA Credentials to GitHub Secrets"
echo "========================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "Install it with: brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI"
    echo "Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""

# Prompt for credentials securely
read -p "Enter JIRA email address: " JIRA_EMAIL
read -sp "Enter JIRA API token (will not be displayed): " JIRA_API_TOKEN
echo ""
echo ""

# Validate inputs
if [ -z "$JIRA_EMAIL" ] || [ -z "$JIRA_API_TOKEN" ]; then
    echo "❌ Email and API token are required"
    exit 1
fi

# Add secrets
echo "Adding JIRA_EMAIL secret..."
echo "$JIRA_EMAIL" | gh secret set JIRA_EMAIL

echo "Adding JIRA_API_TOKEN secret..."
echo "$JIRA_API_TOKEN" | gh secret set JIRA_API_TOKEN

echo ""
echo "✅ JIRA credentials added to GitHub Secrets"
echo ""
echo "Verify secrets:"
gh secret list
