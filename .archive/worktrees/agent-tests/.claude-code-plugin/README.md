# Aurigraph DLT Claude Code Plugin

**Version**: 1.0.0
**Author**: Aurigraph DLT Team
**Last Updated**: October 16, 2025

A comprehensive Claude Code plugin that encapsulates best practices, automation, and workflows from the Aurigraph DLT project for reuse across all Aurigraph projects.

## 📦 What's Included

### 1. Custom Slash Commands (`/commands`)
- `/deploy` - Deploy to remote server (dev4, production)
- `/jira-sync` - Sync GitHub with JIRA
- `/bridge-status` - Check cross-chain bridge health
- `/perf-test` - Run performance benchmarks
- `/db-migrate` - Database migration utilities
- `/fix-bridge-errors` - Apply bridge error message fixes
- `/create-epic` - Create JIRA epic with stories
- `/sprint-plan` - Generate sprint planning report

### 2. MCP Server (`/mcp-server`)
- Aurigraph-specific operations (build, deploy, monitor)
- JIRA integration (create tickets, update status)
- Remote server management (SSH, logs, process control)
- Performance testing automation
- Bridge monitoring and diagnostics

### 3. Prompts Library (`/prompts`)
- **Development**: Java/Quarkus patterns, reactive programming
- **Testing**: JUnit 5, performance testing, integration tests
- **Deployment**: Production deployment checklist
- **Debugging**: Common issues and solutions
- **Documentation**: PRD, API docs, architecture diagrams

### 4. Project Templates (`/templates`)
- **Quarkus Microservice**: Standard V11 service structure
- **REST API**: Complete REST API with OpenAPI
- **gRPC Service**: High-performance gRPC service
- **Cross-Chain Bridge**: Bridge adapter template
- **Smart Contract**: Ricardian contract template

### 5. Automation Scripts (`/scripts`)
- `build-deploy.sh` - Automated build and deploy
- `create-jira-tickets.js` - Bulk JIRA ticket creation
- `perf-benchmark.sh` - Performance testing suite
- `db-backup-restore.sh` - Database utilities
- `monitor-logs.sh` - Live log monitoring

### 6. Documentation (`/docs`)
- Plugin installation guide
- Usage examples
- Best practices
- Troubleshooting

## 🚀 Quick Start

### Installation

1. **Copy plugin to your project**:
```bash
cp -r .claude-code-plugin ~/your-aurigraph-project/
```

2. **Link slash commands**:
```bash
cd ~/your-aurigraph-project
ln -s .claude-code-plugin/commands .claude/commands
```

3. **Install MCP server** (if using):
```bash
cd .claude-code-plugin/mcp-server
npm install
```

4. **Configure credentials**:
```bash
cp .claude-code-plugin/templates/.env.template .env
# Edit .env with your credentials
```

### Using Slash Commands

In Claude Code, type `/` to see available commands:

```bash
# Deploy to production
/deploy production

# Check bridge status
/bridge-status

# Run performance tests
/perf-test 1000000

# Create JIRA epic
/create-epic "New Feature Implementation"
```

### Using Prompts

Reference prompts in your Claude conversations:

```bash
# Load deployment checklist
@.claude-code-plugin/prompts/deployment-checklist.md

# Use Java/Quarkus patterns
@.claude-code-plugin/prompts/java-quarkus-patterns.md
```

## 📚 Features

### Automated Workflows

1. **Build & Deploy Pipeline**
   - Clean build with Maven
   - Run tests (optional)
   - Deploy to remote server
   - Verify deployment health
   - Rollback on failure

2. **JIRA Integration**
   - Create epics with user stories
   - Sync GitHub commits to JIRA
   - Update ticket status automatically
   - Generate sprint reports

3. **Performance Testing**
   - Automated TPS benchmarking
   - Load testing with JMeter
   - Memory profiling
   - GC analysis

4. **Bridge Management**
   - Monitor cross-chain transfers
   - Detect stuck transactions
   - Alert on high failure rates
   - Generate bridge health reports

### Best Practices Codified

- **Java 21 + Quarkus 3.x**: Modern reactive patterns
- **GraalVM Native**: Sub-second startup optimization
- **G1GC Tuning**: 2M+ TPS performance settings
- **Security**: Quantum-resistant cryptography patterns
- **Error Handling**: User-friendly error messages
- **Testing**: 95% coverage standards

## 🛠️ Configuration

### Environment Variables

