# Aurigraph V11 Multi-Cloud Infrastructure

This directory contains Infrastructure-as-Code (IaC) for deploying Aurigraph V11 across AWS, Azure, and GCP.

## Directory Structure

```
infrastructure/
├── README.md                          # This file
├── docs/                              # Documentation
│   ├── MULTI_CLOUD_DEPLOYMENT_STRATEGY.md  # Complete deployment strategy
│   └── CLOUD_MIGRATION_RUNBOOK.md          # Step-by-step migration guide
├── terraform/                         # Terraform configurations
│   ├── aws/                          # AWS infrastructure
│   │   ├── main.tf                   # Main AWS configuration
│   │   ├── variables.tf              # AWS variables
│   │   ├── outputs.tf                # AWS outputs
│   │   └── modules/                  # AWS-specific modules
│   │       ├── vpc/                  # VPC module
│   │       ├── compute/              # EC2 instances
│   │       ├── rds/                  # RDS PostgreSQL
│   │       ├── elasticache/          # Redis cache
│   │       ├── load-balancer/        # ALB/NLB
│   │       └── route53/              # DNS configuration
│   ├── azure/                        # Azure infrastructure
│   │   ├── main.tf                   # Main Azure configuration
│   │   ├── variables.tf              # Azure variables
│   │   ├── outputs.tf                # Azure outputs
│   │   └── modules/                  # Azure-specific modules
│   │       ├── vnet/                 # Virtual Network
│   │       ├── compute/              # Virtual Machines
│   │       ├── postgres/             # Azure Database for PostgreSQL
│   │       ├── redis/                # Azure Cache for Redis
│   │       └── appgateway/           # Application Gateway
│   ├── gcp/                          # GCP infrastructure
│   │   ├── main.tf                   # Main GCP configuration
│   │   ├── variables.tf              # GCP variables
│   │   ├── outputs.tf                # GCP outputs
│   │   └── modules/                  # GCP-specific modules
│   │       ├── vpc/                  # VPC Network
│   │       ├── compute/              # Compute Engine
│   │       ├── cloudsql/             # Cloud SQL PostgreSQL
│   │       ├── memorystore/          # Redis cache
│   │       └── loadbalancer/         # Cloud Load Balancing
│   └── shared/                       # Cross-cloud modules
│       ├── vpn-mesh.tf               # VPN mesh configuration
│       ├── monitoring/               # Monitoring stack
│       └── templates/                # Configuration templates
└── scripts/                          # Deployment scripts
    ├── deploy-all.sh                 # Deploy to all clouds
    ├── deploy-aws.sh                 # Deploy AWS only
    ├── deploy-azure.sh               # Deploy Azure only
    ├── deploy-gcp.sh                 # Deploy GCP only
    ├── test-connectivity.sh          # Test cross-cloud connectivity
    └── validate-deployment.sh        # Validate deployment
```

## Prerequisites

### Required Tools

1. **Terraform** (>= 1.6.0)
   ```bash
   # macOS
   brew install terraform

   # Linux
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

2. **Cloud CLIs**

   **AWS CLI** (>= 2.0):
   ```bash
   # macOS
   brew install awscli

   # Configure
   aws configure
   ```

   **Azure CLI** (>= 2.0):
   ```bash
   # macOS
   brew install azure-cli

   # Login
   az login
   ```

   **GCP Cloud SDK**:
   ```bash
   # macOS
   brew install --cask google-cloud-sdk

   # Initialize
   gcloud init
   ```

3. **Other Tools**
   ```bash
   # jq for JSON parsing
   brew install jq

   # Ansible for configuration management
   brew install ansible

   # kubectl for Kubernetes (optional)
   brew install kubectl
   ```

### Required Credentials

1. **AWS Credentials**
   - AWS Access Key ID
   - AWS Secret Access Key
   - Location: `~/.aws/credentials`

2. **Azure Credentials**
   - Azure Subscription ID
   - Azure Tenant ID
   - Location: `az login` (browser-based)

3. **GCP Credentials**
   - GCP Project ID
   - Service Account Key
   - Location: `~/.config/gcloud/`

### Required Permissions

**AWS**:
- EC2 full access
- VPC full access
- RDS full access
- ElastiCache full access
- Route 53 full access
- S3 full access
- KMS full access
- IAM (for roles and policies)

**Azure**:
- Contributor role on subscription
- User Access Administrator (for role assignments)

**GCP**:
- Compute Admin
- Network Admin
- Cloud SQL Admin
- Storage Admin
- Service Account Admin

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git
cd Aurigraph-DLT/infrastructure
```

