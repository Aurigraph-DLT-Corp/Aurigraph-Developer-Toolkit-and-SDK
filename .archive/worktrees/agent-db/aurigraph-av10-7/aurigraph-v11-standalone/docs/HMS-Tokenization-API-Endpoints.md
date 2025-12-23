# HMS Tokenization API Endpoints
**Version**: 1.0  
**Date**: September 15, 2025  
**Base URL**: http://localhost:9006/api/v11/tokenization  
**HMS Integration**: http://localhost:9005/hms/api/v1  
**Authentication**: Bearer Token / OAuth 2.0

## Overview

The HMS Tokenization API provides comprehensive endpoints for creating, managing, and trading tokenized assets integrated with the Hermes Management System (HMS). This API supports multiple token standards and real-world asset tokenization with full compliance and regulatory support.

## Authentication

All endpoints require authentication via Bearer token or OAuth 2.0:

```bash
# Bearer Token Authentication
curl -H "Authorization: Bearer <access_token>" \
     -H "Content-Type: application/json" \
     "http://localhost:9006/api/v11/tokenization/tokens"

# OAuth 2.0 Authentication
curl -H "Authorization: OAuth <oauth_token>" \
     -H "Content-Type: application/json" \
     "http://localhost:9006/api/v11/tokenization/tokens"
```

## Token Management Endpoints

### 1. Create Token

**Endpoint**: `POST /api/v11/tokenization/tokens/create`

Create a new token with specified standard and parameters.

```bash
curl -X POST http://localhost:9006/api/v11/tokenization/tokens/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "tokenType": "ERC20",
    "name": "Aurigraph Utility Token",
    "symbol": "AUR",
    "totalSupply": 1000000000,
    "decimals": 18,
    "mintable": true,
    "burnable": true,
    "pausable": false,
    "hmsIntegration": {
      "enabled": true,
      "assetClass": "UTILITY",
      "complianceLevel": "STANDARD"
    },
    "metadata": {
      "description": "Utility token for Aurigraph platform",
      "website": "https://aurigraph.io",
      "logo": "https://aurigraph.io/logo.png"
    }
  }'
```

**Response**:
```json
{
  "success": true,
  "tokenId": "AUR-001-2025091501",
  "contractAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "transactionHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "blockNumber": 15234567,
  "gasUsed": 2547891,
  "hms": {
    "assetId": "HMS-AUR-001",
    "registrationStatus": "REGISTERED",
    "complianceStatus": "APPROVED"
  },
  "deployedAt": "2025-09-15T10:30:45Z"
}
```

### 2. Get Token Details

**Endpoint**: `GET /api/v11/tokenization/tokens/{tokenId}`

Retrieve detailed information about a specific token.

```bash
curl -X GET http://localhost:9006/api/v11/tokenization/tokens/AUR-001-2025091501 \
  -H "Authorization: Bearer <token>"
```

**Response**:
```json
{
  "tokenId": "AUR-001-2025091501",
  "contractAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "tokenType": "ERC20",
  "name": "Aurigraph Utility Token",
  "symbol": "AUR",
  "totalSupply": "1000000000000000000000000000",
  "circulatingSupply": "750000000000000000000000000",
  "decimals": 18,
  "holders": 15847,
  "transactions": 234567,
  "status": "ACTIVE",
  "hms": {
    "assetId": "HMS-AUR-001",
    "assetClass": "UTILITY",
    "complianceLevel": "STANDARD",
    "lastSyncAt": "2025-09-15T10:45:30Z",
    "syncStatus": "SYNCHRONIZED"
  },
  "performance": {
    "24hVolume": "15000000000000000000000000",
    "24hTransactions": 3456,
    "currentPrice": "0.15",
    "marketCap": "150000000"
  },
  "createdAt": "2025-09-15T10:30:45Z",
  "updatedAt": "2025-09-15T10:45:30Z"
}
```

### 3. List All Tokens

