#!/bin/bash

# GitHub MCP Setup Script for Aurigraph-DLT
set -e

echo "🚀 Setting up GitHub MCP for Aurigraph-DLT..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install GitHub MCP server globally
echo "📦 Installing GitHub MCP server..."
npm install -g @modelcontextprotocol/server-github

# Check if .env.mcp exists
if [ ! -f ".env.mcp" ]; then
    echo "❌ .env.mcp file not found. Please create it with your GitHub token."
    echo "   Copy .env.mcp.example and add your GitHub Personal Access Token"
    exit 1
fi

# Load environment variables
source .env.mcp

# Validate GitHub token
if [ "$GITHUB_PERSONAL_ACCESS_TOKEN" = "your_github_token_here" ] || [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
    echo "❌ Please set your GitHub Personal Access Token in .env.mcp"
    echo "   Visit: https://github.com/settings/tokens to create a token"
    echo "   Required scopes: repo, read:org, read:user"
    exit 1
fi

# Test GitHub API connection
echo "🔍 Testing GitHub API connection..."
if curl -s -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" https://api.github.com/user > /dev/null; then
    echo "✅ GitHub API connection successful"
else
    echo "❌ GitHub API connection failed. Please check your token."
    exit 1
fi

# Create MCP configuration directory if it doesn't exist
mkdir -p .mcp

echo "✅ GitHub MCP setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Your MCP configuration is in .mcp/config.json"
echo "2. Your GitHub credentials are in .env.mcp"
echo "3. You can now use GitHub MCP with compatible AI assistants"
echo ""
echo "🔧 Available GitHub MCP capabilities:"
echo "   - Repository management"
echo "   - Issue tracking"
echo "   - Pull request operations"
echo "   - File operations"
echo "   - Branch management"
echo "   - Commit history access"
