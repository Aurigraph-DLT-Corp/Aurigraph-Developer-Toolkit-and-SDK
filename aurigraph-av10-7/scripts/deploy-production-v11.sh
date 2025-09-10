#!/bin/bash
# Aurigraph V11 Production Deployment Script
# Comprehensive deployment script for multi-region Kubernetes infrastructure

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
VERSION="11.0.0"
NAMESPACE="aurigraph-system"
REGIONS=("us-east-1" "us-west-2" "eu-west-1")
HELM_CHART_PATH="$ROOT_DIR/aurigraph-v11/kubernetes/helm/aurigraph-v11"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
Aurigraph V11 Production Deployment Script

Usage: $0 [OPTIONS] COMMAND

Commands:
    deploy              Deploy to all regions
    deploy-region       Deploy to specific region
    upgrade             Upgrade existing deployment
    rollback            Rollback to previous version
    status              Check deployment status
    destroy             Destroy deployment (USE WITH CAUTION)
    validate            Validate deployment
    backup              Trigger manual backup
    failover            Trigger regional failover

Options:
    -r, --region REGION     Target specific region (us-east-1, us-west-2, eu-west-1)
    -v, --version VERSION   Deployment version (default: $VERSION)
    -n, --namespace NS      Kubernetes namespace (default: $NAMESPACE)
    -d, --dry-run          Show what would be deployed without applying
    -f, --force            Force deployment without confirmation
    -h, --help             Show this help message

Examples:
    $0 deploy                           # Deploy to all regions
    $0 deploy-region -r us-east-1       # Deploy to us-east-1 only
    $0 upgrade -v 11.0.1               # Upgrade to version 11.0.1
    $0 status                           # Check deployment status
    $0 validate                         # Validate deployment

EOF
}

# Pre-flight checks
preflight_checks() {
    log_info "Running pre-flight checks..."
    
    # Check required tools
    local tools=("kubectl" "helm" "aws" "docker" "jq")
    for tool in "${tools[@]}"; do
        if ! command -v $tool &> /dev/null; then
            log_error "Required tool '$tool' not found"
            exit 1
        fi
    done
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured"
        exit 1
    fi
    
    # Check Helm chart exists
    if [[ ! -f "$HELM_CHART_PATH/Chart.yaml" ]]; then
        log_error "Helm chart not found at $HELM_CHART_PATH"
        exit 1
    fi
    
    # Check container image exists
    if ! docker manifest inspect ghcr.io/aurigraph/v11-native:$VERSION &> /dev/null; then
        log_warning "Container image ghcr.io/aurigraph/v11-native:$VERSION not found or not accessible"
    fi
    
    log_success "Pre-flight checks completed"
}

# Setup Kubernetes context for region
setup_kubectl_context() {
    local region=$1
    local cluster_name="aurigraph-prod-$region"
    
    log_info "Setting up kubectl context for region: $region"
    
    if ! aws eks update-kubeconfig --region "$region" --name "$cluster_name" &> /dev/null; then
        log_error "Failed to update kubeconfig for cluster $cluster_name in $region"
        return 1
    fi
    
    # Verify cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to cluster $cluster_name in $region"
        return 1
    fi
    
    log_success "Connected to cluster $cluster_name in $region"
    return 0
}

# Deploy to specific region
deploy_region() {
    local region=$1
    local dry_run=${2:-false}
    
    log_info "Deploying Aurigraph V11 to region: $region"
    
    if ! setup_kubectl_context "$region"; then
        return 1
    fi
    
    # Create namespace if it doesn't exist
    if ! kubectl get namespace $NAMESPACE &> /dev/null; then
        if [[ "$dry_run" == "false" ]]; then
            kubectl create namespace $NAMESPACE
            kubectl label namespace $NAMESPACE istio-injection=enabled
            log_success "Created namespace $NAMESPACE"
        else
            log_info "[DRY-RUN] Would create namespace $NAMESPACE"
        fi
    fi
    
    # Prepare Helm values
    local values_file="$ROOT_DIR/aurigraph-v11/kubernetes/overlays/production/values.yaml"
    local region_values_file="$ROOT_DIR/aurigraph-v11/kubernetes/overlays/production/values-$region.yaml"
    
    # Build helm command
    local helm_cmd="helm upgrade --install aurigraph-v11 $HELM_CHART_PATH"
    helm_cmd+=" --namespace $NAMESPACE"
    helm_cmd+=" --values $values_file"
    
    if [[ -f "$region_values_file" ]]; then
        helm_cmd+=" --values $region_values_file"
    fi
    
    helm_cmd+=" --set global.region=$region"
    helm_cmd+=" --set image.tag=$VERSION"
    helm_cmd+=" --set global.environment=production"
    helm_cmd+=" --timeout 15m"
    helm_cmd+=" --wait"
    
    if [[ "$dry_run" == "true" ]]; then
        helm_cmd+=" --dry-run"
        log_info "[DRY-RUN] Helm command: $helm_cmd"
    fi
    
    # Execute deployment
    if eval "$helm_cmd"; then
        if [[ "$dry_run" == "false" ]]; then
            log_success "Successfully deployed to $region"
            
            # Apply additional configurations
            apply_security_configs "$region" "$dry_run"
            apply_monitoring_configs "$region" "$dry_run"
            apply_disaster_recovery_configs "$region" "$dry_run"
        else
            log_info "[DRY-RUN] Deployment simulation completed for $region"
        fi
    else
        log_error "Failed to deploy to $region"
        return 1
    fi
    
    return 0
}

