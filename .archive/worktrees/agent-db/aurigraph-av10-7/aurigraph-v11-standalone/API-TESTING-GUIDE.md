# API Testing Guide - Aurigraph V11 Enterprise Portal

**Target Audience:** Sprint 20 Development Team
**Purpose:** Comprehensive guide for testing all backend REST APIs and WebSocket endpoints
**Time to Complete:** Review in 15-20 minutes, use as reference during development

---

## Overview

This guide provides copy-paste ready examples for testing all Aurigraph V11 backend endpoints. Each section includes:

- **Endpoint URL** and HTTP method
- **Request examples** with curl and Postman
- **Expected responses** with status codes
- **Error scenarios** and handling
- **WebSocket testing** with multiple tools

---

## Table of Contents

1. [Testing Tools Setup](#testing-tools-setup)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Platform Status Endpoints](#platform-status-endpoints)
4. [Demo Management Endpoints](#demo-management-endpoints)
5. [Transaction Endpoints](#transaction-endpoints)
6. [Live Data Endpoints](#live-data-endpoints)
7. [WebSocket Endpoints](#websocket-endpoints)
8. [JWT Token Testing](#jwt-token-testing)
9. [Error Handling Examples](#error-handling-examples)
10. [Postman Collection](#postman-collection)

---

## Testing Tools Setup

### Install curl (Usually Pre-installed)

**macOS/Linux:**
```bash
curl --version
# Expected: curl 7.x or higher
```

**Windows:**
```bash
# Use Git Bash or WSL2
curl --version
```

---

### Install websocat (For WebSocket Testing)

**macOS:**
```bash
brew install websocat
```

**Linux:**
```bash
cargo install websocat
```

**Windows:**
```bash
# Download from: https://github.com/vi/websocat/releases
```

---

### Install jq (For JSON Formatting)

**macOS:**
```bash
brew install jq
```

**Linux:**
```bash
sudo apt install jq
```

**Usage:**
```bash
curl http://localhost:9003/api/v11/status | jq
```

---

## Authentication Endpoints

### POST /api/v11/login/authenticate

**Description:** Authenticate user and create session

---

#### Request Example (curl)
```bash
curl -v -X POST http://localhost:9003/api/v11/login/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demo",
    "password": "demo123"
  }'
```

---

#### Expected Response (200 OK)
```json
{
  "sessionId": "abc123def456...",
  "username": "demo",
  "success": true,
  "message": "Login successful"
}
```

**Response Headers:**
```
Set-Cookie: session_id=abc123def456...; Path=/; HttpOnly; Max-Age=28800
```

---

#### Save Session Cookie
```bash
# Save cookie to file
curl -c cookies.txt -X POST http://localhost:9003/api/v11/login/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'

# Use cookie in subsequent requests
curl -b cookies.txt http://localhost:9003/api/v11/demos
```

---

#### Error Scenarios

**Invalid Credentials (401 Unauthorized):**
```bash
curl -X POST http://localhost:9003/api/v11/login/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "username": "wrong",
    "password": "wrong"
  }'
```

**Expected Response:**
```json
{
  "error": "Invalid credentials"
}
```

---

**Missing Fields (400 Bad Request):**
```bash
curl -X POST http://localhost:9003/api/v11/login/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demo"
  }'
```

**Expected Response:**
```json
{
  "error": "Username and password are required"
}
```

---

### GET /api/v11/login/verify

**Description:** Verify session is still valid

---

#### Request Example (curl)
```bash
curl -b cookies.txt http://localhost:9003/api/v11/login/verify
```

---

#### Expected Response (200 OK)
```json
{
  "sessionId": "abc123def456...",
  "username": "demo",
  "userData": {
    "userId": "user-123",
    "email": "demo@aurigraph.io",
    "role": "USER"
  }
}
```

---

#### Error Scenarios

**No Session (401 Unauthorized):**
```bash
curl http://localhost:9003/api/v11/login/verify
```

**Expected Response:**
```json
{
  "error": "No session"
}
```

---

**Expired Session (401 Unauthorized):**
```bash
# Use expired session cookie
curl -b expired_cookies.txt http://localhost:9003/api/v11/login/verify
```

**Expected Response:**
```json
{
  "error": "Invalid or expired session"
}
```

---

### POST /api/v11/login/logout

**Description:** Invalidate session and clear cookie

---

#### Request Example (curl)
```bash
curl -b cookies.txt -c cookies.txt -X POST http://localhost:9003/api/v11/login/logout
```

---

#### Expected Response (200 OK)
```json
{
  "message": "Logged out successfully"
}
```

**Response Headers:**
```
Set-Cookie: session_id=; Path=/; Max-Age=0
```

---

## Platform Status Endpoints

### GET /api/v11/status

**Description:** Get platform status and version

---

#### Request Example (curl)
```bash
curl http://localhost:9003/api/v11/status | jq
```

---

#### Expected Response (200 OK)
```json
{
  "status": "running",
  "version": "11.4.4",
  "uptime": "3h 24m 15s",
  "nodeId": "node-001",
  "timestamp": 1730000000000
}
```

---

### GET /api/v11/info

**Description:** Get system information

---

#### Request Example (curl)
```bash
curl http://localhost:9003/api/v11/info | jq
```

---

#### Expected Response (200 OK)
```json
{
  "javaVersion": "21.0.1",
  "osName": "Mac OS X",
  "osVersion": "14.1",
  "availableProcessors": 10,
  "totalMemory": "16GB",
  "freeMemory": "8GB",
  "maxMemory": "16GB"
}
```

---

### GET /q/health

**Description:** Quarkus health check endpoint

---

#### Request Example (curl)
```bash
curl http://localhost:9003/q/health | jq
```

---

#### Expected Response (200 OK)
```json
{
  "status": "UP",
  "checks": [
    {
      "name": "Database connections health check",
      "status": "UP"
    },
    {
      "name": "Reactive PostgreSQL Client health check",
      "status": "UP"
    }
  ]
}
```

---

## Demo Management Endpoints

### GET /api/v11/demos

**Description:** List all demos (requires authentication)

---

#### Request Example (curl)
```bash
curl -b cookies.txt http://localhost:9003/api/v11/demos | jq
```

---

#### Expected Response (200 OK)
```json
[
  {
    "id": "demo-001",
    "demoName": "Supply Chain Demo",
    "status": "ACTIVE",
    "userEmail": "demo@example.com",
    "userName": "Demo User",
    "description": "Supply chain traceability demo",
    "createdAt": "2024-11-01T10:00:00Z",
    "channels": [
      {
        "id": "channel-001",
        "name": "main-channel",
        "type": "public"
      }
    ]
  }
]
```

---

#### Error Scenarios

**Not Authenticated (401 Unauthorized):**
```bash
curl http://localhost:9003/api/v11/demos
```

**Expected Response:**
```json
{
  "error": "Unauthorized"
}
```

---

### POST /api/v11/demos

**Description:** Create new demo (requires authentication)

---

#### Request Example (curl)
```bash
curl -b cookies.txt -X POST http://localhost:9003/api/v11/demos \
  -H "Content-Type: application/json" \
  -d '{
    "demoName": "Test Demo",
    "userEmail": "test@example.com",
    "userName": "Test User",
    "description": "Test demo for Sprint 20",
    "demoType": "TRACEABILITY"
  }' | jq
```

---

#### Expected Response (201 Created)
```json
{
  "id": "demo-002",
  "demoName": "Test Demo",
  "status": "PENDING",
  "userEmail": "test@example.com",
  "userName": "Test User",
  "description": "Test demo for Sprint 20",
  "createdAt": "2024-11-10T15:30:00Z"
}
```

---

#### Error Scenarios

**Missing Required Fields (400 Bad Request):**
```bash
curl -b cookies.txt -X POST http://localhost:9003/api/v11/demos \
  -H "Content-Type: application/json" \
  -d '{
    "demoName": "Test Demo"
  }'
```

**Expected Response:**
```json
{
  "error": "userEmail is required"
}
```

---

### GET /api/v11/demos/{id}

**Description:** Get demo details

---

#### Request Example (curl)
```bash
curl -b cookies.txt http://localhost:9003/api/v11/demos/demo-001 | jq
```

---

#### Expected Response (200 OK)
```json
{
  "id": "demo-001",
  "demoName": "Supply Chain Demo",
  "status": "ACTIVE",
  "userEmail": "demo@example.com",
  "userName": "Demo User",
  "description": "Supply chain traceability demo",
  "createdAt": "2024-11-01T10:00:00Z",
  "channels": [
    {
      "id": "channel-001",
      "name": "main-channel",
      "type": "public",
      "validators": 5,
      "nodes": 10
    }
  ],
  "statistics": {
    "totalTransactions": 15000,
    "currentTPS": 1250,
    "uptime": "9d 5h 23m"
  }
}
```

---

### POST /api/v11/demos/{id}/start

**Description:** Start a demo

---

#### Request Example (curl)
```bash
curl -b cookies.txt -X POST http://localhost:9003/api/v11/demos/demo-001/start | jq
```

---

#### Expected Response (200 OK)
```json
{
  "id": "demo-001",
  "status": "RUNNING",
  "message": "Demo started successfully"
}
```

---

### POST /api/v11/demos/{id}/stop

**Description:** Stop a demo

---

#### Request Example (curl)
```bash
curl -b cookies.txt -X POST http://localhost:9003/api/v11/demos/demo-001/stop | jq
```

---

#### Expected Response (200 OK)
```json
{
  "id": "demo-001",
  "status": "STOPPED",
  "message": "Demo stopped successfully"
}
```

---

## Transaction Endpoints

### POST /api/v11/transactions

**Description:** Process single transaction

---

#### Request Example (curl)
```bash
curl -b cookies.txt -X POST http://localhost:9003/api/v11/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "from": "0x1234567890abcdef",
    "to": "0xabcdef1234567890",
    "amount": 100.50,
    "data": "Payment for goods"
  }' | jq
```

---

#### Expected Response (200 OK)
```json
{
  "transactionId": "txn-abc123",
  "status": "confirmed",
  "blockHeight": 12345,
  "timestamp": 1730000000000,
  "gasUsed": 21000
}
```

---

### POST /api/v11/transactions/batch

**Description:** Process batch transactions

---

#### Request Example (curl)
```bash
curl -b cookies.txt -X POST http://localhost:9003/api/v11/transactions/batch \
  -H "Content-Type: application/json" \
  -d '{
    "batchSize": 100,
    "minAmount": 10,
    "maxAmount": 1000
  }' | jq
```

---

#### Expected Response (200 OK)
```json
{
  "batchId": "batch-xyz789",
  "totalTransactions": 100,
  "successfulTransactions": 98,
  "failedTransactions": 2,
  "averageTPS": 1250,
  "processingTimeMs": 80
}
```

---

### GET /api/v11/transactions/stats

**Description:** Get transaction statistics

---

#### Request Example (curl)
```bash
curl -b cookies.txt http://localhost:9003/api/v11/transactions/stats | jq
```

---

#### Expected Response (200 OK)
```json
{
  "totalTransactions": 1500000,
  "currentTPS": 1250,
  "averageTPS": 1100,
  "peakTPS": 2000,
  "successRate": 99.8,
  "last24Hours": {
    "transactions": 100000,
    "avgTPS": 1157
  }
}
```

---

## Live Data Endpoints

### GET /api/v11/live/validators

**Description:** Get live validator data

---

#### Request Example (curl)
```bash
curl http://localhost:9003/api/v11/live/validators | jq
```

---

#### Expected Response (200 OK)
```json
[
  {
    "id": "validator-001",
    "name": "Node Alpha",
    "status": "active",
    "votingPower": 1000,
    "uptime": "99.95%",
    "lastBlockProposed": 12345,
    "totalBlocksProposed": 5678
  },
  {
    "id": "validator-002",
    "name": "Node Beta",
    "status": "active",
    "votingPower": 950,
    "uptime": "99.92%",
    "lastBlockProposed": 12340,
    "totalBlocksProposed": 5432
  }
]
```

---

## WebSocket Endpoints

### Overview

Aurigraph V11 provides 7 WebSocket endpoints for real-time data streaming:

1. `/ws/transactions` - Transaction events
2. `/ws/validators` - Validator status changes
3. `/ws/consensus` - Consensus protocol events
4. `/ws/network` - Network topology updates
5. `/ws/metrics` - Performance metrics
6. `/ws/channels` - Multi-channel updates
7. `/api/v11/live/stream` - Unified live data stream

---

### Testing with websocat

#### Transactions WebSocket
```bash
websocat ws://localhost:9003/ws/transactions
```

**Expected Output:**
```json
{"type":"NEW_TRANSACTION","payload":{"id":"txn-001","from":"0x123...","to":"0xabc...","amount":100},"timestamp":1730000000000}
{"type":"TRANSACTION_CONFIRMED","payload":{"id":"txn-001","blockHeight":12345},"timestamp":1730000010000}
```

**Press Ctrl+C to disconnect**

---

#### Validators WebSocket
```bash
websocat ws://localhost:9003/ws/validators
```

**Expected Output:**
```json
{"type":"VALIDATOR_STATUS_CHANGE","payload":{"id":"validator-001","status":"active"},"timestamp":1730000000000}
{"type":"NEW_VALIDATOR","payload":{"id":"validator-005","name":"Node Epsilon"},"timestamp":1730000020000}
```

---

#### Metrics WebSocket
```bash
websocat ws://localhost:9003/ws/metrics
```

**Expected Output:**
```json
{"type":"TPS_UPDATE","payload":{"tps":1250,"blockHeight":12345},"timestamp":1730000000000}
{"type":"MEMORY_UPDATE","payload":{"used":"8GB","free":"8GB"},"timestamp":1730000005000}
```

---

### Testing with wscat (Alternative)

**Install wscat:**
```bash
npm install -g wscat
```

**Connect to WebSocket:**
```bash
wscat -c ws://localhost:9003/ws/transactions
```

**Expected:** Connection opens, messages stream in

---

### Testing with Browser JavaScript

**Open browser console (F12) and run:**
```javascript
// Connect to transactions WebSocket
const ws = new WebSocket('ws://localhost:9003/ws/transactions');

// Handle connection opened
ws.onopen = () => {
  console.log('✅ WebSocket connected');
};

// Handle incoming messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('📨 Received:', message.type, message.payload);
};

// Handle errors
ws.onerror = (error) => {
  console.error('❌ WebSocket error:', error);
};

// Handle connection closed
ws.onclose = () => {
  console.log('🔌 WebSocket disconnected');
};

// To disconnect:
// ws.close();
```

---

### Testing with curl (HTTP Upgrade)

**Attempt WebSocket upgrade:**
```bash
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" \
  http://localhost:9003/ws/transactions
```

**Expected Response:**
```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: ...
```

---

## JWT Token Testing

### Generate JWT Token (If Backend Supports)

**Endpoint:** `POST /api/v11/auth/token`

---

#### Request Example (curl)
```bash
curl -X POST http://localhost:9003/api/v11/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demo",
    "password": "demo123"
  }' | jq
```

---

#### Expected Response (200 OK)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 28800,
  "tokenType": "Bearer"
}
```

---

### Use JWT Token in Requests

```bash
# Save token to variable
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Use token in API call
curl http://localhost:9003/api/v11/demos \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Error Handling Examples

### 400 Bad Request

**Example:**
```bash
curl -X POST http://localhost:9003/api/v11/demos \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

**Expected Response:**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    "demoName is required",
    "userEmail is required"
  ]
}
```

---

### 401 Unauthorized

**Example:**
```bash
curl http://localhost:9003/api/v11/demos
```

**Expected Response:**
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "No session or token provided"
}
```

---

### 404 Not Found

**Example:**
```bash
curl -b cookies.txt http://localhost:9003/api/v11/demos/nonexistent-id
```

**Expected Response:**
```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Demo with id 'nonexistent-id' not found"
}
```

---

### 500 Internal Server Error

**Example:** (Only occurs on backend crash)
```bash
curl http://localhost:9003/api/v11/demos/crash-endpoint
```

**Expected Response:**
```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Postman Collection

### Import Collection

**Create a Postman Collection:**

1. **Open Postman**
2. **Click "Import"**
3. **Select "Raw text"**
4. **Paste the following JSON:**

```json
{
  "info": {
    "name": "Aurigraph V11 API",
    "description": "Complete API collection for Sprint 20",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:9003/api/v11"
    },
    {
      "key": "sessionId",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "// Extract sessionId from response",
                  "const response = pm.response.json();",
                  "pm.collectionVariables.set('sessionId', response.sessionId);"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"demo\",\n  \"password\": \"demo123\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/login/authenticate",
              "host": ["{{baseUrl}}"],
              "path": ["login", "authenticate"]
            }
          }
        },
        {
          "name": "Verify Session",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/login/verify",
              "host": ["{{baseUrl}}"],
              "path": ["login", "verify"]
            }
          }
        },
        {
          "name": "Logout",
          "request": {
            "method": "POST",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/login/logout",
              "host": ["{{baseUrl}}"],
              "path": ["login", "logout"]
            }
          }
        }
      ]
    },
    {
      "name": "Platform Status",
      "item": [
        {
          "name": "Get Status",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/status",
              "host": ["{{baseUrl}}"],
              "path": ["status"]
            }
          }
        },
        {
          "name": "Get Info",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/info",
              "host": ["{{baseUrl}}"],
              "path": ["info"]
            }
          }
        }
      ]
    },
    {
      "name": "Demos",
      "item": [
        {
          "name": "List Demos",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/demos",
              "host": ["{{baseUrl}}"],
              "path": ["demos"]
            }
          }
        },
        {
          "name": "Create Demo",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"demoName\": \"Test Demo\",\n  \"userEmail\": \"test@example.com\",\n  \"userName\": \"Test User\",\n  \"description\": \"Created via Postman\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/demos",
              "host": ["{{baseUrl}}"],
              "path": ["demos"]
            }
          }
        }
      ]
    }
  ]
}
```

5. **Click "Import"**
6. **Collection is now available in Postman**

---

### Using Postman Collection

1. **Set Base URL:** Edit collection variables, set `baseUrl` to `http://localhost:9003/api/v11`
2. **Login:** Run "Authentication > Login" request
3. **Verify Session:** Session cookie is automatically saved
4. **Test Endpoints:** All subsequent requests use saved session

---

## Testing Scripts

### Automated Testing Script

**Create a bash script to test all endpoints:**

```bash
#!/bin/bash
# test-api.sh

BASE_URL="http://localhost:9003/api/v11"
COOKIES="cookies.txt"

echo "🧪 Aurigraph V11 API Test Suite"
echo "================================"

# Test 1: Health Check
echo -e "\n1️⃣ Testing Health Endpoint..."
curl -s http://localhost:9003/q/health | jq -r '.status'

# Test 2: Platform Status
echo -e "\n2️⃣ Testing Platform Status..."
curl -s $BASE_URL/status | jq -r '.status'

# Test 3: Authentication
echo -e "\n3️⃣ Testing Authentication..."
curl -c $COOKIES -s -X POST $BASE_URL/login/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}' | jq -r '.success'

# Test 4: Session Verification
echo -e "\n4️⃣ Testing Session Verification..."
curl -b $COOKIES -s $BASE_URL/login/verify | jq -r '.username'

# Test 5: List Demos
echo -e "\n5️⃣ Testing List Demos..."
curl -b $COOKIES -s $BASE_URL/demos | jq 'length'

# Test 6: Live Validators
echo -e "\n6️⃣ Testing Live Validators..."
curl -s $BASE_URL/live/validators | jq 'length'

# Test 7: Logout
echo -e "\n7️⃣ Testing Logout..."
curl -b $COOKIES -c $COOKIES -s -X POST $BASE_URL/login/logout | jq -r '.message'

echo -e "\n✅ All tests completed!"
rm -f $COOKIES
```

**Run script:**
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## Quick Reference

### Essential Commands

**Login:**
```bash
curl -c cookies.txt -X POST http://localhost:9003/api/v11/login/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'
```

**Verify Session:**
```bash
curl -b cookies.txt http://localhost:9003/api/v11/login/verify
```

**List Demos:**
```bash
curl -b cookies.txt http://localhost:9003/api/v11/demos | jq
```

**Test WebSocket:**
```bash
websocat ws://localhost:9003/ws/transactions
```

**Logout:**
```bash
curl -b cookies.txt -c cookies.txt -X POST http://localhost:9003/api/v11/login/logout
```

---

## Next Steps

### During Development
1. **Test Before Code:** Test endpoints with curl before writing frontend code
2. **Verify Responses:** Check response format matches expected structure
3. **Handle Errors:** Test error scenarios (401, 404, 500)
4. **WebSocket Testing:** Verify WebSocket connects and receives messages

### Before Committing
1. **Run Test Script:** Execute `test-api.sh` to verify all endpoints work
2. **Check Logs:** Review backend logs for errors
3. **Documentation:** Update this guide if endpoints change

---

**END OF API TESTING GUIDE**

**Estimated Time to Review:** 15-20 minutes
**Next Document:** `PROGRESS-TRACKING-TEMPLATE.md` (Daily progress reporting)
