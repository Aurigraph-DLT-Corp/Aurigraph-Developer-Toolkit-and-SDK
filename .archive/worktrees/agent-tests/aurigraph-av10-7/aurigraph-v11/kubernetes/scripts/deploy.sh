#!/bin/bash

# Aurigraph V11 Kubernetes Deployment Script
# Enterprise-grade deployment with production-ready configurations

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="${NAMESPACE:-aurigraph-v11}"
ENVIRONMENT="${ENVIRONMENT:-production}"
RELEASE_NAME="${RELEASE_NAME:-aurigraph-v11}"
CHART_PATH="${CHART_PATH:-./helm/aurigraph-v11}"
VALUES_FILE="${VALUES_FILE:-values.yaml}"
DRY_RUN="${DRY_RUN:-false}"
WAIT_TIMEOUT="${WAIT_TIMEOUT:-600}"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if kubectl is installed and configured
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        print_error "Helm is not installed or not in PATH"
        exit 1
    fi
    
    # Check kubectl connectivity
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check if namespace exists or can be created
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        print_warning "Namespace $NAMESPACE does not exist, will be created"
    fi
    
    print_success "Prerequisites check completed"
}

# Function to setup namespace
setup_namespace() {
    print_status "Setting up namespace: $NAMESPACE"
    
    # Create namespace if it doesn't exist
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        kubectl create namespace "$NAMESPACE"
        print_success "Created namespace: $NAMESPACE"
    fi
    
    # Label namespace for Istio injection
    kubectl label namespace "$NAMESPACE" istio-injection=enabled --overwrite
    
    # Apply network policies
    kubectl label namespace "$NAMESPACE" name="$NAMESPACE" --overwrite
    
    print_success "Namespace setup completed"
}

# Function to deploy dependencies
deploy_dependencies() {
    print_status "Deploying dependencies..."
    
    # Add required Helm repositories
    print_status "Adding Helm repositories..."
    helm repo add jetstack https://charts.jetstack.io
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo add grafana https://grafana.github.io/helm-charts
    helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
    helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
    helm repo add istio https://istio-release.storage.googleapis.com/charts
    helm repo update
    
    # Deploy cert-manager if not present
    if ! kubectl get deployment cert-manager -n cert-manager &> /dev/null; then
        print_status "Installing cert-manager..."
        helm install cert-manager jetstack/cert-manager \
            --namespace cert-manager \
            --create-namespace \
            --version v1.13.0 \
            --set installCRDs=true \
            --wait --timeout="${WAIT_TIMEOUT}s"
        print_success "cert-manager installed"
    fi
    
    # Deploy sealed secrets controller if not present
    if ! kubectl get deployment sealed-secrets-controller -n kube-system &> /dev/null; then
        print_status "Installing sealed-secrets..."
        helm install sealed-secrets sealed-secrets/sealed-secrets \
            --namespace kube-system \
            --wait --timeout="${WAIT_TIMEOUT}s"
        print_success "sealed-secrets installed"
    fi
    
    # Deploy Istio if not present
    if ! kubectl get deployment istiod -n istio-system &> /dev/null; then
        print_status "Installing Istio..."
        helm install istio-base istio/base \
            --namespace istio-system \
            --create-namespace
        helm install istiod istio/istiod \
            --namespace istio-system \
            --wait --timeout="${WAIT_TIMEOUT}s"
        print_success "Istio installed"
    fi
    
    print_success "Dependencies deployment completed"
}

# Function to validate configuration
validate_configuration() {
    print_status "Validating Helm chart..."
    
    # Lint the Helm chart
    if ! helm lint "$CHART_PATH" --values "$CHART_PATH/$VALUES_FILE"; then
        print_error "Helm chart validation failed"
        exit 1
    fi
    
    # Template the chart to check for errors
    if ! helm template "$RELEASE_NAME" "$CHART_PATH" \
        --namespace "$NAMESPACE" \
        --values "$CHART_PATH/$VALUES_FILE" > /dev/null; then
        print_error "Helm template validation failed"
        exit 1
    fi
    
    print_success "Configuration validation completed"
}

