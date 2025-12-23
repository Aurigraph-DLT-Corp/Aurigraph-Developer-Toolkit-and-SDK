# Aurigraph Enterprise Portal v4.0.0 - Terraform Infrastructure

Infrastructure-as-Code for deploying the Aurigraph Enterprise Portal to production servers with automated build, deployment, and SSL configuration.

## 🎯 Features

- **Automated Frontend Build**: Builds React/TypeScript frontend with Vite
- **Secure Deployment**: SSH-based deployment with password authentication
- **nginx Configuration**: Automated nginx setup with HTTPS/SSL
- **SSL Certificate Management**: Optional Let's Encrypt automation
- **Deployment Verification**: Automated health checks and validation
- **Rollback Support**: Automatic backup of previous deployments
- **Idempotent**: Safe to run multiple times

## 📋 Prerequisites

### Local Requirements
- Terraform >= 1.5.0
- Node.js >= 18.0.0
- npm >= 9.0.0

### Remote Server Requirements
- Ubuntu 22.04+ or similar Linux distribution
- nginx installed and configured
- SSL certificate (or certbot for auto-setup)
- SSH access with password authentication
- Aurigraph V11 backend running on port 8443

## 🚀 Quick Start

### 1. Configure Variables

Copy the example configuration:

```bash
cd enterprise-portal/terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
remote_host     = "dlt.aurigraph.io"
remote_user     = "subbu"
remote_port     = 22
domain_name     = "dlt.aurigraph.io"
backend_port    = 8443
environment     = "production"
```

### 2. Set Password (Secure Method)

**Option A**: Environment variable (recommended)
```bash
export TF_VAR_remote_password="your-password-here"
```

**Option B**: In terraform.tfvars (less secure)
```hcl
remote_password = "your-password-here"
```

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Plan Deployment

Review the deployment plan:

```bash
terraform plan
```

### 5. Deploy

```bash
terraform apply
```

Or auto-approve for CI/CD:

```bash
terraform apply -auto-approve
```

## 📂 Project Structure

```
enterprise-portal/terraform/
├── main.tf                       # Main Terraform configuration
├── variables.tf                  # Input variables
├── outputs.tf                    # Output values
├── terraform.tfvars.example      # Example configuration
├── terraform.tfvars              # Your configuration (gitignored)
├── templates/
│   └── nginx-complete.conf.tpl   # nginx configuration template
└── README.md                     # This file
```

## 🔧 Terraform Resources

### null_resource.build_frontend
- Builds React/TypeScript frontend with `npm run build`
- Triggered on every apply

### null_resource.create_deployment_package
- Creates tar.gz package of dist folder
- Depends on successful frontend build

### local_file.nginx_config
- Generates nginx configuration from template
- Includes SSL, proxy settings, and optimizations

### null_resource.deploy_portal
- Uploads deployment package to remote server
- Uploads nginx configuration
- Extracts files to `/var/www/aurigraph-portal`
- Configures and reloads nginx

### null_resource.setup_ssl_certificate (optional)
- Automatically installs Let's Encrypt SSL certificate
- Only runs if `auto_setup_ssl = true`
- Skips if certificate already exists

### null_resource.verify_deployment
- Verifies deployment was successful
- Checks portal files, nginx status, backend health
- Tests external HTTPS access

## 🌐 Deployment Workflow

1. **Build**: Compiles frontend to production bundle
2. **Package**: Creates compressed deployment package
3. **Upload**: Transfers files to remote server via SSH
4. **Deploy**: Extracts files and sets permissions
5. **Configure**: Installs nginx configuration
6. **Reload**: Reloads nginx with zero downtime
7. **Verify**: Runs health checks and validation

## 📊 Outputs

After successful deployment, Terraform provides:

```
portal_url              = "https://dlt.aurigraph.io"
portal_version          = "4.0.0"
deployment_timestamp    = "2025-10-10-0452"
remote_server           = { host, port, user }
portal_path             = "/var/www/aurigraph-portal"
nginx_config_path       = "/etc/nginx/sites-available/aurigraph-complete"
backend_endpoint        = "http://localhost:8443"
deployment_summary      = <formatted summary>
```

## 🔐 Security Best Practices

### Password Management

**Never commit passwords to version control!**

1. Use environment variables:
   ```bash
   export TF_VAR_remote_password="password"
   terraform apply
   ```

2. Use a `.tfvars` file (gitignored):
   ```bash
   echo 'terraform.tfvars' >> .gitignore
   ```

