# Multi-Cloud Node Architecture for Aurigraph V11
## Enhanced AV11-426: Separate Node Types + Multi-Cloud Support

**Version**: 2.0
**Date**: October 21, 2025
**Status**: Enhanced Design Phase
**Sprint**: 14-15 (10 days)

---

## 🎯 Enhanced Objectives

1. ✅ Separate container types for **Validator**, **Business**, and **Slim** nodes
2. ✅ Multi-cloud deployment across AWS, Azure, GCP, and on-premise
3. ✅ Cross-cloud service discovery and networking
4. ✅ 2M+ TPS total throughput across distributed cloud infrastructure
5. ✅ High availability with geo-distributed deployment

---

## 🏗️ Node Type Specifications

### 1. Validator Nodes
**Purpose**: Consensus participation, block validation, state management

**Resource Requirements**:
- **CPU**: 16-32 cores (high compute)
- **Memory**: 4-8GB RAM
- **Storage**: 100GB SSD (blockchain state)
- **Network**: High bandwidth, low latency (<50ms inter-validator)

**Configuration**:
```env
NODE_TYPE=VALIDATOR
CONSENSUS_ROLE=ACTIVE
BLOCK_PRODUCTION=ENABLED
STATE_STORAGE=ENABLED
TRANSACTION_PROCESSING=ENABLED
PUBLIC_API=DISABLED  # Validators don't serve public traffic
```

**Deployment**:
- **Minimum**: 4 validators (Byzantine fault tolerance)
- **Recommended**: 7-10 validators (better decentralization)
- **Multi-cloud**: Distribute across regions for resilience

---

### 2. Business Nodes
**Purpose**: Transaction processing, smart contract execution, API serving

**Resource Requirements**:
- **CPU**: 8-16 cores (balanced)
- **Memory**: 2-4GB RAM
- **Storage**: 50GB SSD (local cache)
- **Network**: Medium bandwidth, moderate latency (<100ms)

**Configuration**:
```env
NODE_TYPE=BUSINESS
CONSENSUS_ROLE=OBSERVER
BLOCK_PRODUCTION=DISABLED
STATE_STORAGE=PARTIAL  # Read-only replica
TRANSACTION_PROCESSING=ENABLED
PUBLIC_API=ENABLED  # Serves public traffic
SMART_CONTRACTS=ENABLED
RWA_TOKENIZATION=ENABLED
```

**Deployment**:
- **Minimum**: 2 business nodes (load balancing)
- **Recommended**: 4-10 business nodes (horizontal scaling)
- **Multi-cloud**: Deploy near users for low latency

---

### 3. Slim Nodes
**Purpose**: Lightweight read operations, data queries, analytics

**Resource Requirements**:
- **CPU**: 4-8 cores (low compute)
- **Memory**: 1-2GB RAM
- **Storage**: 20GB SSD (minimal cache)
- **Network**: Low bandwidth, higher latency acceptable (<200ms)

**Configuration**:
```env
NODE_TYPE=SLIM
CONSENSUS_ROLE=NONE
BLOCK_PRODUCTION=DISABLED
STATE_STORAGE=MINIMAL  # Headers only
TRANSACTION_PROCESSING=DISABLED
PUBLIC_API=ENABLED  # Read-only queries
SMART_CONTRACTS=DISABLED
RWA_TOKENIZATION=DISABLED
```

**Deployment**:
- **Minimum**: 2 slim nodes (data availability)
- **Recommended**: 5-20 slim nodes (edge deployment)
- **Multi-cloud**: Deploy at edge locations worldwide

---

## 🌐 Multi-Cloud Architecture

