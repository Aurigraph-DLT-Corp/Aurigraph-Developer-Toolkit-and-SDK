# gRPC / Protocol Buffers / HTTP/2 Internal Communication Configuration
**Aurigraph DLT V11.1.0**
**Date**: November 17, 2025
**Status**: Configuration Design (Ready for Implementation)

---

## EXECUTIVE SUMMARY

This document defines the internal communication architecture for Aurigraph DLT services using gRPC, Protocol Buffers, and HTTP/2 for optimized inter-service communication. The current docker-compose deployment uses HTTP/REST, but this configuration prepares for native gRPC communication for better performance and reduced latency.

**Current State**: REST/HTTP - External facing
**Target State**: gRPC/HTTP/2 - Internal service-to-service communication
**External API**: REST/HTTP/2 - Client facing (NGINX proxy)

---

## ARCHITECTURE OVERVIEW

### Communication Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                     External Clients (REST/HTTP/2)              │
│                         via NGINX Gateway                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│          NGINX Reverse Proxy (Port 443 - TLS 1.3)               │
│      - HTTP/2 ALPN termination                                  │
│      - TLS certificate management                               │
│      - Rate limiting & security headers                         │
│      - Request routing to backend services                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────┐        ┌─────────┐       ┌─────────┐
   │ Portal  │        │ API V11 │       │ Grafana │
   │ HTTP/2  │        │HTTP/2   │       │HTTP/2   │
   │ 3000    │        │ 9003    │       │ 3000    │
   └─────────┘        └────┬────┘       └─────────┘
                           │
                ┌──────────┼──────────┐
                │                     │
                ▼                     ▼
           ┌────────────────────────────────┐
           │  INTERNAL gRPC/HTTP2 NETWORK   │
           │  (Docker Backend Network)      │
           │  - Protocol: gRPC over HTTP/2  │
           │  - Port: 9004 (gRPC)           │
           │  - TLS: mTLS with certificates │
           └────────────────────────────────┘
                │          │        │
    ┌───────────┼──────────┼────────┼───────────┐
    │           │          │        │           │
    ▼           ▼          ▼        ▼           ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Validator│ │Consensus│ │RWA    │ │AI Opt  │ │Bridge  │
│Nodes   │ │Engine  │ │Registry│ │Service │ │Service │
│gRPC9004│ │gRPC    │ │gRPC    │ │gRPC    │ │gRPC    │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘
    │           │          │        │           │
    └───────────┼──────────┼────────┼───────────┘
                │
                ▼
           ┌────────────┐
           │  Database  │
           │ PostgreSQL │
           │   5432     │
           └────────────┘
```

---

## PROTOCOL SPECIFICATIONS

### gRPC Service Definitions

#### Service Port Assignment

| Service | HTTP/REST Port | gRPC Port | Protocol | Purpose |
|---------|---|---|---|---|
| API Gateway | 9003 | 9004 | HTTP/2 + TLS | External REST API |
| V11 Service | 9003 | 9004 | gRPC + mTLS | Service core |
| Validator Node | 9100-9102 | 9104-9106 | gRPC + mTLS | Consensus |
| Consensus Engine | Internal | Internal | gRPC + mTLS | RAFT coordination |
| RWA Registry | Internal | Internal | gRPC + mTLS | Asset tokenization |
| AI Optimization | Internal | Internal | gRPC + mTLS | ML services |
| Bridge Service | Internal | Internal | gRPC + mTLS | Cross-chain |

### Protocol Buffer Definitions

#### Core Service Interface (service.proto)

```protobuf
syntax = "proto3";

package aurigraph.v11;

service AurigraphService {
  // Transaction submission
  rpc SubmitTransaction (SubmitTransactionRequest) returns (SubmitTransactionResponse);

  // Transaction queries
  rpc GetTransaction (GetTransactionRequest) returns (Transaction);
  rpc GetTransactions (GetTransactionsRequest) returns (stream Transaction);

  // State queries
  rpc GetState (GetStateRequest) returns (StateResponse);

  // Health checks
  rpc Health (HealthRequest) returns (HealthResponse);
  rpc Ready (ReadyRequest) returns (ReadyResponse);
}

message Transaction {
  string id = 1;
  string from = 2;
  string to = 3;
  double amount = 4;
  string status = 5;
  int64 timestamp = 6;
}

message SubmitTransactionRequest {
  string from = 1;
  string to = 2;
  double amount = 3;
  string signature = 4;
}