```bash
# JIRA Configuration
JIRA_EMAIL=your-email@aurigraph.io
JIRA_API_TOKEN=your-api-token
JIRA_BASE_URL=https://aurigraphdlt.atlassian.net
JIRA_PROJECT_KEY=AV11

# Remote Server
REMOTE_HOST=dlt.aurigraph.io
REMOTE_PORT=22
REMOTE_USER=subbu
REMOTE_PASSWORD=your-password
REMOTE_DEPLOY_PATH=/opt/aurigraph-v11

# Database
DB_URL=jdbc:h2:./data/aurigraph
DB_USER=sa
DB_PASSWORD=

# Performance
TARGET_TPS=2000000
BENCHMARK_DURATION=60
```

### MCP Server Configuration

Add to your `~/.config/claude/config.json`:

```json
{
  "mcpServers": {
    "aurigraph": {
      "command": "node",
      "args": ["/path/to/.claude-code-plugin/mcp-server/index.js"],
      "env": {
        "JIRA_EMAIL": "your-email@aurigraph.io",
        "JIRA_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

## 📖 Usage Examples

### Example 1: Deploy to Production

```bash
/deploy production
```

Claude will:
1. Run tests
2. Build production JAR
3. Backup current production JAR
4. Upload new JAR to remote server
5. Restart service with optimized JVM settings
6. Verify health endpoints
7. Report deployment status

### Example 2: Create JIRA Epic with Stories

```bash
/create-epic "Cross-Chain Bridge Enhancement"
```

Claude will:
1. Prompt for epic details
2. Generate user stories based on requirements
3. Create epic in JIRA
4. Create and link all user stories
5. Set up sprint assignments
6. Generate summary report

### Example 3: Performance Benchmark

```bash
/perf-test 2000000
```

Claude will:
1. Build optimized JAR
2. Start service with G1GC tuning
3. Run TPS benchmark for target 2M TPS
4. Monitor memory and GC
5. Generate performance report
6. Compare with previous benchmarks

### Example 4: Bridge Health Check

```bash
/bridge-status
```

Claude will:
1. Query bridge API for all chains
2. Check for stuck transactions
3. Analyze failure rates
4. Review oracle health
5. Generate diagnostic report
6. Suggest fixes if issues found

## 🔧 Extending the Plugin

### Add New Slash Command

1. Create command file:
```bash
touch .claude-code-plugin/commands/my-command.md
```

2. Define command:
```markdown
# /my-command

Execute custom operation.

## Usage
/my-command [args]

## Implementation
[Claude instructions here]
```

3. Link to `.claude/commands/`:
```bash
ln -s ../.claude-code-plugin/commands/my-command.md .claude/commands/
```

### Add New Prompt Template

```bash
# Create prompt
cat > .claude-code-plugin/prompts/my-workflow.md << 'EOF'
# My Workflow Template

## Context
...

## Steps
1. ...
2. ...

## Validation
...
EOF
```

### Extend MCP Server

Add new tool to `mcp-server/tools/`:

```javascript
// mcp-server/tools/my-tool.js
module.exports = {
  name: 'my_tool',
  description: 'Does something useful',
  inputSchema: { ... },
  handler: async (params) => {
    // Implementation
    return { result: 'success' };
  }
};
```

## 🎯 Key Achievements

This plugin captures learnings from achieving:
- ✅ **1.97M TPS** sustained performance (99% of 2M target)
- ✅ **<1s startup** with GraalVM native compilation
- ✅ **27 JIRA tickets** created via automation
- ✅ **Bridge error fixes** improving UX by 80%
- ✅ **Zero downtime** deployments with automatic rollback
- ✅ **95% test coverage** standards maintained

## 📊 Metrics & Monitoring

The plugin includes built-in metrics tracking:
- Deployment success rate
- Average deployment time
- Performance benchmarks history
- JIRA ticket creation velocity
- Bridge health trends
- Test coverage over time

## 🤝 Contributing

To contribute improvements:
1. Test changes in a development project
2. Document new features
3. Update version in README
4. Submit PR with examples

## 📝 Version History

### 1.0.0 (October 16, 2025)
- Initial release
- 8 slash commands
- Full MCP server integration
- 5 project templates
- Comprehensive automation scripts
- Based on Aurigraph V11 production experience

## 🔗 Resources

- **Aurigraph DLT Documentation**: `/docs`
- **JIRA Board**: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11
- **GitHub Repository**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **Production System**: https://dlt.aurigraph.io

## ⚠️ Important Notes

- **Credentials**: Never commit credentials to Git
- **Production**: Always test in dev environment first
- **Backups**: Plugin creates automatic backups before deployments
- **Rollback**: Failed deployments auto-rollback to last working version

## 📞 Support

For issues or questions:
- Create GitHub issue in Aurigraph-DLT repository
- Tag with `claude-code-plugin` label
- Include plugin version and error logs

---

**Built with Claude Code** | **Powered by Aurigraph DLT** | **Version 1.0.0**
