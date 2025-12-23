# Multi-Node Container Architecture for Aurigraph V11
## AV11-426 Implementation Design

**Version**: 1.0
**Date**: October 21, 2025
**Status**: Design Phase
**Sprint**: 14-15 (10 days)

---

## 🎯 Objective

Design and implement a Docker container architecture where a **single container runs multiple Aurigraph V11 node instances**, achieving 2M+ TPS per container with optimal resource utilization.

---

## 📋 Key Requirements

1. ✅ Single Docker container runs 4-8 Aurigraph V11 node instances
2. ✅ Resource isolation and management per node (CPU, memory, network)
3. ✅ GraalVM native image support for minimal startup time (<1s per node)
4. ✅ Kubernetes orchestration with HPA/VPA for auto-scaling
5. ✅ Service mesh integration for inter-node communication
6. ✅ Prometheus/Grafana monitoring and metrics aggregation
7. ✅ Performance target: 2M+ TPS per container with 4-8 nodes

---

## 🏗️ Architecture Overview

### Current Architecture (Existing)
- **Pattern**: One container → One node
- **Scaling**: Horizontal (more containers = more nodes)
- **File**: `docker-compose-native-cluster.yml`
- **Pros**: Simple, isolated failures, easy to scale
- **Cons**: Higher overhead per node, more containers to manage

### New Architecture (AV11-426)
- **Pattern**: One container → Multiple nodes (4-8 instances)
- **Scaling**: Vertical + Horizontal (more CPUs per container + more containers)
- **File**: `docker-compose-multi-node.yml` (new)
- **Pros**: Better resource efficiency, fewer containers, higher density
- **Cons**: Shared failure domain, complex resource management

---

## 🔧 Technical Stack

### Base Components
- **Base Image**: GraalVM native-image optimized (ubi9-minimal)
- **Framework**: Quarkus 3.28.2 with reactive streams
- **Runtime**: Java 21 with Virtual Threads
- **Process Manager**: Supervisor or custom launcher script
- **Orchestration**: Docker Compose (dev) + Kubernetes (production)
- **Networking**: gRPC/HTTP2 with service discovery
- **Monitoring**: Prometheus + Grafana

### Resource Management
- **CPU Isolation**: Linux cgroups + CPU pinning (taskset)
- **Memory Isolation**: Per-process memory limits (cgroup v2)
- **Network Isolation**: Virtual network interfaces (macvlan/ipvlan)
- **I/O Isolation**: Block I/O cgroup limits

---

## 🏭 Container Design

### Multi-Node Container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Docker Container: aurigraph-multi-node-1                   │
│  Resources: 32 CPU, 4GB RAM, 50GB SSD                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Supervisor Process (PID 1)                              ││
│  │ - Health monitoring                                      ││
│  │ - Auto-restart failed nodes                              ││
│  │ - Metrics aggregation                                   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Node 1   │  │ Node 2   │  │ Node 3   │  │ Node 4   │    │
│  │ Leader   │  │ Follower │  │ Follower │  │ Follower │    │
│  │          │  │          │  │          │  │          │    │
│  │ CPU: 0-7 │  │ CPU: 8-15│  │ CPU:16-23│  │ CPU:24-31│    │
│  │ RAM: 1GB │  │ RAM: 1GB │  │ RAM: 1GB │  │ RAM: 1GB │    │
│  │ Port:9003│  │ Port:9013│  │ Port:9023│  │ Port:9033│    │
│  │ gRPC:9004│  │ gRPC:9014│  │ gRPC:9024│  │ gRPC:9034│    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│       ↓              ↓              ↓              ↓         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Shared Services                                        │ │
│  │ - Redis Cache (256MB)                                  │ │
│  │ - Metrics Collector (Prometheus Node Exporter)        │ │
│  │ - Log Aggregator (Fluentd)                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Implementation Components

### 1. Multi-Node Launcher Script (`multi-node-launcher.sh`)

**Purpose**: Start and manage multiple Aurigraph nodes within a single container