### 2. Configure Variables

Create `terraform.tfvars` in each cloud directory:

**AWS** (`terraform/aws/terraform.tfvars`):
```hcl
primary_region   = "us-east-1"
secondary_region = "us-west-2"
environment      = "production"
project_name     = "aurigraph-v11"
domain_name      = "dlt.aurigraph.io"

key_name         = "aurigraph-prod-key"
db_username      = "aurigraph_admin"
db_password      = "<secure-password>"  # Use AWS Secrets Manager in production

validator_instance_type = "c6i.4xlarge"
business_instance_type  = "c6i.2xlarge"
slim_instance_type      = "t3.large"
```

**Azure** (`terraform/azure/terraform.tfvars`):
```hcl
primary_region   = "eastus"
secondary_region = "westus"
environment      = "production"
project_name     = "aurigraph-v11"

admin_username   = "azureuser"
ssh_public_key   = "<your-ssh-public-key>"
db_admin_username = "aurigraph_admin"
db_admin_password = "<secure-password>"  # Use Azure Key Vault in production

validator_vm_size = "Standard_D8s_v5"
business_vm_size  = "Standard_D4s_v5"
slim_vm_size      = "Standard_B2s"
```

**GCP** (`terraform/gcp/terraform.tfvars`):
```hcl
project_id       = "aurigraph-prod-12345"
primary_region   = "us-central1"
secondary_region = "us-west1"
environment      = "production"
project_name     = "aurigraph-v11"
domain_name      = "dlt.aurigraph.io"

admin_username   = "gcpuser"
ssh_public_key   = "<your-ssh-public-key>"
db_admin_username = "aurigraph_admin"
db_admin_password = "<secure-password>"  # Use Secret Manager in production

validator_machine_type = "c2-standard-8"
business_machine_type  = "c2-standard-4"
slim_machine_type      = "e2-standard-2"
```

### 3. Initialize Terraform

```bash
# AWS
cd terraform/aws
terraform init

# Azure
cd ../azure
terraform init

# GCP
cd ../gcp
terraform init
```

### 4. Plan Deployment

```bash
# AWS
cd terraform/aws
terraform plan -out=aws.tfplan

# Azure
cd ../azure
terraform plan -out=azure.tfplan

# GCP
cd ../gcp
terraform plan -out=gcp.tfplan
```

### 5. Deploy Infrastructure

**Option A: Deploy All Clouds at Once**
```bash
cd infrastructure
./scripts/deploy-all.sh
```

**Option B: Deploy Each Cloud Separately**
```bash
# Deploy AWS first
cd terraform/aws
terraform apply aws.tfplan

# Wait for AWS to complete, then deploy Azure
cd ../azure
terraform apply azure.tfplan

# Finally deploy GCP
cd ../gcp
terraform apply gcp.tfplan
```

### 6. Configure VPN Mesh

```bash
cd terraform/shared
terraform init
terraform plan -out=vpn.tfplan
terraform apply vpn.tfplan
```

### 7. Validate Deployment

```bash
cd infrastructure
./scripts/validate-deployment.sh
```

Expected output:
```
✓ AWS: 22 nodes deployed
✓ Azure: 22 nodes deployed
✓ GCP: 22 nodes deployed
✓ Cross-cloud VPN tunnels: UP
✓ Load balancers: Healthy
✓ Databases: Replicating
✓ All health checks: PASSED
```

## Deployment Scenarios

### Development Environment

For development/testing with minimal resources:

```hcl
# terraform.tfvars
environment = "dev"

# Reduced instance counts
validator_count = 1
business_count  = 2
slim_count      = 3

# Smaller instance sizes
validator_instance_type = "t3.medium"
business_instance_type  = "t3.small"
slim_instance_type      = "t3.micro"

# Single AZ (no HA)
multi_az = false
```

