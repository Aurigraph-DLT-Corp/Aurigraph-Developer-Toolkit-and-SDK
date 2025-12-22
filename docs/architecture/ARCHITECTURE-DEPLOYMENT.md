## Deployment Architecture

### Container Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Kubernetes Cluster                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │          Ingress Controller (NGINX)           │  │
│  │      TLS Termination & Load Balancing         │  │
│  └────────────────┬─────────────────────────────┘  │
│                   │                                  │
│  ┌────────────────┴─────────────────────────────┐  │
│  │                                               │  │
│  │  ┌─────────────┐         ┌─────────────┐    │  │
│  │  │   V11 Pod   │         │  Portal Pod │    │  │
│  │  │  (Quarkus)  │         │   (Nginx)   │    │  │
│  │  │  Replicas:3 │         │  Replicas:2 │    │  │
│  │  └─────────────┘         └─────────────┘    │  │
│  │                                               │  │
│  │  ┌─────────────┐         ┌─────────────┐    │  │
│  │  │  IAM Pod    │         │  Oracle Pod │    │  │
│  │  │ (Keycloak)  │         │  (Custom)   │    │  │
│  │  │  Replicas:2 │         │  Replicas:3 │    │  │
│  │  └─────────────┘         └─────────────┘    │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │        StatefulSets (Persistent Storage)      │  │
│  │  ┌─────────────┐         ┌─────────────┐    │  │
│  │  │ PostgreSQL  │         │   RocksDB   │    │  │
│  │  │  Replicas:3 │         │  Replicas:3 │    │  │
│  │  └─────────────┘         └─────────────┘    │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Deployment Environments

**Development** (`dev`):
- Single-node setup
- Hot reload enabled
- Debug mode
- Mock external services

**Staging** (`staging`):
- Multi-node setup
- Production-like configuration
- Integration testing
- Performance validation

**Production** (`prod`):
- **Multi-Cloud Deployment**: AWS + Azure + GCP
- **High Availability (HA)**: Survives single-cloud outage
- **Auto-Scaling**: Kubernetes HPA/VPA
- **Global Distribution**:
  - Validator nodes: 12 total (4 per cloud)
  - Business nodes: 18 total (6 per region)
  - Slim nodes: 36 total (12 per edge location)
- **Cross-Cloud Latency**: <50ms (validator-to-validator)
- **Global API Latency**: <200ms (via edge slim nodes)
- **Carbon Tracking**: Real-time monitoring and ESG reporting
- **Full Monitoring**: Prometheus + Grafana + Carbon Dashboard

### CI/CD Pipeline

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Commit │────>│  Build  │────>│  Test   │────>│ Deploy  │
│  (Git)  │     │ (Maven) │     │ (JUnit) │     │  (K8s)  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
                      │               │               │
                      │               │               │
                 Compile         Unit Tests      Blue-Green
                 Native          Integration     Deployment
                 Image           Performance
```

**Pipeline Stages**:
1. **Source** - Git push triggers build
2. **Build** - Maven compile + native image
3. **Test** - Unit, integration, performance tests
4. **Security Scan** - Vulnerability scanning
5. **Deploy** - Kubernetes rollout
6. **Verify** - Health checks and smoke tests
7. **Monitor** - Prometheus + Grafana