```bash
#!/bin/bash
# File: multi-node-launcher.sh

NODE_COUNT="${AURIGRAPH_NODE_COUNT:-4}"
BASE_HTTP_PORT="${AURIGRAPH_BASE_HTTP_PORT:-9003}"
BASE_GRPC_PORT="${AURIGRAPH_BASE_GRPC_PORT:-9004}"
CPU_PER_NODE="${AURIGRAPH_CPU_PER_NODE:-8}"

# Start nodes in background with CPU pinning
for i in $(seq 0 $((NODE_COUNT-1))); do
    NODE_ID="node-${CONTAINER_ID}-${i}"
    HTTP_PORT=$((BASE_HTTP_PORT + i*10))
    GRPC_PORT=$((BASE_GRPC_PORT + i*10))
    CPU_START=$((i * CPU_PER_NODE))
    CPU_END=$((CPU_START + CPU_PER_NODE - 1))

    # CPU pinning with taskset
    taskset -c ${CPU_START}-${CPU_END} \
        /app/aurigraph-v11 \
        -Daurigraph.node.id=${NODE_ID} \
        -Dquarkus.http.port=${HTTP_PORT} \
        -Dquarkus.grpc.server.port=${GRPC_PORT} \
        &> /app/logs/node-${i}.log &

    NODE_PIDS[${i}]=$!
    echo "Started node ${NODE_ID} on CPU ${CPU_START}-${CPU_END}, PID ${NODE_PIDS[${i}]}"
done

# Monitor and restart failed nodes
while true; do
    for i in $(seq 0 $((NODE_COUNT-1))); do
        if ! kill -0 ${NODE_PIDS[${i}]} 2>/dev/null; then
            echo "Node ${i} died, restarting..."
            # Restart logic here
        fi
    done
    sleep 5
done
```

### 2. Supervisor Configuration (`supervisord.conf`)

**Alternative to custom launcher**: Use Supervisor for process management

```ini
[supervisord]
nodaemon=true
user=root

[program:aurigraph-node-0]
command=/app/aurigraph-v11 -Dquarkus.http.port=9003 -Dquarkus.grpc.server.port=9004
autostart=true
autorestart=true
stdout_logfile=/app/logs/node-0.log
environment=AURIGRAPH_NODE_ID="node-0",AURIGRAPH_CPU_AFFINITY="0-7"

[program:aurigraph-node-1]
command=/app/aurigraph-v11 -Dquarkus.http.port=9013 -Dquarkus.grpc.server.port=9014
autostart=true
autorestart=true
stdout_logfile=/app/logs/node-1.log
environment=AURIGRAPH_NODE_ID="node-1",AURIGRAPH_CPU_AFFINITY="8-15"

[program:aurigraph-node-2]
command=/app/aurigraph-v11 -Dquarkus.http.port=9023 -Dquarkus.grpc.server.port=9024
autostart=true
autorestart=true
stdout_logfile=/app/logs/node-2.log
environment=AURIGRAPH_NODE_ID="node-2",AURIGRAPH_CPU_AFFINITY="16-23"

[program:aurigraph-node-3]
command=/app/aurigraph-v11 -Dquarkus.http.port=9033 -Dquarkus.grpc.server.port=9034
autostart=true
autorestart=true
stdout_logfile=/app/logs/node-3.log
environment=AURIGRAPH_NODE_ID="node-3",AURIGRAPH_CPU_AFFINITY="24-31"

[program:prometheus-exporter]
command=/app/prometheus-exporter --port=9100
autostart=true
autorestart=true

[program:fluentd]
command=/app/fluentd -c /app/config/fluentd.conf
autostart=true
autorestart=true
```

### 3. Dockerfile.multi-node (New)

```dockerfile
FROM ghcr.io/graalvm/native-image-community:21-muslib AS build

WORKDIR /build
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -B

COPY src/ src/
RUN ./mvnw clean package -Pnative-ultra \
    -DskipTests \
    -Dquarkus.native.container-build=false

FROM registry.access.redhat.com/ubi9/ubi-minimal:9.3

# Install supervisor and utilities
RUN microdnf install -y \
    supervisor \
    util-linux \
    procps-ng \
    && microdnf clean all

WORKDIR /app

# Copy native executable
COPY --from=build /build/target/*-runner /app/aurigraph-v11

# Copy multi-node launcher
COPY scripts/multi-node-launcher.sh /app/
COPY config/supervisord.conf /etc/supervisord.conf

# Create directories
RUN mkdir -p /app/logs /app/data /app/config && \
    chmod +x /app/multi-node-launcher.sh /app/aurigraph-v11

# Expose port ranges (4 nodes × 3 ports each)
EXPOSE 9003-9033 9004-9034 9005-9035

# Use supervisor as entrypoint
ENTRYPOINT ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
```

### 4. docker-compose-multi-node.yml (New)

