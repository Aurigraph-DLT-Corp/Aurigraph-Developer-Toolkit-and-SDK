# GitHub MCP Configuration for Aurigraph-DLT

This directory contains the Model Context Protocol (MCP) configuration for GitHub integration with the Aurigraph-DLT project.

## What is GitHub MCP?

GitHub MCP is a standardized protocol that allows AI assistants to interact with GitHub repositories through a consistent interface. It provides capabilities for:

- Repository management
- Issue tracking and management
- Pull request operations
- File and directory operations
- Branch management
- Commit history access
- Code search and analysis

## Setup Instructions

### 1. Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- GitHub Personal Access Token

### 2. Create GitHub Personal Access Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `read:org` (Read org and team membership)
   - `read:user` (Read user profile data)
4. Copy the generated token

### 3. Configure Environment

1. Copy `.env.mcp` and update with your token:
   ```bash
   cp .env.mcp .env.mcp.local
   # Edit .env.mcp.local with your actual token
   ```

2. Run the setup script:
   ```bash
   ./scripts/setup-github-mcp.sh
   ```

### 4. Verify Installation

Test the MCP server:
```bash
npx @modelcontextprotocol/server-github
```

## Configuration Files

- `config.json` - Main MCP server configuration
- `.env.mcp` - Environment variables template
- `README.md` - This documentation

## Usage with AI Assistants

Once configured, compatible AI assistants can use this MCP server to:

1. **Repository Operations**
   - List repositories
   - Get repository information
   - Create/delete repositories

2. **Issue Management**
   - List issues
   - Create/update issues
   - Add comments
   - Manage labels and milestones

3. **Pull Request Operations**
   - List pull requests
   - Create pull requests
   - Review and merge PRs
   - Manage PR comments

4. **File Operations**
   - Read file contents
   - Create/update files
   - Delete files
   - Search code

5. **Branch Management**
   - List branches
   - Create/delete branches
   - Switch branches

## Security Considerations

- Store your GitHub token securely
- Use environment variables, never commit tokens to version control
- Regularly rotate your GitHub tokens
- Use minimal required scopes for your token

## Troubleshooting

### Common Issues

1. **Token Authentication Failed**
   - Verify token is correct
   - Check token scopes
   - Ensure token hasn't expired

2. **MCP Server Not Found**
   - Run `npm install -g @modelcontextprotocol/server-github`
   - Check Node.js version (requires v18+)

3. **Permission Denied**
   - Verify token has required scopes
   - Check repository access permissions

### Getting Help

- Check the [MCP GitHub Server documentation](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
- Review GitHub API documentation
- Check Aurigraph-DLT project issues

## Integration with Aurigraph-DLT

This MCP configuration is specifically tailored for the Aurigraph-DLT project and includes:

- Repository: `Aurigraph-DLT-Corp/Aurigraph-DLT`
- Project-specific issue templates
- Custom workflow integration
- Development environment compatibility