3. Use SSH keys instead (future enhancement):
   ```hcl
   # TODO: Add SSH key support
   ```

### SSL Certificates

- Use Let's Encrypt for free SSL certificates
- Set `auto_setup_ssl = true` for automatic setup
- Certificates auto-renew with certbot

## 🛠 Advanced Usage

### Custom nginx Configuration

Edit `templates/nginx-complete.conf.tpl` to customize:
- Worker processes and connections
- Proxy settings and timeouts
- Security headers
- Cache settings
- Compression levels

### Environment-Specific Deployments

```bash
# Development
terraform apply -var="environment=dev" -var="domain_name=dev.aurigraph.io"

# Staging
terraform apply -var="environment=staging" -var="domain_name=staging.aurigraph.io"

# Production
terraform apply -var="environment=production"
```

### Rollback Deployment

Terraform automatically backs up previous deployments:

```bash
# SSH to server
ssh subbu@dlt.aurigraph.io

# View backups
ls -l /var/www/aurigraph-portal/

# Restore from backup
sudo rm -rf /var/www/aurigraph-portal/dist
sudo mv /var/www/aurigraph-portal/dist.backup.YYYY-MM-DD-HHMM /var/www/aurigraph-portal/dist
sudo systemctl reload nginx
```

### Manual SSL Setup

If `auto_setup_ssl = false`, install SSL manually:

```bash
ssh subbu@dlt.aurigraph.io
sudo certbot --nginx -d dlt.aurigraph.io
```

## 📝 Variables Reference

### Required Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `remote_password` | SSH password | - (required) |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `remote_host` | Remote server hostname | `dlt.aurigraph.io` |
| `remote_user` | SSH username | `subbu` |
| `remote_port` | SSH port | `22` |
| `domain_name` | Portal domain | `dlt.aurigraph.io` |
| `backend_port` | V11 backend port | `8443` |
| `environment` | Deployment environment | `production` |
| `auto_setup_ssl` | Auto-install SSL certificate | `false` |
| `enable_backup` | Enable deployment backups | `true` |
| `retention_days` | Backup retention days | `7` |

## 🔍 Troubleshooting

### Build Fails

```bash
# Check Node.js version
node --version  # Should be >= 18

# Clean and rebuild
cd ../enterprise-portal/frontend
rm -rf node_modules dist
npm install
npm run build
```

### SSH Connection Fails

```bash
# Test SSH connection
ssh subbu@dlt.aurigraph.io -p 22

# Check password
export TF_VAR_remote_password="correct-password"
```

### nginx Configuration Error

```bash
# SSH to server
ssh subbu@dlt.aurigraph.io

# Test nginx config
sudo nginx -t

# View nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Deployment Verification Fails

```bash
# Check portal files
ssh subbu@dlt.aurigraph.io "ls -la /var/www/aurigraph-portal/dist/"

# Check nginx status
ssh subbu@dlt.aurigraph.io "sudo systemctl status nginx"

# Check backend
ssh subbu@dlt.aurigraph.io "curl http://localhost:8443/q/health"
```

## 🚨 Common Issues

### Port 9003 vs 8443

The backend runs on port **8443** (not 9003). Ensure:
```hcl
backend_port = 8443
```

### nginx Configuration Conflicts

If multiple nginx configs exist:
```bash
# Disable conflicting configs
sudo rm /etc/nginx/sites-enabled/aurigraph-portal
sudo systemctl reload nginx
```

### SSL Certificate Path

Check the correct certificate path:
```bash
sudo certbot certificates
# Use the path shown in output
```

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Enterprise Portal

on:
  push:
    branches: [main]
    paths:
      - 'enterprise-portal/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.5.0

      - name: Terraform Init
        run: terraform init
        working-directory: enterprise-portal/terraform

      - name: Terraform Apply
        run: terraform apply -auto-approve
        working-directory: enterprise-portal/terraform
        env:
          TF_VAR_remote_password: ${{ secrets.REMOTE_PASSWORD }}
```

## 🎯 Future Enhancements

- [ ] SSH key-based authentication
- [ ] Multi-environment workspaces
- [ ] Remote state backend (S3/GCS)
- [ ] Blue-green deployments
- [ ] Health check monitoring integration
- [ ] Automated rollback on failure
- [ ] Docker-based deployment option

## 📚 Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Aurigraph DLT Repository](https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT)

## 📧 Support

For issues or questions:
- GitHub Issues: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues
- Email: subbu@aurigraph.io

---

**Generated with Terraform for Aurigraph Enterprise Portal v4.0.0**
