# Multi-Cloud Deployment Strategy for Aurigraph V11

**Version**: 1.0.0
**Status**: Design Phase
**Last Updated**: 2025-11-12
**Author**: Agent 4 (Multi-Cloud Deployment)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [AWS Architecture](#aws-architecture)
4. [Azure Architecture](#azure-architecture)
5. [GCP Architecture](#gcp-architecture)
6. [Load Balancing Strategy](#load-balancing-strategy)
7. [Data Replication](#data-replication)
8. [Failover & Failback](#failover--failback)
9. [Cost Optimization](#cost-optimization)
10. [Network Architecture](#network-architecture)
11. [Security & Compliance](#security--compliance)
12. [Monitoring & Observability](#monitoring--observability)
13. [Implementation Phases](#implementation-phases)

---

## Executive Summary

### Objectives

The Aurigraph V11 multi-cloud deployment strategy aims to deliver:

- **99.99% availability** across three major cloud providers (AWS, Azure, GCP)
- **Geographic redundancy** with 6 regions (2 per cloud)
- **2M+ TPS** sustained performance across all regions
- **<100ms finality** with global consensus
- **Active-active deployment** with intelligent routing
- **Cost optimization** through workload distribution and spot instances

### Architecture Principles

1. **Cloud Agnostic**: Infrastructure-as-code using Terraform for portability
2. **Regional Failover**: Automatic failover within and across clouds
3. **Data Sovereignty**: Region-specific data residency compliance
4. **Zero Downtime**: Rolling updates with canary deployments
5. **Cost Efficiency**: Right-sizing and auto-scaling across clouds

### Target Deployment

| Cloud Provider | Primary Region | Secondary Region | Total Nodes |
|---------------|---------------|-----------------|-------------|
| AWS           | us-east-1     | us-west-2       | 22 (4V+6B+12S) |
| Azure         | eastus        | westus          | 22 (4V+6B+12S) |
| GCP           | us-central1   | us-west1        | 22 (4V+6B+12S) |
| **Total**     | **6 Regions** | **3 Clouds**    | **66 Nodes** |

**Node Types**:
- **V** = Validator Nodes (4 per cloud)
- **B** = Business Nodes (6 per cloud)
- **S** = Slim Nodes (12 per cloud)

---

## Architecture Overview

### High-Level Multi-Cloud Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Global Load Balancer                             │
│                    (GeoDNS + Cloudflare + Route53)                       │
└─────────────┬───────────────────┬───────────────────┬───────────────────┘
              │                   │                   │
    ┌─────────▼─────────┐  ┌──────▼──────┐  ┌────────▼────────┐
    │    AWS Cloud      │  │ Azure Cloud │  │   GCP Cloud     │
    │   22 Nodes        │  │  22 Nodes   │  │   22 Nodes      │
    │                   │  │             │  │                 │
    │ Primary: us-east-1│  │ Primary:    │  │ Primary:        │
    │ Secondary: west-2 │  │  eastus     │  │  us-central1    │
    └─────────┬─────────┘  └──────┬──────┘  └────────┬────────┘
              │                   │                   │
              └───────────────────┼───────────────────┘
                                  │
                   ┌──────────────▼──────────────┐
                   │   Cross-Cloud VPN Mesh      │
                   │   (WireGuard + IPSec)       │
                   │   - Full Mesh Topology      │
                   │   - Encrypted Tunnels       │
                   │   - <10ms Latency          │
                   └──────────────┬──────────────┘
                                  │
                   ┌──────────────▼──────────────┐
                   │  Consensus Layer (Global)   │
                   │  - HyperRAFT++ Cluster      │
                   │  - 12 Total Validators      │
                   │  - Byzantine Fault Tolerant │
                   └──────────────┬──────────────┘
                                  │
                   ┌──────────────▼──────────────┐
                   │   Data Replication Layer    │
                   │   - CockroachDB (Global)    │
                   │   - Redis (Regional)        │
                   │   - S3/Blob/GCS (Backup)    │
                   └─────────────────────────────┘
```

### Node Distribution Strategy

**Validator Nodes (12 total)**:
- 4 per cloud provider
- Participate in HyperRAFT++ consensus
- High-performance compute (c6i.4xlarge / D8s_v5 / c2-standard-8)
- SSD-backed storage with IOPS optimization

**Business Nodes (18 total)**:
- 6 per cloud provider
- Handle API requests and transaction processing
- Medium compute with auto-scaling (c6i.2xlarge / D4s_v5 / c2-standard-4)
- Connected to regional read replicas

**Slim Nodes (36 total)**:
- 12 per cloud provider
- Edge processing and caching
- Light compute (t3.large / B2s / e2-standard-2)
- Quick deployment for burst capacity

---

## AWS Architecture

### Region Configuration

#### Primary Region: us-east-1 (N. Virginia)

**Availability Zones**: 3 AZs (us-east-1a, 1b, 1c)

**Node Distribution**:
```
AZ 1a: 2 Validators, 2 Business, 4 Slim
AZ 1b: 1 Validator,  2 Business, 4 Slim
AZ 1c: 1 Validator,  2 Business, 4 Slim
```

**Infrastructure**:
- **VPC**: 10.0.0.0/16
- **Public Subnets**: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
- **Private Subnets**: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
- **Database Subnet**: 10.0.21.0/24, 10.0.22.0/24
- **NAT Gateways**: 1 per AZ (3 total)
- **Internet Gateway**: 1 per VPC

#### Secondary Region: us-west-2 (Oregon)

**Availability Zones**: 3 AZs (us-west-2a, 2b, 2c)

**Node Distribution**:
```
AZ 2a: 1 Validator,  2 Business, 4 Slim
AZ 2b: 1 Validator,  2 Business, 4 Slim
AZ 2c: 0 Validators, 2 Business, 4 Slim
```

**Infrastructure**:
- **VPC**: 10.1.0.0/16
- **Subnets**: Same pattern as us-east-1
- **VPC Peering**: To us-east-1 VPC
- **Transit Gateway**: For multi-region routing

### Instance Types

| Node Type | Instance Type | vCPUs | RAM | Storage | Cost/Month |
|-----------|--------------|-------|-----|---------|------------|
| Validator | c6i.4xlarge  | 16    | 32GB| 500GB SSD| $415      |
| Business  | c6i.2xlarge  | 8     | 16GB| 250GB SSD| $207      |
| Slim      | t3.large     | 2     | 8GB | 100GB SSD| $60       |

### AWS Services Used

1. **Compute**: EC2 with Auto Scaling Groups
2. **Networking**: VPC, Transit Gateway, PrivateLink
3. **Storage**: EBS (gp3), S3 (backup), EFS (shared config)
4. **Database**: RDS PostgreSQL 16 (Multi-AZ)
5. **Cache**: ElastiCache Redis (cluster mode)
6. **Load Balancing**: ALB (Application), NLB (Network)
7. **DNS**: Route 53 with health checks
8. **Monitoring**: CloudWatch, X-Ray
9. **Security**: IAM, Secrets Manager, KMS, WAF
10. **Container**: ECS Fargate (optional for services)

### Cost Estimation (AWS)

**Monthly Costs per Region**:
```
Validators:  4 × $415  = $1,660
Business:    6 × $207  = $1,242
Slim:       12 × $60   = $720
RDS (Multi-AZ):         $450
ElastiCache:            $200
Data Transfer:          $300
Load Balancers:         $150
NAT Gateways:           $100
──────────────────────────────
Regional Total:         $4,822
AWS Total (2 regions):  $9,644/month
```

**Annual**: ~$115,728

---

## Azure Architecture

### Region Configuration

#### Primary Region: East US (Virginia)

**Availability Zones**: 3 zones

**Node Distribution**:
```
Zone 1: 2 Validators, 2 Business, 4 Slim
Zone 2: 1 Validator,  2 Business, 4 Slim
Zone 3: 1 Validator,  2 Business, 4 Slim
```

**Infrastructure**:
- **Virtual Network**: 10.10.0.0/16
- **Public Subnets**: 10.10.1.0/24, 10.10.2.0/24, 10.10.3.0/24
- **Private Subnets**: 10.10.11.0/24, 10.10.12.0/24, 10.10.13.0/24
- **Database Subnet**: 10.10.21.0/24
- **NAT Gateway**: 1 per zone (3 total)
- **VNet Gateway**: For VPN connectivity

#### Secondary Region: West US (California)

**Availability Zones**: 3 zones

**Node Distribution**:
```
Zone 1: 1 Validator,  2 Business, 4 Slim
Zone 2: 1 Validator,  2 Business, 4 Slim
Zone 3: 0 Validators, 2 Business, 4 Slim
```

**Infrastructure**:
- **Virtual Network**: 10.11.0.0/16
- **VNet Peering**: To East US VNet
- **ExpressRoute**: For hybrid connectivity

### Instance Types

| Node Type | VM Size      | vCPUs | RAM | Storage | Cost/Month |
|-----------|-------------|-------|-----|---------|------------|
| Validator | D8s_v5      | 8     | 32GB| 500GB SSD| $380      |
| Business  | D4s_v5      | 4     | 16GB| 250GB SSD| $190      |
| Slim      | B2s         | 2     | 4GB | 100GB SSD| $40       |

### Azure Services Used

1. **Compute**: Virtual Machines with VM Scale Sets
2. **Networking**: Virtual Network, VPN Gateway, ExpressRoute
3. **Storage**: Managed Disks (Premium SSD), Blob Storage
4. **Database**: Azure Database for PostgreSQL (Zone-redundant)
5. **Cache**: Azure Cache for Redis (Premium tier)
6. **Load Balancing**: Application Gateway, Load Balancer
7. **DNS**: Azure DNS with Traffic Manager
8. **Monitoring**: Azure Monitor, Application Insights
9. **Security**: Azure AD, Key Vault, Security Center
10. **Container**: AKS (Azure Kubernetes Service) optional

### Cost Estimation (Azure)

**Monthly Costs per Region**:
```
Validators:  4 × $380  = $1,520
Business:    6 × $190  = $1,140
Slim:       12 × $40   = $480
PostgreSQL (Zone-red):  $420
Redis Cache:            $180
Data Transfer:          $280
App Gateway:            $140
NAT Gateway:            $90
──────────────────────────────
Regional Total:         $4,250
Azure Total (2 regions): $8,500/month
```

**Annual**: ~$102,000

---

## GCP Architecture

### Region Configuration

#### Primary Region: us-central1 (Iowa)

**Zones**: 3 zones (a, b, c)

**Node Distribution**:
```
Zone a: 2 Validators, 2 Business, 4 Slim
Zone b: 1 Validator,  2 Business, 4 Slim
Zone c: 1 Validator,  2 Business, 4 Slim
```

**Infrastructure**:
- **VPC Network**: 10.20.0.0/16 (auto mode)
- **Subnets**: Auto-created per zone
- **Cloud Router**: For dynamic routing
- **Cloud NAT**: For outbound connectivity
- **Cloud VPN**: For cross-cloud connectivity

#### Secondary Region: us-west1 (Oregon)

**Zones**: 3 zones (a, b, c)

**Node Distribution**:
```
Zone a: 1 Validator,  2 Business, 4 Slim
Zone b: 1 Validator,  2 Business, 4 Slim
Zone c: 0 Validators, 2 Business, 4 Slim
```

**Infrastructure**:
- **VPC Network**: Same global VPC (10.21.0.0/16 subnet)
- **VPC Peering**: Native global VPC
- **Cloud Interconnect**: For hybrid connectivity

### Instance Types

| Node Type | Machine Type    | vCPUs | RAM | Storage | Cost/Month |
|-----------|----------------|-------|-----|---------|------------|
| Validator | c2-standard-8  | 8     | 32GB| 500GB SSD| $350      |
| Business  | c2-standard-4  | 4     | 16GB| 250GB SSD| $175      |
| Slim      | e2-standard-2  | 2     | 8GB | 100GB SSD| $50       |

### GCP Services Used

1. **Compute**: Compute Engine with Managed Instance Groups
2. **Networking**: VPC, Cloud VPN, Cloud Interconnect
3. **Storage**: Persistent Disk (SSD), Cloud Storage
4. **Database**: Cloud SQL for PostgreSQL (High Availability)
5. **Cache**: Memorystore for Redis (Standard tier)
6. **Load Balancing**: Cloud Load Balancing (Global)
7. **DNS**: Cloud DNS with Cloud CDN
8. **Monitoring**: Cloud Monitoring, Cloud Trace
9. **Security**: Cloud IAM, Secret Manager, Cloud KMS
10. **Container**: GKE (Google Kubernetes Engine) optional

### Cost Estimation (GCP)

**Monthly Costs per Region**:
```
Validators:  4 × $350  = $1,400
Business:    6 × $175  = $1,050
Slim:       12 × $50   = $600
Cloud SQL (HA):         $390
Memorystore:            $170
Data Transfer:          $250
Load Balancer:          $120
Cloud NAT:              $80
──────────────────────────────
Regional Total:         $4,060
GCP Total (2 regions):  $8,120/month
```

**Annual**: ~$97,440

---

## Load Balancing Strategy

### Global Load Balancing Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Cloudflare Global Anycast                   │
│              (DDoS Protection + CDN + WAF)                   │
└─────────────┬────────────────────────────┬──────────────────┘
              │                            │
    ┌─────────▼──────────┐      ┌─────────▼──────────┐
    │   Route 53         │      │  Azure Traffic     │
    │   (AWS GeoDNS)     │      │  Manager           │
    │   Health Checks    │      │  (Priority)        │
    └─────────┬──────────┘      └─────────┬──────────┘
              │                            │
    ┌─────────▼──────────┐      ┌─────────▼──────────┐
    │  AWS ALB/NLB       │      │  Azure App Gateway │
    │  (Regional LB)     │      │  (Regional LB)     │
    └─────────┬──────────┘      └─────────┬──────────┘
              │                            │
    ┌─────────▼────────────────────────────▼──────────┐
    │         Backend Nodes (Validators/Business)      │
    │         - Health Check: /q/health                │
    │         - Readiness Check: /q/ready              │
    │         - Liveness Check: /q/live                │
    └──────────────────────────────────────────────────┘
```

### Routing Strategy

**1. Geographic Routing (Primary)**
- **Latency-based**: Route to nearest cloud region
- **Geoproximity**: Bias routing based on user location
- **Fallback**: Secondary region if primary unhealthy

**2. Health-Based Routing**
- **Endpoint Monitoring**: /q/health checks every 10 seconds
- **Unhealthy Threshold**: 3 consecutive failures
- **Recovery**: Auto-recovery after 2 consecutive successes
- **Drain Period**: 30 seconds for graceful shutdown

**3. Weighted Routing**
- **AWS**: 40% of traffic (largest deployment)
- **Azure**: 30% of traffic
- **GCP**: 30% of traffic
- **Adjustable**: Dynamic weights based on load

**4. Consensus-Aware Routing**
- **Leader Affinity**: Route writes to current HyperRAFT++ leader
- **Read Replicas**: Route reads to nearest healthy replica
- **Follower Reads**: Stale reads (eventual consistency) for analytics

### Load Balancer Configuration

**Layer 7 (Application)**:
- Protocol: HTTPS (TLS 1.3)
- Sticky Sessions: Cookie-based (AURIGRAPH_SESSION)
- Session Duration: 1 hour
- X-Forwarded-For: Preserved
- WebSocket Support: Enabled

**Layer 4 (Network)**:
- Protocol: TCP/UDP
- Port: 9003 (HTTP/2), 9004 (gRPC)
- Proxy Protocol: v2
- Connection Draining: 30 seconds

### Traffic Distribution Modes

**Active-Active (Default)**:
- All clouds receive traffic simultaneously
- Best for global distribution
- Maximum resource utilization

**Active-Passive (Disaster Recovery)**:
- One cloud primary, others standby
- Instant failover on failure
- Lower operational cost

**Active-Active-Passive (Hybrid)**:
- AWS + Azure active (70% traffic)
- GCP passive (30% traffic)
- Cost-optimized with redundancy

---

## Data Replication

### Database Replication Strategy

#### CockroachDB (Global Distributed SQL)

**Deployment Model**: Multi-region cluster with zone-replication

```
┌───────────────────────────────────────────────────────────┐
│               CockroachDB Global Cluster                   │
│           (Strong Consistency, Multi-Region)               │
└─────────┬─────────────────┬──────────────────┬───────────┘
          │                 │                  │
    ┌─────▼─────┐     ┌─────▼─────┐     ┌─────▼─────┐
    │    AWS    │     │   Azure   │     │    GCP    │
    │  Region   │     │  Region   │     │  Region   │
    │           │     │           │     │           │
    │ 3 Nodes   │     │ 3 Nodes   │     │ 3 Nodes   │
    │ (RF=3)    │     │ (RF=3)    │     │ (RF=3)    │
    └───────────┘     └───────────┘     └───────────┘
```

**Configuration**:
- **Replication Factor**: 3 per region
- **Consistency**: Strong (linearizable)
- **Conflict Resolution**: Last-write-wins with timestamp
- **Automatic Rebalancing**: Every 10 minutes
- **Backup**: Daily full + hourly incremental

**Table Partitioning**:
```sql
-- Geo-partitioned by user region
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  region STRING NOT NULL,
  data JSONB,
  created_at TIMESTAMP
) PARTITION BY LIST (region) (
  PARTITION us_east VALUES IN ('us-east-1', 'us-east-2'),
  PARTITION us_west VALUES IN ('us-west-1', 'us-west-2'),
  PARTITION eu VALUES IN ('eu-west-1', 'eu-central-1'),
  PARTITION asia VALUES IN ('ap-southeast-1', 'ap-northeast-1')
);
```

#### PostgreSQL (Regional)

**Deployment Model**: Primary-replica with async replication

**Primary-Replica Setup** (per region):
- 1 Primary (write node)
- 2 Read Replicas (read nodes)
- Async streaming replication
- <5 second replication lag

**Cross-Region Replication**:
- Logical replication for critical tables
- Async replication to avoid latency
- Conflict resolution via timestamps

#### Redis Cache (Regional)

**Deployment Model**: Regional clusters with cross-region sync

**Cache Hierarchy**:
```
Level 1: Local Redis (in-memory, <1ms)
Level 2: Regional Redis Cluster (2-5ms)
Level 3: Cross-Region Redis (10-50ms)
Level 4: Database (50-200ms)
```

**Data Types Cached**:
- Hot transactions (1-hour TTL)
- User sessions (24-hour TTL)
- API rate limits (1-minute TTL)
- Blockchain state (10-minute TTL)

**Eviction Policy**: LRU (Least Recently Used)

### Object Storage Replication

#### Blockchain Data

**Storage Layer**:
- **AWS**: S3 with Cross-Region Replication (CRR)
- **Azure**: Blob Storage with Geo-Redundant Storage (GRS)
- **GCP**: Cloud Storage with Dual-Region buckets

**Replication Strategy**:
- Block data: Replicate to all 6 regions (3 clouds × 2 regions)
- Transaction logs: Real-time streaming replication
- State snapshots: Daily full sync
- Archival data: Weekly backup to cold storage

**Data Lifecycle**:
```
Hot Data (0-30 days):     Standard storage, all regions
Warm Data (30-90 days):   Infrequent access, 2 regions
Cold Data (90+ days):     Archive storage, 1 region
Compliance Data (7 years): Glacier/Archive, encrypted
```

### State Replication (RocksDB)

**Local Storage**: Each node maintains local RocksDB instance

**Synchronization**:
- HyperRAFT++ log replication for consensus
- Snapshot replication every 1000 blocks
- Incremental sync for new nodes

**Consistency Model**:
- Validators: Strong consistency (quorum writes)
- Business Nodes: Eventual consistency (async replication)
- Slim Nodes: Eventual consistency (cached reads)

---

## Failover & Failback

### Failover Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Failure Detection & Orchestration           │
│                                                          │
│  Health Monitors ──┐                                    │
│  - Load Balancers   │                                    │
│  - Consul          ├─► Failure Detection (10s)          │
│  - Prometheus      │                                    │
│  - Synthetic Tests─┘                                    │
│                                                          │
│              ▼                                           │
│  ┌────────────────────────────────────────────┐        │
│  │       Decision Engine (Automated)          │        │
│  │  - Severity Assessment                     │        │
│  │  - Impact Analysis                         │        │
│  │  - Failover Trigger                        │        │
│  └────────────┬───────────────────────────────┘        │
│               ▼                                          │
│  ┌────────────────────────────────────────────┐        │
│  │     Failover Actions (30-60s)              │        │
│  │  1. Update DNS records                     │        │
│  │  2. Drain unhealthy nodes                  │        │
│  │  3. Promote standby leader                 │        │
│  │  4. Reroute traffic                        │        │
│  │  5. Alert operations team                  │        │
│  └────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Failover Scenarios

#### Scenario 1: Single Node Failure

**Detection**: 30 seconds (3 consecutive health check failures)

**Actions**:
1. Remove node from load balancer pool
2. Auto-scaling group launches replacement node
3. New node joins consensus/replication
4. Traffic redistributed to healthy nodes

**Impact**: None (redundancy absorbs failure)

**Time to Recovery**: 2-5 minutes

#### Scenario 2: Availability Zone Failure

**Detection**: 1 minute (multiple node failures)

**Actions**:
1. Mark entire AZ as unhealthy
2. Redirect traffic to other AZs in region
3. Consensus quorum maintained (if >50% validators healthy)
4. Launch replacement nodes in healthy AZs

**Impact**: Minimal (33% capacity reduction per region)

**Time to Recovery**: 5-10 minutes

#### Scenario 3: Region Failure

**Detection**: 2 minutes (region-wide health check failures)

**Actions**:
1. Declare regional disaster
2. Update global DNS to remove region
3. Promote secondary region to primary
4. Increase capacity in healthy regions (auto-scaling)
5. Notify operations and management

**Impact**: Moderate (50% capacity reduction per cloud)

**Time to Recovery**: 10-30 minutes

**Consensus Handling**:
- If validators in failed region: Elect new leader in healthy region
- If quorum lost: Trigger consensus recovery protocol

#### Scenario 4: Cloud Provider Failure

**Detection**: 5 minutes (multi-region failure across single cloud)

**Actions**:
1. Declare cloud-wide disaster (extremely rare)
2. Route all traffic to remaining 2 clouds
3. Activate passive nodes in standby clouds
4. Scale up capacity to handle full load
5. Initiate incident response team

**Impact**: Significant (33% total capacity loss)

**Time to Recovery**: 30-60 minutes

**Mitigation**:
- Multi-cloud architecture absorbs full cloud failure
- Target: Continue operations at 60-70% normal capacity

### Failback Procedures

#### Planned Failback (Maintenance Window)

**Steps**:
1. **Preparation** (T-24h):
   - Announce maintenance window
   - Validate secondary environment
   - Run pre-failback checks

2. **Data Sync** (T-2h):
   - Synchronize databases
   - Replicate blockchain state
   - Validate data consistency

3. **Failback Execution** (T-0):
   - Update DNS records (TTL: 60s)
   - Gradual traffic migration (10% every 5 minutes)
   - Monitor error rates and latency

4. **Validation** (T+30m):
   - Confirm traffic flowing correctly
   - Verify all services operational
   - Monitor for 1 hour

5. **Completion** (T+2h):
   - Close maintenance window
   - Post-mortem documentation
   - Restore normal operations

**Rollback Plan**: Revert DNS if error rate >1% or latency >500ms

#### Unplanned Failback (After Incident)

**Trigger**: Original region/cloud restored and validated

**Process**:
1. **Assessment** (0-30 minutes):
   - Verify root cause resolved
   - Validate infrastructure health
   - Check data consistency

2. **Staged Failback** (30-90 minutes):
   - Route 10% traffic to restored region
   - Monitor for 15 minutes
   - Increase to 25%, 50%, 75%, 100% in 15-minute intervals

3. **Validation** (90-120 minutes):
   - Full traffic on original region
   - Monitor for 2 hours for anomalies
   - Keep secondary region warm (hot standby)

4. **Normalization** (2-4 hours):
   - Restore normal capacity levels
   - Update runbooks with lessons learned
   - Schedule post-incident review

**Abort Criteria**:
- Error rate spike (>0.5%)
- Latency increase (>200ms)
- Data inconsistency detected
- Consensus issues

---

## Cost Optimization

### Multi-Cloud Cost Summary

| Cloud Provider | Monthly Cost | Annual Cost | % of Total |
|---------------|-------------|-------------|------------|
| AWS           | $9,644      | $115,728    | 37.2%      |
| Azure         | $8,500      | $102,000    | 32.8%      |
| GCP           | $8,120      | $97,440     | 31.3%      |
| **Total**     | **$26,264** | **$315,168**| **100%**   |

**Additional Costs**:
- Cross-cloud data transfer: $2,000/month
- Monitoring/logging tools: $1,500/month
- VPN/interconnect: $1,000/month
- Security tools (WAF, DDoS): $1,500/month
- **Grand Total**: ~$32,264/month or ~$387,168/year

### Cost Optimization Strategies

#### 1. Reserved Instances & Committed Use

**AWS Reserved Instances** (1-year term):
- Validators: 30% savings = $124/month per instance
- Business: 30% savings = $62/month per instance
- Annual Savings: ~$35,000

**Azure Reserved VM Instances** (1-year term):
- Validators: 35% savings = $133/month per instance
- Business: 35% savings = $66/month per instance
- Annual Savings: ~$32,000

**GCP Committed Use Discounts** (1-year term):
- Validators: 37% savings = $130/month per instance
- Business: 37% savings = $65/month per instance
- Annual Savings: ~$31,000

**Total Savings from Commitments**: ~$98,000/year (31% reduction)

#### 2. Spot Instances / Preemptible VMs

**Target**: Non-critical Slim nodes (60% of slim nodes = 21 nodes)

**Savings**:
- AWS Spot: 70% discount = $42/month per instance
- Azure Spot: 70% discount = $28/month per instance
- GCP Preemptible: 80% discount = $10/month per instance

**Annual Savings**: ~$18,000

**Risk Mitigation**:
- Mix of spot and on-demand
- Auto-scaling to replace preempted instances
- Graceful shutdown handlers

#### 3. Auto-Scaling

**Business Nodes Dynamic Scaling**:
- **Peak Hours** (8am-6pm): 6 nodes per cloud
- **Off-Peak** (6pm-8am): 3 nodes per cloud
- **Weekend**: 4 nodes per cloud

**Estimated Savings**: 30% of business node costs = ~$15,000/year

**Slim Nodes Burst Scaling**:
- **Baseline**: 8 nodes per cloud
- **Burst**: Up to 12 nodes during peak TPS
- **Savings**: ~$10,000/year

#### 4. Storage Optimization

**Tiered Storage Strategy**:
- Hot data (0-30 days): Standard storage
- Warm data (30-90 days): Infrequent access (50% cheaper)
- Cold data (90+ days): Archive storage (80% cheaper)

**Estimated Savings**: ~$8,000/year

**Snapshot Optimization**:
- Incremental backups only
- Compress before upload
- Delete old snapshots (>90 days)

**Estimated Savings**: ~$4,000/year

#### 5. Network Optimization

**Data Transfer Reduction**:
- Regional caching (reduce cross-region traffic by 40%)
- Compression for replication data
- Smart routing to minimize egress

**Estimated Savings**: ~$12,000/year

**VPN Optimization**:
- Use cloud-native interconnects where possible
- Batch non-critical replication traffic
- QoS for consensus traffic only

**Estimated Savings**: ~$3,000/year

#### 6. Right-Sizing

**Periodic Instance Analysis** (Quarterly):
- Analyze CPU/memory utilization
- Downsize underutilized instances
- Upsize over-utilized instances

**Target**: 70-80% utilization for efficiency

**Estimated Savings**: ~$15,000/year

#### 7. Multi-Cloud Arbitrage

**Workload Placement**:
- CPU-intensive: GCP (best c2 pricing)
- Memory-intensive: AWS (better m6i pricing)
- GPU workloads: Azure (competitive NDv4)

**Dynamic Workload Migration**:
- Move batch jobs to cheapest cloud
- Use spot instances aggressively
- API calls to compare pricing in real-time

**Estimated Savings**: ~$20,000/year

### Optimized Cost Summary

| Category          | Original | Optimized | Savings | % Saved |
|------------------|----------|-----------|---------|---------|
| Compute          | $232,000 | $150,000  | $82,000 | 35%     |
| Storage          | $45,000  | $33,000   | $12,000 | 27%     |
| Networking       | $24,000  | $9,000    | $15,000 | 63%     |
| Database         | $45,000  | $40,000   | $5,000  | 11%     |
| Other            | $11,168  | $11,168   | $0      | 0%      |
| **Total**        | **$357,168** | **$243,168** | **$114,000** | **32%** |

**Optimized Annual Cost**: ~$243,168 (vs. original $357,168)

**Cost Per Transaction** (at 2M TPS):
- Original: $0.0000057 per transaction
- Optimized: $0.0000039 per transaction

**Cost Per User** (assuming 10M active users):
- Original: $35.72/user/year
- Optimized: $24.32/user/year

---

## Network Architecture

### Cross-Cloud VPN Mesh

```
                    ┌────────────────┐
                    │   AWS VPC      │
                    │  10.0.0.0/16   │
                    │  us-east-1     │
                    └────┬──────┬────┘
                         │      │
                WireGuard│      │IPSec
                         │      │
        ┌────────────────┼──────┼────────────────┐
        │                │      │                │
    ┌───▼────┐      ┌────▼──────▼────┐      ┌───▼────┐
    │ Azure  │      │      GCP        │      │  AWS   │
    │  VNet  │◄─────┤   VPC Network   ├─────►│  VPC   │
    │ eastus │      │  10.20.0.0/16   │      │ west-2 │
    └────────┘      │  us-central1    │      └────────┘
                    └──────────────────┘
```

### VPN Configuration

#### WireGuard Tunnels (Primary)

**Advantages**:
- Modern, lightweight protocol
- Better performance than IPSec
- Native in Linux kernel 5.6+
- Simple configuration

**Configuration** (per tunnel):
```ini
[Interface]
PrivateKey = <generated-key>
Address = 172.16.0.1/30
ListenPort = 51820

[Peer]
PublicKey = <peer-public-key>
Endpoint = peer-ip:51820
AllowedIPs = 10.0.0.0/16, 10.10.0.0/16
PersistentKeepalive = 25
```

**Tunnel Topology**:
- Full mesh: 15 tunnels (6 regions × 5 peers / 2)
- Dedicated tunnel per region pair
- Automatic failover to IPSec backup

#### IPSec Tunnels (Backup)

**Use Case**: Fallback when WireGuard unavailable

**Configuration**: IKEv2 with:
- Authentication: Pre-shared keys (PSK) + certificates
- Encryption: AES-256-GCM
- Integrity: SHA-256
- DH Group: 21 (Curve25519)

### Network Latency Matrix

| Source → Target | AWS east | AWS west | Azure east | Azure west | GCP central | GCP west |
|----------------|----------|----------|------------|------------|-------------|----------|
| **AWS east**   | -        | 65ms     | 10ms       | 70ms       | 30ms        | 80ms     |
| **AWS west**   | 65ms     | -        | 75ms       | 15ms       | 25ms        | 10ms     |
| **Azure east** | 10ms     | 75ms     | -          | 70ms       | 35ms        | 85ms     |
| **Azure west** | 70ms     | 15ms     | 70ms       | -          | 20ms        | 8ms      |
| **GCP central**| 30ms     | 25ms     | 35ms       | 20ms       | -           | 45ms     |
| **GCP west**   | 80ms     | 10ms     | 85ms       | 8ms        | 45ms        | -        |

**Target Latency**: <50ms for 90th percentile cross-cloud traffic

### Service Discovery

#### Consul (Multi-Datacenter)

**Deployment**: 3 Consul servers per cloud (9 total)

**Configuration**:
```hcl
datacenter = "aws-us-east-1"
node_name = "consul-server-1"
server = true
bootstrap_expect = 3
retry_join = ["consul-server-2", "consul-server-3"]

# WAN federation
retry_join_wan = [
  "consul.aws-us-east-1.example.com",
  "consul.azure-eastus.example.com",
  "consul.gcp-us-central1.example.com"
]

# Gossip encryption
encrypt = "<consul-gossip-key>"
encrypt_verify_incoming = true
encrypt_verify_outgoing = true
```

**Service Registration**:
```json
{
  "service": {
    "name": "aurigraph-validator",
    "id": "validator-aws-1",
    "port": 9003,
    "tags": ["validator", "aws", "us-east-1"],
    "meta": {
      "cloud": "aws",
      "region": "us-east-1",
      "zone": "us-east-1a",
      "consensus_role": "follower"
    },
    "checks": [
      {
        "http": "http://localhost:9003/q/health",
        "interval": "10s",
        "timeout": "2s"
      }
    ]
  }
}
```

### DNS Strategy

#### Global DNS (Route 53 Primary)

**Hosted Zone**: dlt.aurigraph.io

**Records**:
```dns
; Multi-cloud weighted routing
api.dlt.aurigraph.io.  60 IN A    <aws-lb-ip>      (weight: 40)
api.dlt.aurigraph.io.  60 IN A    <azure-lb-ip>    (weight: 30)
api.dlt.aurigraph.io.  60 IN A    <gcp-lb-ip>      (weight: 30)

; Health check endpoints
health-aws.dlt.aurigraph.io.    IN A    <aws-health>
health-azure.dlt.aurigraph.io.  IN A    <azure-health>
health-gcp.dlt.aurigraph.io.    IN A    <gcp-health>

; Regional endpoints (latency-based)
us.api.dlt.aurigraph.io.        IN CNAME  aws-lb.elb.amazonaws.com
eu.api.dlt.aurigraph.io.        IN CNAME  azure-lb.cloudapp.azure.com
asia.api.dlt.aurigraph.io.      IN CNAME  gcp-lb.cloud.google.com
```

**TTL Strategy**:
- Production records: 60 seconds (fast failover)
- Static content: 3600 seconds (1 hour)
- Health checks: 10 seconds

#### GeoDNS Routing

**Rules**:
1. **North America**: Route to AWS (us-east-1 or us-west-2)
2. **Europe**: Route to Azure (eastus closest to EU)
3. **Asia**: Route to GCP (asia-southeast1 planned)
4. **Latency Override**: Always route to lowest latency if <20ms difference

---

## Security & Compliance

### Security Architecture

#### Defense in Depth

```
Layer 1: Edge Protection (Cloudflare WAF)
  ├─ DDoS mitigation (up to 100 Gbps)
  ├─ Bot detection and blocking
  ├─ Rate limiting (global)
  └─ SSL/TLS termination

Layer 2: Cloud WAF (AWS WAF, Azure Front Door, GCP Armor)
  ├─ OWASP Top 10 protection
  ├─ IP reputation filtering
  ├─ Geo-blocking (high-risk countries)
  └─ Custom rule sets

Layer 3: Network Security
  ├─ VPC/VNet isolation
  ├─ Security groups (stateful firewall)
  ├─ Network ACLs (stateless firewall)
  └─ Private subnets for data layer

Layer 4: Application Security
  ├─ OAuth 2.0 + JWT authentication
  ├─ RBAC (Role-Based Access Control)
  ├─ API rate limiting (per-user)
  └─ Input validation and sanitization

Layer 5: Data Security
  ├─ Encryption at rest (AES-256)
  ├─ Encryption in transit (TLS 1.3)
  ├─ Quantum-resistant cryptography
  └─ Key rotation (90-day policy)

Layer 6: Monitoring & Response
  ├─ SIEM integration (Splunk/ELK)
  ├─ Intrusion detection (Suricata/Snort)
  ├─ Security auditing (CloudTrail, etc.)
  └─ Incident response playbooks
```

#### Identity and Access Management

**Multi-Cloud IAM Strategy**:

**AWS**:
- IAM roles for EC2 instances
- Service Control Policies (SCPs) for org-wide rules
- IAM Access Analyzer for unused permissions
- Temporary credentials via STS

**Azure**:
- Managed identities for VMs
- Azure AD for user authentication
- Azure RBAC for resource access
- Privileged Identity Management (PIM)

**GCP**:
- Service accounts for workload identity
- Organization policies for constraints
- VPC Service Controls for data perimeter
- Workload Identity Federation

**Unified IAM**:
- Okta/Keycloak for SSO across clouds
- SAML/OIDC federation
- MFA enforced for all admin access
- Just-in-time (JIT) privilege elevation

#### Encryption Strategy

**Data at Rest**:
- **AWS**: KMS with customer-managed keys (CMK)
- **Azure**: Key Vault with customer-managed keys
- **GCP**: Cloud KMS with customer-managed encryption keys (CMEK)

**Key Management**:
- Separate keys per environment (dev/staging/prod)
- Separate keys per data classification (PII, blockchain, logs)
- Automatic rotation every 90 days
- Hardware Security Modules (HSM) for root keys

**Data in Transit**:
- TLS 1.3 for all HTTPS traffic
- WireGuard/IPSec for VPN tunnels
- gRPC with mTLS for inter-service communication
- Certificate pinning for mobile apps

**Quantum-Resistant Cryptography**:
- CRYSTALS-Dilithium for digital signatures
- CRYSTALS-Kyber for key encapsulation
- Hybrid approach: Classical + Post-Quantum

#### Compliance

**Frameworks**:
- **SOC 2 Type II**: Security, availability, confidentiality
- **ISO 27001**: Information security management
- **GDPR**: EU data protection (if applicable)
- **CCPA**: California privacy law (if applicable)
- **PCI DSS**: Payment card data (if handling payments)

**Data Residency**:
- EU data stored in EU regions only
- US data can be stored in US regions
- Asia data in Asia-Pacific regions (future)
- User consent for cross-border transfers

**Audit Logging**:
- All API calls logged (CloudTrail, Azure Activity, Cloud Audit)
- Immutable audit logs (WORM storage)
- Log retention: 7 years for compliance
- Real-time log streaming to SIEM

### Disaster Recovery Compliance

**RTO (Recovery Time Objective)**: <30 minutes

**RPO (Recovery Point Objective)**: <5 minutes

**Business Continuity Plan**:
- Documented runbooks for all failure scenarios
- Quarterly DR drills with full cloud failover
- Annual tabletop exercises
- Post-incident reviews within 48 hours

---

## Monitoring & Observability

### Monitoring Stack

```
┌───────────────────────────────────────────────────────┐
│                  Grafana Dashboards                    │
│         (Unified view across all clouds)               │
└─────────────┬─────────────────────────────────────────┘
              │
    ┌─────────▼──────────┐
    │    Prometheus      │
    │  (Multi-cluster)   │
    │  - Federation      │
    │  - Remote Write    │
    └─────────┬──────────┘
              │
    ┌─────────┴──────────────────────────┐
    │                                     │
┌───▼────────────┐            ┌──────────▼─────────┐
│  Cloud-Native  │            │   Custom Metrics   │
│   Exporters    │            │    - Node Stats    │
│  - CloudWatch  │            │    - Blockchain    │
│  - Azure Mon   │            │    - Consensus     │
│  - GCP Mon     │            │    - Transaction   │
└────────────────┘            └────────────────────┘
```

### Key Metrics

#### Infrastructure Metrics

**Compute**:
- CPU utilization (target: 70-80%)
- Memory utilization (target: <85%)
- Disk IOPS (monitor saturation)
- Network throughput (ingress/egress)

**Network**:
- VPN tunnel status (up/down)
- Cross-cloud latency (<50ms target)
- Packet loss (<0.1%)
- Bandwidth utilization

**Storage**:
- Disk space utilization (<80%)
- Read/write latency
- IOPS consumption
- Replication lag (<5 seconds)

#### Application Metrics

**Blockchain**:
- Transactions per second (TPS)
- Block production rate
- Block finality time
- Fork events (should be 0)

**Consensus**:
- Leader election count
- Leader stability (uptime)
- Quorum status (healthy/degraded)
- Replication lag

**API**:
- Request rate (req/sec)
- Error rate (%)
- Latency (p50, p95, p99)
- 4xx/5xx status codes

#### Business Metrics

**Users**:
- Active users (DAU/MAU)
- New user registrations
- User session duration
- Geographic distribution

**Transactions**:
- Transaction volume (per hour)
- Transaction value (USD equivalent)
- Failed transactions (%)
- Smart contract executions

**Revenue** (if applicable):
- Transaction fees collected
- Token trading volume
- RWA tokenization volume

### Alerting Strategy

#### Alert Severity Levels

**P0 - Critical** (Page on-call immediately):
- Service outage (>50% of nodes down)
- Consensus failure (no leader elected)
- Data loss detected
- Security breach

**P1 - High** (Page on-call, 5-minute SLA):
- Regional degradation (>30% nodes down)
- Database replication lag >30 seconds
- Error rate >5%
- Latency >1 second (p95)

**P2 - Medium** (Notify on-call, 30-minute SLA):
- Single node failure
- Auto-scaling triggered
- Elevated error rate (1-5%)
- Disk space >80%

**P3 - Low** (Ticket, next business day):
- Warning thresholds crossed
- Non-critical service degradation
- Capacity planning alerts

#### Alert Channels

**Primary**: PagerDuty with escalation policy
**Secondary**: Slack (#alerts-production)
**Email**: ops-team@aurigraph.io
**SMS**: For P0/P1 alerts

#### Alert Routing

```yaml
routes:
  - match:
      severity: critical
    receiver: pagerduty-critical
    group_wait: 10s
    group_interval: 5m
    repeat_interval: 3h

  - match:
      severity: warning
    receiver: slack-warnings
    group_wait: 5m
    group_interval: 10m
    repeat_interval: 12h

  - match:
      alertname: InstanceDown
      cloud: aws
    receiver: aws-oncall

  - match:
      alertname: InstanceDown
      cloud: azure
    receiver: azure-oncall
```

### Logging Strategy

#### Log Aggregation

**Stack**: ELK (Elasticsearch, Logstash, Kibana) or Loki

**Architecture**:
```
Nodes (all clouds)
  └─> Filebeat/Promtail (agent)
      └─> Kafka (buffering)
          └─> Logstash/Loki (processing)
              └─> Elasticsearch/Loki (storage)
                  └─> Kibana/Grafana (visualization)
```

**Log Types**:
- **Application Logs**: JSON-formatted, structured
- **Access Logs**: NGINX, API Gateway
- **Audit Logs**: Security events, IAM changes
- **System Logs**: Syslog, kernel logs

**Retention**:
- Hot logs (0-7 days): Full text search, SSD storage
- Warm logs (7-30 days): Indexed, HDD storage
- Cold logs (30-365 days): Compressed, object storage
- Archive (1-7 years): Compressed, cold storage

#### Distributed Tracing

**Stack**: Jaeger or Tempo

**Instrumentation**:
- OpenTelemetry SDK in all services
- Trace ID propagated across services
- Parent-child span relationships
- Trace sampling (1% for normal, 100% for errors)

**Use Cases**:
- End-to-end transaction flow
- Performance bottleneck identification
- Cross-cloud call chain visualization
- Root cause analysis for errors

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-4)

**Goals**:
- Infrastructure-as-code setup
- Network connectivity established
- Base VM/container images

**Tasks**:
1. **Week 1-2: AWS Setup**
   - Create Terraform modules for AWS
   - Deploy VPCs in us-east-1 and us-west-2
   - Launch 1 validator node per region (testing)
   - Configure security groups and NACLs

2. **Week 3: Azure Setup**
   - Create Terraform modules for Azure
   - Deploy VNets in eastus and westus
   - Launch 1 validator node per region
   - Configure NSGs and firewall rules

3. **Week 4: GCP Setup**
   - Create Terraform modules for GCP
   - Deploy VPC in us-central1 and us-west1
   - Launch 1 validator node per region
   - Test cross-cloud connectivity

**Deliverables**:
- 6 validator nodes operational (1 per region)
- Cross-cloud VPN mesh established
- Monitoring stack deployed
- Documentation complete

**Success Criteria**:
- All nodes can communicate with <50ms latency
- Terraform apply succeeds without errors
- Basic health checks passing

### Phase 2: Deployment (Weeks 5-8)

**Goals**:
- Full node deployment
- Database replication configured
- Load balancers operational

**Tasks**:
1. **Week 5: Scale Out AWS**
   - Deploy remaining 18 nodes (AWS)
   - Configure ALB/NLB
   - Set up RDS PostgreSQL
   - Deploy ElastiCache Redis

2. **Week 6: Scale Out Azure**
   - Deploy remaining 18 nodes (Azure)
   - Configure Application Gateway
   - Set up Azure Database for PostgreSQL
   - Deploy Azure Cache for Redis

3. **Week 7: Scale Out GCP**
   - Deploy remaining 18 nodes (GCP)
   - Configure Cloud Load Balancing
   - Set up Cloud SQL for PostgreSQL
   - Deploy Memorystore for Redis

4. **Week 8: Integration Testing**
   - Full mesh connectivity tests
   - Load balancer health checks
   - Database replication validation
   - End-to-end transaction tests

**Deliverables**:
- 66 nodes deployed and operational
- Load balancers routing traffic
- Database replication running
- Automated deployment pipelines

**Success Criteria**:
- All health checks passing
- TPS baseline achieved (776K+)
- Database replication lag <5 seconds

### Phase 3: Consensus & Data (Weeks 9-12)

**Goals**:
- HyperRAFT++ consensus operational
- Data replication validated
- Failover tested

**Tasks**:
1. **Week 9: Consensus Setup**
   - Configure 12-validator HyperRAFT++ cluster
   - Elect initial leader
   - Validate log replication
   - Test leader election

2. **Week 10: Data Replication**
   - Deploy CockroachDB cluster
   - Configure geo-partitioning
   - Set up cross-region replication
   - Validate data consistency

3. **Week 11: Backup & DR**
   - Configure automated backups
   - Set up cross-region snapshots
   - Test restore procedures
   - Document runbooks

4. **Week 12: Failover Testing**
   - Test node failure scenarios
   - Test AZ failure scenarios
   - Test region failure scenarios
   - Test cloud failure scenarios

**Deliverables**:
- Consensus cluster operational
- Data replicated across all clouds
- Backup/restore procedures validated
- DR runbooks complete

**Success Criteria**:
- Consensus achieves <100ms finality
- Failover completes in <5 minutes
- Data loss = 0 during failover
- All DR tests pass

### Phase 4: Production Cutover (Weeks 13-16)

**Goals**:
- Production traffic migration
- Performance validation
- Cost optimization

**Tasks**:
1. **Week 13: Production Preparation**
   - Security audit and penetration testing
   - Performance benchmarking (load tests)
   - Chaos engineering tests
   - Final documentation review

2. **Week 14: Gradual Rollout**
   - 10% traffic to multi-cloud (monitor)
   - 25% traffic (if stable)
   - 50% traffic (if stable)
   - 100% traffic (final cutover)

3. **Week 15: Validation**
   - 24-hour monitoring intensive period
   - Performance metrics validation
   - User feedback collection
   - Issue triage and resolution

4. **Week 16: Optimization**
   - Right-size instances based on actual load
   - Enable auto-scaling policies
   - Optimize database queries
   - Fine-tune cache hit rates

**Deliverables**:
- 100% production traffic on multi-cloud
- Performance targets met (2M+ TPS)
- Cost optimization implemented
- Operational handoff complete

**Success Criteria**:
- 99.99% uptime achieved
- Latency <100ms (p95)
- Error rate <0.01%
- User satisfaction >95%

### Phase 5: Optimization & Expansion (Weeks 17+)

**Goals**:
- Cost optimization ongoing
- Geographic expansion
- Advanced features

**Tasks**:
- Deploy Asia-Pacific regions (future)
- Implement advanced caching strategies
- Enable spot instances where appropriate
- Reserved instance purchasing
- Quarterly DR drills
- Continuous security improvements

**Success Metrics**:
- Cost reduced by 30% from baseline
- Geographic coverage expanded
- New features deployed with zero downtime

---

## Conclusion

This multi-cloud deployment strategy for Aurigraph V11 provides:

1. **High Availability**: 99.99% uptime with multi-region, multi-cloud redundancy
2. **Performance**: 2M+ TPS capability with <100ms finality
3. **Disaster Recovery**: Comprehensive failover/failback procedures
4. **Cost Efficiency**: $243K/year optimized cost (32% savings)
5. **Scalability**: Auto-scaling to handle 3x peak load
6. **Security**: Defense-in-depth with compliance (SOC 2, ISO 27001)
7. **Operational Excellence**: Full observability and automated runbooks

The architecture leverages best-of-breed services from AWS, Azure, and GCP while maintaining cloud agnosticism through infrastructure-as-code. This ensures Aurigraph V11 can deliver enterprise-grade blockchain services globally with exceptional reliability and performance.

---

**Document Control**

| Version | Date       | Author   | Changes                    |
|---------|-----------|----------|----------------------------|
| 1.0.0   | 2025-11-12| Agent 4  | Initial multi-cloud strategy|

**Next Steps**:
1. Review and approval by architecture team
2. Cost approval from finance team
3. Security review and sign-off
4. Begin Phase 1 implementation

**Related Documents**:
- `CLOUD_MIGRATION_RUNBOOK.md`
- Terraform modules in `/infrastructure/terraform/`
- `ARCHITECTURE.md` (main project architecture)
