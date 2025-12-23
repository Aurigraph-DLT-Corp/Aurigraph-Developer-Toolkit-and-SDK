#!/bin/bash
# Aurigraph V11 Multi-Cloud Deployment Script
# Deploys infrastructure to AWS, Azure, and GCP
# Version: 1.0.0

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$INFRA_DIR/terraform"

# Log function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        error "Terraform is not installed. Please install Terraform >= 1.6.0"
        exit 1
    fi
    success "Terraform installed: $(terraform version -json | jq -r '.terraform_version')"

    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        error "AWS CLI is not installed. Please install AWS CLI >= 2.0"
        exit 1
    fi
    success "AWS CLI installed: $(aws --version | awk '{print $1}')"

    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        error "Azure CLI is not installed. Please install Azure CLI >= 2.0"
        exit 1
    fi
    success "Azure CLI installed: $(az version --output json | jq -r '."azure-cli"')"

    # Check GCP SDK
    if ! command -v gcloud &> /dev/null; then
        error "Google Cloud SDK is not installed. Please install gcloud CLI"
        exit 1
    fi
    success "GCP SDK installed: $(gcloud version --format=json | jq -r '."Google Cloud SDK"')"

    # Check jq
    if ! command -v jq &> /dev/null; then
        error "jq is not installed. Please install jq for JSON parsing"
        exit 1
    fi
    success "jq installed"

    echo ""
}

# Validate cloud credentials
validate_credentials() {
    log "Validating cloud credentials..."

    # AWS
    if aws sts get-caller-identity &> /dev/null; then
        AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
        success "AWS credentials valid (Account: $AWS_ACCOUNT)"
    else
        error "AWS credentials invalid. Run 'aws configure'"
        exit 1
    fi

    # Azure
    if az account show &> /dev/null; then
        AZURE_SUBSCRIPTION=$(az account show --query name --output tsv)
        success "Azure credentials valid (Subscription: $AZURE_SUBSCRIPTION)"
    else
        error "Azure credentials invalid. Run 'az login'"
        exit 1
    fi

    # GCP
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
        GCP_PROJECT=$(gcloud config get-value project 2>/dev/null)
        success "GCP credentials valid (Project: $GCP_PROJECT)"
    else
        error "GCP credentials invalid. Run 'gcloud auth login'"
        exit 1
    fi

    echo ""
}

# Deploy to AWS
deploy_aws() {
    log "Deploying to AWS..."

    cd "$TERRAFORM_DIR/aws"

    # Initialize
    log "Initializing Terraform (AWS)..."
    terraform init -upgrade

    # Validate
    log "Validating Terraform configuration (AWS)..."
    terraform validate

    # Plan
    log "Creating Terraform plan (AWS)..."
    terraform plan -out=aws.tfplan

    # Prompt for confirmation
    echo ""
    warning "About to deploy AWS infrastructure. This will create resources and incur costs."
    read -p "Continue with AWS deployment? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        warning "AWS deployment cancelled"
        return 1
    fi

    # Apply
    log "Applying Terraform plan (AWS)..."
    terraform apply aws.tfplan

    success "AWS deployment complete!"
    echo ""

    # Save outputs
    terraform output -json > "$INFRA_DIR/outputs/aws-outputs.json"
    success "AWS outputs saved to outputs/aws-outputs.json"

    cd "$INFRA_DIR"
}

# Deploy to Azure
deploy_azure() {
    log "Deploying to Azure..."

    cd "$TERRAFORM_DIR/azure"

    # Initialize
    log "Initializing Terraform (Azure)..."
    terraform init -upgrade

    # Validate
    log "Validating Terraform configuration (Azure)..."
    terraform validate

    # Plan
    log "Creating Terraform plan (Azure)..."
    terraform plan -out=azure.tfplan

    # Prompt for confirmation
    echo ""
    warning "About to deploy Azure infrastructure. This will create resources and incur costs."
    read -p "Continue with Azure deployment? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        warning "Azure deployment cancelled"
        return 1
    fi

    # Apply
    log "Applying Terraform plan (Azure)..."
    terraform apply azure.tfplan

    success "Azure deployment complete!"
    echo ""

    # Save outputs
    terraform output -json > "$INFRA_DIR/outputs/azure-outputs.json"
    success "Azure outputs saved to outputs/azure-outputs.json"

    cd "$INFRA_DIR"
}

# Deploy to GCP
deploy_gcp() {
    log "Deploying to GCP..."

    cd "$TERRAFORM_DIR/gcp"

    # Initialize
    log "Initializing Terraform (GCP)..."
    terraform init -upgrade

    # Validate
    log "Validating Terraform configuration (GCP)..."
    terraform validate

    # Plan
    log "Creating Terraform plan (GCP)..."
    terraform plan -out=gcp.tfplan

    # Prompt for confirmation
    echo ""
    warning "About to deploy GCP infrastructure. This will create resources and incur costs."
    read -p "Continue with GCP deployment? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        warning "GCP deployment cancelled"
        return 1
    fi

    # Apply
    log "Applying Terraform plan (GCP)..."
    terraform apply gcp.tfplan

    success "GCP deployment complete!"
    echo ""

    # Save outputs
    terraform output -json > "$INFRA_DIR/outputs/gcp-outputs.json"
    success "GCP outputs saved to outputs/gcp-outputs.json"

    cd "$INFRA_DIR"
}

# Configure VPN mesh
configure_vpn() {
    log "Configuring cross-cloud VPN mesh..."

    cd "$TERRAFORM_DIR/shared"

    # Initialize
    log "Initializing Terraform (VPN)..."
    terraform init -upgrade

    # Plan
    log "Creating Terraform plan (VPN)..."
    terraform plan -out=vpn.tfplan

    # Apply
    log "Applying Terraform plan (VPN)..."
    terraform apply vpn.tfplan

    success "VPN mesh configuration complete!"
    echo ""

    cd "$INFRA_DIR"
}

