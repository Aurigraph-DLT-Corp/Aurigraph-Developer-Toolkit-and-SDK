# Aurigraph V11 - API Integrations Guide

**Version**: 11.1.0
**Last Updated**: October 10, 2025
**Base URL**: `https://dlt.aurigraph.io`

---

## 📊 API Integration Overview

Aurigraph V11 provides a comprehensive REST API ecosystem with **20+ resource endpoints** covering blockchain operations, DeFi integrations, cross-chain bridges, healthcare systems, and enterprise features.

### Quick Stats
- **Total API Endpoints**: 300+
- **Resource Classes**: 27
- **Integration Services**: 10+
- **External Protocols**: 15+
- **Transport**: HTTP/2 + gRPC

---

## 🔗 Core API Integrations

### 1. **Ricardian Contract APIs** ✅ (PRODUCTION READY)
**Location**: `src/main/java/io/aurigraph/v11/contracts/RicardianContractResource.java`
**Base Path**: `/api/v11/contracts/ricardian`

**Endpoints**:
```
GET    /gas-fees                          # Gas fee rates (7 operation types)
POST   /upload                            # Upload document for conversion
GET    /{contractId}                      # Get contract details
POST   /{contractId}/parties              # Add party to contract
POST   /{contractId}/sign                 # Submit digital signature
POST   /{contractId}/activate             # Activate contract
GET    /{contractId}/audit                # Get audit trail
GET    /{contractId}/compliance/{framework}  # Compliance report (GDPR/SOX/HIPAA)
```

**Features**:
- Document-to-contract conversion (PDF/DOC/TXT)
- Multi-party management with KYC
- Quantum-safe signatures (CRYSTALS-Dilithium)
- LevelDB-backed audit trail
- Regulatory compliance (GDPR, SOX, HIPAA)
- Gas fee consensus with AURI tokens

**Status**: ✅ **FULLY OPERATIONAL** - 100% tested

---

### 2. **Blockchain Core APIs**
**Location**: `src/main/java/io/aurigraph/v11/api/BlockchainApiResource.java`
**Base Path**: `/api/v11/blockchain`

**Endpoints**:
```
GET    /chain/info                        # Blockchain info
GET    /blocks                            # List blocks
GET    /blocks/{height}                   # Get block by height
GET    /transactions                      # List transactions
POST   /transactions                      # Submit transaction
POST   /transactions/batch                # Batch transactions
GET    /transactions/stats                # Transaction statistics
GET    /validators                        # List validators
GET    /network                           # Network status
```

**Features**:
- Block explorer functionality
- Transaction submission and tracking
- Batch processing
- Validator management
- Network statistics

---

### 3. **Cross-Chain Bridge APIs**
**Location**: `src/main/java/io/aurigraph/v11/api/CrossChainBridgeResource.java`
**Base Path**: `/api/v11/bridge`

**Endpoints**:
```
GET    /chains                            # Supported chains
GET    /bridges                           # Active bridges
GET    /bridges/{id}                      # Bridge details
POST   /transfers                         # Initiate cross-chain transfer
GET    /transfers                         # List transfers
GET    /stats                             # Bridge statistics
```

**Integrations**:
- **Ethereum**: Via Web3j
- **Bitcoin**: BTC bridge adapter
- **Polkadot**: Substrate integration
- **Cosmos**: IBC protocol
- **Binance Smart Chain**: BSC adapter

**Location**: `src/main/java/io/aurigraph/v11/bridge/adapters/`

---

### 4. **DeFi Integration APIs**
**Location**: `src/main/java/io/aurigraph/v11/api/Phase2BlockchainResource.java`
**Base Path**: `/api/v11/blockchain/defi`

**Endpoints**:
```
GET    /protocols                         # Supported DeFi protocols
GET    /pools                             # Liquidity pools
POST   /pools/{poolId}/add-liquidity      # Add liquidity
GET    /yield-farming                     # Yield farming opportunities
```

**DeFi Integrations**:

#### **Uniswap V3**
**Location**: `src/main/java/io/aurigraph/v11/defi/adapters/UniswapV3Integration.java`
- Swap routing
- Liquidity provision
- Price oracles
- Pool analytics

#### **DeFi Protocols**
**Location**: `src/main/java/io/aurigraph/v11/contracts/defi/`
- Aave integration
- Compound integration
- Curve Finance
- Balancer
- SushiSwap

---

### 5. **Healthcare (HMS) Integration APIs** 🏥
**Location**: `src/main/java/io/aurigraph/v11/hms/HMSIntegrationService.java`
**Base Path**: N/A (Internal Service)

