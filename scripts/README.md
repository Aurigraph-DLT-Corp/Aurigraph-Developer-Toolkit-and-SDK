# Aurigraph Scripts Directory

This directory contains all automation scripts for the Aurigraph DLT platform, organized by function.

## 📁 Directory Structure

```
scripts/
├── README.md (this file)
├── ci-cd/                  # CI/CD automation and deployment scripts
│   └── setup-remote-deployment.sh
├── deployment/             # Deployment automation scripts
├── setup/                  # Initial setup and configuration scripts
├── monitoring/             # Monitoring and observability scripts
├── testing/               # Testing and verification scripts
└── utilities/             # General utility and maintenance scripts
```

---

## 🎯 CI/CD Scripts

Location: `scripts/ci-cd/`

### setup-remote-deployment.sh
**Purpose**: Automated setup for remote server CI/CD deployment

**Usage**:
```bash
bash scripts/ci-cd/setup-remote-deployment.sh
```

**What it does**:
- Generates SSH ED25519 deployment key
- Configures GitHub Secrets automatically
- Creates remote deployment directories
- Verifies SSH connectivity

**Prerequisites**:
- GitHub CLI (`gh`) installed and authenticated
- SSH access to remote server
- Write permissions to GitHub repository

**Related Documentation**:
- See `docs/cicd/REMOTE_DEPLOYMENT_SETUP.md` for detailed instructions
- See `docs/cicd/README.md` for quick start

---

## 📝 Deployment Scripts

Location: `scripts/deployment/`

These scripts automate platform deployment across different environments.

**Available Scripts**:
- `ci-cd-deploy-entire-platform.sh` - Complete platform deployment
- `deploy-production.sh` - Production environment deployment
- `deploy-react-portal.sh` - Portal deployment
- `deploy-v4-production.sh` - V4 production deployment
- `docker-deploy-remote.sh` - Docker-based remote deployment
- Others for specific versions and environments

**Usage**:
```bash
bash scripts/deployment/ci-cd-deploy-entire-platform.sh
```

---

## 🔧 Setup Scripts

Location: `scripts/setup/`

Initial configuration and setup automation.

**Examples**:
- `setup-github-secrets.sh` - Configure GitHub Secrets
- `setup-grafana-monitoring.sh` - Monitoring setup
- `setup-git-hooks.sh` - Git hooks configuration
- Agent setup scripts

---

## 📊 Monitoring Scripts

Location: `scripts/monitoring/`

Monitoring, observability, and dashboard scripts.

**Examples**:
- `run-vizro-dashboard.sh` - Start Vizor dashboard
- `setup-grafana-monitoring.sh` - Grafana setup
- `monitor-batch-execution.sh` - Batch monitoring

---

## 🧪 Testing Scripts

Location: `scripts/testing/`

Testing, validation, and verification scripts.

**Examples**:
- `test-transition.sh` - Transition testing
- `test_local.sh` - Local environment testing
- `verify-leveldb-integration.sh` - Database verification
- `verify-closed-tickets.sh` - Ticket verification

---

## 🛠️ Utility Scripts

Location: `scripts/utilities/`

General utilities and maintenance scripts.

**Examples**:
- `fix-ssl-cert.sh` - SSL certificate fixes
- `fix-ui-https.sh` - HTTPS UI configuration
- `autoscale-nodes.sh` - Node autoscaling
- `create-portal-epic.sh` - Portal management
- `close-duplicate-tickets.sh` - Ticket management

---

## 🚀 Quick Start

### For CI/CD Setup
```bash
# Set up remote deployment
bash scripts/ci-cd/setup-remote-deployment.sh

# Then follow the prompts to configure GitHub Secrets
```

### For Production Deployment
```bash
# Deploy entire platform
bash scripts/deployment/ci-cd-deploy-entire-platform.sh

# Or specific components
bash scripts/deployment/deploy-production.sh
bash scripts/deployment/deploy-react-portal.sh
```

### For Local Testing
```bash
# Run local tests
bash scripts/testing/test_local.sh

# Verify integrations
bash scripts/testing/verify-leveldb-integration.sh
```

---

## 📚 Documentation Links

- **CI/CD Setup Guide**: `docs/cicd/REMOTE_DEPLOYMENT_SETUP.md`
- **CI/CD Overview**: `docs/cicd/README.md`
- **CI/CD Architecture**: `docs/cicd/CI_CD_REMOTE_DEPLOYMENT_SUMMARY.md`
- **GitHub Actions Workflow**: `.github/workflows/remote-deployment.yml`