### Deployment Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                    Multi-Cloud Aurigraph Network                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   AWS (US-East) │  │  Azure (EU-West)│  │ GCP (Asia-Pacific) │
│                 │  │                 │  │                    │
│ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌──────────────┐ │
│ │Validator #1 │ │  │ │Validator #2 │ │  │ │Validator #3  │ │
│ │CPU: 32 cores│ │  │ │CPU: 32 cores│ │  │ │CPU: 32 cores │ │
│ │RAM: 8GB     │ │  │ │RAM: 8GB     │ │  │ │RAM: 8GB      │ │
│ │Port: 9003   │ │  │ │Port: 9003   │ │  │ │Port: 9003    │ │
│ └─────────────┘ │  │ └─────────────┘ │  │ └──────────────┘ │
│                 │  │                 │  │                    │
│ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌──────────────┐ │
│ │Business #1  │ │  │ │Business #2  │ │  │ │Business #3   │ │
│ │CPU: 16 cores│ │  │ │CPU: 16 cores│ │  │ │CPU: 16 cores │ │
│ │RAM: 4GB     │ │  │ │RAM: 4GB     │ │  │ │RAM: 4GB      │ │
│ │Port: 9013   │ │  │ │Port: 9013   │ │  │ │Port: 9013    │ │
│ └─────────────┘ │  │ └─────────────┘ │  │ └──────────────┘ │
│                 │  │                 │  │                    │
│ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌──────────────┐ │
│ │Slim #1,#2   │ │  │ │Slim #3,#4   │ │  │ │Slim #5,#6    │ │
│ │CPU: 8 cores │ │  │ │CPU: 8 cores │ │  │ │CPU: 8 cores  │ │
│ │RAM: 2GB     │ │  │ │RAM: 2GB     │ │  │ │RAM: 2GB      │ │
│ │Ports:9023-33│ │  │ │Ports:9043-53│ │  │ │Ports:9063-73 │ │
│ └─────────────┘ │  │ └─────────────┘ │  │ └──────────────┘ │
└─────────────────┘  └─────────────────┘  └─────────────────────┘
        ↓                    ↓                      ↓
┌─────────────────────────────────────────────────────────────────┐
│           Cross-Cloud Service Mesh (Consul/Istio)                │
│  - Service Discovery   - Load Balancing   - mTLS Encryption     │
└─────────────────────────────────────────────────────────────────┘
        ↓                    ↓                      ↓
┌─────────────────────────────────────────────────────────────────┐
│              Global Load Balancer (Cloudflare/F5)                │
│  - GeoDNS Routing   - DDoS Protection   - CDN Edge Caching      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Docker Images for Each Node Type

### 1. Dockerfile.validator
```dockerfile
FROM aurigraph/v11-native:base AS runtime

# Validator-specific configuration
ENV NODE_TYPE=VALIDATOR \
    CONSENSUS_ROLE=ACTIVE \
    BLOCK_PRODUCTION=ENABLED \
    MIN_CPU=16 \
    MIN_MEMORY=4G

# Validator requires full state
VOLUME ["/app/data/state", "/app/data/blocks"]

# Expose consensus ports only
EXPOSE 9003 9004 9005

CMD ["/app/aurigraph-v11", \
     "--node-type=validator", \
     "--consensus-role=active", \
     "--enable-block-production"]

LABEL role="validator" \
      type="consensus-node" \
      min-cpu="16" \
      min-memory="4GB"
```

### 2. Dockerfile.business
```dockerfile
FROM aurigraph/v11-native:base AS runtime

# Business node configuration
ENV NODE_TYPE=BUSINESS \
    CONSENSUS_ROLE=OBSERVER \
    TRANSACTION_PROCESSING=ENABLED \
    MIN_CPU=8 \
    MIN_MEMORY=2G

# Business nodes need partial state and cache
VOLUME ["/app/data/cache", "/app/data/contracts"]

# Expose public API ports
EXPOSE 9013 9014 9015 8080

CMD ["/app/aurigraph-v11", \
     "--node-type=business", \
     "--consensus-role=observer", \
     "--enable-public-api", \
     "--enable-smart-contracts"]

LABEL role="business" \
      type="api-node" \
      min-cpu="8" \
      min-memory="2GB"
```

### 3. Dockerfile.slim
```dockerfile
FROM aurigraph/v11-native:base AS runtime

# Slim node configuration (minimal)
ENV NODE_TYPE=SLIM \
    CONSENSUS_ROLE=NONE \
    READ_ONLY=true \
    MIN_CPU=4 \
    MIN_MEMORY=1G

# Slim nodes need minimal storage
VOLUME ["/app/data/headers"]

# Expose query API only
EXPOSE 9023 8080

CMD ["/app/aurigraph-v11", \
     "--node-type=slim", \
     "--read-only", \
     "--enable-query-api", \
     "--headers-only"]

LABEL role="slim" \
      type="query-node" \
      min-cpu="4" \
      min-memory="1GB"
```