Cost: ~$500/month per cloud (~$1,500/month total)

### Staging Environment

For pre-production testing:

```hcl
environment = "staging"

# Moderate instance counts
validator_count = 2
business_count  = 3
slim_count      = 6

# Production-like instance sizes
validator_instance_type = "c6i.2xlarge"
business_instance_type  = "c6i.xlarge"
slim_instance_type      = "t3.medium"

# Multi-AZ with lower redundancy
multi_az = true
```

Cost: ~$2,000/month per cloud (~$6,000/month total)

### Production Environment

For full production deployment (as documented):

```hcl
environment = "production"

# Full node counts
validator_count = 4
business_count  = 6
slim_count      = 12

# Production instance sizes
validator_instance_type = "c6i.4xlarge"
business_instance_type  = "c6i.2xlarge"
slim_instance_type      = "t3.large"

# Multi-AZ with full redundancy
multi_az               = true
enable_auto_scaling    = true
enable_backups         = true
backup_retention_days  = 30
```

Cost: ~$8,000/month per cloud (~$24,000/month total)

## Architecture Overview

### Node Distribution

| Cloud | Validators | Business | Slim | Total |
|-------|-----------|----------|------|-------|
| AWS   | 4         | 6        | 12   | 22    |
| Azure | 4         | 6        | 12   | 22    |
| GCP   | 4         | 6        | 12   | 22    |
| **Total** | **12** | **18**  | **36** | **66** |

### Network Architecture

```
          ┌─────────────────┐
          │  Cloudflare CDN │
          │  (Global DNS)   │
          └────────┬────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
    ┌───▼──┐   ┌───▼──┐   ┌───▼──┐
    │ AWS  │◄──┤Azure │◄──┤ GCP  │
    │  LB  │   │  LB  │   │  LB  │
    └───┬──┘   └───┬──┘   └───┬──┘
        │          │          │
        └──────────┼──────────┘
                   │
          ┌────────▼────────┐
          │   VPN Mesh      │
          │  (WireGuard)    │
          └─────────────────┘
```

### Data Flow

1. **User Request** → Cloudflare CDN (GeoDNS routing)
2. **CDN** → Nearest cloud load balancer
3. **Load Balancer** → Business node or Validator node
4. **Node** → Process request, coordinate via HyperRAFT++
5. **Consensus** → Replicate to validators across clouds
6. **Database** → Write to PostgreSQL/CockroachDB
7. **Cache** → Update Redis cache
8. **Response** → Return to user

## Operations

### Scaling

**Horizontal Scaling** (add more nodes):
```bash
# Update terraform.tfvars
business_count = 8  # Increase from 6

# Apply changes
terraform plan
terraform apply
```

**Vertical Scaling** (larger instances):
```bash
# Update terraform.tfvars
business_instance_type = "c6i.4xlarge"  # Upgrade from c6i.2xlarge

# Apply with downtime window
terraform apply
```

### Monitoring

Access monitoring dashboards:
- **Grafana**: https://metrics.aurigraph.io
- **Prometheus**: https://prometheus.aurigraph.io
- **AWS CloudWatch**: https://console.aws.amazon.com/cloudwatch
- **Azure Monitor**: https://portal.azure.com/#blade/Microsoft_Azure_Monitoring
- **GCP Cloud Monitoring**: https://console.cloud.google.com/monitoring

### Backup & Restore

**Backup**:
```bash
# Database backup (automated daily)
# Manual trigger:
./scripts/backup-database.sh --cloud aws --region us-east-1

# Blockchain state backup
./scripts/backup-blockchain-state.sh --all-clouds

# Configuration backup
terraform show > terraform-state-backup-$(date +%Y%m%d).txt
```

**Restore**:
```bash
# Restore database
./scripts/restore-database.sh --cloud aws --backup-id <backup-id>

# Restore blockchain state
./scripts/restore-blockchain-state.sh --snapshot <snapshot-id>

# Restore infrastructure
terraform apply
```

### Disaster Recovery