**Endpoint**: `GET /api/v11/tokenization/tokens`

Retrieve a paginated list of all tokens.

```bash
curl -X GET "http://localhost:9006/api/v11/tokenization/tokens?page=1&limit=20&tokenType=ERC20" \
  -H "Authorization: Bearer <token>"
```

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)
- `tokenType`: Filter by token type (ERC20, ERC721, ERC1155, RICARDIAN)
- `status`: Filter by status (ACTIVE, PAUSED, DEPRECATED)
- `hmsEnabled`: Filter by HMS integration (true/false)

**Response**:
```json
{
  "success": true,
  "tokens": [
    {
      "tokenId": "AUR-001-2025091501",
      "name": "Aurigraph Utility Token",
      "symbol": "AUR",
      "tokenType": "ERC20",
      "totalSupply": "1000000000000000000000000000",
      "status": "ACTIVE",
      "hmsEnabled": true,
      "createdAt": "2025-09-15T10:30:45Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 4. Update Token

**Endpoint**: `PUT /api/v11/tokenization/tokens/{tokenId}`

Update token metadata and configuration.

```bash
curl -X PUT http://localhost:9006/api/v11/tokenization/tokens/AUR-001-2025091501 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "metadata": {
      "description": "Updated utility token for Aurigraph platform",
      "website": "https://v2.aurigraph.io"
    },
    "hmsIntegration": {
      "complianceLevel": "ENHANCED"
    }
  }'
```

**Response**:
```json
{
  "success": true,
  "tokenId": "AUR-001-2025091501",
  "updated": true,
  "hms": {
    "syncStatus": "PENDING_SYNC",
    "lastSyncAt": "2025-09-15T10:45:30Z"
  },
  "updatedAt": "2025-09-15T11:00:15Z"
}
```

## RWA (Real-World Asset) Tokenization Endpoints

### 1. Create RWA Token

**Endpoint**: `POST /api/v11/tokenization/rwa/create`

Tokenize a real-world asset with HMS compliance integration.

```bash
curl -X POST http://localhost:9006/api/v11/tokenization/rwa/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "assetType": "REAL_ESTATE",
    "assetDetails": {
      "name": "Downtown Commercial Property",
      "description": "Prime commercial real estate in downtown financial district",
      "location": {
        "address": "123 Wall Street, New York, NY 10005",
        "coordinates": {
          "latitude": 40.7074,
          "longitude": -74.0113
        }
      },
      "valuation": {
        "amount": 50000000,
        "currency": "USD",
        "appraisalDate": "2025-09-01",
        "appraiser": "Premier Real Estate Appraisals LLC"
      }
    },
    "tokenization": {
      "tokenStandard": "ERC1155",
      "totalTokens": 50000,
      "pricePerToken": 1000,
      "minimumInvestment": 5000,
      "fractionalOwnership": true
    },
    "hmsCompliance": {
      "kycRequired": true,
      "amlCheck": true,
      "accreditedInvestorOnly": true,
      "jurisdiction": "US",
      "regulatoryFramework": "SEC_REGULATION_D"
    },
    "legalDocuments": {
      "propertyDeed": "https://docs.aurigraph.io/rwa/deed-123.pdf",
      "appraisalReport": "https://docs.aurigraph.io/rwa/appraisal-123.pdf",
      "legalOpinion": "https://docs.aurigraph.io/rwa/legal-123.pdf"
    }
  }'