**Features**:
- **HL7/FHIR Integration**: `HL7FHIRIntegrationService.java`
- Healthcare data tokenization
- Patient record management
- HIPAA-compliant storage
- Medical data interoperability

**Endpoints** (Planned):
```
POST   /api/v11/hms/patients              # Register patient
GET    /api/v11/hms/records/{id}          # Get medical record
POST   /api/v11/hms/records/tokenize      # Tokenize medical data
GET    /api/v11/hms/compliance            # HIPAA compliance status
```

---

### 6. **AI/ML Integration APIs**
**Location**: `src/main/java/io/aurigraph/v11/api/AIApiResource.java`
**Base Path**: `/api/v11/ai`

**Endpoints**:
```
GET    /models                            # List AI models
GET    /models/{id}                       # Model details
POST   /models/{id}/retrain               # Retrain model
POST   /predictions                       # Make predictions
GET    /metrics                           # AI performance metrics
```

**AI Services**:
**Location**: `src/main/java/io/aurigraph/v11/ai/AIIntegrationService.java`
- Consensus optimization
- Transaction prediction
- Anomaly detection
- Performance tuning
- Fraud detection

---

### 7. **Real World Asset (RWA) APIs**
**Location**: `src/main/java/io/aurigraph/v11/api/RWAApiResource.java`
**Base Path**: `/api/v11/rwa`

**Endpoints**:
```
POST   /tokenize                          # Tokenize real-world asset
GET    /tokens                            # List RWA tokens
GET    /tokens/{tokenId}                  # Token details
GET    /portfolio/{address}               # Asset portfolio
GET    /oracle/price/{assetId}            # Asset price from oracle
GET    /oracle/sources                    # Price data sources
```

**Asset Types**:
- Real Estate
- Commodities
- Art & Collectibles
- Bonds & Securities
- Intellectual Property

---

### 8. **Governance APIs**
**Location**: `src/main/java/io/aurigraph/v11/api/Phase2BlockchainResource.java`
**Base Path**: `/api/v11/blockchain/governance`

**Endpoints**:
```
GET    /proposals                         # List proposals
POST   /proposals                         # Create proposal
GET    /proposals/{id}                    # Proposal details
POST   /proposals/{id}/vote               # Vote on proposal
GET    /parameters                        # Governance parameters
```

**Features**:
- On-chain governance
- Voting mechanisms
- Proposal lifecycle
- Parameter updates
- Community voting

---

### 9. **Security & Cryptography APIs**
**Location**: `src/main/java/io/aurigraph/v11/api/SecurityApiResource.java`
**Base Path**: `/api/v11/security`

**Endpoints**:
```
GET    /status                            # Security status
POST   /keys/generate                     # Generate keys
POST   /keys/rotate                       # Rotate keys
GET    /keys                              # List keys
GET    /keys/{keyId}                      # Key details
GET    /audit                             # Security audit
GET    /metrics                           # Security metrics
```

**Crypto Services**:
**Location**: `src/main/java/io/aurigraph/v11/crypto/`
- **Quantum-safe crypto**: CRYSTALS-Kyber, CRYSTALS-Dilithium
- **HSM Integration**: `HSMIntegration.java`
- **Key management**: Multi-sig support
- **Encryption**: AES-256, Post-quantum algorithms

---

### 10. **Enterprise APIs**
**Location**: `src/main/java/io/aurigraph/v11/api/Phase4EnterpriseResource.java`
**Base Path**: `/api/v11/enterprise`

**Endpoints**:
```
# Multi-Tenancy
GET    /tenants                           # List tenants
POST   /tenants                           # Create tenant
GET    /tenants/{id}/usage                # Tenant usage

# RBAC
GET    /rbac/roles                        # List roles
POST   /rbac/roles                        # Create role
POST   /rbac/assign                       # Assign role
GET    /rbac/permissions/{userId}         # User permissions

# SSO/Auth
GET    /auth/sso/providers                # SSO providers
POST   /auth/sso/configure                # Configure SSO
GET    /auth/sessions                     # Active sessions

# Backup & DR
POST   /backup/create                     # Create backup
GET    /backup/list                       # List backups
POST   /backup/restore                    # Restore backup
GET    /backup/dr-plan                    # Disaster recovery plan

# Cluster Management
GET    /cluster/status                    # Cluster status
GET    /cluster/nodes                     # Cluster nodes
POST   /cluster/nodes/add                 # Add node
GET    /cluster/load-balancer             # Load balancer status

# Integrations Marketplace
GET    /integrations/marketplace          # Available integrations
GET    /integrations/installed            # Installed integrations
POST   /integrations/install              # Install integration

# Mobile APIs
POST   /mobile/register                   # Register device
POST   /mobile/push                       # Send push notification
GET    /mobile/devices                    # List devices
GET    /mobile/analytics                  # Mobile analytics

# Reporting
GET    /reports                           # List reports
POST   /reports/generate                  # Generate report
GET    /reports/templates                 # Report templates

# Launch Readiness
GET    /launch/readiness                  # Production readiness
GET    /launch/checklist                  # Launch checklist
GET    /launch/metrics                    # Launch metrics
```

