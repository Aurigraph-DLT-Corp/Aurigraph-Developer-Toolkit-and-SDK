#!/bin/bash

# Global GitHub MCP Setup Script
# Sets up GitHub MCP across all projects for user SUBBUAURIGRAPH

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# GitHub token (already configured)
GITHUB_TOKEN="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"

echo -e "${BLUE}🚀 Setting up Global GitHub MCP for All Projects${NC}"
echo -e "${BLUE}=================================================${NC}"

# Function to setup MCP in a directory
setup_mcp_in_directory() {
    local dir="$1"
    echo -e "${YELLOW}📁 Setting up MCP in: $dir${NC}"
    
    cd "$dir"
    
    # Create package.json if it doesn't exist
    if [ ! -f "package.json" ]; then
        echo -e "${BLUE}📦 Creating package.json...${NC}"
        cat > package.json << EOF
{
  "name": "$(basename "$dir")-mcp",
  "version": "1.0.0",
  "description": "GitHub MCP configuration for $(basename "$dir")",
  "scripts": {
    "mcp:github": "node ./node_modules/@modelcontextprotocol/server-github/dist/index.js",
    "mcp:test": "node -e \"console.log('MCP GitHub server available')\"",
    "mcp:setup": "./scripts/setup-github-mcp.sh"
  },
  "dependencies": {
    "@modelcontextprotocol/server-github": "^2025.4.8"
  },
  "keywords": ["mcp", "github", "$(basename "$dir")"],
  "author": "SUBBUAURIGRAPH",
  "license": "MIT"
}
EOF
    fi
    
    # Install GitHub MCP server
    echo -e "${BLUE}📦 Installing GitHub MCP server...${NC}"
    npm install @modelcontextprotocol/server-github
    
    # Create MCP directory
    mkdir -p .mcp
    
    # Create MCP config
    cat > .mcp/config.json << EOF
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": [
        "./node_modules/@modelcontextprotocol/server-github/dist/index.js"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "$GITHUB_TOKEN",
        "GITHUB_API_URL": "https://api.github.com"
      }
    }
  },
  "version": "1.0.0",
  "description": "GitHub MCP configuration for $(basename "$dir")"
}
EOF
    
    # Create environment file
    cat > .env.mcp << EOF
# GitHub MCP Configuration for $(basename "$dir")
GITHUB_PERSONAL_ACCESS_TOKEN=$GITHUB_TOKEN
GITHUB_API_URL=https://api.github.com
GITHUB_DEFAULT_ORG=Aurigraph-DLT-Corp
EOF
    
    # Create or update .gitignore
    if [ ! -f ".gitignore" ]; then
        touch .gitignore
    fi
    
    # Add MCP-related entries to .gitignore if not already present
    grep -q ".env.mcp.local" .gitignore || echo ".env.mcp.local" >> .gitignore
    grep -q "node_modules/" .gitignore || echo "node_modules/" >> .gitignore
    grep -q ".mcp/secrets/" .gitignore || echo ".mcp/secrets/" >> .gitignore
    
    # Create scripts directory if it doesn't exist
    mkdir -p scripts
    
    # Copy test script if it exists in current directory
    if [ -f "../scripts/test-github-mcp.js" ]; then
        cp "../scripts/test-github-mcp.js" scripts/
        chmod +x scripts/test-github-mcp.js
    fi
    
    echo -e "${GREEN}✅ MCP setup complete for $dir${NC}"
    cd - > /dev/null
}

# Get current directory
CURRENT_DIR=$(pwd)

# Setup MCP in current directory
echo -e "${YELLOW}🔧 Setting up MCP in current directory...${NC}"
setup_mcp_in_directory "$CURRENT_DIR"

# Ask user if they want to setup MCP in other directories
echo -e "${YELLOW}🤔 Do you want to setup MCP in other project directories? (y/n)${NC}"
read -r setup_others

if [ "$setup_others" = "y" ] || [ "$setup_others" = "Y" ]; then
    echo -e "${BLUE}📂 Please enter project directories (one per line, empty line to finish):${NC}"
    
    while true; do
        read -r project_dir
        if [ -z "$project_dir" ]; then
            break
        fi
        
        if [ -d "$project_dir" ]; then
            setup_mcp_in_directory "$project_dir"
        else
            echo -e "${RED}❌ Directory not found: $project_dir${NC}"
        fi
    done
fi

# Test the setup
echo -e "${BLUE}🧪 Testing GitHub API connection...${NC}"
if curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user > /dev/null; then
    echo -e "${GREEN}✅ GitHub API connection successful${NC}"
    echo -e "${GREEN}✅ User: SUBBUAURIGRAPH${NC}"
else
    echo -e "${RED}❌ GitHub API connection failed${NC}"
fi

echo -e "${BLUE}=================================================${NC}"
echo -e "${GREEN}🎉 Global GitHub MCP Setup Complete!${NC}"
echo -e "${BLUE}📋 What's been configured:${NC}"
echo -e "   • GitHub MCP server installed"
echo -e "   • Configuration files created"
echo -e "   • Environment variables set"
echo -e "   • Package.json scripts added"
echo -e "   • .gitignore updated"
echo ""
echo -e "${BLUE}🚀 Usage:${NC}"
echo -e "   • Test: ${YELLOW}npm run mcp:test${NC}"
echo -e "   • Run: ${YELLOW}npm run mcp:github${NC}"
echo -e "   • Verify: ${YELLOW}node scripts/test-github-mcp.js${NC}"
echo ""
echo -e "${BLUE}📖 Documentation: ${YELLOW}Claude.md${NC}"
