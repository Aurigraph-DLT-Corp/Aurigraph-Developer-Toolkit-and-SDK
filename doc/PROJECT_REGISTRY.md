# Aurigraph Project Registry

> **Version**: 1.0.0 | **Last Updated**: November 28, 2025
> **Purpose**: Central registry of all Aurigraph projects, modules, and their configurations

---

## Active Projects

### 1. Aurigraph V12 (Core Platform)

| Attribute | Value |
|-----------|-------|
| **Project Code** | AV12 |
| **JIRA Project** | AV11 |
| **Repository Path** | `/aurigraph-av10-7/aurigraph-v11-standalone` |
| **Branch** | `V12` |
| **Status** | Active Development |
| **Lead** | @subbu |
| **Team** | Core Team |

#### Technology Stack
- **Language**: Java 21
- **Framework**: Quarkus 3.29.0
- **Build**: Maven 3.9+
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Protocols**: REST, gRPC, WebSocket

#### Ports
| Service | Port | Protocol |
|---------|------|----------|
| HTTP API | 9003 | HTTP/2 |
| gRPC | 9004 | gRPC |
| Debug | 5005 | JDWP |

#### Key Commands
```bash
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw quarkus:dev          # Development
./mvnw clean package        # Build
./mvnw test                 # Test
```

---

### 2. Enterprise Portal

| Attribute | Value |
|-----------|-------|
| **Project Code** | EP |
| **JIRA Project** | *To be created* |
| **Repository Path** | `/enterprise-portal/enterprise-portal/frontend` |
| **Branch** | `V12` |
| **Status** | Active Development |
| **Lead** | @frontend-lead |
| **Team** | Frontend Team |

#### Technology Stack
- **Language**: TypeScript
- **Framework**: React 18
- **UI Library**: Material-UI
- **Charts**: Recharts
- **Build**: Vite/npm

#### Ports
| Service | Port | Protocol |
|---------|------|----------|
| Dev Server | 3000 | HTTP |
| Production | 443 | HTTPS (via NGINX) |

#### Key Commands
```bash
cd enterprise-portal/enterprise-portal/frontend
npm install                 # Install dependencies
npm run dev                 # Development
npm run build               # Production build
```

---

### 3. Cross-Chain Bridge

| Attribute | Value |
|-----------|-------|
| **Project Code** | CCB |
| **JIRA Project** | *To be created* |
| **Repository Path** | `/aurigraph-av10-7/aurigraph-v11/crosschain-bridge` |
| **Branch** | `V12` |
| **Status** | In Development |
| **Lead** | @bridge-lead |
| **Team** | Core Team |

#### Supported Chains
- Ethereum (EVM)
- Polygon (EVM)
- Solana
- Avalanche
- BSC
- LayerZero (aggregator)

#### Configuration
```properties
# Bridge chain configs in database
# See: V8__create_bridge_chain_config_table.sql
```

---

### 4. Monitoring Stack

| Attribute | Value |
|-----------|-------|
| **Project Code** | MON |
| **Repository Path** | `/deployment` |
| **Branch** | `V12` |
| **Status** | Active |
| **Lead** | @devops-lead |
| **Team** | DevOps Team |

#### Components
| Component | Port | Purpose |
|-----------|------|---------|
| Prometheus | 9090 | Metrics collection |
| Grafana | 3001 | Dashboards |
| AlertManager | 9093 | Alert routing |
| Loki | 3100 | Log aggregation |

#### Key Commands
```bash
cd deployment
docker-compose -f docker-compose.monitoring.yml up -d
```

---

## Project Modules (V12)

### Backend Modules

| Module | Package | Description | Agent |
|--------|---------|-------------|-------|
| **API** | `io.aurigraph.v11.api` | REST endpoints | agent-1.1 |
| **gRPC** | `io.aurigraph.v11.grpc` | gRPC services | agent-1.1 |
| **Consensus** | `io.aurigraph.v11.consensus` | HyperRAFT++ | agent-1.2 |
| **Contracts** | `io.aurigraph.v11.contracts` | Smart contracts | agent-1.3 |
| **Crypto** | `io.aurigraph.v11.crypto` | Quantum crypto | agent-1.4 |
| **Storage** | `io.aurigraph.v11.storage` | LevelDB state | agent-1.5 |
| **Traceability** | `io.aurigraph.v11.traceability` | Supply chain | agent-2.1 |
| **RWA** | `io.aurigraph.v11.rwa` | Real-world assets | agent-2.5 |
| **Bridge** | `io.aurigraph.v11.bridge` | Cross-chain | Core Team |
| **Analytics** | `io.aurigraph.v11.analytics` | Metrics/dashboards | Core Team |
| **WebSocket** | `io.aurigraph.v11.websocket` | Real-time | agent-ws |
| **Channels** | `io.aurigraph.v11.channels` | Message channels | agent-ws |

### gRPC Services

| Service | Proto File | Implementation | Status |
|---------|-----------|----------------|--------|
| BlockchainService | `blockchain.proto` | `BlockchainServiceImpl.java` | Complete |
| ConsensusService | `consensus.proto` | `ConsensusServiceImpl.java` | Complete |
| TransactionService | `transaction.proto` | `TransactionServiceImpl.java` | Complete |
| CryptoService | `crypto.proto` | `CryptoServiceImpl.java` | Complete |
| NetworkService | `network.proto` | `NetworkServiceImpl.java` | Complete |
| StorageService | `storage.proto` | `StorageServiceImpl.java` | Complete |
| ContractService | `contract.proto` | `ContractServiceImpl.java` | Complete |
| TraceabilityService | `traceability.proto` | `TraceabilityServiceImpl.java` | Complete |
| AnalyticsStreamService | `analytics_stream.proto` | Disabled | Needs fix |

