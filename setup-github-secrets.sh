#!/bin/bash
# Add JIRA credentials to GitHub Secrets
# Requires GitHub CLI (gh) to be installed and authenticated

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

# Add secrets
echo "Adding JIRA_EMAIL secret..."
echo "subbu@aurigraph.io" | gh secret set JIRA_EMAIL

echo "Adding JIRA_API_TOKEN secret..."
echo "ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5" | gh secret set JIRA_API_TOKEN

echo ""
echo "✅ JIRA credentials added to GitHub Secrets"
echo ""
echo "Verify secrets:"
gh secret list
