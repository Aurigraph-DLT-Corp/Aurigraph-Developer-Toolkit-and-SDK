# Aurigraph V11 Network Topology - Channel-Grouped Architecture

**Version**: 11.3.4
**Last Updated**: October 20, 2025
**Classification**: TECHNICAL DOCUMENTATION

## Overview

This document provides network connection diagrams organized by channel type. Each channel operates with its own isolated network topology, ensuring proper data segregation and security boundaries.

---

## 1. PUBLIC CHANNEL NETWORK TOPOLOGY

### 1.1 Public Channel Architecture

**Purpose**: Fully transparent, publicly accessible blockchain channel
**Participants**: All registered nodes (Validators, Business Nodes, Slim Nodes)
**Consensus**: HyperRAFT++ with full participation

```
┌────────────────────────────────────────────────────────────────────────┐
│                         PUBLIC CHANNEL NETWORK                          │
│                      (Fully Connected Mesh Topology)                    │
└────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────┐
                    │   PUBLIC CHANNEL LAYER   │
                    │   - Open Participation   │
                    │   - Full Transparency    │
                    │   - Public Read Access   │
                    └──────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  VALIDATOR   │◄────►│  VALIDATOR   │◄────►│  VALIDATOR   │
│   NODE #1    │      │   NODE #2    │      │   NODE #3    │
│              │      │              │      │              │
│  - Leader    │      │  - Follower  │      │  - Follower  │
│  - gRPC:9004 │      │  - gRPC:9004 │      │  - gRPC:9004 │
│  - HTTP:9003 │      │  - HTTP:9003 │      │  - HTTP:9003 │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       │◄────────────────────┼────────────────────►│
       │     Consensus       │    Consensus        │
       │     Protocol        │    Protocol         │
       │                     │                     │
       ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  BUSINESS    │◄────►│  BUSINESS    │◄────►│  BUSINESS    │
│   NODE #1    │      │   NODE #2    │      │   NODE #3    │
│              │      │              │      │              │
│  - Observer  │      │  - Observer  │      │  - Observer  │
│  - gRPC:9004 │      │  - gRPC:9004 │      │  - gRPC:9004 │
│  - HTTP:9003 │      │  - HTTP:9003 │      │  - HTTP:9003 │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   SLIM       │◄────►│   SLIM       │◄────►│   SLIM       │
│  NODE #1     │      │  NODE #2     │      │  NODE #3     │
│              │      │              │      │              │
│  - Light     │      │  - Light     │      │  - Light     │
│  - HTTP:9003 │      │  - HTTP:9003 │      │  - HTTP:9003 │
└──────────────┘      └──────────────┘      └──────────────┘

┌─────────────────────────────────────────────────────────┐
│            EXTERNAL ACCESS (Public Channel)              │
│                                                          │
│  Internet  ──►  Load Balancer  ──►  Any Validator/Node  │
│                                                          │
│  - Public API: https://dlt.aurigraph.io/api/v11/*       │
│  - Public Explorer: https://dlt.aurigraph.io/explorer   │
│  - Read-Only Access: Enabled                            │
│  - Write Access: Requires Authentication                │
└─────────────────────────────────────────────────────────┘

Connection Types:
  ◄────► gRPC Bidirectional Stream (TLS 1.3)
  ──►    HTTP/2 REST API
```

### 1.2 Public Channel Connection Matrix

| From → To | Validator | Business Node | Slim Node |
|-----------|-----------|---------------|-----------|
| **Validator** | Full Mesh (Consensus) | Block Propagation | Block Propagation |
| **Business Node** | Block Sync | Peer-to-Peer | Block Sharing |
| **Slim Node** | Block Headers | Block Headers | Peer Headers |

---

## 2. PRIVATE CHANNEL NETWORK TOPOLOGY

### 2.1 Private Channel Architecture

**Purpose**: Permissioned, access-controlled blockchain channel
**Participants**: Pre-authorized nodes only
**Consensus**: Restricted HyperRAFT++ with ACL validation

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRIVATE CHANNEL NETWORK                          │
│                    (ACL-Controlled Star Topology)                       │
└────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────┐
                    │  PRIVATE CHANNEL LAYER   │
                    │  - Access Control Lists  │
                    │  - Encrypted Transport   │
                    │  - Private Data Zones    │
                    └──────────────────────────┘
                              │
                              │ ACL GATEWAY
                              │
                    ┌─────────┴─────────┐
                    │  AUTHORIZED       │
                    │  PARTICIPANTS     │
                    │  REGISTRY         │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  AUTHORIZED  │◄────►│  AUTHORIZED  │◄────►│  AUTHORIZED  │