# Apply security configurations
apply_security_configs() {
    local region=$1
    local dry_run=${2:-false}
    
    log_info "Applying security configurations for $region"
    
    local security_file="$ROOT_DIR/aurigraph-v11/kubernetes/overlays/production/security-hardening.yaml"
    
    if [[ -f "$security_file" ]]; then
        if [[ "$dry_run" == "false" ]]; then
            kubectl apply -f "$security_file"
            log_success "Applied security configurations"
        else
            log_info "[DRY-RUN] Would apply security configurations from $security_file"
        fi
    fi
}

# Apply monitoring configurations
apply_monitoring_configs() {
    local region=$1
    local dry_run=${2:-false}
    
    log_info "Applying monitoring configurations for $region"
    
    local monitoring_file="$ROOT_DIR/aurigraph-v11/kubernetes/helm/aurigraph-v11/templates/production-monitoring.yaml"
    
    if [[ -f "$monitoring_file" ]]; then
        if [[ "$dry_run" == "false" ]]; then
            kubectl apply -f "$monitoring_file"
            log_success "Applied monitoring configurations"
        else
            log_info "[DRY-RUN] Would apply monitoring configurations from $monitoring_file"
        fi
    fi
}

# Apply disaster recovery configurations
apply_disaster_recovery_configs() {
    local region=$1
    local dry_run=${2:-false}
    
    log_info "Applying disaster recovery configurations for $region"
    
    local dr_file="$ROOT_DIR/aurigraph-v11/kubernetes/overlays/production/disaster-recovery.yaml"
    local multi_region_file="$ROOT_DIR/aurigraph-v11/kubernetes/overlays/production/multi-region-setup.yaml"
    
    if [[ -f "$dr_file" ]]; then
        if [[ "$dry_run" == "false" ]]; then
            kubectl apply -f "$dr_file"
            log_success "Applied disaster recovery configurations"
        else
            log_info "[DRY-RUN] Would apply disaster recovery configurations"
        fi
    fi
    
    if [[ -f "$multi_region_file" ]]; then
        if [[ "$dry_run" == "false" ]]; then
            kubectl apply -f "$multi_region_file"
            log_success "Applied multi-region configurations"
        else
            log_info "[DRY-RUN] Would apply multi-region configurations"
        fi
    fi
}