---

## 🔧 Multi-Cloud Service Discovery

### Consul-Based Service Discovery

```yaml
# consul-config.yml
datacenter: "aurigraph-global"

services:
  - name: "aurigraph-validator"
    tags: ["validator", "consensus"]
    port: 9003
    checks:
      - http: "http://localhost:9003/q/health"
        interval: "10s"

  - name: "aurigraph-business"
    tags: ["business", "api"]
    port: 9013
    checks:
      - http: "http://localhost:9013/q/health"
        interval: "10s"

  - name: "aurigraph-slim"
    tags: ["slim", "query"]
    port: 9023
    checks:
      - http: "http://localhost:9023/q/health"
        interval: "10s"

# WAN gossip for cross-cloud discovery
wan_gossip:
  enabled: true
  serf_wan_bind: "0.0.0.0:8302"
```

### Service Mesh Integration (Istio)

```yaml
# istio-gateway.yaml
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: aurigraph-gateway
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 443
      name: https-validators
      protocol: HTTPS
    hosts:
    - "validators.aurigraph.io"
    tls:
      mode: SIMPLE
      credentialName: validator-cert

  - port:
      number: 443
      name: https-business
      protocol: HTTPS
    hosts:
    - "api.aurigraph.io"
    tls:
      mode: SIMPLE
      credentialName: api-cert
```

---

## 🌍 Cloud-Specific Deployment Configs

### AWS Deployment (validator-aws.yml)
```yaml
version: '3.9'

services:
  validator-aws-1:
    image: aurigraph/v11-validator:latest
    environment:
      NODE_TYPE: VALIDATOR
      CLOUD_PROVIDER: AWS
      REGION: us-east-1
      CONSUL_SERVER: consul.us-east-1.aws.aurigraph.io
      CLUSTER_SEEDS: |
        validator.azure.aurigraph.io:9004
        validator.gcp.aurigraph.io:9004
    deploy:
      resources:
        limits:
          cpus: '32'
          memory: 8G
    ports:
      - "9003:9003"
      - "9004:9004"

  business-aws-1:
    image: aurigraph/v11-business:latest
    environment:
      NODE_TYPE: BUSINESS
      CLOUD_PROVIDER: AWS
      REGION: us-east-1
      CONSUL_SERVER: consul.us-east-1.aws.aurigraph.io
    deploy:
      resources:
        limits:
          cpus: '16'
          memory: 4G
    ports:
      - "9013:9013"
      - "8080:8080"

  slim-aws:
    image: aurigraph/v11-slim:latest
    environment:
      NODE_TYPE: SLIM
      CLOUD_PROVIDER: AWS
      REGION: us-east-1
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '8'
          memory: 2G
    ports:
      - "9023-9033:9023-9033"
```

### Azure Deployment (validator-azure.yml)
```yaml
version: '3.9'

services:
  validator-azure-1:
    image: aurigraph/v11-validator:latest
    environment:
      NODE_TYPE: VALIDATOR
      CLOUD_PROVIDER: AZURE
      REGION: westeurope
      CONSUL_SERVER: consul.westeurope.azure.aurigraph.io
      CLUSTER_SEEDS: |
        validator.aws.aurigraph.io:9004
        validator.gcp.aurigraph.io:9004
    deploy:
      resources:
        limits:
          cpus: '32'
          memory: 8G
    ports:
      - "9003:9003"
      - "9004:9004"
```

### GCP Deployment (validator-gcp.yml)
```yaml
version: '3.9'

services:
  validator-gcp-1:
    image: aurigraph/v11-validator:latest
    environment:
      NODE_TYPE: VALIDATOR
      CLOUD_PROVIDER: GCP
      REGION: asia-northeast1
      CONSUL_SERVER: consul.asia-northeast1.gcp.aurigraph.io
      CLUSTER_SEEDS: |
        validator.aws.aurigraph.io:9004
        validator.azure.aurigraph.io:9004
    deploy:
      resources:
        limits:
          cpus: '32'
          memory: 8G
    ports:
      - "9003:9003"
      - "9004:9004"
```

---

## 🔐 Cross-Cloud Networking

### VPN Mesh (WireGuard)