│  VALIDATOR   │      │  VALIDATOR   │      │  VALIDATOR   │
│    #1        │      │    #2        │      │    #3        │
│              │      │              │      │              │
│  - mTLS      │      │  - mTLS      │      │  - mTLS      │
│  - PKI Cert  │      │  - PKI Cert  │      │  - PKI Cert  │
│  - Encrypted │      │  - Encrypted │      │  - Encrypted │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       │ End-to-End         │                     │
       │ Encryption         │                     │
       │                     │                     │
       ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  AUTHORIZED  │      │  AUTHORIZED  │      │  AUTHORIZED  │
│  BUSINESS    │◄────►│  BUSINESS    │◄────►│  BUSINESS    │
│  NODE #1     │      │  NODE #2     │      │  NODE #3     │
│              │      │              │      │              │
│  - ACL Token │      │  - ACL Token │      │  - ACL Token │
│  - IAM Auth  │      │  - IAM Auth  │      │  - IAM Auth  │
└──────────────┘      └──────────────┘      └──────────────┘

┌─────────────────────────────────────────────────────────┐
│         PRIVATE CHANNEL ACCESS CONTROL                   │
│                                                          │
│  1. Client presents JWT + Certificate                   │
│  2. IAM validates against ACL                           │
│  3. Channel Gateway authorizes access                   │
│  4. Encrypted tunnel established (mTLS)                 │
│                                                          │
│  - IAM Server: https://iam2.aurigraph.io                │
│  - Certificate Authority: Internal PKI                  │
│  - Access Log: Full audit trail                        │
└─────────────────────────────────────────────────────────┘

Connection Security:
  ◄══════► mTLS + End-to-End Encryption
  ──[🔒]──► Authenticated HTTP/2 with ACL
  ─[ACL]──► ACL-Validated Connection
```

### 2.2 Private Channel Connection Matrix

| From → To | Authorized Validator | Authorized Business | Unauthorized |
|-----------|---------------------|---------------------|--------------|
| **Authorized Validator** | Full Encrypted Mesh | Encrypted Data | BLOCKED ❌ |
| **Authorized Business** | Encrypted Sync | Encrypted P2P | BLOCKED ❌ |
| **Unauthorized Node** | BLOCKED ❌ | BLOCKED ❌ | BLOCKED ❌ |

---

## 3. CONSORTIUM CHANNEL NETWORK TOPOLOGY

### 3.1 Consortium Channel Architecture

**Purpose**: Multi-organization collaborative blockchain channel
**Participants**: Multiple organizations with equal voting rights
**Consensus**: Multi-signature HyperRAFT++ with organizational quorum

```
┌────────────────────────────────────────────────────────────────────────┐
│                      CONSORTIUM CHANNEL NETWORK                         │
│                  (Multi-Org Federated Topology)                         │
└────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────┐
                    │ CONSORTIUM CHANNEL LAYER │
                    │ - Multi-Org Governance   │
                    │ - Weighted Voting        │
                    │ - Cross-Org Settlement   │
                    └──────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  ORGANIZATION A  │  │  ORGANIZATION B  │  │  ORGANIZATION C  │
│                  │  │                  │  │                  │
│  ┌────────────┐  │  │  ┌────────────┐  │  │  ┌────────────┐  │
│  │ Validator  │◄─┼──┼─►│ Validator  │◄─┼──┼─►│ Validator  │  │
│  │   Node     │  │  │  │   Node     │  │  │  │   Node     │  │
│  └─────┬──────┘  │  │  └─────┬──────┘  │  │  └─────┬──────┘  │
│        │         │  │        │         │  │        │         │
│        │         │  │        │         │  │        │         │
│  ┌─────▼──────┐  │  │  ┌─────▼──────┐  │  │  ┌─────▼──────┐  │
│  │ Business   │  │  │  │ Business   │  │  │  │ Business   │  │
│  │ Node 1     │  │  │  │ Node 2     │  │  │  │ Node 3     │  │
│  └────────────┘  │  │  └────────────┘  │  │  └────────────┘  │
│                  │  │                  │  │                  │
│  Org A Subnet    │  │  Org B Subnet    │  │  Org C Subnet    │
│  10.1.0.0/24     │  │  10.2.0.0/24     │  │  10.3.0.0/24     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                   ┌───────────▼───────────┐
                   │  CONSORTIUM GATEWAY   │
                   │  - Multi-Sig Required │
                   │  - 2/3 Quorum         │
                   │  - Cross-Org Routing  │
                   └───────────────────────┘
                               │
                   ┌───────────▼───────────┐
                   │   SETTLEMENT LAYER    │
                   │  - Cross-Org Txs      │
                   │  - Merkle Proofs      │
                   │  - State Anchoring    │
                   └───────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              CONSORTIUM GOVERNANCE MODEL                         │