```

**Response**:
```json
{
  "success": true,
  "rwaTokenId": "RWA-RE-001-2025091502",
  "contractAddress": "0xabcdef1234567890abcdef1234567890abcdef12",
  "assetId": "HMS-RWA-RE-001",
  "tokenization": {
    "totalTokens": 50000,
    "availableTokens": 50000,
    "soldTokens": 0,
    "pricePerToken": 1000,
    "totalValue": 50000000
  },
  "hms": {
    "registrationStatus": "REGISTERED",
    "complianceStatus": "APPROVED",
    "kycStatus": "ENABLED",
    "amlStatus": "ENABLED"
  },
  "legalCompliance": {
    "jurisdiction": "US",
    "regulatoryStatus": "COMPLIANT",
    "filingReference": "SEC-D-2025-091502"
  },
  "deployedAt": "2025-09-15T11:15:30Z"
}
```

### 2. Get RWA Token Details

**Endpoint**: `GET /api/v11/tokenization/rwa/{rwaTokenId}`

Retrieve comprehensive details about an RWA token.

```bash
curl -X GET http://localhost:9006/api/v11/tokenization/rwa/RWA-RE-001-2025091502 \
  -H "Authorization: Bearer <token>"
```

**Response**:
```json
{
  "rwaTokenId": "RWA-RE-001-2025091502",
  "contractAddress": "0xabcdef1234567890abcdef1234567890abcdef12",
  "assetType": "REAL_ESTATE",
  "assetDetails": {
    "name": "Downtown Commercial Property",
    "description": "Prime commercial real estate in downtown financial district",
    "location": {
      "address": "123 Wall Street, New York, NY 10005",
      "coordinates": {
        "latitude": 40.7074,
        "longitude": -74.0113
      }
    },
    "currentValuation": {
      "amount": 52000000,
      "currency": "USD",
      "lastUpdated": "2025-09-15T11:00:00Z",
      "appreciationRate": 4.0
    }
  },
  "tokenization": {
    "totalTokens": 50000,
    "availableTokens": 32450,
    "soldTokens": 17550,
    "currentPrice": 1040,
    "minimumInvestment": 5000,
    "fractionalOwnership": true
  },
  "ownership": {
    "totalInvestors": 87,
    "averageInvestment": 23456,
    "largestInvestment": 250000,
    "ownership": [
      {
        "investorId": "INV-001",
        "tokens": 240,
        "percentage": 0.48,
        "investment": 250000
      }
    ]
  },
  "hms": {
    "assetId": "HMS-RWA-RE-001",
    "registrationStatus": "REGISTERED",
    "complianceStatus": "APPROVED",
    "lastAuditDate": "2025-09-10",
    "nextAuditDate": "2025-12-10",
    "syncStatus": "SYNCHRONIZED",
    "lastSyncAt": "2025-09-15T11:30:00Z"
  },
  "performance": {
    "totalRevenue": 234567,
    "netIncome": 187234,
    "dividendsDistributed": 156789,
    "occupancyRate": 95.5,
    "monthlyRent": 45678
  },
  "compliance": {
    "jurisdiction": "US",
    "regulatoryStatus": "COMPLIANT",
    "kycCompliance": 100,
    "amlCompliance": 100,
    "lastComplianceCheck": "2025-09-15T09:00:00Z"
  },
  "createdAt": "2025-09-15T11:15:30Z",
  "updatedAt": "2025-09-15T11:30:00Z"
}
```

### 3. List RWA Assets

**Endpoint**: `GET /api/v11/tokenization/rwa`

Retrieve a list of all RWA tokens with filtering options.

```bash
curl -X GET "http://localhost:9006/api/v11/tokenization/rwa?assetType=REAL_ESTATE&status=ACTIVE&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

**Query Parameters**:
- `assetType`: REAL_ESTATE, COMMODITIES, ART, BONDS
- `status`: ACTIVE, PENDING, SOLD_OUT, DEPRECATED
- `minInvestment`: Minimum investment amount filter
- `maxInvestment`: Maximum investment amount filter
- `jurisdiction`: Legal jurisdiction filter
- `page`: Page number
- `limit`: Results per page

## HMS Integration Endpoints

### 1. HMS Sync Status

**Endpoint**: `GET /api/v11/tokenization/hms/sync/{tokenId}`

Check HMS synchronization status for a specific token.

```bash
curl -X GET http://localhost:9006/api/v11/tokenization/hms/sync/AUR-001-2025091501 \
  -H "Authorization: Bearer <token>"
```