---

### 11. **Payment Channel APIs**
**Location**: `src/main/java/io/aurigraph/v11/api/ChannelResource.java`
**Base Path**: `/api/v11/channels`

**Endpoints**:
```
GET    /{id}                              # Channel details
POST   /{id}/join                         # Join channel
GET    /{id}/members                      # Channel members
GET    /{id}/messages                     # Channel messages
POST   /{id}/messages                     # Send message
GET    /{id}/metrics                      # Channel metrics
```

**Features**:
- State channels
- Payment routing
- Off-chain transactions
- Lightning Network compatibility

---

### 12. **Live Data APIs**
**Location**: `src/main/java/io/aurigraph/v11/api/LiveChannelApiResource.java`
**Base Path**: `/api/v11/live`

**Endpoints**:
```
GET    /channels                          # Live channels
GET    /channels/{id}                     # Channel data
GET    /channels/{id}/participants        # Channel participants
GET    /channels/{id}/full                # Full channel state
GET    /channels/all-with-participants    # All channels with participants
GET    /channels/stats                    # Channel statistics
```

**Status**: ⚠️ Not available in production (see test results)

---

### 13. **Validator & Staking APIs**
**Location**: `src/main/java/io/aurigraph/v11/api/ValidatorResource.java`
**Base Path**: `/api/v11/validators`

**Endpoints**:
```
GET    /{id}                              # Validator details
POST   /{id}/stake                        # Stake tokens
POST   /{id}/unstake                      # Unstake tokens
POST   /register                          # Register validator
POST   /delegate                          # Delegate stake
GET    /staking/info                      # Staking information
GET    /staking/pools                     # Staking pools
GET    /staking/delegations/{address}     # Delegations
POST   /staking/calculate-rewards         # Calculate rewards
```

---

### 14. **Consensus APIs**
**Location**: `src/main/java/io/aurigraph/v11/api/ConsensusApiResource.java`
**Base Path**: `/api/v11/consensus`

**Endpoints**:
```
GET    /status                            # Consensus status
GET    /nodes                             # Consensus nodes
POST   /propose                           # Propose block
GET    /metrics                           # Consensus metrics
GET    /leader-history                    # Leader history
```

**Consensus**: HyperRAFT++ with AI optimization

---

### 15. **Data Feed APIs**
**Location**: `src/main/java/io/aurigraph/v11/api/DataFeedResource.java`
**Base Path**: `/api/v11/datafeeds`

**Endpoints**:
```
GET    /{id}                              # Feed details
POST   /{id}                              # Create feed
PUT    /{id}                              # Update feed
DELETE /{id}                              # Delete feed
GET    /{id}/data                         # Get feed data
POST   /{id}/data                         # Push feed data
POST   /{id}/subscribe                    # Subscribe to feed
POST   /{id}/unsubscribe                  # Unsubscribe
GET    /{id}/subscriptions                # Feed subscriptions
GET    /stats                             # Feed statistics
```

---

### 16. **Composite Token APIs**
**Location**: `src/main/java/io/aurigraph/v11/api/CompositeTokenResource.java`
**Base Path**: `/api/v11/composite-tokens`

**Endpoints**:
```
POST   /create                            # Create composite token
GET    /{compositeId}                     # Token details
POST   /{compositeId}/transfer            # Transfer token
POST   /{compositeId}/verify              # Verify token
GET    /{compositeId}/verification-history # Verification history
POST   /{compositeId}/secondary-tokens    # Add secondary token
DELETE /{compositeId}/secondary-tokens/{type} # Remove secondary token
GET    /by-owner/{ownerAddress}           # Tokens by owner
GET    /by-type/{assetType}               # Tokens by type
GET    /health                            # Service health
GET    /stats                             # Token statistics
```

**Verifier Management**:
```
POST   /verifiers/register                # Register verifier
GET    /verifiers/tier/{tier}             # Verifiers by tier
GET    /verifiers/{id}/performance        # Verifier performance
GET    /verifiers/stats                   # Verifier statistics
```

**Verification Workflow**:
```
GET    /verification/{workflowId}         # Workflow status
POST   /verification/{workflowId}/submit  # Submit verification
GET    /verification/{workflowId}/audit   # Audit trail
```

