# JIRA Integration API Testing Guide

## Overview

This document describes how to test the JIRA Integration API endpoints that were added to fix bug AV11-550.

**Issue:** API endpoint `/api/v3/jira/search` was returning 404 - Cannot GET

**Solution:** Implemented `JiraIntegrationResource.java` with full JIRA API integration.

## Files Added/Modified

### New Files
- `/aurigraph-av10-7/aurigraph-v11-standalone/src/main/java/io/aurigraph/v11/integration/JiraIntegrationResource.java` - Main JIRA integration resource
- `/aurigraph-av10-7/aurigraph-v11-standalone/src/test/java/io/aurigraph/v11/integration/JiraIntegrationResourceTest.java` - Unit tests

### Modified Files
- `/aurigraph-av10-7/aurigraph-v11-standalone/src/main/resources/application.properties` - Added JIRA configuration

## Configuration

### Environment Variables

The JIRA integration requires two environment variables:

```bash
export JIRA_EMAIL="sjoish12@gmail.com"
export JIRA_API_TOKEN="your-jira-api-token-here"
```

**To generate a JIRA API token:**
1. Go to: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Copy the token and save it securely

### Configuration Properties

The following properties are configured in `application.properties`:

```properties
# JIRA API Endpoint
jira.base.url=https://aurigraphdlt.atlassian.net

# JIRA Authentication (from environment variables)
jira.email=${JIRA_EMAIL:}
jira.api.token=${JIRA_API_TOKEN:}
```

## API Endpoints

### 1. Search JIRA Issues

**Endpoint:** `GET /api/v3/jira/search`

**Query Parameters:**
- `jql` (required) - JIRA Query Language query string
- `startAt` (optional, default: 0) - Starting index for pagination
- `maxResults` (optional, default: 50, max: 100) - Maximum results to return
- `fields` (optional, default: summary,status,assignee,created,updated) - Fields to include

**Example JQL Queries:**
- `project = AV11` - All issues in project AV11
- `project = AV11 AND status = "In Progress"` - In-progress issues
- `assignee = currentUser() AND status != Done` - My open issues
- `created >= -7d ORDER BY created DESC` - Issues created in last 7 days

**Example Request:**
```bash
curl "http://localhost:9000/api/v3/jira/search?jql=project%20%3D%20AV11&maxResults=10"
```

**Example Response (Success - 200):**
```json
{
  "expand": "schema,names",
  "startAt": 0,
  "maxResults": 10,
  "total": 42,
  "issues": [
    {
      "id": "12345",
      "key": "AV11-550",
      "fields": {
        "summary": "Fix JIRA Search endpoint 404 bug",
        "status": {
          "name": "In Progress"
        },
        "assignee": {
          "displayName": "John Doe"
        }
      }
    }
  ]
}
```

**Example Response (Error - 400 Bad Request):**
```json
{
  "error": true,
  "message": "JQL query parameter is required",
  "timestamp": "2025-12-09T08:30:00Z"
}
```

**Example Response (Error - 401 Unauthorized):**
```json
{
  "error": true,
  "message": "JIRA authentication failed. Check credentials.",
  "timestamp": "2025-12-09T08:30:00Z"
}
```

**Example Response (Error - 500 Internal Server Error):**
```json
{
  "error": true,
  "message": "JIRA credentials not configured. Contact administrator.",
  "timestamp": "2025-12-09T08:30:00Z"
}
```

### 2. Health Check

**Endpoint:** `GET /api/v3/jira/health`

**Example Request:**
```bash
curl http://localhost:9000/api/v3/jira/health
```

**Example Response (UP - 200):**
```json
{
  "status": "UP",
  "jiraBaseUrl": "https://aurigraphdlt.atlassian.net",
  "credentialsConfigured": true,
  "timestamp": "2025-12-09T08:30:00Z"
}
```

**Example Response (DOWN - 503):**
```json
{
  "status": "DOWN",
  "jiraBaseUrl": "https://aurigraphdlt.atlassian.net",
  "credentialsConfigured": false,
  "warning": "JIRA credentials not configured",
  "timestamp": "2025-12-09T08:30:00Z"
}
```

## Testing Locally

### 1. Set Environment Variables

```bash
export JIRA_EMAIL="sjoish12@gmail.com"
export JIRA_API_TOKEN="your-api-token"
```

### 2. Start the Application

```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT-WT2/aurigraph-av10-7/aurigraph-v11-standalone
./mvnw quarkus:dev
```

### 3. Test Health Endpoint

```bash
curl http://localhost:9000/api/v3/jira/health | jq .
```

**Expected output:**
```json
{
  "status": "UP",
  "jiraBaseUrl": "https://aurigraphdlt.atlassian.net",
  "credentialsConfigured": true,
  "timestamp": "2025-12-09T08:30:00Z"
}
```

### 4. Test Search Endpoint

**Test 1: Basic search**
```bash
curl "http://localhost:9000/api/v3/jira/search?jql=project%20%3D%20AV11" | jq .
```

**Test 2: Search with filters**
```bash
curl "http://localhost:9000/api/v3/jira/search?jql=project%20%3D%20AV11%20AND%20status%20%3D%20%22In%20Progress%22&maxResults=5" | jq .
```