---

## ⚙️ Common Tasks

### Setting Up Remote Deployment
```bash
# 1. Read documentation
cat docs/cicd/README.md

# 2. Run setup script
bash scripts/ci-cd/setup-remote-deployment.sh

# 3. Configure GitHub Secrets
gh secret list

# 4. Test deployment
# Go to GitHub Actions and manually trigger workflow
```

### Running Tests
```bash
# Full test suite
bash scripts/testing/test_local.sh

# Specific verification
bash scripts/testing/verify-leveldb-integration.sh
```

### Deploying to Production
```bash
# Review deployment script
cat scripts/deployment/ci-cd-deploy-entire-platform.sh

# Execute deployment
bash scripts/deployment/ci-cd-deploy-entire-platform.sh
```

---

## 🔐 Security Guidelines

✅ **Safe Practices**:
- Scripts use environment variables for secrets
- No hardcoded credentials
- SSH key-based authentication preferred
- Scripts validate prerequisites

❌ **Avoid**:
- Running unknown scripts without review
- Running with elevated privileges unnecessarily
- Storing credentials in scripts

---

## 🆘 Troubleshooting

### Script Not Found
```bash
# Verify script location
ls -la scripts/ci-cd/setup-remote-deployment.sh

# Check permissions
chmod +x scripts/ci-cd/setup-remote-deployment.sh
```

### Permission Denied
```bash
# Make script executable
chmod +x scripts/*/setup-remote-deployment.sh

# Or run with bash explicitly
bash scripts/ci-cd/setup-remote-deployment.sh
```

### Script Fails
1. Check error message
2. Review script documentation above
3. See related docs in `docs/cicd/`
4. Check GitHub Actions logs

---

## 📞 Support

For issues with scripts:

1. **Check documentation**:
   - `docs/cicd/` for CI/CD scripts
   - `DEVELOPMENT.md` for development scripts
   - `README.md` in specific script folder

2. **Review script headers**:
   - Most scripts have usage comments
   - Check prerequisites section

3. **GitHub Actions logs**:
   - Go to repository Actions tab
   - Review workflow execution logs

---

## 📝 Script Best Practices

When creating new scripts:

1. **Add header documentation**:
   ```bash
   #!/bin/bash
   # Description: What this script does
   # Usage: bash script-name.sh [options]
   # Prerequisites: What's needed
   ```

2. **Handle errors**:
   ```bash
   set -e
   trap 'echo "Error occurred"' ERR
   ```

3. **Validate prerequisites**:
   ```bash
   command -v docker >/dev/null || { echo "Docker required"; exit 1; }
   ```

4. **Use logging**:
   ```bash
   echo "[INFO] Starting process..."
   echo "[ERROR] Something went wrong"
   ```

5. **Test locally first**:
   ```bash
   bash -x script-name.sh  # debug mode
   ```

---

## 🔄 Script Organization Rules

**By Category**:
- `ci-cd/` - GitHub Actions and automation setup
- `deployment/` - Platform and service deployment
- `setup/` - Initial configuration
- `monitoring/` - Observability and dashboards
- `testing/` - Validation and verification
- `utilities/` - General maintenance

**Naming Convention**:
- Use descriptive names: `setup-remote-deployment.sh`
- Use hyphens for multi-word names
- Prefix with action: `setup-`, `deploy-`, `run-`, `verify-`, `test-`

---

## ✅ Maintenance Checklist

- [ ] Scripts have executable permissions (`chmod +x`)
- [ ] Documentation is up-to-date
- [ ] Prerequisites are documented
- [ ] Error handling is in place
- [ ] Tests pass locally
- [ ] Related docs reference the scripts

---

## 📊 Scripts Inventory

| Category | Count | Location |
|----------|-------|----------|
| CI/CD | 1 | `scripts/ci-cd/` |
| Deployment | 9+ | `scripts/deployment/` |
| Setup | 5+ | `scripts/setup/` |
| Monitoring | 3+ | `scripts/monitoring/` |
| Testing | 5+ | `scripts/testing/` |
| Utilities | 6+ | `scripts/utilities/` |
| **Total** | **30+** | - |

---

## 🎯 Next Steps

1. **For CI/CD Setup**: See `scripts/ci-cd/setup-remote-deployment.sh`
2. **For Deployments**: See `scripts/deployment/`
3. **For Setup**: See `scripts/setup/`
4. **For Help**: See `docs/cicd/README.md`

---

**Version**: 1.0
**Last Updated**: 2024-11-24
**Status**: ✅ Active & Maintained
