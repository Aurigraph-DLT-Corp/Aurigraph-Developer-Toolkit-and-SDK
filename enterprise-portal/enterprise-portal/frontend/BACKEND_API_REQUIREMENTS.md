# Backend API Requirements for Feature Enablement

## Overview

This document provides backend developers with a quick reference for implementing APIs required by frontend features. Each feature section includes endpoint specifications, request/response formats, and implementation checklist.

## Quick Reference Table

| Feature | Status | Target Version | Priority | Backend Team |
|---------|--------|----------------|----------|--------------|
| Validator Dashboard | Planned | V12.1 | High | Consensus Team |
| Staking Operations | Planned | V12.1 | High | Consensus Team |
| AI Optimization | Planned | V12.2 | Medium | AI Team |
| ML Models | Planned | V12.2 | Medium | AI Team |
| Predictive Analytics | Planned | V12.2 | Low | AI Team |
| Quantum Security | Planned | V12.3 | Low | Security Team |
| Key Rotation | Planned | V12.3 | Medium | Security Team |
| Security Audits | Planned | V12.3 | Medium | Security Team |
| Vulnerability Scanning | Planned | V12.3 | Low | Security Team |
| Cross-Chain Bridge | Planned | V12.4 | Low | Bridge Team |
| Bridge Transfers | Planned | V12.4 | Low | Bridge Team |
| Real-time Updates | Planned | V12.5 | Medium | Infrastructure Team |
| WebSocket Connection | Planned | V12.5 | Medium | Infrastructure Team |

---

## Validator Dashboard (V12.1)

### Required Endpoints

#### 1. List Validators
```
GET /api/v11/validators
```

**Query Parameters:**
- `page` (optional): Page number (default: 0)
- `size` (optional): Page size (default: 20)
- `status` (optional): Filter by status (active, inactive, jailed)
- `sort` (optional): Sort field (voting_power, commission, uptime)

**Response:**
```json
{
  "success": true,
  "data": {
    "validators": [
      {
        "id": "validator-1",
        "address": "0x1234...5678",
        "moniker": "Aurigraph Validator 1",
        "status": "active",
        "votingPower": "1000000",
        "commission": "0.05",
        "uptime": "99.9",
        "delegatorCount": 150,
        "totalStaked": "5000000",
        "rewardsEarned": "50000",
        "createdAt": "2025-01-01T00:00:00Z",
        "lastBlockProposed": 12345
      }
    ],
    "pagination": {
      "page": 0,
      "size": 20,
      "total": 100
    }
  },
  "timestamp": "2025-12-16T10:30:00Z"
}
```

#### 2. Get Validator Details
```
GET /api/v11/validators/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "validator-1",
    "address": "0x1234...5678",
    "moniker": "Aurigraph Validator 1",
    "description": "Enterprise validator node",
    "website": "https://aurigraph.io",
    "status": "active",
    "votingPower": "1000000",
    "commission": "0.05",
    "maxCommission": "0.20",
    "maxCommissionChange": "0.01",
    "uptime": "99.9",
    "delegatorCount": 150,
    "totalStaked": "5000000",
    "selfStake": "100000",
    "rewardsEarned": "50000",
    "missedBlocks": 5,
    "createdAt": "2025-01-01T00:00:00Z",
    "lastBlockProposed": 12345,
    "jailStatus": {
      "isJailed": false,
      "jailedUntil": null,
      "reason": null
    }
  },
  "timestamp": "2025-12-16T10:30:00Z"
}
```

#### 3. Get Validator Statistics
```
GET /api/v11/validators/:id/stats
```

**Query Parameters:**
- `period` (optional): Time period (24h, 7d, 30d, all)

**Response:**
```json
{
  "success": true,
  "data": {
    "validatorId": "validator-1",
    "period": "24h",
    "blocksProposed": 150,
    "blocksMissed": 2,
    "uptime": "99.9",
    "avgBlockTime": "5.2",
    "rewardsDistributed": "500",
    "newDelegators": 5,
    "lostDelegators": 1,
    "stakingChange": "+50000",
    "votingPowerChange": "+1000"
  },
  "timestamp": "2025-12-16T10:30:00Z"
}
```

#### 4. Get Validator Performance
```
GET /api/v11/validators/:id/performance
```