---

## Environment Configuration

### Development

| Setting | Value |
|---------|-------|
| **Profile** | `dev` |
| **Database** | H2 in-memory |
| **Config File** | `application.properties` |
| **Hot Reload** | Enabled |

### Staging

| Setting | Value |
|---------|-------|
| **Profile** | `staging` |
| **Database** | PostgreSQL (staging) |
| **Config File** | `application-staging.properties` |
| **URL** | *staging.aurigraph.io* |

### Production

| Setting | Value |
|---------|-------|
| **Profile** | `production` |
| **Database** | PostgreSQL (prod) |
| **Config File** | `application-production.properties` |
| **URL** | https://dlt.aurigraph.io |
| **SSH** | `ssh subbu@dlt.aurigraph.io` |

---

## Docker Compose Files

| File | Purpose | Environment |
|------|---------|-------------|
| `docker-compose.yml` | Basic setup | Development |
| `docker-compose.ci.yml` | CI environment | CI/CD |
| `docker-compose.staging.yml` | Staging | Staging |
| `docker-compose.prod.yml` | Production | Production |
| `docker-compose.monitoring.yml` | Prometheus/Grafana | All |
| `docker-compose.database.yml` | PostgreSQL + backup | All |
| `docker-compose.cache.yml` | Redis | All |
| `docker-compose.testing.yml` | Full test env | Testing |
| `docker-compose.loadtest.yml` | Load testing | Performance |

---

## API Endpoints Summary

### V12 REST API (`/api/v11/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/info` | GET | System info |
| `/stats` | GET | Statistics |
| `/analytics/dashboard` | GET | Dashboard data |
| `/blockchain/transactions` | GET | Transaction list |
| `/blockchain/blocks` | GET | Block list |
| `/nodes` | GET | Node list |
| `/consensus/status` | GET | Consensus state |
| `/contracts/deploy` | POST | Deploy contract |
| `/rwa/tokenize` | POST | Tokenize asset |

### gRPC Services (Port 9004)

| Service | Methods |
|---------|---------|
| BlockchainService | createBlock, validateBlock, getBlockDetails, executeTransaction, verifyTransaction, getBlockchainStatistics, streamBlocks |
| ConsensusService | proposeBlock, voteOnBlock, commitBlock, getConsensusState, requestLeaderElection, heartbeat, syncState, getValidatorInfo, submitConsensusMetrics, getRaftLog, streamConsensusEvents |
| TransactionService | submitTransaction, batchSubmitTransactions, getTransactionStatus, getTransactionReceipt, cancelTransaction, resendTransaction, estimateGasCost, validateTransactionSignature, getPendingTransactions, getTransactionHistory, getTxPoolSize, streamTransactionEvents |

---

## Database Schema

### Flyway Migrations

| Version | Description | File |
|---------|-------------|------|
| V1 | Create Demos Table | `V1__Create_Demos_Table.sql` |
| V2 | Create Bridge Transactions | `V2__Create_Bridge_Transactions_Table.sql` |
| V4 | Seed Test Users | `V4__Seed_Test_Users.sql` |
| V5 | Fix User Defaults | `V5__Fix_User_Default_Values.sql` |
| V6 | Ensure Test Users | `V6__Ensure_Test_Users_Exist.sql` |
| V7 | Auth Tokens Table | `V7__Create_Auth_Tokens_Table.sql` |
| V8 | Bridge Chain Config | `V8__create_bridge_chain_config_table.sql` |
| V9 | Missing Schema | `V9__Add_Missing_Schema_Components.sql` |
| V10 | User UUID | `V10__Ensure_User_UUID.sql` |
| V11 | Oracle Verification | `V11__Create_Oracle_Verification_Tables.sql` |
| V12 | WebSocket Subscriptions | `V12__Create_WebSocket_Subscriptions_Table.sql` |

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| TPS (baseline) | 776K | 776K |
| TPS (with ML) | 2M+ | 3M (benchmark) |
| Startup (JVM) | <3s | ~3s |
| Startup (Native) | <1s | <1s |
| Memory (JVM) | <512MB | ~355MB |
| Memory (Native) | <256MB | ~256MB |
| Finality | <500ms | <500ms |

---

## Creating a New Project

### Checklist

1. [ ] Add entry to this registry
2. [ ] Create JIRA project (if separate)
3. [ ] Setup repository/folder structure
4. [ ] Configure CI/CD workflows
5. [ ] Add to `CODEOWNERS`
6. [ ] Assign team/agents
7. [ ] Document in `DEVELOPER_HANDBOOK.md`
8. [ ] Create environment configs
9. [ ] Setup monitoring/alerts

### Template

```markdown
### [Project Name]

| Attribute | Value |
|-----------|-------|
| **Project Code** | XX |
| **JIRA Project** | XX |
| **Repository Path** | `/path/to/project` |
| **Branch** | `branch-name` |
| **Status** | Status |
| **Lead** | @github-handle |
| **Team** | Team Name |

#### Technology Stack
- List technologies

#### Ports
| Service | Port | Protocol |
|---------|------|----------|
| Service | Port | Protocol |

#### Key Commands
```bash
# Commands here
```
```

---

*Last Updated: November 28, 2025*