---

### 17. **Analytics APIs**
**Location**: `src/main/java/io/aurigraph/v11/api/Sprint9AnalyticsResource.java`
**Base Path**: `/api/v11/analytics`

**Endpoints**:
```
GET    /transactions                      # Transaction analytics
GET    /validators                        # Validator analytics
GET    /predictive                        # Predictive analytics
GET    /trends                            # Market trends
```

---

### 18. **Configuration APIs**
**Location**: `src/main/java/io/aurigraph/v11/api/Sprint10ConfigurationResource.java`
**Base Path**: `/api/v11/config`

**Endpoints**:
```
GET    /settings                          # Get settings
PUT    /settings                          # Update settings
GET    /network                           # Network config
PUT    /network                           # Update network
POST   /settings/rotate-keys              # Rotate keys
GET    /history                           # Config history
```

---

### 19. **Advanced Features APIs**
**Location**: `src/main/java/io/aurigraph/v11/api/Phase3AdvancedFeaturesResource.java`
**Base Path**: `/api/v11/advanced`

**Endpoints**:
```
# Cross-Chain Bridge
GET    /bridge/chains                     # Supported chains
POST   /bridge/transfer                   # Cross-chain transfer

# Privacy
POST   /privacy/transaction               # Privacy transaction
GET    /privacy/stats                     # Privacy statistics

# Atomic Swaps
POST   /swaps/create                      # Create atomic swap
GET    /swaps/active                      # Active swaps

# Multi-Sig
POST   /multisig/create                   # Create multi-sig wallet
GET    /multisig/wallets                  # List wallets

# Oracle
GET    /oracle/prices                     # Asset prices
GET    /oracle/providers                  # Oracle providers

# Monitoring
GET    /monitoring/realtime               # Real-time monitoring
GET    /monitoring/alerts                 # Active alerts

# Compliance
GET    /compliance/audit-trails           # Audit trails
POST   /compliance/report                 # Generate report

# API Gateway
GET    /gateway/usage                     # API usage
GET    /gateway/rate-limit                # Rate limits

# Developer Tools
GET    /developer/sdks                    # Available SDKs
GET    /developer/examples                # Code examples
```

---

## 🔌 External Integration Services

### Healthcare Integrations
**Location**: `src/main/java/io/aurigraph/v11/hms/`

**HL7/FHIR Integration**
- **File**: `HL7FHIRIntegrationService.java`
- **Protocol**: HL7 v2.x, FHIR R4
- **Features**: Patient records, lab results, prescriptions
- **Compliance**: HIPAA-compliant

**HMS Integration**
- **File**: `HMSIntegrationService.java`
- **Features**: Hospital Management System integration
- **Data**: Patient demographics, appointments, billing

### DeFi Protocol Integrations
**Location**: `src/main/java/io/aurigraph/v11/defi/`

**Supported Protocols**:
1. **Uniswap V3** - `adapters/UniswapV3Integration.java`
2. **Aave** - Lending/borrowing
3. **Compound** - DeFi lending
4. **Curve** - Stablecoin swaps
5. **Balancer** - Liquidity pools

**DEX Integration Service**
- **File**: `services/DEXIntegrationService.java`
- **Features**: Multi-DEX routing, best price discovery

### AI/ML Integrations
**Location**: `src/main/java/io/aurigraph/v11/ai/AIIntegrationService.java`

**Features**:
- TensorFlow model integration
- ONNX runtime support
- Real-time prediction API
- Model retraining pipeline
- Performance optimization

### Blockchain Bridge Adapters
**Location**: `src/main/java/io/aurigraph/v11/bridge/adapters/`

**Supported Chains**:
- Ethereum (EVM)
- Bitcoin (UTXO)
- Polkadot (Substrate)
- Cosmos (IBC)
- Binance Smart Chain
- Solana (planned)
- Cardano (planned)

---

## 🔐 Authentication & Security

### API Key Authentication
```http
Authorization: Bearer <your-api-key>
X-API-Key: <your-api-key>
```

### JWT Authentication
```http
Authorization: Bearer <jwt-token>
```

### Quantum-Safe Signatures
All critical operations use post-quantum cryptography:
- **Key Exchange**: CRYSTALS-Kyber
- **Signatures**: CRYSTALS-Dilithium
- **Security Level**: NIST Level 5

---

## 📡 Transport Protocols

### REST/HTTP2
- **Protocol**: HTTP/2 with TLS 1.3
- **Format**: JSON
- **Port**: 8443 (HTTPS)

