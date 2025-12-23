# Aurigraph V11 Production Kubernetes Deployment Guide

This guide provides comprehensive instructions for deploying Aurigraph V11 to production Kubernetes clusters with multi-region support, high availability, and 2M+ TPS capability.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Infrastructure Setup](#infrastructure-setup)
4. [Multi-Region Deployment](#multi-region-deployment)
5. [Security Configuration](#security-configuration)
6. [Monitoring and Observability](#monitoring-and-observability)
7. [Disaster Recovery](#disaster-recovery)
8. [Deployment Procedures](#deployment-procedures)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance](#maintenance)

## Overview

Aurigraph V11 production deployment architecture:

- **Multi-Region**: 3 regions (us-east-1, us-west-2, eu-west-1)
- **High Availability**: 99.99% uptime target
- **Performance**: 2M+ TPS with <100ms consensus latency
- **Auto-scaling**: HPA/VPA/Cluster Autoscaler
- **Security**: Zero-trust with Istio service mesh
- **Observability**: Prometheus/Grafana/Jaeger stack
- **Disaster Recovery**: RTO 5min, RPO 15min

### Key Components

```
┌────────────────────────────────────────────────────────┐
│                     Global Load Balancer                        │
│                   (AWS Network Load Balancer)                   │
└┬─────────────────────────────────────────────────────┘
 │
┌┴────────────────┐   ┌────────────────┐   ┌────────────────┐
│   us-east-1     │   │   us-west-2     │   │   eu-west-1     │
│  (Primary)     │   │  (Secondary)   │   │   (Tertiary)    │
├─────────────────┤   ├─────────────────┤   ├─────────────────┤
│ Istio Gateway   │   │ Istio Gateway   │   │ Istio Gateway   │
│ Platform: 5     │   │ Platform: 5     │   │ Platform: 5     │
│ Consensus: 5    │   │ Consensus: 5    │   │ Consensus: 5    │
│ Monitoring: 1   │   │ Monitoring: 1   │   │ Monitoring: 1   │
└─────────────────┘   └─────────────────┘   └─────────────────┘
                │                       │                       │
                └─────── Sync Replication ───────┘
```

## Prerequisites

### Infrastructure Requirements

- **Kubernetes**: v1.25+ (EKS recommended)
- **Node Types**: c5.2xlarge or higher (4+ vCPU, 8+ GB RAM)
- **Storage**: Fast SSD (gp3 with 3000+ IOPS)
- **Network**: 10+ Gbps network bandwidth
- **DNS**: Route 53 or equivalent for multi-region routing

### Software Dependencies

- **Helm**: v3.12+
- **kubectl**: v1.28+
- **Istio**: v1.19+
- **Prometheus Operator**: v0.67+
- **AWS Load Balancer Controller**: v2.6+
- **External DNS**: v0.13+
- **Cert Manager**: v1.12+

### Access Requirements

- AWS CLI configured with appropriate permissions
- kubectl access to all target clusters
- Container registry access (GitHub Container Registry)
- Monitoring and alerting webhooks configured

## Infrastructure Setup

### 1. Cluster Creation

Create EKS clusters in each region:

```bash
# Primary region (us-east-1)
eksctl create cluster \
  --name aurigraph-prod-us-east-1 \
  --region us-east-1 \
  --version 1.28 \
  --nodegroup-name aurigraph-nodes \
  --node-type c5.2xlarge \
  --nodes 6 \
  --nodes-min 3 \
  --nodes-max 50 \
  --managed \
  --enable-ssm \
  --with-oidc

# Secondary region (us-west-2)
eksctl create cluster \
  --name aurigraph-prod-us-west-2 \
  --region us-west-2 \
  --version 1.28 \
  --nodegroup-name aurigraph-nodes \
  --node-type c5.2xlarge \
  --nodes 6 \
  --nodes-min 3 \
  --nodes-max 50 \
  --managed \
  --enable-ssm \
  --with-oidc

# Tertiary region (eu-west-1)
eksctl create cluster \
  --name aurigraph-prod-eu-west-1 \
  --region eu-west-1 \
  --version 1.28 \
  --nodegroup-name aurigraph-nodes \
  --node-type c5.2xlarge \
  --nodes 6 \
  --nodes-min 3 \
  --nodes-max 50 \
  --managed \
  --enable-ssm \
  --with-oidc
```

### 2. Install Core Components

For each cluster, install the core components:

```bash
#!/bin/bash
# install-core-components.sh

REGION=$1
CLUSTER_NAME="aurigraph-prod-${REGION}"

# Update kubeconfig
aws eks update-kubeconfig --region $REGION --name $CLUSTER_NAME

# Install AWS Load Balancer Controller
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=$CLUSTER_NAME \
  --set serviceAccount.create=false \
  --set region=$REGION \
  --set vpcId=$(aws eks describe-cluster --name $CLUSTER_NAME --region $REGION --query "cluster.resourcesVpcConfig.vpcId" --output text)

# Install External DNS
helm repo add external-dns https://kubernetes-sigs.github.io/external-dns/
helm install external-dns external-dns/external-dns \
  -n kube-system \
  --set provider=aws \
  --set aws.region=$REGION \
  --set txtOwnerId=aurigraph-$REGION

# Install Cert Manager
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.12.0 \
  --set installCRDs=true

# Install Istio
curl -L https://istio.io/downloadIstio | ISTIO_VERSION=1.19.0 sh -
cd istio-1.19.0
export PATH=$PWD/bin:$PATH

istioctl install --set values.defaultRevision=default -y
kubectl label namespace default istio-injection=enabled

# Install Prometheus Operator
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus-operator prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --values values-prometheus-$REGION.yaml

echo "Core components installed for region: $REGION"
```

### 3. Storage Classes

Create optimized storage classes:

```yaml
# storage-class.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
  encrypted: "true
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
reclaimPolicy: Retain

---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: backup-storage
provisioner: ebs.csi.aws.com
parameters:
  type: sc1  # Cold HDD for backups
  encrypted: "true"
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
reclaimPolicy: Retain
```

## Multi-Region Deployment

### 1. Deploy Using Helm

```bash
#!/bin/bash
# deploy-multi-region.sh

regions=("us-east-1" "us-west-2" "eu-west-1")
version="11.0.0"

for region in "${regions[@]}"; do
  echo "Deploying to region: $region"
  
  # Update kubeconfig for region
  aws eks update-kubeconfig --region $region --name aurigraph-prod-$region
  
  # Deploy using Helm with region-specific values
  helm upgrade --install aurigraph-v11 \
    ./kubernetes/helm/aurigraph-v11 \
    --namespace aurigraph-system \
    --create-namespace \
    --values ./kubernetes/overlays/production/values.yaml \
    --values ./kubernetes/overlays/production/values-$region.yaml \
    --set global.region=$region \
    --set image.tag=$version \
    --timeout 15m \
    --wait
  
  # Verify deployment
  kubectl get pods -n aurigraph-system
  kubectl get svc -n aurigraph-system
  
  echo "Region $region deployed successfully"
done
```

### 2. Configure Cross-Region Networking

```bash
# Setup VPC peering for cross-region communication
for source_region in us-east-1 us-west-2 eu-west-1; do
  for target_region in us-east-1 us-west-2 eu-west-1; do
    if [ "$source_region" != "$target_region" ]; then
      echo "Setting up peering: $source_region -> $target_region"
      
      # Create VPC peering connection
      aws ec2 create-vpc-peering-connection \
        --vpc-id $(aws eks describe-cluster --name aurigraph-prod-$source_region --region $source_region --query 'cluster.resourcesVpcConfig.vpcId' --output text) \
        --peer-vpc-id $(aws eks describe-cluster --name aurigraph-prod-$target_region --region $target_region --query 'cluster.resourcesVpcConfig.vpcId' --output text) \
        --peer-region $target_region \
        --region $source_region
    fi
  done
done
```

### 3. DNS and Load Balancing

```yaml
# global-dns.yaml
apiVersion: route53.aws.crossplane.io/v1alpha1
kind: RecordSet
metadata:
  name: aurigraph-global-dns
spec:
  forProvider:
    name: api.aurigraph.io
    type: A
    ttl: 60
    setIdentifier: "global"
    geolocationContinentCode: "*"
    healthCheckId: "aurigraph-health-check"
    alias:
      name: aurigraph-global-lb.elb.amazonaws.com
      zoneId: Z3AADJGX6KTTL2
      evaluateTargetHealth: true
```

## Security Configuration

### 1. Network Policies

Apply strict network segmentation:

```bash
# Apply security configurations
kubectl apply -f kubernetes/overlays/production/security-hardening.yaml
kubectl apply -f kubernetes/overlays/production/network-policies.yaml
```

### 2. Service Mesh Security

```bash
# Enable strict mTLS across all services
kubectl apply -f - <<EOF
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: aurigraph-system
spec:
  mtls:
    mode: STRICT
EOF
```

### 3. RBAC and Service Accounts

```bash
# Create service accounts with minimal permissions
kubectl apply -f kubernetes/overlays/production/rbac.yaml
kubectl apply -f kubernetes/overlays/production/service-accounts.yaml
```

## Monitoring and Observability

### 1. Deploy Monitoring Stack

```bash
# Deploy comprehensive monitoring
kubectl apply -f kubernetes/helm/aurigraph-v11/templates/production-monitoring.yaml

# Verify monitoring components
kubectl get pods -n monitoring
kubectl get svc -n monitoring
```

### 2. Configure Alerting

```bash
# Apply alerting rules
kubectl apply -f - <<EOF
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: aurigraph-production-alerts
  namespace: monitoring
spec:
  groups:
  - name: aurigraph.critical
    rules:
    - alert: AurigraphTPSBelowThreshold
      expr: sum(rate(aurigraph_transactions_processed_total[5m])) < 2000000
      for: 2m
      labels:
        severity: critical
      annotations:
        summary: "Aurigraph TPS below 2M threshold"
EOF
```

### 3. Grafana Dashboards

```bash
# Import production dashboards
curl -X POST http://admin:admin@grafana.aurigraph.io/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @monitoring/dashboards/aurigraph-production.json
```

## Disaster Recovery

### 1. Backup Configuration

```bash
# Deploy backup and disaster recovery
kubectl apply -f kubernetes/overlays/production/disaster-recovery.yaml
kubectl apply -f kubernetes/overlays/production/backup-schedule.yaml

# Verify backup jobs
kubectl get cronjobs -n aurigraph-system
```

### 2. Cross-Region Replication

```bash
# Enable cross-region replication
for region in us-east-1 us-west-2 eu-west-1; do
  aws eks update-kubeconfig --region $region --name aurigraph-prod-$region
  kubectl patch deployment aurigraph-v11-production \
    -n aurigraph-system \
    -p '{"spec":{"template":{"spec":{"containers":[{"name":"aurigraph-v11","env":[{"name":"CROSS_REGION_REPLICATION","value":"true"}]}]}}}}'
done
```

## Deployment Procedures

### 1. Blue-Green Deployment

```bash
#!/bin/bash
# blue-green-deploy.sh

NEW_VERSION=$1
REGION=$2

# Deploy green version
helm upgrade --install aurigraph-v11-green \
  ./kubernetes/helm/aurigraph-v11 \
  --namespace aurigraph-system \
  --set image.tag=$NEW_VERSION \
  --set deployment.subset=green \
  --wait

# Health check
kubectl wait --for=condition=ready pod \
  -l app=aurigraph-v11,subset=green \
  -n aurigraph-system --timeout=300s

# Performance validation
kubectl run perf-test --image=aurigraph/perf-test:latest \
  --env="TARGET_HOST=aurigraph-v11-green" \
  --env="MIN_TPS=2000000" \
  --rm -i --restart=Never

if [ $? -eq 0 ]; then
  # Switch traffic
  kubectl patch virtualservice aurigraph-v11-vs \
    -n aurigraph-system \
    --type='json' \
    -p='[{"op": "replace", "path": "/spec/http/0/route/0/destination/subset", "value": "green"}]'
  
  echo "Traffic switched to green deployment"
  
  # Cleanup blue after 10 minutes
  sleep 600
  kubectl delete deployment aurigraph-v11-blue -n aurigraph-system
else
  echo "Performance validation failed, keeping blue deployment"
  kubectl delete deployment aurigraph-v11-green -n aurigraph-system
  exit 1
fi
```

### 2. Rolling Updates

```bash
# Rolling update with zero downtime
helm upgrade aurigraph-v11 \
  ./kubernetes/helm/aurigraph-v11 \
  --namespace aurigraph-system \
  --set image.tag=$NEW_VERSION \
  --set deployment.strategy.type=RollingUpdate \
  --set deployment.strategy.rollingUpdate.maxUnavailable=1 \
  --set deployment.strategy.rollingUpdate.maxSurge=2 \
  --wait
```

### 3. Canary Deployments

```bash
# Deploy canary with 5% traffic
helm upgrade aurigraph-v11 \
  ./kubernetes/helm/aurigraph-v11 \
  --namespace aurigraph-system \
  --set image.tag=$NEW_VERSION \
  --set deployment.canary.enabled=true \
  --set deployment.canary.weight=5

# Monitor canary metrics
watch kubectl top pods -n aurigraph-system -l version=canary

# Promote canary if successful
helm upgrade aurigraph-v11 \
  ./kubernetes/helm/aurigraph-v11 \
  --namespace aurigraph-system \
  --set deployment.canary.weight=100
```

## Troubleshooting

### 1. Performance Issues

```bash
# Check TPS metrics
kubectl exec -n monitoring deployment/prometheus -- \
  promtool query instant 'sum(rate(aurigraph_transactions_processed_total[5m]))'

# Check resource usage
kubectl top pods -n aurigraph-system --sort-by=cpu
kubectl top nodes --sort-by=memory

# Check consensus latency
kubectl exec -n aurigraph-system deployment/aurigraph-v11-production -- \
  curl -s http://localhost:9003/q/metrics | grep consensus_latency
```

### 2. Networking Issues

```bash
# Check Istio configuration
istioctl analyze -n aurigraph-system
istioctl proxy-config cluster aurigraph-v11-production-pod-name.aurigraph-system

# Test connectivity between regions
kubectl run network-test --image=nicolaka/netshoot -i --tty --rm
```

### 3. Security Issues

```bash
# Check network policies
kubectl describe networkpolicy -n aurigraph-system

# Verify mTLS
istioctl authn tls-check aurigraph-v11-service.aurigraph-system.svc.cluster.local

# Check certificate expiry
kubectl get certificates -n aurigraph-system
```

### 4. Monitoring Issues

```bash
# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
# Visit http://localhost:9090/targets

# Check Grafana connectivity
kubectl port-forward -n monitoring svc/grafana 3000:80
# Visit http://localhost:3000

# Verify metrics collection
kubectl logs -n monitoring deployment/prometheus-operator
```

## Maintenance

### 1. Regular Maintenance Tasks

```bash
#!/bin/bash
# maintenance.sh - Run weekly

# Update cluster nodes
for region in us-east-1 us-west-2 eu-west-1; do
  aws eks update-nodegroup-version \
    --cluster-name aurigraph-prod-$region \
    --nodegroup-name aurigraph-nodes \
    --region $region
done

# Clean up old container images
kubectl get pods -A -o jsonpath="{..image}" | tr -s '[[:space:]]' '\n' | sort | uniq -c

# Rotate certificates
cert-manager renew --all

# Database maintenance
kubectl exec -n aurigraph-system deployment/postgresql -- \
  psql -U aurigraph -c "VACUUM ANALYZE;"

# Clean up completed jobs
kubectl delete jobs -n aurigraph-system --field-selector=status.successful=1
```

### 2. Backup Verification

```bash
# Test backup restoration
kubectl create job restore-test-$(date +%s) \
  --from=cronjob/aurigraph-v11-backup-scheduler \
  -n aurigraph-system

# Monitor backup job status
kubectl get jobs -n aurigraph-system -l component=backup
```

### 3. Performance Monitoring

```bash
# Generate performance report
kubectl exec -n monitoring deployment/prometheus -- \
  promtool query instant \
  'histogram_quantile(0.95, sum(rate(aurigraph_consensus_latency_seconds_bucket[5m])) by (le))'

# Check auto-scaling metrics
kubectl get hpa -n aurigraph-system
kubectl get vpa -n aurigraph-system
```

## Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| TPS | 2M+ | < 1.5M |
| Consensus Latency P95 | < 100ms | > 150ms |
| Availability | 99.99% | < 99.9% |
| Cross-region sync | < 30s | > 60s |
| Memory usage | < 80% | > 85% |
| CPU usage | < 70% | > 80% |

## Security Checklist

- [ ] Network policies applied
- [ ] mTLS enabled cluster-wide
- [ ] RBAC configured with least privilege
- [ ] Pod Security Standards enforced
- [ ] Service accounts use workload identity
- [ ] Secrets encrypted at rest and in transit
- [ ] Container images signed and scanned
- [ ] Audit logging enabled
- [ ] Network segmentation implemented
- [ ] Certificate auto-rotation configured

## Disaster Recovery Procedures

Refer to the [Disaster Recovery Runbook](./DISASTER-RECOVERY-RUNBOOK.md) for detailed procedures on:

- Regional failover procedures
- Data recovery from backups
- Split-brain resolution
- Emergency scaling procedures
- Communication protocols during incidents

---

**Note**: This guide assumes familiarity with Kubernetes, Helm, and AWS services. For detailed troubleshooting and advanced configurations, refer to the component-specific documentation in the `/docs` directory.

For support, contact: devops@aurigraph.io