│                                                                  │
│  Transaction Approval Requirements:                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Type            │  Quorum    │  Signatures              │  │
│  ├──────────────────┼────────────┼──────────────────────────┤  │
│  │  State Change    │  2/3       │  Multi-Org Validators    │  │
│  │  Config Update   │  3/3       │  All Org Admins          │  │
│  │  Member Add      │  2/3       │  Multi-Org Governance    │  │
│  │  Asset Transfer  │  2/3       │  Sender + 2 Validators   │  │
│  └──────────────────┴────────────┴──────────────────────────┘  │
│                                                                  │
│  - Voting Weight: Equal per organization                        │
│  - Dispute Resolution: On-chain governance contracts            │
│  - Audit Trail: Immutable governance log                        │
└─────────────────────────────────────────────────────────────────┘

Org Connections:
  ◄═══[ORG]═══► Cross-Organization Authenticated Channel
  ──[VOTE]──► Governance Voting Channel
  ──[SETTLE]─► Settlement Transaction Flow
```

### 3.2 Consortium Channel Connection Matrix

| From → To | Org A Validator | Org B Validator | Org C Validator | Gateway |
|-----------|-----------------|-----------------|-----------------|---------|
| **Org A Validator** | Internal Mesh | Multi-Sig Auth | Multi-Sig Auth | Authorized |
| **Org B Validator** | Multi-Sig Auth | Internal Mesh | Multi-Sig Auth | Authorized |
| **Org C Validator** | Multi-Sig Auth | Multi-Sig Auth | Internal Mesh | Authorized |
| **External Client** | Via Gateway | Via Gateway | Via Gateway | ACL Check |

---

## 4. CHANNEL ISOLATION & SECURITY

### 4.1 Network Segregation

```
┌──────────────────────────────────────────────────────────────┐
│              CHANNEL ISOLATION ARCHITECTURE                   │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PHYSICAL LAYER                            │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                │
│  │  Node #1  │  │  Node #2  │  │  Node #3  │                │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘                │
└────────┼──────────────┼──────────────┼───────────────────────┘
         │              │              │
┌────────┼──────────────┼──────────────┼───────────────────────┐
│        │  NETWORK VIRTUALIZATION LAYER (VLAN/VPN)            │
│        │              │              │                        │
│  ┌─────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐               │
│  │  PUBLIC    │ │  PRIVATE   │ │ CONSORTIUM │               │
│  │  Channel   │ │  Channel   │ │  Channel   │               │
│  │  VLAN 100  │ │  VLAN 200  │ │  VLAN 300  │               │
│  └────────────┘ └────────────┘ └────────────┘               │
└─────────────────────────────────────────────────────────────┘

Traffic Isolation:
  - VLAN Segmentation: L2 isolation
  - VPN Tunnels: L3 encryption
  - Application-Level: Channel-specific authentication
  - Data-at-Rest: Channel-specific encryption keys
```

### 4.2 Channel Security Comparison

| Security Feature | PUBLIC | PRIVATE | CONSORTIUM |
|------------------|--------|---------|------------|
| **Authentication** | Optional | Required (IAM) | Multi-Org PKI |
| **Authorization** | Public Read | ACL-based | Multi-Sig Quorum |
| **Encryption (Transit)** | TLS 1.3 | mTLS + E2E | mTLS + Multi-Org |
| **Encryption (Rest)** | Standard | AES-256 | AES-256 + HSM |
| **Access Control** | Open | Whitelist | Multi-Org Approval |
| **Audit Logging** | Basic | Full | Governance Log |
| **Data Visibility** | Transparent | Restricted | Org-Scoped |

---

## 5. CHANNEL-SPECIFIC PROTOCOLS

### 5.1 Protocol Stack per Channel

```
┌─────────────────────────────────────────────────────────────┐
│                   PROTOCOL LAYERS BY CHANNEL                 │
└─────────────────────────────────────────────────────────────┘