See `docs/CLOUD_MIGRATION_RUNBOOK.md` for complete DR procedures.

**Quick Failover** (regional failure):
```bash
# Update DNS to remove failed region
./scripts/failover-region.sh --cloud aws --from us-east-1 --to us-west-2

# Verify traffic routing
./scripts/test-connectivity.sh --target us-west-2
```

**Full Cloud Failover** (cloud provider failure):
```bash
# Remove failed cloud from DNS
./scripts/failover-cloud.sh --from aws --to azure,gcp

# Scale remaining clouds
terraform apply -target=module.azure.auto_scaling_group
terraform apply -target=module.gcp.auto_scaling_group
```

### Cost Optimization

**Enable Reserved Instances**:
```bash
# AWS
./scripts/purchase-reserved-instances.sh --cloud aws --term 1year

# Azure
./scripts/purchase-reserved-vms.sh --cloud azure --term 1year

# GCP
./scripts/commit-use-discounts.sh --cloud gcp --term 1year
```

**Enable Spot Instances for Slim Nodes**:
```hcl
# terraform.tfvars
slim_use_spot_instances = true
slim_spot_max_price     = "0.05"  # $0.05/hour max
```

**Auto-Scaling Configuration**:
```hcl
enable_auto_scaling = true
auto_scaling_min    = 3
auto_scaling_max    = 12
scale_up_threshold  = 80   # CPU %
scale_down_threshold = 30  # CPU %
```

## Troubleshooting

### Common Issues

**1. Terraform State Locked**
```bash
# AWS
terraform force-unlock <lock-id>

# Azure
az storage blob lease break --blob-name terraform.tfstate --container-name tfstate

# GCP
gsutil rm gs://aurigraph-terraform-state/.terraform.lock.info
```

**2. VPN Tunnel Down**
```bash
# Check tunnel status
./scripts/check-vpn-status.sh

# Restart tunnel
./scripts/restart-vpn-tunnel.sh --tunnel aws-to-azure
```

**3. Instance Unhealthy**
```bash
# Check health
aws elbv2 describe-target-health --target-group-arn <arn>

# SSH and troubleshoot
ssh -i ~/.ssh/aurigraph-key.pem ec2-user@<instance-ip>
sudo systemctl status aurigraph-v11
sudo journalctl -u aurigraph-v11 -n 100
```

**4. Database Replication Lag**
```bash
# Check replication status
psql -h <replica-host> -U postgres -c "SELECT * FROM pg_stat_replication;"

# If lag too high, consider increasing replica resources
```

### Getting Help

- **Documentation**: `docs/` directory
- **GitHub Issues**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues
- **Email Support**: devops@aurigraph.io
- **Emergency On-Call**: See runbook for PagerDuty details

## Security Best Practices

1. **Secrets Management**
   - Never commit secrets to Git
   - Use cloud-native secret stores:
     - AWS: Secrets Manager
     - Azure: Key Vault
     - GCP: Secret Manager

2. **Network Security**
   - Enable VPN for cross-cloud traffic
   - Use security groups/NSGs to restrict access
   - Enable DDoS protection (Cloudflare, AWS Shield)

3. **Access Control**
   - Use IAM roles instead of access keys
   - Enable MFA for all admin accounts
   - Regular access audits (quarterly)

4. **Encryption**
   - Encryption at rest (KMS/Key Vault/Cloud KMS)
   - Encryption in transit (TLS 1.3)
   - Rotate keys every 90 days

5. **Compliance**
   - Enable audit logging (CloudTrail, Azure Activity, Cloud Audit)
   - Regular security scans (AWS Inspector, Azure Security Center)
   - Compliance checks (SOC 2, ISO 27001)

## Contributing

See main repository CONTRIBUTING.md for contribution guidelines.

When contributing infrastructure changes:
1. Test in dev environment first
2. Run `terraform fmt` and `terraform validate`
3. Update documentation
4. Create pull request with detailed description
5. Wait for infrastructure team review

## License

See main repository LICENSE file.

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-12
**Maintained By**: Agent 4 (Multi-Cloud Deployment)

For questions or support, contact: devops@aurigraph.io
