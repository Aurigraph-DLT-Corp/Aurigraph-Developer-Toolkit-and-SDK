# Aurigraph V12 API Endpoint Documentation

**Version**: 12.0.0
**Base URL**: `https://dlt.aurigraph.io`
**Author**: API Documentation Team
**Date**: December 2025
**JIRA**: AV11-544

## Table of Contents

1. [Authentication](#1-authentication)
2. [Health & Status](#2-health--status)
3. [Transactions](#3-transactions)
4. [Blocks](#4-blocks)
5. [Validators](#5-validators)
6. [User Management](#6-user-management)
7. [User Interests](#7-user-interests)
8. [Use Case Feedback](#8-use-case-feedback)
9. [File Attachments](#9-file-attachments)
10. [Demo Registration](#10-demo-registration)
11. [Oracle Services](#11-oracle-services)
12. [Cross-Chain Bridge](#12-cross-chain-bridge)
13. [Analytics](#13-analytics)
14. [WebSocket Endpoints](#14-websocket-endpoints)
15. [gRPC Services](#15-grpc-services)

---

## 1. Authentication

### 1.1 Login

```http
POST /api/v11/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "username": "user@example.com",
    "role": "USER"
  }
}
```

### 1.2 Refresh Token

```http
POST /api/v11/auth/refresh
Authorization: Bearer {refreshToken}
```

### 1.3 Logout

```http
POST /api/v11/auth/logout
Authorization: Bearer {token}
```

---

## 2. Health & Status

### 2.1 Health Check

```http
GET /q/health
```

**Response:**
```json
{
  "status": "UP",
  "checks": [
    {
      "name": "Database connections health check",
      "status": "UP"
    },
    {
      "name": "oracle-service",
      "status": "UP",
      "data": {
        "active_oracles": 9,
        "minimum_required": 3
      }
    }
  ]
}
```

### 2.2 Node Info

```http
GET /api/v11/info
```

**Response:**
```json
{
  "version": "12.0.0",
  "nodeType": "validator",
  "networkId": "mainnet",
  "blockHeight": 15234567,
  "peerCount": 42,
  "uptime": 864000
}
```

### 2.3 Metrics

```http
GET /q/metrics
```

---

## 3. Transactions

### 3.1 Submit Transaction

```http
POST /api/v11/transactions
Authorization: Bearer {token}
Content-Type: application/json

{
  "from": "0x1234...5678",
  "to": "0xabcd...efgh",
  "value": "1000000000000000000",
  "data": "0x...",
  "gasPrice": "20000000000",
  "gasLimit": "21000",
  "nonce": 42
}
```

**Response:**
```json
{
  "txHash": "0x7890...abcd",
  "status": "PENDING",
  "timestamp": 1702800000000
}
```

### 3.2 Get Transaction

```http
GET /api/v11/transactions/{txHash}
```

**Response:**
```json
{
  "txHash": "0x7890...abcd",
  "from": "0x1234...5678",
  "to": "0xabcd...efgh",
  "value": "1000000000000000000",
  "blockNumber": 15234567,
  "status": "CONFIRMED",
  "gasUsed": "21000",
  "timestamp": 1702800000000
}
```

### 3.3 Get Transaction History

```http
GET /api/v11/transactions?address={address}&page=0&size=20
```

---

## 4. Blocks

### 4.1 Get Latest Block

```http
GET /api/v11/blocks/latest
```

### 4.2 Get Block by Number

```http
GET /api/v11/blocks/{blockNumber}
```

### 4.3 Get Block Transactions

```http
GET /api/v11/blocks/{blockNumber}/transactions
```

---

## 5. Validators

### 5.1 Get Validator List

```http
GET /api/v11/validators
```

**Response:**
```json
{
  "validators": [
    {
      "id": "validator-1",
      "publicKey": "0x...",
      "stake": "100000000000000000000",
      "isActive": true,
      "reputationScore": 98.5
    }
  ],
  "totalValidators": 20,
  "activeValidators": 18
}
```

### 5.2 Get Validator Details

```http
GET /api/v11/validators/{validatorId}
```

### 5.3 Get Staking Info

```http
GET /api/v12/staking/info
Authorization: Bearer {token}
```

---

## 6. User Management

### 6.1 Register User

```http
POST /api/v11/users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securePassword123",
  "fullName": "John Doe"
}
```

### 6.2 Get User Profile

```http
GET /api/v11/users/profile
Authorization: Bearer {token}
```

### 6.3 Update User Profile

```http
PUT /api/v11/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "fullName": "John Doe Updated",
  "company": "Acme Corp"
}
```

---

## 7. User Interests

### 7.1 Record Interest

```http
POST /api/v12/interests
Authorization: Bearer {token}
Content-Type: application/json

{
  "category": "TOKENIZATION",
  "useCase": "commercial_property",
  "actionType": "DEMO_START",
  "source": "dashboard",
  "sessionId": "session-123",
  "metadata": "{\"page\":\"rwa-demo\"}"
}
```

### 7.2 Get My Interests

```http
GET /api/v12/interests/me?limit=50
Authorization: Bearer {token}
```

### 7.3 Get My Engagement Score

```http
GET /api/v12/interests/me/engagement
Authorization: Bearer {token}
```

### 7.4 Get Category Analytics (Admin)

```http
GET /api/v12/interests/analytics/category/{category}
Authorization: Bearer {token}
```

### 7.5 Get High Priority Leads (Admin)

```http
GET /api/v12/interests/leads/high-priority
Authorization: Bearer {token}
```

---

## 8. Use Case Feedback

### 8.1 Like Use Case

```http
POST /api/v12/feedback/like
Authorization: Bearer {token}
Content-Type: application/json

{
  "useCaseId": "commercial_property",
  "category": "TOKENIZATION"
}
```

### 8.2 Add Comment

```http
POST /api/v12/feedback/comment
Authorization: Bearer {token}
Content-Type: application/json

{
  "useCaseId": "commercial_property",
  "category": "TOKENIZATION",
  "commentText": "This is very helpful!",
  "parentId": null
}
```

### 8.3 Rate Use Case

```http
POST /api/v12/feedback/rate
Authorization: Bearer {token}
Content-Type: application/json

{
  "useCaseId": "commercial_property",
  "category": "TOKENIZATION",
  "rating": 5
}
```

### 8.4 Get Feedback Summary

```http
GET /api/v12/feedback/summary/{useCaseId}
```

**Response:**
```json
{
  "useCaseId": "commercial_property",
  "likes": 42,
  "comments": 15,
  "averageRating": 4.7,
  "userLiked": true,
  "userRating": 5
}
```

---

## 9. File Attachments

### 9.1 Upload File

```http
POST /api/v12/files/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: (binary)
category: documents
transactionId: tx-123 (optional)
description: Property deed document
```

**Response:**
```json
{
  "fileId": "file-uuid-123",
  "originalName": "deed.pdf",
  "sha256Hash": "abc123...",
  "cdnUrl": "https://dlt.aurigraph.io/cdn/attachments/file-uuid-123_deed.pdf",
  "size": 1048576
}
```

### 9.2 Get File

```http
GET /api/v12/files/{fileId}
Authorization: Bearer {token}
```

### 9.3 Verify File Hash

```http
POST /api/v12/files/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "fileId": "file-uuid-123",
  "sha256Hash": "abc123..."
}
```

### 9.4 Link File to Transaction

```http
PUT /api/v12/files/{fileId}/link
Authorization: Bearer {token}
Content-Type: application/json

{
  "transactionId": "0x7890...abcd"
}
```

---

## 10. Demo Registration

### 10.1 Register for Demo

```http
POST /api/v12/demos/register
Content-Type: application/json

{
  "email": "user@example.com",
  "fullName": "John Doe",
  "company": "Acme Corp",
  "category": "tokenization",
  "useCase": "commercial_property",
  "source": "website",
  "createAccount": true
}
```

**Response:**
```json
{
  "demoId": "demo-uuid-123",
  "token": "demo_abc123def456",
  "email": "user@example.com",
  "demoUrl": "https://dlt.aurigraph.io/demo/tokenization/commercial_property?token=demo_abc123def456",
  "expiresAt": "2025-12-23T00:00:00Z"
}
```

### 10.2 Get Demo Status

```http
GET /api/v12/demos/register/{token}/status
```

### 10.3 Start Demo

```http
POST /api/v12/demos/register/{token}/start
```

### 10.4 Complete Demo

```http
POST /api/v12/demos/register/{token}/complete
Content-Type: application/json

{
  "feedback": "Great demo experience!",
  "rating": 5
}
```

### 10.5 List Available Demos

```http
GET /api/v12/demos/register/available
```

---

## 11. Oracle Services

### 11.1 Get Oracle Status

```http
GET /api/v11/oracle/status
```

### 11.2 Get Price Feeds

```http
GET /api/v11/oracle/prices?symbols=BTC,ETH,AUR
```

### 11.3 Request Verification

```http
POST /api/v11/oracle/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "verificationType": "property_ownership",
  "data": {
    "propertyId": "prop-123",
    "registry": "singapore_land_authority"
  }
}
```

---

## 12. Cross-Chain Bridge

### 12.1 Get Supported Chains

```http
GET /api/v11/bridge/chains/supported
```

### 12.2 Estimate Bridge Fee

```http
POST /api/v11/bridge/fees/estimate
Content-Type: application/json

{
  "sourceChain": "Ethereum",
  "targetChain": "Aurigraph",
  "tokenSymbol": "USDT",
  "amount": 1000
}
```

### 12.3 Validate Bridge Transaction

```http
POST /api/v11/bridge/validate
Authorization: Bearer {token}
Content-Type: application/json

{
  "bridgeId": "bridge-123",
  "sourceChain": "Ethereum",
  "targetChain": "Aurigraph",
  "sourceAddress": "0x1234...",
  "targetAddress": "0xabcd...",
  "tokenSymbol": "USDT",
  "amount": 1000
}
```

---

## 13. Analytics

### 13.1 Get Network Analytics

```http
GET /api/v12/analytics/network
Authorization: Bearer {token}
```

### 13.2 Get Transaction Analytics

```http
GET /api/v12/analytics/transactions?period=24h
Authorization: Bearer {token}
```

### 13.3 Get TPS Metrics

```http
GET /api/v12/analytics/tps
```

---

## 14. WebSocket Endpoints

### 14.1 Transaction Stream

```javascript
ws://dlt.aurigraph.io/ws/transactions

// Subscribe message
{
  "action": "subscribe",
  "channel": "transactions",
  "filters": {
    "address": "0x1234..."
  }
}
```

### 14.2 Block Stream

```javascript
ws://dlt.aurigraph.io/ws/blocks
```

### 14.3 Validator Stream

```javascript
ws://dlt.aurigraph.io/ws/validators
```

### 14.4 Metrics Stream

```javascript
ws://dlt.aurigraph.io/ws/metrics
```

---

## 15. gRPC Services

### 15.1 Blockchain Service

```protobuf
service BlockchainService {
  rpc GetBlock(BlockRequest) returns (Block);
  rpc GetTransaction(TransactionRequest) returns (Transaction);
  rpc SubmitTransaction(TransactionSubmission) returns (TransactionReceipt);
  rpc StreamBlocks(Empty) returns (stream Block);
}
```

### 15.2 Consensus Service

```protobuf
service ConsensusService {
  rpc ProposeBlock(BlockProposal) returns (ProposalResponse);
  rpc VoteOnBlock(BlockVote) returns (VoteResponse);
  rpc GetValidatorSet(Empty) returns (ValidatorSet);
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

## Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| Public endpoints | 100 req/min |
| Authenticated endpoints | 500 req/min |
| WebSocket connections | 10 per user |
| File uploads | 10 MB max |

---

*Generated for AV11-544: API Endpoint Documentation*