PUBLIC CHANNEL:
┌─────────────────┐
│  Application    │  REST API, GraphQL
├─────────────────┤
│  Consensus      │  HyperRAFT++ (Full Participation)
├─────────────────┤
│  P2P Messaging  │  gRPC Streams
├─────────────────┤
│  Transport      │  HTTP/2, TLS 1.3
├─────────────────┤
│  Network        │  IPv4/IPv6, VLAN 100
└─────────────────┘

PRIVATE CHANNEL:
┌─────────────────┐
│  Application    │  Authenticated REST, Secure GraphQL
├─────────────────┤
│  Access Control │  IAM + JWT Validation
├─────────────────┤
│  Consensus      │  HyperRAFT++ (ACL-Restricted)
├─────────────────┤
│  P2P Messaging  │  Encrypted gRPC Streams (mTLS)
├─────────────────┤
│  Transport      │  HTTP/2, mTLS 1.3
├─────────────────┤
│  Network        │  VPN, VLAN 200
└─────────────────┘

CONSORTIUM CHANNEL:
┌─────────────────┐
│  Application    │  Multi-Org API Gateway
├─────────────────┤
│  Governance     │  Multi-Signature Validation
├─────────────────┤
│  Consensus      │  HyperRAFT++ (Quorum-based)
├─────────────────┤
│  Cross-Org      │  Settlement & State Anchoring
├─────────────────┤
│  P2P Messaging  │  Org-to-Org Encrypted Streams
├─────────────────┤
│  Transport      │  HTTP/2, mTLS 1.3, Multi-Org PKI
├─────────────────┤
│  Network        │  Multi-VPN, VLAN 300
└─────────────────┘
```

---

## 6. DEMO NETWORK CONFIGURATION EXAMPLES

### 6.1 Example Demo with Multiple Channels

```yaml
demo:
  id: "demo-001"
  name: "Multi-Channel Enterprise Demo"
  user: "enterprise@aurigraph.io"

  channels:
    - id: "public-main"
      name: "Public Blockchain"
      type: PUBLIC
      nodes:
        validators: 5
        businessNodes: 10
        slimNodes: 20
      config:
        consensusThreshold: 0.67
        blockTime: "2s"
        maxTPS: 50000

    - id: "private-finance"
      name: "Private Finance Channel"
      type: PRIVATE
      nodes:
        validators: 3
        businessNodes: 5
        slimNodes: 0  # No slim nodes in private
      config:
        aclEnabled: true
        encryption: "AES-256-GCM"
        iamRealm: "AWD"
        consensusThreshold: 1.0  # 100% agreement

    - id: "consortium-settlement"
      name: "Multi-Bank Settlement"
      type: CONSORTIUM
      organizations:
        - name: "Bank A"
          validators: 2
          weight: 1
        - name: "Bank B"
          validators: 2
          weight: 1
        - name: "Bank C"
          validators: 2
          weight: 1
      config:
        quorum: 0.67  # 2/3 majority
        governanceContract: "0xabc..."
        settlementPeriod: "24h"