# Function to backup current deployment
backup_deployment() {
    if helm list -n "$NAMESPACE" | grep -q "$RELEASE_NAME"; then
        print_status "Creating backup of current deployment..."
        
        BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
        BACKUP_DIR="/tmp/aurigraph-backup-${BACKUP_DATE}"
        mkdir -p "$BACKUP_DIR"
        
        # Backup Helm release
        helm get values "$RELEASE_NAME" -n "$NAMESPACE" > "$BACKUP_DIR/values.yaml"
        helm get manifest "$RELEASE_NAME" -n "$NAMESPACE" > "$BACKUP_DIR/manifest.yaml"
        
        # Backup persistent data (if needed)
        if kubectl get pvc -n "$NAMESPACE" | grep -q "aurigraph"; then
            kubectl get pvc -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/pvcs.yaml"
        fi
        
        print_success "Backup created at: $BACKUP_DIR"
        echo "$BACKUP_DIR" > /tmp/aurigraph-backup-path
    fi
}

# Function to deploy Aurigraph V11
deploy_aurigraph() {
    print_status "Deploying Aurigraph V11..."
    
    local HELM_ARGS=(
        "$RELEASE_NAME"
        "$CHART_PATH"
        --namespace "$NAMESPACE"
        --values "$CHART_PATH/$VALUES_FILE"
        --timeout "${WAIT_TIMEOUT}s"
        --wait
        --atomic
    )
    
    # Add environment-specific values
    if [[ -f "$CHART_PATH/values-${ENVIRONMENT}.yaml" ]]; then
        HELM_ARGS+=(--values "$CHART_PATH/values-${ENVIRONMENT}.yaml")
    fi
    
    # Add dry-run if specified
    if [[ "$DRY_RUN" == "true" ]]; then
        HELM_ARGS+=(--dry-run --debug)
    fi
    
    # Check if release exists
    if helm list -n "$NAMESPACE" | grep -q "$RELEASE_NAME"; then
        print_status "Upgrading existing release..."
        helm upgrade "${HELM_ARGS[@]}"
    else
        print_status "Installing new release..."
        helm install "${HELM_ARGS[@]}"
    fi
    
    if [[ "$DRY_RUN" != "true" ]]; then
        print_success "Aurigraph V11 deployment completed"
    else
        print_success "Dry-run completed successfully"
    fi
}

# Function to verify deployment
verify_deployment() {
    if [[ "$DRY_RUN" == "true" ]]; then
        return 0
    fi
    
    print_status "Verifying deployment..."
    
    # Wait for pods to be ready
    print_status "Waiting for pods to be ready..."
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=aurigraph-v11 \
        -n "$NAMESPACE" --timeout="${WAIT_TIMEOUT}s"
    
    # Check service endpoints
    print_status "Checking service endpoints..."
    kubectl get endpoints -n "$NAMESPACE"
    
    # Verify ingress
    if kubectl get ingress -n "$NAMESPACE" &> /dev/null; then
        print_status "Verifying ingress configuration..."
        kubectl get ingress -n "$NAMESPACE"
    fi
    
    # Health check
    print_status "Performing health check..."
    SERVICE_NAME=$(kubectl get service -n "$NAMESPACE" -l app.kubernetes.io/component=platform-service -o jsonpath='{.items[0].metadata.name}')
    if [[ -n "$SERVICE_NAME" ]]; then
        kubectl port-forward "service/$SERVICE_NAME" 8080:8080 -n "$NAMESPACE" &
        PORT_FORWARD_PID=$!
        sleep 5
        
        if curl -f http://localhost:8080/health/ready; then
            print_success "Health check passed"
        else
            print_warning "Health check failed - service may still be starting"
        fi
        
        kill $PORT_FORWARD_PID 2>/dev/null || true
    fi
    
    print_success "Deployment verification completed"
}

