# Installation Guide - Aurigraph DLT Claude Code Plugin

This guide will help you install and configure the Aurigraph DLT Claude Code plugin.

## Prerequisites

- Claude Code CLI installed
- Node.js 20+ (for MCP server)
- Access to Aurigraph projects
- JIRA account with API token
- SSH access to deployment servers

## Installation Steps

### 1. Copy Plugin to Your Project

```bash
# From Aurigraph-DLT repository
cd /path/to/your-aurigraph-project
cp -r /path/to/Aurigraph-DLT/.claude-code-plugin .
```

### 2. Set Up Slash Commands

```bash
# Create .claude directory if it doesn't exist
mkdir -p .claude/commands

# Link slash commands
cd .claude/commands
ln -s ../../.claude-code-plugin/commands/deploy.md deploy.md
ln -s ../../.claude-code-plugin/commands/jira-sync.md jira-sync.md
ln -s ../../.claude-code-plugin/commands/bridge-status.md bridge-status.md
ln -s ../../.claude-code-plugin/commands/perf-test.md perf-test.md

# Verify links
ls -la
```

### 3. Configure Environment Variables

```bash
# Copy example env file
cp .claude-code-plugin/templates/.env.template .env

# Edit with your credentials
nano .env
```

Required variables:

```bash
# JIRA Configuration
JIRA_EMAIL=your-email@aurigraph.io
JIRA_API_TOKEN=your-jira-api-token
JIRA_BASE_URL=https://aurigraphdlt.atlassian.net
JIRA_PROJECT_KEY=AV11

# Remote Server
REMOTE_HOST=dlt.aurigraph.io
REMOTE_PORT=22
REMOTE_USER=subbu
REMOTE_PASSWORD=your-password
REMOTE_DEPLOY_PATH=/opt/aurigraph-v11

# API Endpoints
API_BASE_URL=http://localhost:9003

# Performance Testing
TARGET_TPS=2000000
BENCHMARK_DURATION=60
PARALLEL_THREADS=256
```

### 4. Install MCP Server (Optional but Recommended)

```bash
# Navigate to MCP server directory
cd .claude-code-plugin/mcp-server

# Install dependencies
npm install

# Test server
npm start
```

### 5. Configure MCP Server in Claude Code

Edit your Claude Code configuration (`~/.config/claude/config.json` or `~/.claude/config.json`):

```json
{
  "mcpServers": {
    "aurigraph": {
      "command": "node",
      "args": ["/absolute/path/to/.claude-code-plugin/mcp-server/index.js"],
      "env": {
        "JIRA_EMAIL": "your-email@aurigraph.io",
        "JIRA_API_TOKEN": "your-api-token",
        "JIRA_BASE_URL": "https://aurigraphdlt.atlassian.net",
        "JIRA_PROJECT_KEY": "AV11",
        "REMOTE_HOST": "dlt.aurigraph.io",
        "REMOTE_USER": "subbu",
        "REMOTE_PASSWORD": "your-password",
        "API_BASE_URL": "http://localhost:9003"
      }
    }
  }
}
```

**Important**: Replace `/absolute/path/to/` with the actual full path to your project.

### 6. Verify Installation

```bash
# Test slash commands are available
claude-code

# In Claude Code, type:
/deploy
/jira-sync
/bridge-status
/perf-test

# Test MCP server tools
# In Claude Code, ask:
"Check if the Aurigraph service is running"
"Get recent service logs"
"Check bridge health"
```

## Obtaining JIRA API Token

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a label (e.g., "Claude Code Plugin")
4. Copy the token immediately (it won't be shown again)
5. Add to your `.env` file

## SSH Key Setup (Alternative to Password)

For better security, use SSH keys instead of passwords:

```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your-email@aurigraph.io"

# Copy public key to remote server
ssh-copy-id -p 22 subbu@dlt.aurigraph.io

# Remove REMOTE_PASSWORD from .env
# MCP server will use SSH key authentication
```

## Troubleshooting

### Slash Commands Not Appearing

```bash
# Check if commands directory exists
ls -la .claude/commands

# Verify symbolic links
ls -la .claude/commands/*.md

# Restart Claude Code
```

### MCP Server Not Connecting

```bash
# Check MCP server logs
cd .claude-code-plugin/mcp-server
npm start

# Verify config.json syntax
cat ~/.config/claude/config.json | jq .

# Check Node.js version
node --version  # Should be 20+
```

### JIRA API Errors

```bash
# Test JIRA credentials
curl -u your-email@aurigraph.io:your-api-token \
  https://aurigraphdlt.atlassian.net/rest/api/3/myself

# Verify project key exists
curl -u your-email@aurigraph.io:your-api-token \
  https://aurigraphdlt.atlassian.net/rest/api/3/project/AV11
```

### SSH Connection Failures

```bash
# Test SSH connection manually
ssh -p 22 subbu@dlt.aurigraph.io "echo 'Connection successful'"

# Check firewall/network
ping dlt.aurigraph.io

# Verify credentials
ssh -v -p 22 subbu@dlt.aurigraph.io
```

## Updating the Plugin

```bash
# Pull latest changes from Aurigraph-DLT repo
cd /path/to/Aurigraph-DLT
git pull origin main

# Copy updated plugin
cd /path/to/your-project
rm -rf .claude-code-plugin
cp -r /path/to/Aurigraph-DLT/.claude-code-plugin .

# Reinstall MCP dependencies if updated
cd .claude-code-plugin/mcp-server
npm install
```

## Uninstallation

```bash
# Remove plugin
rm -rf .claude-code-plugin

# Remove slash command links
rm .claude/commands/deploy.md
rm .claude/commands/jira-sync.md
rm .claude/commands/bridge-status.md
rm .claude/commands/perf-test.md

# Remove MCP server from config.json
# Edit ~/.config/claude/config.json and remove "aurigraph" entry
```

## Security Best Practices

1. **Never commit .env files** - Add to .gitignore
2. **Rotate API tokens regularly** - Every 90 days
3. **Use SSH keys** instead of passwords when possible
4. **Limit JIRA token permissions** - Only what's needed
5. **Use separate tokens** for dev/staging/prod
6. **Review MCP server access** - Audit what it can do
7. **Keep credentials encrypted** - Use system keychain if available

## Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review plugin README.md
3. Check MCP server logs
4. Create GitHub issue with details:
   - Plugin version
   - Node.js version
   - Error messages
   - Steps to reproduce

## Next Steps

After installation:

1. ✅ Test slash commands with `/deploy dev4 --skip-tests`
2. ✅ Verify MCP server with "Check service status"
3. ✅ Review prompts in `.claude-code-plugin/prompts/`
4. ✅ Customize for your project needs
5. ✅ Share feedback with the team

## Additional Resources

- Plugin README: `.claude-code-plugin/README.md`
- Slash Commands: `.claude-code-plugin/commands/`
- Prompts Library: `.claude-code-plugin/prompts/`
- MCP Server Code: `.claude-code-plugin/mcp-server/`
- Templates: `.claude-code-plugin/templates/`

---

**Installed Version**: 1.0.0
**Last Updated**: October 16, 2025
**Maintained by**: Aurigraph DLT Team