```

### 6.2 Network Visualization by Channel

**Demo: "Multi-Channel Enterprise Demo"**

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEMO NETWORK OVERVIEW                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PUBLIC CHANNEL: "Public Blockchain"                     │  │
│  │  Nodes: 5 Validators + 10 Business + 20 Slim = 35 Total │  │
│  │  TPS: 50,000 │ Block Time: 2s │ Consensus: 67%          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PRIVATE CHANNEL: "Private Finance Channel"             │  │
│  │  Nodes: 3 Validators + 5 Business = 8 Total             │  │
│  │  Security: ACL + IAM │ Consensus: 100% Agreement        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CONSORTIUM CHANNEL: "Multi-Bank Settlement"            │  │
│  │  Organizations: 3 (Bank A, B, C)                        │  │
│  │  Nodes: 6 Validators (2 per org) │ Quorum: 2/3         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Total Nodes: 49  │  Active Channels: 3  │  Status: RUNNING   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. MONITORING & OBSERVABILITY

### 7.1 Channel-Specific Metrics

```
Channel Monitoring Dashboard:
┌────────────────────────────────────────────────────────┐
│  Channel: PUBLIC                                        │
├────────────────────────────────────────────────────────┤
│  Nodes Online:    35/35  ✓                            │
│  Current TPS:     47,532                               │
│  Block Height:    #1,245,678                           │
│  Consensus Time:  1.8s avg                             │
│  Network Health:  99.9%                                │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  Channel: PRIVATE                                       │
├────────────────────────────────────────────────────────┤
│  Nodes Online:    8/8  ✓                              │
│  Current TPS:     12,450                               │
│  ACL Violations:  0                                    │
│  Encryption:      Active (AES-256-GCM)                 │
│  IAM Auth Rate:   100%                                 │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  Channel: CONSORTIUM                                    │
├────────────────────────────────────────────────────────┤
│  Organizations:   3 (All Active)                       │
│  Nodes Online:    6/6  ✓                              │
│  Quorum Status:   2/3 Available ✓                     │
│  Pending Votes:   2                                    │
│  Settlement Txs:  456 (Last 24h)                       │
└────────────────────────────────────────────────────────┘
```

---

## 8. DEPLOYMENT CONFIGURATION

### 8.1 Channel Network Configuration Files

**File**: `/opt/aurigraph-v11/config/network-channels.yaml`

```yaml
channels:
  public:
    enabled: true
    vlan: 100
    port_range: "9003-9100"
    tls:
      enabled: true
      version: "1.3"
      ciphers: "TLS_AES_256_GCM_SHA384"
    consensus:
      algorithm: "HyperRAFT++"
      threshold: 0.67

  private:
    enabled: true
    vlan: 200
    port_range: "9200-9300"
    tls:
      enabled: true
      version: "1.3"
      mutual: true  # mTLS required
      ca_cert: "/opt/certs/private-ca.pem"
    iam:
      enabled: true
      server: "https://iam2.aurigraph.io"
      realm: "AWD"
    consensus:
      algorithm: "HyperRAFT++"
      threshold: 1.0
      acl_validation: true

  consortium:
    enabled: true
    vlan: 300
    port_range: "9400-9500"
    tls:
      enabled: true
      version: "1.3"
      mutual: true
      multi_org_pki: true
    governance:
      enabled: true
      quorum: 0.67
      voting_period: "24h"
      contract_address: "0x..."
    consensus:
      algorithm: "HyperRAFT++"
      multi_sig_required: true
      settlement_layer: true
```

---

## 9. TROUBLESHOOTING & DIAGNOSTICS

### 9.1 Channel Connectivity Tests

```bash
# Test PUBLIC channel connectivity
curl https://dlt.aurigraph.io/api/v11/channels/public/health

# Test PRIVATE channel (requires auth)
curl -H "Authorization: Bearer $IAM_TOKEN" \
  https://dlt.aurigraph.io/api/v11/channels/private/health

# Test CONSORTIUM channel (requires multi-org credentials)
curl -H "X-Org-Id: BankA" \
  -H "Authorization: Bearer $ORG_TOKEN" \
  https://dlt.aurigraph.io/api/v11/channels/consortium/health

# Test node connectivity within a channel
grpcurl -plaintext \
  -d '{"channelId":"public"}' \
  localhost:9004 \
  aurigraph.v11.ChannelService/ListPeers
```

### 9.2 Common Issues by Channel Type

| Issue | Channel | Diagnosis | Solution |
|-------|---------|-----------|----------|
| Connection Timeout | PUBLIC | Network/Firewall | Check ports 9003, 9004 |
| ACL Denied | PRIVATE | Invalid JWT | Refresh IAM token |
| Quorum Failed | CONSORTIUM | Org offline | Contact org admin |
| Encryption Error | PRIVATE/CONSORTIUM | Cert expired | Renew PKI certificates |

---

## 10. REFERENCES

- **HyperRAFT++ Consensus**: See CONSENSUS-PROTOCOL.md
- **IAM Integration**: See RBAC-INTEGRATION-GUIDE.md
- **Security Architecture**: See AURIGRAPH-V11-QUANTUM-CRYPTOGRAPHY-SECURITY-REPORT.md
- **API Documentation**: https://dlt.aurigraph.io/api/docs
- **Enterprise Portal**: https://dlt.aurigraph.io

---

**Document Version**: 1.0
**Maintained By**: Aurigraph DLT Architecture Team
**Last Review**: October 20, 2025
**Next Review**: November 20, 2025