message SubmitTransactionResponse {
  string transaction_id = 1;
  string status = 2;
  string message = 3;
}
```

#### Consensus Service Interface (consensus.proto)

```protobuf
syntax = "proto3";

package aurigraph.consensus;

service ConsensusService {
  // Leader election
  rpc RequestVote (VoteRequest) returns (VoteResponse);

  // Log replication
  rpc AppendEntries (AppendEntriesRequest) returns (AppendEntriesResponse);

  // Heartbeat
  rpc Heartbeat (HeartbeatRequest) returns (HeartbeatResponse);

  // Status queries
  rpc GetConsensusStatus (StatusRequest) returns (ConsensusStatus);
}

message VoteRequest {
  int32 term = 1;
  string candidate_id = 2;
  int32 last_log_index = 3;
  int32 last_log_term = 4;
}

message VoteResponse {
  int32 term = 1;
  bool vote_granted = 2;
}

message HeartbeatRequest {
  int32 term = 1;
  string leader_id = 2;
  int64 timestamp = 3;
}

message HeartbeatResponse {
  int32 term = 1;
  bool success = 2;
}

message ConsensusStatus {
  int32 current_term = 1;
  string voted_for = 2;
  string role = 3;  // leader, follower, candidate
  string leader_id = 4;
  int32 commit_index = 5;
  int32 last_applied = 6;
}
```

---

## DOCKER COMPOSE CONFIGURATION

### Updated Service Definitions

#### Aurigraph V11 Service (HTTP/2 + gRPC)

```yaml
aurigraph-v11-service:
  image: aurigraph/v11:latest
  ports:
    - "9003:9003"   # HTTP/2 REST API (external)
    - "9004:9004"   # gRPC (internal)
  environment:
    # HTTP/2 Configuration
    QUARKUS_HTTP_PORT=9003
    QUARKUS_HTTP_HTTP2=true
    QUARKUS_HTTP_MIN_TLS_PROTOCOL_VERSION=TLSv1.2

    # gRPC Configuration
    QUARKUS_GRPC_SERVER_ENABLED=true
    QUARKUS_GRPC_SERVER_PORT=9004
    QUARKUS_GRPC_SERVER_USE_SEPARATE_THREADS=true
    QUARKUS_GRPC_SERVER_MAX_CONCURRENT_STREAMS=1000

    # mTLS Configuration for internal gRPC
    QUARKUS_GRPC_SERVER_SECURITY_SSL_ENABLED=true
    QUARKUS_GRPC_SERVER_SECURITY_SSL_CERTIFICATE=/etc/ssl/grpc/cert.pem
    QUARKUS_GRPC_SERVER_SECURITY_SSL_KEY=/etc/ssl/grpc/key.pem
    QUARKUS_GRPC_SERVER_SECURITY_SSL_KEY_STORE_TYPE=PKCS12

    # Service Discovery
    QUARKUS_STORK_CONSENSUS_SERVICE_SERVICE_DISCOVERY_TYPE=static
    QUARKUS_STORK_CONSENSUS_SERVICE_ADDRESS_LIST=validator-node-1:9104,validator-node-2:9105,validator-node-3:9106

    # gRPC Client Configuration
    QUARKUS_GRPC_CLIENTS_CONSENSUS_HOST=validator-node-1
    QUARKUS_GRPC_CLIENTS_CONSENSUS_PORT=9104
    QUARKUS_GRPC_CLIENTS_CONSENSUS_USE_PLAINTEXT=false
    QUARKUS_GRPC_CLIENTS_CONSENSUS_SSL_TRUST_STORE=/etc/ssl/grpc/truststore.p12
    QUARKUS_GRPC_CLIENTS_CONSENSUS_SSL_TRUST_STORE_PASSWORD=changeit
    QUARKUS_GRPC_CLIENTS_CONSENSUS_SSL_TRUST_STORE_TYPE=PKCS12

  volumes:
    - ./config/grpc/certs:/etc/ssl/grpc:ro
    - ./config/proto:/proto:ro
  networks:
    - dlt-backend
    - dlt-monitoring