**Test 3: Pagination**
```bash
curl "http://localhost:9000/api/v3/jira/search?jql=project%20%3D%20AV11&startAt=10&maxResults=10" | jq .
```

**Test 4: Custom fields**
```bash
curl "http://localhost:9000/api/v3/jira/search?jql=project%20%3D%20AV11&fields=summary,description,status" | jq .
```

### 5. Error Cases

**Test missing JQL parameter:**
```bash
curl http://localhost:9000/api/v3/jira/search | jq .
```

**Expected:** 400 Bad Request with error message

**Test invalid JQL:**
```bash
curl "http://localhost:9000/api/v3/jira/search?jql=invalid_field%20%3D%20value" | jq .
```

**Expected:** 400 Bad Request with JIRA error details

## Testing on Remote Server

### 1. Set Environment Variables on Server

SSH into the server:
```bash
ssh -p 2235 subbu@dlt.aurigraph.io
```

Add environment variables to the service configuration or Docker Compose file.

For Docker Compose, edit `docker-compose.yml`:
```yaml
services:
  aurigraph-v11:
    environment:
      - JIRA_EMAIL=sjoish12@gmail.com
      - JIRA_API_TOKEN=${JIRA_API_TOKEN}
```

### 2. Test on Production

```bash
# Health check
curl https://dlt.aurigraph.io/api/v3/jira/health | jq .

# Search
curl "https://dlt.aurigraph.io/api/v3/jira/search?jql=project%20%3D%20AV11&maxResults=5" | jq .
```

## Implementation Details

### Architecture

The JIRA integration is implemented as a proxy service:

1. **Client Request** → Enterprise Portal sends request to `/api/v3/jira/search`
2. **JiraIntegrationResource** → Validates input and builds JIRA API URL
3. **OkHttpClient** → Makes authenticated request to JIRA REST API
4. **JIRA API** → Returns search results
5. **Response** → Proxy returns JIRA response to client

### Authentication

- Uses **Basic Authentication** with email and API token
- Credentials are passed via `Authorization` header
- Tokens are stored in environment variables for security

### Error Handling

- **400 Bad Request** - Invalid JQL or missing required parameters
- **401 Unauthorized** - JIRA authentication failed
- **500 Internal Server Error** - Network errors, JIRA API errors, or missing credentials
- **503 Service Unavailable** - Health check fails (credentials not configured)

### Dependencies

The implementation uses:
- **OkHttp 4.12.0** - HTTP client (already in `pom.xml`)
- **Quarkus REST** - JAX-RS implementation
- **MicroProfile Config** - Configuration injection
- **MicroProfile OpenAPI** - API documentation

## Troubleshooting

### Issue: 404 Not Found

**Cause:** Endpoint not deployed or application not running

**Solution:**
1. Verify application is running: `curl http://localhost:9000/q/health`
2. Check logs for startup errors
3. Ensure code is compiled: `./mvnw clean compile`

### Issue: 401 Unauthorized

**Cause:** Invalid JIRA credentials

**Solution:**
1. Verify JIRA_EMAIL is correct
2. Regenerate JIRA API token
3. Check environment variables are set: `echo $JIRA_EMAIL`

### Issue: 500 Internal Server Error

**Cause:** Credentials not configured

**Solution:**
1. Set environment variables before starting application
2. Check health endpoint to verify configuration
3. Review application logs for details

### Issue: Network timeout

**Cause:** Cannot reach JIRA API

**Solution:**
1. Check internet connectivity
2. Verify firewall allows outbound HTTPS
3. Test JIRA connectivity: `curl https://aurigraphdlt.atlassian.net`

## Next Steps

### Frontend Integration

Update Enterprise Portal to use the new endpoint:

```typescript
// Example: Fetch JIRA issues in React
const fetchJiraIssues = async (jql: string) => {
  const response = await fetch(
    `/api/v3/jira/search?jql=${encodeURIComponent(jql)}&maxResults=50`
  );

  if (!response.ok) {
    throw new Error('JIRA search failed');
  }

  return response.json();
};

// Usage
const issues = await fetchJiraIssues('project = AV11 AND status = "In Progress"');
```

### Security Enhancements

For production deployment:
1. Store JIRA credentials in a secrets manager (AWS Secrets Manager, HashiCorp Vault)
2. Implement rate limiting to prevent abuse
3. Add caching to reduce JIRA API calls
4. Add authentication/authorization to the endpoint
5. Consider using OAuth 2.0 for JIRA authentication

## References

- JIRA REST API: https://developer.atlassian.com/cloud/jira/platform/rest/v3/
- JQL (JIRA Query Language): https://www.atlassian.com/software/jira/guides/jql
- API Token Management: https://id.atlassian.com/manage-profile/security/api-tokens

## Related Issues

- **AV11-550** - Fix JIRA Search endpoint 404 bug (FIXED)

## Commit Details

- **Branch:** `fix/jira-search-AV11-550`
- **Commit:** `fix(api): Add JIRA search endpoint /api/v3/jira/search - AV11-550`
