#!/bin/bash
set -e

# Aurigraph Enterprise Portal v4.0.0 - Terraform Deployment Script
# Quick deployment wrapper for common Terraform operations

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Aurigraph Enterprise Portal v4.0.0 - Terraform${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

check_prerequisites() {
    print_info "Checking prerequisites..."

    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform not found. Please install Terraform >= 1.5.0"
        exit 1
    fi

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js >= 18.0.0"
        exit 1
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm not found. Please install npm >= 9.0.0"
        exit 1
    fi

    # Check terraform.tfvars
    if [ ! -f "terraform.tfvars" ]; then
        print_error "terraform.tfvars not found."
        print_info "Copy terraform.tfvars.example to terraform.tfvars and configure it"
        exit 1
    fi

    # Check password environment variable
    if [ -z "$TF_VAR_remote_password" ]; then
        print_error "TF_VAR_remote_password environment variable not set"
        print_info "Set password with: export TF_VAR_remote_password=\"your-password\""
        exit 1
    fi

    print_success "Prerequisites check passed"
    echo ""
}

show_usage() {
    cat << EOF
Usage: $0 [command]

Commands:
    init        Initialize Terraform
    plan        Show deployment plan
    apply       Deploy portal
    destroy     Remove portal deployment
    output      Show deployment outputs
    validate    Validate Terraform configuration
    fmt         Format Terraform files
    help        Show this help message

Examples:
    $0 init       # First time setup
    $0 plan       # Preview changes
    $0 apply      # Deploy portal
    $0 output     # View deployment info

Environment Variables:
    TF_VAR_remote_password    SSH password for remote server (required)

EOF
}

terraform_init() {
    print_info "Initializing Terraform..."
    terraform init
    print_success "Terraform initialized"
}

terraform_plan() {
    print_info "Creating deployment plan..."
    terraform plan -out=terraform.tfplan
    print_success "Plan created successfully"
    echo ""
    print_info "Review the plan above. Run '$0 apply' to proceed with deployment."
}

terraform_apply() {
    print_info "Deploying Enterprise Portal v4.0.0..."
    echo ""

    if [ -f "terraform.tfplan" ]; then
        terraform apply terraform.tfplan
        rm -f terraform.tfplan
    else
        terraform apply
    fi

    echo ""
    print_success "Deployment complete!"
    echo ""
    terraform output deployment_summary
}

terraform_destroy() {
    print_error "WARNING: This will remove the portal deployment!"
    echo ""
    read -p "Are you sure? (type 'yes' to confirm): " confirm

    if [ "$confirm" = "yes" ]; then
        print_info "Destroying deployment..."
        terraform destroy
        print_success "Deployment removed"
    else
        print_info "Destroy cancelled"
    fi
}

terraform_output() {
    terraform output deployment_summary
}

terraform_validate() {
    print_info "Validating Terraform configuration..."
    terraform validate
    print_success "Configuration is valid"
}

terraform_fmt() {
    print_info "Formatting Terraform files..."
    terraform fmt -recursive
    print_success "Files formatted"
}

# Main script
print_header

COMMAND=${1:-help}

case "$COMMAND" in
    init)
        terraform_init
        ;;
    plan)
        check_prerequisites
        terraform_plan
        ;;
    apply)
        check_prerequisites
        terraform_apply
        ;;
    destroy)
        terraform_destroy
        ;;
    output)
        terraform_output
        ;;
    validate)
        terraform_validate
        ;;
    fmt)
        terraform_fmt
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        echo ""
        show_usage
        exit 1
        ;;
esac