```

#### Validator Node 1 (gRPC + HyperRAFT++)

```yaml
validator-node-1:
  image: aurigraph/v11:latest
  ports:
    - "9100:9100"   # REST API (optional)
    - "9104:9104"   # gRPC (required)
  environment:
    # Node Configuration
    AURIGRAPH_NODE_ID=validator-1
    AURIGRAPH_NODE_TYPE=validator

    # gRPC Server
    QUARKUS_GRPC_SERVER_ENABLED=true
    QUARKUS_GRPC_SERVER_PORT=9104
    QUARKUS_GRPC_SERVER_USE_SEPARATE_THREADS=true
    QUARKUS_GRPC_SERVER_SECURITY_SSL_ENABLED=true
    QUARKUS_GRPC_SERVER_SECURITY_SSL_CERTIFICATE=/etc/ssl/grpc/validator-1-cert.pem
    QUARKUS_GRPC_SERVER_SECURITY_SSL_KEY=/etc/ssl/grpc/validator-1-key.pem

    # Consensus Configuration
    CONSENSUS_HEARTBEAT_INTERVAL=50
    CONSENSUS_ELECTION_TIMEOUT_MIN=150
    CONSENSUS_ELECTION_TIMEOUT_MAX=300
    CONSENSUS_LEADER_ELECTION=true
    CONSENSUS_LOG_REPLICATION=parallel

    # Peer Discovery for 3-node cluster
    QUARKUS_GRPC_CLIENTS_PEERS_ADDRESS_LIST=validator-node-2:9105,validator-node-3:9106

  volumes:
    - ./config/grpc/certs:/etc/ssl/grpc:ro
  networks:
    - dlt-backend
```

---

## CERTIFICATE MANAGEMENT (mTLS)

### Certificate Generation

```bash
# Create CA certificate
openssl genrsa -out ca-key.pem 2048
openssl req -new -x509 -days 3650 -key ca-key.pem -out ca-cert.pem

# Create server certificate for V11
openssl genrsa -out v11-key.pem 2048
openssl req -new -key v11-key.pem -out v11.csr
openssl x509 -req -days 365 -in v11.csr -CA ca-cert.pem -CAkey ca-key.pem \
  -CAcreateserial -out v11-cert.pem -extfile <(printf "subjectAltName=DNS:aurigraph-v11-service,DNS:localhost,IP:172.21.1.10")

# Create certificates for each validator node
for i in 1 2 3; do
  openssl genrsa -out validator-$i-key.pem 2048
  openssl req -new -key validator-$i-key.pem -out validator-$i.csr
  openssl x509 -req -days 365 -in validator-$i.csr -CA ca-cert.pem -CAkey ca-key.pem \
    -CAcreateserial -out validator-$i-cert.pem \
    -extfile <(printf "subjectAltName=DNS:dlt-validator-node-$i,DNS:localhost")
done

# Store in config/grpc/certs/
mkdir -p config/grpc/certs
cp ca-cert.pem config/grpc/certs/
cp v11-{cert,key}.pem config/grpc/certs/
cp validator-*-{cert,key}.pem config/grpc/certs/
```

---

## NGINX CONFIGURATION FOR HTTP/2

### NGINX HTTP/2 with gRPC Backend Support

```nginx
# Add upstream for gRPC services
upstream grpc_v11_backend {
    server aurigraph-v11-service:9003;
    keepalive 32;
}

# HTTP/2 server with gRPC support
server {
    listen 443 ssl http2;
    http2_max_field_size 16k;
    http2_max_header_size 32k;

    # HTTP/2 Server Push
    http2_push_preload on;

    # gRPC endpoint
    location /aurigraph.v11.AurigraphService/ {
        grpc_pass grpc://grpc_v11_backend;
        grpc_set_header X-Real-IP $remote_addr;
        grpc_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # gRPC timeouts
        grpc_connect_timeout 30s;
        grpc_send_timeout 60s;
        grpc_read_timeout 60s;

        # Error handling
        grpc_next_upstream error invalid_header timeout;
    }
}
```

---

## NETWORK TOPOLOGY

### Docker Network Configuration

```yaml
networks:
  dlt-frontend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
    # For external HTTPS traffic

  dlt-backend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.21.0.0/16
    # For internal gRPC/HTTP2 service-to-service communication
    # - Service discovery enabled
    # - DNS resolution via Docker daemon
    # - mTLS certificates for secure communication

  dlt-monitoring:
    driver: bridge
    ipam:
      config:
        - subnet: 172.22.0.0/16
    # For Prometheus/Grafana monitoring services