**Response**:
```json
{
  "tokenId": "AUR-001-2025091501",
  "hmsAssetId": "HMS-AUR-001",
  "syncStatus": "SYNCHRONIZED",
  "lastSyncAt": "2025-09-15T11:45:00Z",
  "nextSyncAt": "2025-09-15T12:00:00Z",
  "syncFrequency": "15_MINUTES",
  "syncHealth": "HEALTHY",
  "dataIntegrity": "VERIFIED",
  "complianceStatus": "APPROVED"
}
```

### 2. Force HMS Sync

**Endpoint**: `POST /api/v11/tokenization/hms/sync/{tokenId}/force`

Force immediate synchronization with HMS for a specific token.

```bash
curl -X POST http://localhost:9006/api/v11/tokenization/hms/sync/AUR-001-2025091501/force \
  -H "Authorization: Bearer <token>"
```

**Response**:
```json
{
  "success": true,
  "tokenId": "AUR-001-2025091501",
  "syncInitiated": true,
  "syncId": "SYNC-2025091511450001",
  "estimatedCompletion": "2025-09-15T11:47:00Z",
  "message": "HMS synchronization initiated successfully"
}
```

### 3. HMS Health Check

**Endpoint**: `GET /api/v11/tokenization/hms/health`

Check overall HMS integration health and connectivity.

```bash
curl -X GET http://localhost:9006/api/v11/tokenization/hms/health \
  -H "Authorization: Bearer <token>"
```

**Response**:
```json
{
  "status": "HEALTHY",
  "connectivity": "CONNECTED",
  "lastPingAt": "2025-09-15T11:45:30Z",
  "responseTime": 45,
  "services": {
    "assetManagement": "OPERATIONAL",
    "compliance": "OPERATIONAL",
    "documentation": "OPERATIONAL",
    "reporting": "OPERATIONAL"
  },
  "statistics": {
    "totalTokensSynced": 156,
    "successfulSyncs24h": 2847,
    "failedSyncs24h": 3,
    "averageSyncTime": 2.3,
    "uptime": "99.98%"
  }
}
```

## Transaction and Trading Endpoints

### 1. Token Transfer

**Endpoint**: `POST /api/v11/tokenization/transactions/transfer`

Transfer tokens between addresses with HMS compliance tracking.

```bash
curl -X POST http://localhost:9006/api/v11/tokenization/transactions/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "tokenId": "AUR-001-2025091501",
    "from": "0x1234567890abcdef1234567890abcdef12345678",
    "to": "0xabcdef1234567890abcdef1234567890abcdef12",
    "amount": "1000000000000000000000",
    "hmsCompliance": {
      "kycVerified": true,
      "amlCleared": true,
      "transferReason": "TRADE"
    },
    "metadata": {
      "reference": "TXN-REF-001",
      "description": "Token purchase transaction"
    }
  }'
```

**Response**:
```json
{
  "success": true,
  "transactionHash": "0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
  "transactionId": "TXN-001-2025091512",
  "blockNumber": 15234890,
  "gasUsed": 45678,
  "status": "CONFIRMED",
  "hms": {
    "complianceCheck": "PASSED",
    "reportingStatus": "FILED",
    "auditTrail": "RECORDED"
  },
  "processedAt": "2025-09-15T12:00:15Z"
}
```

### 2. Get Transaction History

**Endpoint**: `GET /api/v11/tokenization/transactions/{tokenId}`

Retrieve transaction history for a specific token.

```bash
curl -X GET "http://localhost:9006/api/v11/tokenization/transactions/AUR-001-2025091501?page=1&limit=50" \
  -H "Authorization: Bearer <token>"
```