# Validate deployment
validate_deployment() {
    log "Validating multi-cloud deployment..."

    # Check AWS instances
    AWS_INSTANCES=$(aws ec2 describe-instances \
        --filters "Name=tag:Project,Values=Aurigraph-V11" "Name=instance-state-name,Values=running" \
        --query 'Reservations[*].Instances[*].[InstanceId]' \
        --output text | wc -l)

    if [ "$AWS_INSTANCES" -ge 22 ]; then
        success "AWS: $AWS_INSTANCES instances running (expected: 22)"
    else
        error "AWS: Only $AWS_INSTANCES instances running (expected: 22)"
    fi

    # Check Azure VMs
    AZURE_VMS=$(az vm list --resource-group aurigraph-v11-production-eastus \
        --query "length([?powerState=='VM running'])" --output tsv)

    if [ "$AZURE_VMS" -ge 22 ]; then
        success "Azure: $AZURE_VMS VMs running (expected: 22)"
    else
        error "Azure: Only $AZURE_VMS VMs running (expected: 22)"
    fi

    # Check GCP instances
    GCP_INSTANCES=$(gcloud compute instances list \
        --filter="labels.project=aurigraph-v11 AND status=RUNNING" \
        --format="value(name)" | wc -l)

    if [ "$GCP_INSTANCES" -ge 22 ]; then
        success "GCP: $GCP_INSTANCES instances running (expected: 22)"
    else
        error "GCP: Only $GCP_INSTANCES instances running (expected: 22)"
    fi

    echo ""
    success "Total nodes deployed: $((AWS_INSTANCES + AZURE_VMS + GCP_INSTANCES)) / 66"
    echo ""
}

# Generate summary
generate_summary() {
    log "Generating deployment summary..."

    cat > "$INFRA_DIR/outputs/deployment-summary.txt" <<EOF
=======================================================
  Aurigraph V11 Multi-Cloud Deployment Summary
=======================================================

Deployment Date: $(date)
Deployed By: $(whoami)

Infrastructure Status:
├── AWS Account: $AWS_ACCOUNT
│   └── Regions: us-east-1, us-west-2
│   └── Nodes: 22 (4V + 6B + 12S per region)
│
├── Azure Subscription: $AZURE_SUBSCRIPTION
│   └── Regions: eastus, westus
│   └── Nodes: 22 (4V + 6B + 12S per region)
│
└── GCP Project: $GCP_PROJECT
    └── Regions: us-central1, us-west1
    └── Nodes: 22 (4V + 6B + 12S per region)

Total Nodes: 66
Total Regions: 6
Total Clouds: 3

Access URLs:
- AWS Load Balancer: $(cat "$INFRA_DIR/outputs/aws-outputs.json" | jq -r '.primary_alb_dns.value')
- Azure Load Balancer: TBD
- GCP Load Balancer: $(cat "$INFRA_DIR/outputs/gcp-outputs.json" | jq -r '.load_balancer_ip.value')

Next Steps:
1. Configure DNS to point to load balancers
2. Deploy Aurigraph V11 application to nodes
3. Initialize HyperRAFT++ consensus cluster
4. Configure monitoring and alerting
5. Run validation tests

For detailed documentation, see:
- docs/MULTI_CLOUD_DEPLOYMENT_STRATEGY.md
- docs/CLOUD_MIGRATION_RUNBOOK.md

=======================================================
EOF

    cat "$INFRA_DIR/outputs/deployment-summary.txt"
}

# Main execution
main() {
    echo ""
    log "=========================================="
    log "Aurigraph V11 Multi-Cloud Deployment"
    log "=========================================="
    echo ""

    # Create outputs directory
    mkdir -p "$INFRA_DIR/outputs"

    # Check prerequisites
    check_prerequisites

    # Validate credentials
    validate_credentials

    # Ask which clouds to deploy
    echo ""
    log "Select clouds to deploy:"
    read -p "Deploy to AWS? (yes/no): " deploy_aws_confirm
    read -p "Deploy to Azure? (yes/no): " deploy_azure_confirm
    read -p "Deploy to GCP? (yes/no): " deploy_gcp_confirm
    echo ""

    # Deploy to selected clouds
    if [ "$deploy_aws_confirm" == "yes" ]; then
        deploy_aws || error "AWS deployment failed"
    fi

    if [ "$deploy_azure_confirm" == "yes" ]; then
        deploy_azure || error "Azure deployment failed"
    fi

    if [ "$deploy_gcp_confirm" == "yes" ]; then
        deploy_gcp || error "GCP deployment failed"
    fi

    # Configure VPN if multiple clouds deployed
    cloud_count=0
    [ "$deploy_aws_confirm" == "yes" ] && ((cloud_count++))
    [ "$deploy_azure_confirm" == "yes" ] && ((cloud_count++))
    [ "$deploy_gcp_confirm" == "yes" ] && ((cloud_count++))

    if [ $cloud_count -ge 2 ]; then
        read -p "Configure cross-cloud VPN mesh? (yes/no): " vpn_confirm
        if [ "$vpn_confirm" == "yes" ]; then
            configure_vpn || warning "VPN configuration failed (can be done later)"
        fi
    fi

    # Validate deployment
    validate_deployment

    # Generate summary
    generate_summary

    echo ""
    success "=========================================="
    success "Multi-Cloud Deployment Complete!"
    success "=========================================="
    echo ""
    log "Summary saved to: outputs/deployment-summary.txt"
    log "Next: Follow the migration runbook for application deployment"
    echo ""
}

# Run main function
main "$@"