```yaml
version: '3.9'

services:
  aurigraph-multi-node-1:
    build:
      context: .
      dockerfile: Dockerfile.multi-node
    container_name: aurigraph-multi-node-1
    hostname: aurigraph-multi-node-1
    environment:
      AURIGRAPH_NODE_COUNT: "4"
      AURIGRAPH_BASE_HTTP_PORT: "9003"
      AURIGRAPH_BASE_GRPC_PORT: "9004"
      AURIGRAPH_CPU_PER_NODE: "8"
      AURIGRAPH_MEMORY_PER_NODE: "1024M"
    deploy:
      resources:
        limits:
          cpus: '32'
          memory: 4G
        reservations:
          cpus: '16'
          memory: 2G
    ports:
      - "9003-9033:9003-9033"  # HTTP ports for 4 nodes
      - "9004-9034:9004-9034"  # gRPC ports for 4 nodes
      - "9005-9035:9005-9035"  # Metrics ports
    volumes:
      - multi-node-1-data:/app/data
      - multi-node-1-logs:/app/logs
    restart: unless-stopped

  # Monitoring stack (shared)
  prometheus:
    image: prom/prometheus:v2.48.0
    volumes:
      - ./config/prometheus/multi-node-prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:10.2.3
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana-data:/var/lib/grafana
    ports:
      - "3000:3000"

volumes:
  multi-node-1-data:
  multi-node-1-logs:
  prometheus-data:
  grafana-data:
```

### 5. Kubernetes Deployment (multi-node-deployment.yaml)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aurigraph-multi-node
  labels:
    app: aurigraph
    tier: backend
    architecture: multi-node
spec:
  replicas: 3
  selector:
    matchLabels:
      app: aurigraph
      tier: backend
  template:
    metadata:
      labels:
        app: aurigraph
        tier: backend
    spec:
      containers:
      - name: aurigraph-multi-node
        image: aurigraph/v11-multi-node:latest
        imagePullPolicy: Always
        env:
        - name: AURIGRAPH_NODE_COUNT
          value: "4"
        - name: AURIGRAPH_BASE_HTTP_PORT
          value: "9003"
        - name: AURIGRAPH_CPU_PER_NODE
          value: "8"
        resources:
          requests:
            cpu: "16"
            memory: "2Gi"
          limits:
            cpu: "32"
            memory: "4Gi"
        ports:
        - containerPort: 9003
          name: http-node-0
        - containerPort: 9013
          name: http-node-1
        - containerPort: 9023
          name: http-node-2
        - containerPort: 9033
          name: http-node-3
        volumeMounts:
        - name: data
          mountPath: /app/data
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: data
        emptyDir: {}
      - name: logs
        emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: aurigraph-multi-node
spec:
  type: LoadBalancer
  selector:
    app: aurigraph
    tier: backend
  ports:
  - port: 8080
    targetPort: 9003
    name: http-lb

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: aurigraph-multi-node-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: aurigraph-multi-node
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80

---
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: aurigraph-multi-node-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: aurigraph-multi-node
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: aurigraph-multi-node
      minAllowed:
        cpu: "8"
        memory: "1Gi"
      maxAllowed:
        cpu: "64"
        memory: "16Gi"
```

---

## 🔍 Resource Isolation Strategy

### CPU Isolation
```bash
# Method 1: taskset (CPU pinning)
taskset -c 0-7 /app/aurigraph-v11 --node-id=0

# Method 2: cgroups v2 (CPU quota)
echo "+cpu +memory" > /sys/fs/cgroup/cgroup.subtree_control
mkdir -p /sys/fs/cgroup/aurigraph/node-0
echo "800000" > /sys/fs/cgroup/aurigraph/node-0/cpu.max  # 8 CPUs
echo $PID > /sys/fs/cgroup/aurigraph/node-0/cgroup.procs
```

### Memory Isolation
```bash
# cgroups v2 memory limits
echo "1073741824" > /sys/fs/cgroup/aurigraph/node-0/memory.max  # 1GB
echo "943718400" > /sys/fs/cgroup/aurigraph/node-0/memory.high  # 900MB soft limit
```

### Network Isolation
```bash
# Method 1: Port-based (simple)
# Each node uses unique ports: Node0=9003, Node1=9013, Node2=9023, etc.

