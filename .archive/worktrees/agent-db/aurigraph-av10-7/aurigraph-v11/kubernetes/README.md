# Aurigraph V11 Kubernetes Deployment

Enterprise-grade Kubernetes deployment for the Aurigraph V11 high-performance blockchain platform, supporting 3M+ TPS with auto-scaling, service mesh, and comprehensive observability.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Internet / External Traffic                  │
└─────────────────────┬───────────────────────────────────────────┘
                     │
┌─────────────────────▼───────────────────────────────────────────┐
│                Load Balancer (NLB/ALB)                        │
└─────────────────────┬───────────────────────────────────────────┘
                     │
┌─────────────────────▼───────────────────────────────────────────┐
│                    Istio Gateway                               │
└─────────────────────┬───────────────────────────────────────────┘
                     │
┌─────────────────────▼───────────────────────────────────────────┐
│                  Kubernetes Cluster                           │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │               Service Mesh (Istio)                     │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │  │
│  │  │  Platform   │  │  Consensus  │  │   Network   │    │  │
│  │  │   Service   │  │   Service   │  │   Service   │    │  │
│  │  │    (HPA)    │  │  (StatefulSet)│  │    (HPA)    │    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │  │
│  │  │CrossChain   │  │     AI      │  │ Monitoring  │    │  │
│  │  │   Bridge    │  │Optimization │  │   Stack     │    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Persistent Storage                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │  │
│  │  │ Blockchain  │  │  Consensus  │  │    Logs     │    │  │
│  │  │    Data     │  │    State    │  │   & Metrics │    │  │
│  │  │   (1TB)     │  │   (100GB)   │  │   (200GB)   │    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Kubernetes 1.24+ cluster with at least 32 CPU cores and 128GB RAM
- Helm 3.8+
- kubectl configured for your cluster
- Istio 1.18+ (optional, will be installed if not present)
- cert-manager (optional, will be installed if not present)

### 1. Clone Repository and Navigate to Kubernetes Directory

```bash
git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git
cd Aurigraph-DLT/aurigraph-v11/kubernetes
```

### 2. Deploy with Default Configuration

```bash
# Deploy to production environment
./scripts/deploy.sh --environment production

# Deploy to staging environment
./scripts/deploy.sh --environment staging --namespace aurigraph-staging
```

### 3. Verify Deployment

```bash
# Check pod status
kubectl get pods -n aurigraph-v11

# Check services
kubectl get services -n aurigraph-v11

# Check ingress
kubectl get ingress -n aurigraph-v11
```

## 📋 Configuration

### Environment Values Files

The deployment supports multiple environments with specific configurations:

- `values.yaml` - Base configuration
- `values-development.yaml` - Development overrides
- `values-staging.yaml` - Staging overrides
- `values-production.yaml` - Production overrides

### Key Configuration Areas

#### 1. Auto-Scaling Configuration

```yaml
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 100
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
  customMetrics:
    - type: "Pods"
      pods:
        metric:
          name: "transactions_per_second"
        target:
          type: "AverageValue"
          averageValue: "30000" # 30k TPS per pod
```

#### 2. Resource Allocation

```yaml
resources:
  platformService:
    requests:
      memory: "2Gi"
      cpu: "1000m"
    limits:
      memory: "8Gi"
      cpu: "4000m"
```

#### 3. Storage Configuration

```yaml
persistence:
  enabled: true
  storageClass: "fast-ssd"
  blockchain:
    size: 500Gi
  logs:
    size: 200Gi
  consensus:
    size: 100Gi
```

## 🔧 Component Details

### Core Services

#### Platform Service
- **Function**: Main API gateway and transaction processing
- **Scaling**: Auto-scales based on TPS load (1-100 replicas)
- **Ports**: HTTP (8080), gRPC (9090), P2P (7000), Metrics (9464)
- **Health Checks**: Live, Ready, and Startup probes

#### Consensus Service
- **Function**: HyperRAFT consensus and block production
- **Scaling**: Conservative scaling (5-7 replicas max)
- **Type**: StatefulSet for stable network identities
- **Data**: Persistent consensus state and logs

#### Network Service
- **Function**: P2P networking and node discovery
- **Scaling**: Auto-scales based on network load
- **External**: LoadBalancer service for P2P connections
- **Discovery**: Bootstrap nodes and DHT

#### Cross-Chain Bridge
- **Function**: Inter-blockchain communication and atomic swaps
- **Integrations**: 50+ blockchain networks
- **Security**: Multi-sig wallets and atomic swap protocols

