# Quick Start Guide - New Directory Structure

## For Developers: Immediate Actions Required

### 1. Pull Latest Changes (RIGHT NOW)
```bash
cd /path/to/aurigraph-v11-standalone
git pull origin main
```

### 2. Update Your IDE Configuration

#### IntelliJ IDEA
1. File → Project Structure → Modules
2. Update source folders:
   - Remove: `src/main/java`
   - Add: `01-source/main/java`
   - Remove: `src/test/java`
   - Add: `01-source/test/java`
3. Click Apply → OK

#### VS Code
Update `.vscode/settings.json`:
```json
{
  "java.project.sourcePaths": ["01-source/main/java"],
  "java.project.outputPath": "10-build/artifacts/target/classes",
  "java.test.sourcePaths": ["01-source/test/java"]
}
```

#### Eclipse
1. Right-click project → Properties → Java Build Path
2. Source tab → Remove old paths
3. Add Folder → Select `01-source/main/java`
4. Add Folder → Select `01-source/test/java`

### 3. Verify Build Still Works
```bash
./mvnw clean compile
./mvnw test
```

**If build fails**, check pom.xml needs updating (DevOps team handles this).

## Common Path Changes

### Before → After

| Old Path | New Path | Usage |
|----------|----------|-------|
| `src/main/java/` | `01-source/main/java/` | Java source code |
| `src/test/java/` | `01-source/test/java/` | Test code |
| `Dockerfile` | `05-deployment/docker/Dockerfile` | Docker builds |
| `scripts/deploy.sh` | `05-deployment/scripts/deploy.sh` | Deployment |
| `config/` | `02-config/common/` | Configuration files |
| `target/` | `10-build/artifacts/target/` | Build outputs |
| `logs/` | `08-monitoring/logs/` | Application logs |

## Where Do Files Go Now?

### I want to...

#### Add source code
📁 Location: `01-source/main/java/io/aurigraph/v11/`
✅ Action: Create your Java files here

#### Add a test
📁 Location: `01-source/test/java/io/aurigraph/v11/`
✅ Action: Create test files here

#### Update configuration
📁 Location: `02-config/dev/` (development)
📁 Location: `02-config/prod/` (production - restricted!)
✅ Action: Update config files, never commit secrets

#### Add documentation
📁 Location: `04-documentation/`
- Architecture: `04-documentation/architecture/`
- API docs: `04-documentation/api/`
- Development guides: `04-documentation/development/`

#### Deploy to production
📁 Location: `05-deployment/docker/` or `05-deployment/kubernetes/`
✅ Action: Update deployment files, test in dev first

#### Check logs
📁 Location: `08-monitoring/logs/`
✅ Action: View logs, never commit log files

#### Run tests
📁 Location: `09-testing/`
```bash
cd 09-testing
./run-tests.sh
```

## What NOT to Do

### 🚫 NEVER Commit These
- Files in `03-secrets/` (excluded from Git)
- Log files in `08-monitoring/logs/`
- Build artifacts in `10-build/`
- Test reports with sensitive data
- Production credentials anywhere

### ✅ ALWAYS Do These
- Update .gitignore if you add new secret types
- Document your changes in appropriate README
- Follow the directory structure
- Ask security@aurigraph.io if unsure about file location

## Quick Reference Commands

### Build & Run
```bash
# Development mode
./mvnw quarkus:dev

# Package application
./mvnw clean package

# Run tests
./mvnw test

# Build native
./mvnw package -Pnative
```

### Find Files
```bash
# Find Java source files
find 01-source/main/java -name "*.java"

# Find configuration files
find 02-config -name "*.properties"

# Find deployment files
find 05-deployment -name "*.yml"
```

### View Logs
```bash
# Application logs
tail -f 08-monitoring/logs/application.log

# Security logs
tail -f 07-compliance/audit-logs/security-logs/security.log
```

## Need Help?

### Technical Issues
- **DevOps Team**: devops@aurigraph.io
- **Build failures**: Post in #devops Slack channel

### Security Questions
- **Security Team**: security@aurigraph.io
- **Access issues**: Post in #security Slack channel

### General Questions
- **Read**: `00-README-DIRECTORY-STRUCTURE.md`
- **Read**: `ISO27001-MIGRATION-SUMMARY.md`
- **Ask**: project-manager@aurigraph.io

## Office Hours (First Week Only)

- **DevOps Support**: Daily 2-3 PM
- **Security Q&A**: Daily 3-4 PM
- **General Help**: Drop-in anytime

## Checklist for Today

- [ ] Pull latest code
- [ ] Update IDE settings
- [ ] Run `./mvnw clean compile` to verify
- [ ] Run `./mvnw test` to verify tests
- [ ] Read `00-README-DIRECTORY-STRUCTURE.md`
- [ ] Update any personal scripts with new paths
- [ ] Notify team of any issues

## Migration Status

✅ **COMPLETE**: Directory structure created
✅ **COMPLETE**: Files moved
✅ **COMPLETE**: Documentation created
⏳ **IN PROGRESS**: Build configuration updates (DevOps)
⏳ **IN PROGRESS**: CI/CD pipeline updates (DevOps)
⏳ **PENDING**: Access control setup (Security Team)

---

**Last Updated**: 2025-11-25
**Questions**: devops@aurigraph.io