# Method 2: macvlan (advanced)
# Create virtual network interface per node for true network isolation
```

---

## 📊 Performance Targets

### Per-Container Targets
- **Total TPS**: 2M+ (4 nodes × 500K TPS each)
- **Startup Time**: <5s (all 4 nodes)
- **Memory**: <4GB total (<1GB per node)
- **CPU**: 32 cores (8 cores per node)
- **Latency P99**: <100ms

### Scaling Targets
- **Horizontal**: 1-10 multi-node containers
- **Vertical**: 4-8 nodes per container
- **Total Network**: Up to 16M TPS (10 containers × 8 nodes × 200K TPS)

---

## 🚀 Deployment Workflow

### Local Development
```bash
# Build multi-node image
docker build -f Dockerfile.multi-node -t aurigraph/v11-multi-node:latest .

# Start multi-node container
docker-compose -f docker-compose-multi-node.yml up -d

# Check node health
for port in 9003 9013 9023 9033; do
    curl http://localhost:${port}/q/health
done

# View aggregated logs
docker logs -f aurigraph-multi-node-1
```

### Kubernetes Production
```bash
# Deploy to Kubernetes
kubectl apply -f k8s/multi-node-deployment.yaml

# Check status
kubectl get pods -l app=aurigraph
kubectl get hpa aurigraph-multi-node-hpa
kubectl get vpa aurigraph-multi-node-vpa

# Scale up
kubectl scale deployment aurigraph-multi-node --replicas=5
```

---

## 📈 Monitoring & Metrics

### Prometheus Scraping
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'aurigraph-multi-node'
    static_configs:
      - targets:
        - 'aurigraph-multi-node-1:9005'  # Node 0 metrics
        - 'aurigraph-multi-node-1:9015'  # Node 1 metrics
        - 'aurigraph-multi-node-1:9025'  # Node 2 metrics
        - 'aurigraph-multi-node-1:9035'  # Node 3 metrics
```

### Grafana Dashboard Metrics
- **Per-Node TPS**: Individual node performance
- **Aggregate TPS**: Total container throughput
- **CPU Usage Per Node**: Core utilization breakdown
- **Memory Per Node**: Per-process memory usage
- **Network Traffic**: Inter-node communication bandwidth

---

## ✅ Success Criteria

1. ✅ Single container successfully runs 4-8 independent node instances
2. ✅ Each node achieves 200K-500K TPS (container total: 2M+ TPS)
3. ✅ Resource isolation prevents one node from starving others
4. ✅ Node failures are auto-restarted without container restart
5. ✅ Kubernetes HPA/VPA successfully scale containers based on load
6. ✅ Monitoring shows per-node and aggregate metrics
7. ✅ Startup time <5s for all nodes in container
8. ✅ Memory footprint <4GB per container

---

## 📝 Next Steps

### Sprint 14 (Days 1-5)
1. ✅ Complete architecture design (this document)
2. ⏳ Implement multi-node launcher script
3. ⏳ Create Dockerfile.multi-node
4. ⏳ Create docker-compose-multi-node.yml
5. ⏳ Test locally with 4 nodes

### Sprint 15 (Days 6-10)
6. ⏳ Implement Kubernetes manifests
7. ⏳ Set up resource isolation (cgroups, CPU pinning)
8. ⏳ Integrate Prometheus/Grafana monitoring
9. ⏳ Performance benchmarking (2M+ TPS target)
10. ⏳ Documentation and JIRA update

---

## 🔗 Dependencies

### Blockers
- ❌ Sprint 13: GraalVM native compilation must be stable
- ❌ Sprint 13: Performance baseline must reach 1.5M+ TPS

**Current Status** (from session summary):
- ✅ Sprint 12: 1.18M TPS baseline achieved
- ❌ Sprint 13: Performance regression (-7.65%, now 1.09M TPS)
- ⚠️ **Recommendation**: Rollback Sprint 13, use Sprint 12 as baseline

### Resolved
- ✅ Native image compilation working (Sprint 12)
- ✅ Docker infrastructure exists
- ✅ Prometheus/Grafana monitoring configured

---

## 📚 References

- **Existing Architecture**: `docker-compose-native-cluster.yml`
- **Native Dockerfile**: `Dockerfile.native`
- **Native Image Config**: `src/main/resources/META-INF/native-image/native-image.properties`
- **JIRA Ticket**: AV11-426
- **Sprint Plan**: Sprint 14-15 (10 days)

---

**Document Status**: ✅ Design Complete - Ready for Implementation
**Last Updated**: October 21, 2025
**Author**: ADA (AI/ML Development Agent) + DDA (DevOps & Deployment Agent)