**Response:**
```json
{
  "success": true,
  "data": {
    "validatorId": "validator-1",
    "performanceScore": 98.5,
    "metrics": {
      "uptime": 99.9,
      "blockSuccessRate": 99.5,
      "avgResponseTime": 100,
      "networkContribution": 85
    },
    "history": [
      {
        "timestamp": "2025-12-16T00:00:00Z",
        "score": 98.5,
        "uptime": 99.9,
        "blocksProposed": 150
      }
    ]
  },
  "timestamp": "2025-12-16T10:30:00Z"
}
```

#### 5. Get Validator Rewards
```
GET /api/v11/validators/:id/rewards
```

**Query Parameters:**
- `from` (optional): Start date
- `to` (optional): End date
- `page` (optional): Page number
- `size` (optional): Page size

**Response:**
```json
{
  "success": true,
  "data": {
    "validatorId": "validator-1",
    "totalRewards": "50000",
    "pendingRewards": "100",
    "claimedRewards": "49900",
    "rewards": [
      {
        "id": "reward-1",
        "amount": "500",
        "type": "block_reward",
        "blockHeight": 12345,
        "timestamp": "2025-12-16T10:00:00Z",
        "claimed": true
      }
    ],
    "pagination": {
      "page": 0,
      "size": 20,
      "total": 500
    }
  },
  "timestamp": "2025-12-16T10:30:00Z"
}
```

### Implementation Checklist

- [ ] Validator Registry service implemented
- [ ] Database schema for validators created
- [ ] Performance metrics collection enabled
- [ ] Reward calculation logic implemented
- [ ] Pagination support added
- [ ] Filtering and sorting implemented
- [ ] Authentication/authorization configured
- [ ] Rate limiting configured
- [ ] API documentation updated
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Performance tests passed

---

## Staking Operations (V12.1)

### Required Endpoints

#### 1. Stake Tokens
```
POST /api/v11/staking/stake
```

**Request:**
```json
{
  "validatorId": "validator-1",
  "amount": "1000",
  "delegatorAddress": "0x9876...5432"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "tx-1",
    "validatorId": "validator-1",
    "amount": "1000",
    "delegatorAddress": "0x9876...5432",
    "status": "pending",
    "timestamp": "2025-12-16T10:30:00Z",
    "estimatedConfirmation": "2025-12-16T10:31:00Z"
  },
  "timestamp": "2025-12-16T10:30:00Z"
}
```

#### 2. Unstake Tokens
```
POST /api/v11/staking/unstake
```

**Request:**
```json
{
  "validatorId": "validator-1",
  "amount": "500",
  "delegatorAddress": "0x9876...5432"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "tx-2",
    "validatorId": "validator-1",
    "amount": "500",
    "delegatorAddress": "0x9876...5432",
    "status": "pending",
    "unbondingPeriod": "21d",
    "availableAt": "2026-01-06T10:30:00Z",
    "timestamp": "2025-12-16T10:30:00Z"
  },
  "timestamp": "2025-12-16T10:30:00Z"
}
```

#### 3. Delegate Tokens
```
POST /api/v11/staking/delegate
```

**Request:**
```json
{
  "validatorId": "validator-1",
  "amount": "2000",
  "delegatorAddress": "0x9876...5432"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "tx-3",
    "validatorId": "validator-1",
    "amount": "2000",
    "delegatorAddress": "0x9876...5432",
    "status": "pending",
    "timestamp": "2025-12-16T10:30:00Z"
  },
  "timestamp": "2025-12-16T10:30:00Z"
}
```

#### 4. Get Staking Rewards
```
GET /api/v11/staking/rewards
```

