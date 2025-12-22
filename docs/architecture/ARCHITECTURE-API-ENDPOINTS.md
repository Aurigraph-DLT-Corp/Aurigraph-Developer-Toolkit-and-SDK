## API Architecture

### V11 REST API Endpoints

**Base URL**: `https://dlt.aurigraph.io/api/v11`

**Core Endpoints**:
```
GET  /health                        # Health check
GET  /info                          # System information
GET  /performance                   # Performance test
GET  /stats                         # Transaction statistics

# Analytics
GET  /analytics/dashboard           # Dashboard analytics
GET  /analytics/performance         # Performance metrics
GET  /ai/predictions                # ML predictions
GET  /ai/performance                # AI performance metrics

# Blockchain
GET  /blockchain/transactions       # Transaction list (paginated)
GET  /blockchain/network/stats      # Network statistics
GET  /blockchain/operations         # Blockchain operations

# Nodes
GET  /nodes                         # Node list
GET  /nodes/{id}                    # Node details
PUT  /nodes/{id}/config             # Update node config

# Consensus
GET  /consensus/status              # Consensus state
GET  /live/consensus                # Real-time consensus data
GET  /consensus/metrics             # Consensus metrics

# Contracts
GET  /contracts                     # Smart contracts list
POST /contracts/deploy              # Deploy contract
GET  /contracts/statistics          # Contract statistics

# Security
GET  /security/audit                # Security audit log
GET  /security/threats              # Threat monitoring
GET  /security/metrics              # Security metrics

# Settings
GET  /settings/system               # System settings
PUT  /settings/system               # Update settings
GET  /settings/api-integrations     # API integration config
PUT  /settings/api-integrations     # Update API integrations

# Users
GET  /users                         # User list
POST /users                         # Create user
PUT  /users/{id}                    # Update user
DELETE /users/{id}                  # Delete user

# Backups
GET  /backups/history               # Backup history
POST /backups/create                # Trigger backup

# RWA (Real World Assets)
POST /rwa/tokenize                  # Tokenize asset
GET  /rwa/portfolio                 # Asset portfolio
GET  /rwa/valuation                 # Asset valuation
GET  /rwa/dividends                 # Dividend management
GET  /rwa/compliance                # Compliance tracking

# Oracle Service
GET  /oracle/status                 # Oracle service status
GET  /oracle/data-feeds             # Data feed list
GET  /oracle/verification           # Verification status

# External Integrations
GET  /integrations/alpaca           # Alpaca Markets status
GET  /integrations/twitter          # Twitter integration
GET  /integrations/weather          # Weather API status
```

### gRPC Services (Planned)

**Port**: 9004
**Protocol**: gRPC + Protocol Buffers

```protobuf
service AurigraphV11Service {
  rpc SubmitTransaction(Transaction) returns (TransactionReceipt);
  rpc GetBlockchainState(StateRequest) returns (BlockchainState);
  rpc StreamTransactions(StreamRequest) returns (stream Transaction);
  rpc GetConsensusStatus(Empty) returns (ConsensusStatus);
}
```