### Infrastructure Components

#### Service Mesh (Istio)
- **Traffic Management**: Load balancing, routing, retries
- **Security**: mTLS encryption and authorization policies
- **Observability**: Distributed tracing and metrics
- **Ingress**: Gateway for external traffic

#### Monitoring Stack
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and dashboards
- **Jaeger**: Distributed tracing
- **Custom Dashboards**: Blockchain-specific metrics

#### Storage
- **High-Performance SSDs**: 16,000 IOPS, 1,000 MB/s throughput
- **Backup System**: Daily snapshots with 30-day retention
- **Encryption**: All data encrypted at rest

## 🔐 Security

### Pod Security Standards

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 1000
  fsGroup: 1000
  seccompProfile:
    type: RuntimeDefault
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]
  readOnlyRootFilesystem: true
```

### Network Policies

- **Default Deny**: All traffic denied by default
- **Inter-Service**: Allow communication between Aurigraph services
- **Monitoring**: Allow Prometheus scraping
- **P2P Network**: Allow public blockchain connectivity
- **Internal Only**: Restrict admin interfaces to internal networks

### TLS Configuration

- **External APIs**: Let's Encrypt certificates
- **Internal Services**: Internal CA for mTLS
- **gRPC**: TLS-enabled gRPC communication
- **WebSocket**: WSS for real-time connections

### Secret Management

- **Sealed Secrets**: Encrypted secrets in Git
- **Blockchain Keys**: Post-quantum cryptographic keys
- **API Keys**: External service credentials
- **Certificate Management**: Automatic certificate rotation

## 📊 Monitoring and Observability

### Metrics

#### Blockchain Metrics
- `aurigraph_transactions_processed_total` - Total transactions processed
- `aurigraph_transaction_duration_seconds` - Transaction processing latency
- `aurigraph_blocks_produced_total` - Total blocks produced
- `aurigraph_consensus_leader_elections_total` - Leader elections

#### System Metrics
- CPU and memory usage per service
- Network throughput and connections
- Storage I/O and utilization
- Pod restart counts and error rates

#### Custom Metrics
- TPS (Transactions Per Second) - Real-time throughput
- Block finality time - Time to block confirmation
- Consensus participation - Node participation in consensus
- Cross-chain bridge volume - Bridge transaction volume

### Dashboards

#### Platform Overview Dashboard
- High-level blockchain metrics
- System health indicators
- Performance trends
- Alert status

#### Performance Dashboard
- Detailed latency metrics
- Resource utilization
- Scaling events
- Bottleneck analysis

#### Network Dashboard
- P2P connection status
- Node discovery metrics
- Message distribution
- Network topology

### Alerting Rules

#### Critical Alerts
- Consensus node down
- Transaction throughput below 100K TPS
- High error rates (>1%)
- Storage capacity >90%

#### Warning Alerts
- High transaction latency (>1ms)
- Memory usage >80%
- CPU usage >80%
- Network connectivity issues

## 🔄 Blue-Green Deployment

### Automated Zero-Downtime Updates

The deployment includes a sophisticated blue-green deployment strategy:

1. **Current State**: Blue environment serves traffic
2. **Deployment**: Green environment deployed with new version
3. **Health Checks**: Comprehensive health validation
4. **Traffic Switch**: Gradual traffic migration to green
5. **Rollback**: Automatic rollback on failure detection

### Deployment Process

```bash
# Trigger blue-green deployment
helm upgrade aurigraph-v11 ./helm/aurigraph-v11 \
  --namespace aurigraph-v11 \
  --values values.yaml
```

The deployment controller automatically:
- Scales up the target environment
- Performs health checks
- Switches traffic via service selector update
- Scales down the previous environment

## 📈 Performance Tuning

### CPU Optimization

```yaml
resources:
  requests:
    cpu: "1000m"     # 1 CPU core minimum
  limits:
    cpu: "4000m"     # 4 CPU cores maximum

# Node affinity for CPU-optimized instances
nodeAffinity:
  preferredDuringSchedulingIgnoredDuringExecution:
  - weight: 100
    preference:
      matchExpressions:
      - key: node-type
        operator: In
        values:
        - compute-optimized
```

### Memory Optimization

```yaml
resources:
  requests:
    memory: "2Gi"    # 2GB minimum
  limits:
    memory: "8Gi"    # 8GB maximum

# JVM tuning for native images
env:
- name: QUARKUS_NATIVE
  value: "true"