**Response**:
```json
{
  "tokenId": "AUR-001-2025091501",
  "transactions": [
    {
      "transactionId": "TXN-001-2025091512",
      "transactionHash": "0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
      "type": "TRANSFER",
      "from": "0x1234567890abcdef1234567890abcdef12345678",
      "to": "0xabcdef1234567890abcdef1234567890abcdef12",
      "amount": "1000000000000000000000",
      "blockNumber": 15234890,
      "gasUsed": 45678,
      "status": "CONFIRMED",
      "timestamp": "2025-09-15T12:00:15Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 234567,
    "totalPages": 4692
  }
}
```

## Compliance and Reporting Endpoints

### 1. Generate Compliance Report

**Endpoint**: `POST /api/v11/tokenization/compliance/report`

Generate comprehensive compliance report for regulatory purposes.

```bash
curl -X POST http://localhost:9006/api/v11/tokenization/compliance/report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "reportType": "QUARTERLY",
    "period": {
      "startDate": "2025-07-01",
      "endDate": "2025-09-30"
    },
    "tokenIds": ["AUR-001-2025091501", "RWA-RE-001-2025091502"],
    "includeTransactions": true,
    "includeKYC": true,
    "includeAML": true,
    "format": "PDF"
  }'
```

**Response**:
```json
{
  "success": true,
  "reportId": "RPT-Q3-2025-001",
  "status": "GENERATED",
  "downloadUrl": "https://reports.aurigraph.io/compliance/RPT-Q3-2025-001.pdf",
  "reportSummary": {
    "totalTokens": 2,
    "totalTransactions": 45678,
    "totalValue": 87654321,
    "complianceScore": 99.8,
    "riskLevel": "LOW"
  },
  "hms": {
    "filedWithRegulator": true,
    "filingReference": "HMS-RPT-Q3-2025-001",
    "filingDate": "2025-09-15T12:15:00Z"
  },
  "generatedAt": "2025-09-15T12:15:00Z",
  "expiresAt": "2025-10-15T12:15:00Z"
}
```

## Webhook Endpoints

### 1. Configure Webhooks

**Endpoint**: `POST /api/v11/tokenization/webhooks/configure`

Configure webhook endpoints for real-time notifications.

```bash
curl -X POST http://localhost:9006/api/v11/tokenization/webhooks/configure \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "webhookUrl": "https://your-app.com/api/webhooks/tokenization",
    "events": [
      "TOKEN_CREATED",
      "TOKEN_TRANSFERRED",
      "RWA_TOKENIZED",
      "HMS_SYNC_COMPLETED",
      "COMPLIANCE_ALERT"
    ],
    "authentication": {
      "type": "HMAC_SHA256",
      "secret": "your-webhook-secret"
    }
  }'
```

**Response**:
```json
{
  "success": true,
  "webhookId": "WH-001-2025091512",
  "status": "ACTIVE",
  "verificationToken": "wh_verify_abc123def456",
  "createdAt": "2025-09-15T12:20:00Z"
}
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN_TYPE",
    "message": "The specified token type is not supported",
    "details": {
      "supportedTypes": ["ERC20", "ERC721", "ERC1155", "RICARDIAN"],
      "providedType": "ERC777"
    }
  },
  "timestamp": "2025-09-15T12:25:00Z",
  "requestId": "req-123456789"
}
```

## Rate Limiting

API endpoints are rate-limited based on authentication tier:

- **Free Tier**: 100 requests/minute
- **Standard Tier**: 1,000 requests/minute  
- **Premium Tier**: 10,000 requests/minute
- **Enterprise Tier**: Unlimited

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1694782800
```

## SDK and Client Libraries

Official SDKs available for:
- JavaScript/TypeScript: `npm install @aurigraph/tokenization-sdk`
- Python: `pip install aurigraph-tokenization`
- Java: Maven dependency available
- Go: `go get github.com/aurigraph/tokenization-go`

---

**API Status**: ✅ Live and Operational  
**Base URL**: http://localhost:9006/api/v11/tokenization  
**Documentation**: Complete with examples  
**Support**: Full technical support available  
**Last Updated**: September 15, 2025