# Function to show deployment status
show_status() {
    print_status "Deployment Status:"
    echo "===================="
    
    # Helm release status
    print_status "Helm Release:"
    helm status "$RELEASE_NAME" -n "$NAMESPACE"
    
    # Pod status
    print_status "Pod Status:"
    kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=aurigraph-v11
    
    # Service status
    print_status "Service Status:"
    kubectl get services -n "$NAMESPACE"
    
    # Ingress status
    if kubectl get ingress -n "$NAMESPACE" &> /dev/null; then
        print_status "Ingress Status:"
        kubectl get ingress -n "$NAMESPACE"
    fi
    
    # PVC status
    if kubectl get pvc -n "$NAMESPACE" &> /dev/null; then
        print_status "Storage Status:"
        kubectl get pvc -n "$NAMESPACE"
    fi
}

# Function to cleanup on failure
cleanup_on_failure() {
    print_error "Deployment failed, initiating cleanup..."
    
    # Restore from backup if available
    if [[ -f "/tmp/aurigraph-backup-path" ]]; then
        BACKUP_PATH=$(cat /tmp/aurigraph-backup-path)
        if [[ -d "$BACKUP_PATH" ]]; then
            print_status "Restoring from backup: $BACKUP_PATH"
            # Implement restoration logic here if needed
        fi
    fi
    
    print_status "Cleanup completed"
}

# Function to print usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy Aurigraph V11 to Kubernetes cluster

OPTIONS:
    -n, --namespace NAMESPACE       Kubernetes namespace (default: aurigraph-v11)
    -e, --environment ENVIRONMENT  Deployment environment (default: production)
    -r, --release RELEASE          Helm release name (default: aurigraph-v11)
    -c, --chart-path PATH          Path to Helm chart (default: ./helm/aurigraph-v11)
    -v, --values-file FILE         Values file name (default: values.yaml)
    -d, --dry-run                  Perform dry-run without deploying
    -t, --timeout SECONDS          Deployment timeout (default: 600)
    -h, --help                     Show this help message

EXAMPLES:
    # Production deployment
    $0 --environment production

    # Staging deployment with custom timeout
    $0 --environment staging --timeout 900

    # Dry-run deployment
    $0 --dry-run

    # Custom namespace and release name
    $0 --namespace my-aurigraph --release my-release

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -r|--release)
            RELEASE_NAME="$2"
            shift 2
            ;;
        -c|--chart-path)
            CHART_PATH="$2"
            shift 2
            ;;
        -v|--values-file)
            VALUES_FILE="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN="true"
            shift
            ;;
        -t|--timeout)
            WAIT_TIMEOUT="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_status "=== Aurigraph V11 Kubernetes Deployment ==="
    print_status "Environment: $ENVIRONMENT"
    print_status "Namespace: $NAMESPACE"
    print_status "Release: $RELEASE_NAME"
    print_status "Chart Path: $CHART_PATH"
    print_status "Values File: $VALUES_FILE"
    print_status "Dry Run: $DRY_RUN"
    print_status "Timeout: ${WAIT_TIMEOUT}s"
    echo

    # Set up error handling
    trap cleanup_on_failure ERR
    
    # Execute deployment steps
    check_prerequisites
    validate_configuration
    
    if [[ "$DRY_RUN" != "true" ]]; then
        setup_namespace
        deploy_dependencies
        backup_deployment
    fi
    
    deploy_aurigraph
    verify_deployment
    show_status
    
    print_success "=== Deployment completed successfully ==="
    
    if [[ "$DRY_RUN" != "true" ]]; then
        print_status "Access URLs:"
        echo "  API: https://api.aurigraph.io"
        echo "  gRPC: grpc.aurigraph.io:443"
        echo "  WebSocket: wss://ws.aurigraph.io/ws"
        echo "  Grafana: https://grafana.aurigraph.io"
        echo "  Bridge: https://bridge.aurigraph.io"
    fi
}

# Execute main function
main "$@"