```

### Service DNS Resolution

Services within the same Docker network can resolve each other via DNS:

```
aurigraph-v11-service:9004          → 172.21.1.10:9004 (gRPC)
validator-node-1:9104               → 172.21.1.20:9104 (gRPC)
validator-node-2:9105               → 172.21.1.21:9105 (gRPC)
validator-node-3:9106               → 172.21.1.22:9106 (gRPC)
postgres:5432                        → 172.21.1.5:5432  (SQL)
redis:6379                           → 172.21.1.6:6379  (Cache)
```

---

## PERFORMANCE CHARACTERISTICS

### gRPC vs REST Comparison

| Metric | REST/HTTP | gRPC/HTTP2 | Improvement |
|--------|---|---|---|
| Message Serialization | JSON (Text) | Protobuf (Binary) | ~7x smaller |
| Latency (P50) | 50-100ms | 5-15ms | ~10x faster |
| Latency (P99) | 500-1000ms | 50-150ms | ~10x faster |
| Throughput | 1,000-5,000 req/s | 10,000-50,000 req/s | ~10x higher |
| Connection Overhead | High | Low (HTTP/2 multiplexing) | ~100x reuse |
| Memory per connection | 1-5MB | 100-500KB | ~5-10x lower |

### Expected Improvements

**Current Architecture**:
- REST API: 776K TPS baseline
- Service communication: HTTP/1.1 (one connection per request)

**After gRPC Migration**:
- Internal service communication: gRPC (multiplexed HTTP/2)
- Expected improvement: 20-30% throughput increase
- Latency reduction: 10-15% faster finality
- Reduced memory footprint: ~200MB → ~150MB per validator

---

## IMPLEMENTATION TIMELINE

### Phase 1: Infrastructure Setup (Week 1)
- [ ] Generate mTLS certificates
- [ ] Update docker-compose with gRPC services
- [ ] Configure NGINX for HTTP/2 + gRPC
- [ ] Deploy test environment

### Phase 2: Protocol Buffer Implementation (Week 2-3)
- [ ] Define all service interfaces (consensus, rwa, ai, bridge)
- [ ] Generate Java code from proto files
- [ ] Implement gRPC service stubs
- [ ] Add service discovery

### Phase 3: Service Migration (Week 4-5)
- [ ] Implement gRPC clients in V11 core
- [ ] Add fallback to REST for compatibility
- [ ] Deploy to staging environment
- [ ] Load test gRPC communication

### Phase 4: Production Rollout (Week 6)
- [ ] Gradual traffic migration from REST to gRPC
- [ ] Monitor performance metrics
- [ ] Deprecate REST internal APIs
- [ ] Document gRPC API specifications

---

## MONITORING & OBSERVABILITY

### Prometheus Metrics for gRPC

```yaml
# gRPC service latency
grpc_server_method_handling_seconds{
  grpc_method="SubmitTransaction",
  grpc_service="aurigraph.v11.AurigraphService",
  grpc_code="OK"
}

# gRPC connection metrics
grpc_server_conn_handling_seconds{
  grpc_service="aurigraph.v11.AurigraphService"
}

# gRPC stream metrics
grpc_server_handling_seconds{
  grpc_type="unary|stream",
  grpc_method="...",
  grpc_code="OK"
}
```

### Grafana Dashboard Panels

1. **gRPC Request Rate** (requests/sec by method)
2. **gRPC Latency Distribution** (P50, P95, P99)
3. **gRPC Error Rate** (errors/sec by error code)
4. **Connection Count** (active gRPC connections)
5. **Message Size Distribution** (bytes by method)

---

## DEPLOYMENT CHECKLIST

- [ ] All certificates generated and mounted
- [ ] gRPC ports exposed (9004, 9104-9106)
- [ ] mTLS enabled on all gRPC services
- [ ] Service discovery configured
- [ ] NGINX HTTP/2 support verified
- [ ] Fallback to REST/HTTP for compatibility
- [ ] Load test with gRPC traffic
- [ ] Monitoring dashboards created
- [ ] Documentation updated
- [ ] Team trained on gRPC debugging

---

## REFERENCE DOCUMENTATION

- **gRPC Documentation**: https://grpc.io/docs/
- **Protocol Buffers**: https://developers.google.com/protocol-buffers
- **Quarkus gRPC**: https://quarkus.io/guides/grpc-getting-started
- **HTTP/2 Spec**: https://tools.ietf.org/html/rfc7540
- **mTLS Guide**: https://grpc.io/docs/guides/auth/

---

**Status**: Ready for Implementation in Phase 5 (Post November 17 Session)
**Owner**: Aurigraph DLT Engineering Team
**Last Updated**: November 17, 2025