**Query Parameters:**
- `delegatorAddress` (required): Delegator address
- `validatorId` (optional): Filter by validator

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRewards": "1500",
    "pendingRewards": "50",
    "claimedRewards": "1450",
    "rewardsByValidator": [
      {
        "validatorId": "validator-1",
        "rewards": "1000",
        "pending": "30",
        "claimed": "970"
      }
    ]
  },
  "timestamp": "2025-12-16T10:30:00Z"
}
```

#### 5. Get Staking Positions
```
GET /api/v11/staking/positions
```

**Query Parameters:**
- `delegatorAddress` (required): Delegator address

**Response:**
```json
{
  "success": true,
  "data": {
    "delegatorAddress": "0x9876...5432",
    "totalStaked": "5000",
    "totalDelegated": "3000",
    "positions": [
      {
        "validatorId": "validator-1",
        "validatorMoniker": "Aurigraph Validator 1",
        "stakedAmount": "1000",
        "delegatedAmount": "2000",
        "rewards": "50",
        "stakingDate": "2025-01-01T00:00:00Z"
      }
    ]
  },
  "timestamp": "2025-12-16T10:30:00Z"
}
```

### Implementation Checklist

- [ ] Staking module implemented
- [ ] Transaction builder service created
- [ ] Wallet integration completed
- [ ] Unbonding period logic implemented
- [ ] Reward calculation implemented
- [ ] Delegation tracking implemented
- [ ] Transaction validation added
- [ ] Gas estimation implemented
- [ ] Error handling for insufficient funds
- [ ] Authentication/authorization configured
- [ ] Unit tests written
- [ ] Integration tests written

---

## Real-time Updates (V12.5)

### Required Endpoints

#### 1. WebSocket Connection
```
WS /ws
```

**Connection:**
```javascript
const ws = new WebSocket('wss://dlt.aurigraph.io/ws');
ws.onopen = () => {
  // Send authentication
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'bearer-token'
  }));
};
```

#### 2. Subscribe to Topics
```
WS /api/v11/realtime/subscribe
```

**Subscribe Message:**
```json
{
  "type": "subscribe",
  "topics": ["blocks", "transactions", "validators", "consensus"]
}
```

**Update Message:**
```json
{
  "type": "update",
  "topic": "blocks",
  "data": {
    "blockHeight": 12346,
    "hash": "0xabcd...1234",
    "timestamp": "2025-12-16T10:30:00Z",
    "transactions": 150,
    "validator": "validator-1"
  },
  "timestamp": "2025-12-16T10:30:00Z"
}
```

#### 3. Get Available Topics
```
GET /api/v11/realtime/topics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "name": "blocks",
        "description": "New block notifications",
        "rate": "5s"
      },
      {
        "name": "transactions",
        "description": "New transaction notifications",
        "rate": "realtime"
      },
      {
        "name": "validators",
        "description": "Validator status updates",
        "rate": "30s"
      }
    ]
  },
  "timestamp": "2025-12-16T10:30:00Z"
}
```

### Implementation Checklist

- [ ] WebSocket server implemented
- [ ] Connection pooling configured
- [ ] Heartbeat/ping-pong implemented
- [ ] Authentication for WebSocket
- [ ] Topic subscription management
- [ ] Event bus integration
- [ ] Message queuing implemented
- [ ] Reconnection logic handled
- [ ] Rate limiting per connection
- [ ] Load testing completed
- [ ] Monitoring and logging added

---

## General API Requirements

### Authentication

All endpoints require Bearer token authentication:

```
Authorization: Bearer <token>
```

### Error Response Format

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATOR_NOT_FOUND",
    "message": "Validator with ID 'validator-1' not found",
    "details": {
      "validatorId": "validator-1"
    }
  },
  "timestamp": "2025-12-16T10:30:00Z"
}
```

### Common Error Codes

- `UNAUTHORIZED` (401) - Invalid or missing authentication
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Invalid request parameters
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error

### Rate Limiting

- Standard endpoints: 100 requests/minute per IP
- WebSocket connections: 10 connections per IP
- Bulk operations: 10 requests/minute per IP

### Pagination

Standard pagination parameters:
- `page`: Page number (0-indexed)
- `size`: Items per page (max: 100)

Standard pagination response:
```json
{
  "pagination": {
    "page": 0,
    "size": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Testing Requirements

### 1. Unit Tests
- Test all business logic
- Mock external dependencies
- Achieve >80% code coverage

### 2. Integration Tests
- Test API endpoints end-to-end
- Test database interactions
- Test authentication/authorization

### 3. Performance Tests
- Load test with realistic traffic
- Test response times (<200ms for GET, <500ms for POST)
- Test concurrent connections (WebSocket)

### 4. Security Tests
- Test authentication bypass attempts
- Test SQL injection
- Test rate limiting
- Test input validation

---

## Deployment Checklist

- [ ] API documentation generated (OpenAPI/Swagger)
- [ ] Postman collection created
- [ ] Environment variables documented
- [ ] Database migrations prepared
- [ ] Monitoring and alerting configured
- [ ] Logging configured
- [ ] Health check endpoint working
- [ ] Load balancer configured
- [ ] SSL/TLS certificates installed
- [ ] CORS configured correctly
- [ ] Rate limiting configured
- [ ] Backup and recovery tested

---

## Contact

For questions or clarifications:
- Frontend Team: frontend@aurigraph.io
- Backend Team: backend@aurigraph.io
- DevOps Team: devops@aurigraph.io

---

**Last Updated**: 2025-12-16
**Version**: 12.0.0