```ini
# wireguard-aws.conf
[Interface]
PrivateKey = <AWS_PRIVATE_KEY>
Address = 10.0.1.1/24
ListenPort = 51820

[Peer]
# Azure validator
PublicKey = <AZURE_PUBLIC_KEY>
Endpoint = validator.azure.aurigraph.io:51820
AllowedIPs = 10.0.2.0/24

[Peer]
# GCP validator
PublicKey = <GCP_PUBLIC_KEY>
Endpoint = validator.gcp.aurigraph.io:51820
AllowedIPs = 10.0.3.0/24
```

---

## 📊 Performance Targets (Multi-Cloud)

### Aggregate Network Performance
- **Total TPS**: 2M+ (distributed across clouds)
- **Validator Throughput**: 500K-750K TPS each (4 validators = 2M+ total)
- **Business Node TPS**: 200K-300K TPS each
- **Slim Node TPS**: 50K-100K TPS each (read-only)

### Latency Targets
- **Intra-cloud latency**: <10ms (same region)
- **Inter-cloud latency**: <50ms (cross-region validators)
- **Global API latency**: <200ms (edge-deployed slim nodes)

### Availability Targets
- **Validator uptime**: 99.99% (geo-distributed resilience)
- **Business node uptime**: 99.9% (auto-scaling)
- **Slim node uptime**: 99.5% (edge deployment)

---

## 🚀 Deployment Commands

### Build All Node Type Images
```bash
# Build validator image
docker build -f Dockerfile.validator -t aurigraph/v11-validator:latest .

# Build business image
docker build -f Dockerfile.business -t aurigraph/v11-business:latest .

# Build slim image
docker build -f Dockerfile.slim -t aurigraph/v11-slim:latest .

# Push to registry
docker push aurigraph/v11-validator:latest
docker push aurigraph/v11-business:latest
docker push aurigraph/v11-slim:latest
```

### Deploy to AWS
```bash
docker-compose -f validator-aws.yml up -d
```

### Deploy to Azure
```bash
docker-compose -f validator-azure.yml up -d
```

### Deploy to GCP
```bash
docker-compose -f validator-gcp.yml up -d
```

### Kubernetes Multi-Cloud
```bash
# Deploy to AWS EKS
kubectl config use-context aws-eks-cluster
kubectl apply -f k8s/validator-deployment.yaml
kubectl apply -f k8s/business-deployment.yaml
kubectl apply -f k8s/slim-deployment.yaml

# Deploy to Azure AKS
kubectl config use-context azure-aks-cluster
kubectl apply -f k8s/validator-deployment.yaml
kubectl apply -f k8s/business-deployment.yaml

# Deploy to GCP GKE
kubectl config use-context gcp-gke-cluster
kubectl apply -f k8s/validator-deployment.yaml
kubectl apply -f k8s/business-deployment.yaml
```

---

## ✅ Success Criteria (Enhanced)

1. ✅ Separate Docker images for Validator, Business, and Slim nodes
2. ✅ Successful deployment across AWS, Azure, and GCP
3. ✅ Cross-cloud service discovery working via Consul
4. ✅ Validators can communicate across clouds (<50ms latency)
5. ✅ Business nodes serve public traffic with global load balancing
6. ✅ Slim nodes deployed at edge locations (<200ms API latency)
7. ✅ Aggregate network achieves 2M+ TPS across all clouds
8. ✅ High availability: Network survives single-cloud outage

---

## 📝 Next Steps

### Week 1 (Node Type Separation)
1. ✅ Create Dockerfile.validator, Dockerfile.business, Dockerfile.slim
2. ⏳ Build and test each node type image locally
3. ⏳ Verify resource isolation between node types
4. ⏳ Test inter-node communication

### Week 2 (Multi-Cloud Deployment)
5. ⏳ Set up Consul service discovery across clouds
6. ⏳ Configure VPN mesh (WireGuard) between clouds
7. ⏳ Deploy validators to AWS, Azure, GCP
8. ⏳ Deploy business nodes with load balancing
9. ⏳ Deploy slim nodes at edge locations
10. ⏳ Performance benchmarking and JIRA update

---

**Document Status**: ✅ Enhanced Design Complete
**Last Updated**: October 21, 2025
**Author**: DDA (DevOps & Deployment Agent)