### gRPC
- **Protocol**: gRPC with Protocol Buffers
- **Port**: 9004
- **Features**: Bidirectional streaming, multiplexing

### WebSocket
- **Protocol**: WSS (WebSocket Secure)
- **Use Cases**: Real-time updates, live data feeds

---

## 📊 API Usage Examples

### 1. Upload Document for Ricardian Contract
```bash
curl -X POST https://dlt.aurigraph.io/api/v11/contracts/ricardian/upload \
  -F "file=@contract.pdf" \
  -F "fileName=real-estate-agreement.pdf" \
  -F "contractType=REAL_ESTATE" \
  -F "jurisdiction=California" \
  -F "submitterAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

### 2. Get Gas Fees
```bash
curl https://dlt.aurigraph.io/api/v11/contracts/ricardian/gas-fees
```

### 3. Submit Blockchain Transaction
```bash
curl -X POST https://dlt.aurigraph.io/api/v11/blockchain/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "from": "0x123...",
    "to": "0x456...",
    "value": "100",
    "data": "0x..."
  }'
```

### 4. Cross-Chain Bridge Transfer
```bash
curl -X POST https://dlt.aurigraph.io/api/v11/bridge/transfers \
  -H "Content-Type: application/json" \
  -d '{
    "sourceChain": "ethereum",
    "targetChain": "binance",
    "amount": "1000",
    "tokenAddress": "0x...",
    "recipient": "0x..."
  }'
```

### 5. Create Governance Proposal
```bash
curl -X POST https://dlt.aurigraph.io/api/v11/blockchain/governance/proposals \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Increase block size",
    "description": "Proposal to increase block size to 2MB",
    "proposer": "0x...",
    "votingPeriod": 7
  }'
```

---

## 🔧 API Configuration

### Base URLs
```
Production:  https://dlt.aurigraph.io
Development: http://localhost:9003
gRPC:        grpc://dlt.aurigraph.io:9004
```

### Rate Limits
```
Default:     1000 requests/minute
Burst:       100 requests/second
Enterprise:  Custom limits available
```

### Timeouts
```
Connection:  60s
Read:        60s
Write:       60s
```

---

## 📚 SDK & Client Libraries

### Java SDK
```java
AurigraphClient client = new AurigraphClient("https://dlt.aurigraph.io");
client.setApiKey("your-api-key");

// Upload contract
RicardianContract contract = client.ricardian()
    .uploadDocument(file, "REAL_ESTATE", "California");
```

### JavaScript SDK
```javascript
const aurigraph = new AurigraphSDK({
  baseUrl: 'https://dlt.aurigraph.io',
  apiKey: 'your-api-key'
});

// Get gas fees
const fees = await aurigraph.ricardian.getGasFees();
```

### Python SDK
```python
from aurigraph import AurigraphClient

client = AurigraphClient(
    base_url='https://dlt.aurigraph.io',
    api_key='your-api-key'
)

# Submit transaction
tx = client.blockchain.submit_transaction(
    from_address='0x123...',
    to_address='0x456...',
    value=100
)
```

---

## 🎯 Integration Status

| Integration | Status | Tested | Production Ready |
|-------------|--------|--------|------------------|
| Ricardian Contracts | ✅ | ✅ | ✅ |
| Blockchain Core | ✅ | ✅ | ✅ |
| Cross-Chain Bridge | ✅ | ⏳ | ⚠️ |
| DeFi Protocols | ✅ | ⏳ | ⚠️ |
| Healthcare (HMS/HL7) | ✅ | ⏳ | ⚠️ |
| AI/ML Services | ✅ | ⏳ | ⚠️ |
| RWA Tokenization | ✅ | ⏳ | ⚠️ |
| Governance | ✅ | ⏳ | ⚠️ |
| Enterprise Features | ✅ | ⏳ | ⚠️ |
| Live Data APIs | ✅ | ❌ | ❌ |

**Legend**:
- ✅ Available
- ⏳ In Testing
- ⚠️ Staging Only
- ❌ Not Available

---

## 📞 Support

### API Documentation
- **Swagger UI**: https://dlt.aurigraph.io/q/swagger-ui/
- **OpenAPI Spec**: https://dlt.aurigraph.io/q/openapi

### Developer Resources
- **GitHub**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **JIRA**: https://aurigraphdlt.atlassian.net
- **Docs**: https://docs.aurigraph.io

### Contact
- **Email**: api@aurigraph.io
- **Support**: support@aurigraph.io
- **Discord**: https://discord.gg/aurigraph

---

**Last Updated**: October 10, 2025
**API Version**: v11.1.0
**Documentation Version**: 1.0.0