- name: JAVA_OPTS
  value: "-XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

### Storage Optimization

```yaml
storageClass: "fast-ssd"
parameters:
  type: gp3
  iops: "16000"          # 16,000 IOPS
  throughput: "1000"     # 1,000 MB/s
  encrypted: "true"
```

### Network Optimization

```yaml
# Service mesh traffic policy
trafficPolicy:
  loadBalancer:
    simple: LEAST_CONN
  connectionPool:
    tcp:
      maxConnections: 1000
    http:
      http1MaxPendingRequests: 100
      maxRequestsPerConnection: 10
      h2UpgradePolicy: UPGRADE
```

## 🛠️ Operations

### Deployment Commands

```bash
# Production deployment
./scripts/deploy.sh --environment production

# Staging deployment
./scripts/deploy.sh --environment staging --namespace aurigraph-staging

# Dry run
./scripts/deploy.sh --dry-run

# Custom values
helm install aurigraph-v11 ./helm/aurigraph-v11 \
  --namespace aurigraph-v11 \
  --values values.yaml \
  --values custom-values.yaml
```

### Scaling Operations

```bash
# Manual scaling
kubectl scale deployment aurigraph-v11-platform --replicas=10

# HPA status
kubectl get hpa -n aurigraph-v11

# VPA recommendations
kubectl describe vpa aurigraph-v11-platform-vpa
```

### Backup and Recovery

```bash
# Create manual backup
kubectl create job backup-$(date +%Y%m%d) \
  --from=cronjob/aurigraph-v11-blockchain-backup

# List available backups
kubectl get volumesnapshots -n aurigraph-v11

# Restore from snapshot
kubectl create pvc restored-data --from-volumesnapshot=snapshot-name
```

### Troubleshooting

```bash
# Check pod logs
kubectl logs -n aurigraph-v11 -l app.kubernetes.io/component=platform-service

# Debug pod issues
kubectl describe pod -n aurigraph-v11 aurigraph-v11-platform-xxx

# Check service endpoints
kubectl get endpoints -n aurigraph-v11

# Istio proxy logs
kubectl logs -n aurigraph-v11 aurigraph-v11-platform-xxx -c istio-proxy

# Port forward for debugging
kubectl port-forward service/aurigraph-v11-platform-service 8080:8080
```

## 📚 API Access

### External Endpoints

- **Main API**: `https://api.aurigraph.io`
- **gRPC API**: `grpc.aurigraph.io:443`
- **WebSocket**: `wss://ws.aurigraph.io/ws`
- **Cross-Chain Bridge**: `https://bridge.aurigraph.io`

### Monitoring Endpoints

- **Grafana**: `https://grafana.aurigraph.io`
- **Prometheus**: `https://prometheus.aurigraph.io` (internal only)
- **Jaeger**: `https://jaeger.aurigraph.io` (internal only)

### Health Checks

```bash
# Platform health
curl https://api.aurigraph.io/health/ready

# Metrics
curl https://api.aurigraph.io/metrics

# Blockchain status
curl https://api.aurigraph.io/api/v1/blockchain/status
```

## 🔧 Development

### Local Development

```bash
# Deploy to local cluster (minikube/kind)
./scripts/deploy.sh --environment development --namespace aurigraph-dev

# Port forwarding for local access
kubectl port-forward service/aurigraph-v11-platform-service 8080:8080
```

### Custom Configuration

```yaml
# custom-values.yaml
replicas:
  platformService: 1
  consensusService: 1

resources:
  platformService:
    requests:
      memory: "512Mi"
      cpu: "250m"
    limits:
      memory: "2Gi"
      cpu: "1000m"
```

## 🆘 Support

### Logs and Debugging

- **Application Logs**: JSON structured logs via stdout
- **Audit Logs**: Security and compliance events
- **Performance Logs**: Metrics and profiling data
- **Error Tracking**: Automatic error aggregation and alerting

### Contact Information

- **Technical Support**: support@aurigraph.io
- **DevOps Team**: devops@aurigraph.io
- **Security Team**: security@aurigraph.io
- **Documentation**: https://docs.aurigraph.io

### Emergency Procedures

1. **Service Outage**: Check Grafana dashboards and alerts
2. **Performance Issues**: Scale up services manually
3. **Security Incident**: Contact security team immediately
4. **Data Recovery**: Use automated backup system

---

**🚀 Aurigraph V11 - Enterprise Blockchain Platform**

Built for scale, security, and performance with cloud-native best practices.