# Deploy to all regions
deploy_all() {
    local dry_run=${1:-false}
    local force=${2:-false}
    
    if [[ "$force" == "false" && "$dry_run" == "false" ]]; then
        echo
        log_warning "You are about to deploy Aurigraph V11 to PRODUCTION"
        log_warning "This will deploy to regions: ${REGIONS[*]}"
        log_warning "Version: $VERSION"
        echo
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [[ "$confirm" != "yes" ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    log_info "Starting deployment to all regions..."
    
    local failed_regions=()
    
    for region in "${REGIONS[@]}"; do
        if deploy_region "$region" "$dry_run"; then
            log_success "Region $region deployment successful"
        else
            log_error "Region $region deployment failed"
            failed_regions+=("$region")
        fi
        echo
    done
    
    if [[ ${#failed_regions[@]} -eq 0 ]]; then
        log_success "All regions deployed successfully!"
        if [[ "$dry_run" == "false" ]]; then
            validate_deployment
        fi
    else
        log_error "Deployment failed for regions: ${failed_regions[*]}"
        return 1
    fi
}

# Validate deployment
validate_deployment() {
    log_info "Validating deployment across all regions..."
    
    local validation_failed=false
    
    for region in "${REGIONS[@]}"; do
        log_info "Validating region: $region"
        
        if ! setup_kubectl_context "$region"; then
            validation_failed=true
            continue
        fi
        
        # Check pod status
        if ! kubectl get pods -n $NAMESPACE -l app=aurigraph-v11 --no-headers | grep -q Running; then
            log_error "No running pods found in $region"
            validation_failed=true
            continue
        fi
        
        # Check service endpoints
        if ! kubectl get endpoints -n $NAMESPACE aurigraph-v11-service &> /dev/null; then
            log_error "Service endpoints not ready in $region"
            validation_failed=true
            continue
        fi
        
        # Health check
        if kubectl run health-check-$(date +%s) \
            --image=curlimages/curl:latest \
            --rm -i --restart=Never \
            --namespace $NAMESPACE \
            -- curl -f -s http://aurigraph-v11-service:9003/q/health/ready &> /dev/null; then
            log_success "Health check passed for $region"
        else
            log_error "Health check failed for $region"
            validation_failed=true
        fi
    done
    
    if [[ "$validation_failed" == "false" ]]; then
        log_success "All regions validated successfully!"
        
        # Run performance test
        log_info "Running performance validation..."
        run_performance_test
    else
        log_error "Validation failed for some regions"
        return 1
    fi
}

# Run performance test
run_performance_test() {
    log_info "Running performance test..."
    
    # Use the first region for performance testing
    local test_region="${REGIONS[0]}"
    setup_kubectl_context "$test_region"
    
    kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: performance-validation-$(date +%s)
  namespace: $NAMESPACE
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: performance-test
        image: aurigraph/performance-test:latest
        env:
        - name: TARGET_URL
          value: "http://aurigraph-v11-service:9003"
        - name: TARGET_TPS
          value: "2000000"
        - name: TEST_DURATION
          value: "60s"
        - name: MAX_LATENCY
          value: "100ms"
EOF
    
    log_info "Performance test job created. Monitor with: kubectl logs -f job/performance-validation-* -n $NAMESPACE"
}

# Get deployment status
get_status() {
    log_info "Checking deployment status across all regions..."
    
    for region in "${REGIONS[@]}"; do
        echo
        log_info "Region: $region"
        
        if ! setup_kubectl_context "$region"; then
            continue
        fi
        
        echo "Pods:"
        kubectl get pods -n $NAMESPACE -l app=aurigraph-v11 -o wide
        
        echo "Services:"
        kubectl get svc -n $NAMESPACE -l app=aurigraph-v11
        
        echo "HPA Status:"
        kubectl get hpa -n $NAMESPACE
        
        echo "Recent Events:"
        kubectl get events -n $NAMESPACE --sort-by=.metadata.creationTimestamp | tail -5
    done
}

# Trigger backup
trigger_backup() {
    local region=${1:-"${REGIONS[0]}"}
    
    log_info "Triggering manual backup in region: $region"
    
    setup_kubectl_context "$region"
    
    # Create backup job from cronjob
    kubectl create job manual-backup-$(date +%s) \
        --from=cronjob/aurigraph-v11-backup-scheduler \
        -n $NAMESPACE
    
    log_success "Backup job created. Monitor with: kubectl get jobs -n $NAMESPACE -l component=backup"
}

# Trigger failover
trigger_failover() {
    local from_region=$1
    local to_region=$2
    
    if [[ -z "$from_region" || -z "$to_region" ]]; then
        log_error "Both from_region and to_region must be specified"
        exit 1
    fi
    
    log_warning "Initiating regional failover from $from_region to $to_region"
    log_warning "This is a critical operation that will affect production traffic"
    
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        log_info "Failover cancelled"
        exit 0
    fi
    
    # Update DNS to point to new region
    log_info "Updating DNS routing..."
    # Implementation would depend on your DNS provider (Route 53, etc.)
    
    # Scale down failed region
    setup_kubectl_context "$from_region"
    kubectl scale deployment aurigraph-v11-production --replicas=0 -n $NAMESPACE
    
    # Scale up target region
    setup_kubectl_context "$to_region"
    kubectl scale deployment aurigraph-v11-production --replicas=10 -n $NAMESPACE
    
    log_success "Failover initiated. Monitor the target region closely."
}

# Main script logic
main() {
    local command=""
    local region=""
    local dry_run=false
    local force=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -r|--region)
                region="$2"
                shift 2
                ;;
            -v|--version)
                VERSION="$2"
                shift 2
                ;;
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -d|--dry-run)
                dry_run=true
                shift
                ;;
            -f|--force)
                force=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            deploy|deploy-region|upgrade|rollback|status|destroy|validate|backup|failover)
                command="$1"
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    if [[ -z "$command" ]]; then
        log_error "No command specified"
        show_help
        exit 1
    fi
    
    # Run pre-flight checks for deployment commands
    if [[ "$command" =~ ^(deploy|deploy-region|upgrade)$ ]]; then
        preflight_checks
    fi
    
    # Execute command
    case $command in
        deploy)
            deploy_all "$dry_run" "$force"
            ;;
        deploy-region)
            if [[ -z "$region" ]]; then
                log_error "Region must be specified for deploy-region command"
                exit 1
            fi
            deploy_region "$region" "$dry_run"
            ;;
        upgrade)
            log_info "Upgrading to version $VERSION"
            deploy_all "$dry_run" "$force"
            ;;
        status)
            get_status
            ;;
        validate)
            validate_deployment
            ;;
        backup)
            trigger_backup "$region"
            ;;
        failover)
            if [[ -z "$region" ]]; then
                log_error "Target region must be specified for failover"
                exit 1
            fi
            # For simplicity, assuming failover from us-east-1
            trigger_failover "us-east-1" "$region"
            ;;
        destroy)
            log_error "Destroy command not implemented for safety"
            log_info "Use 'helm uninstall aurigraph-v11 -n $NAMESPACE' manually if needed"
            exit 1
            ;;
        *)
            log_error "Unknown command: $command"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"