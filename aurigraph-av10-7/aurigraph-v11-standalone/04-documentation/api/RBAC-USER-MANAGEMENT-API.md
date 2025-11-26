# RBAC and User Management API Documentation

## Overview

Complete Role-Based Access Control (RBAC) and User Management implementation for Aurigraph DLT V11.

**Version**: 11.3.1
**Base URL**: `http://localhost:9003/api/v11`
**Authentication**: JWT-ready (currently disabled for testing)

---

## Architecture

### Components

1. **Entities** (`src/main/java/io/aurigraph/v11/user/`)
   - `User.java` - User entity with Panache pattern
   - `Role.java` - Role entity with JSON permissions

2. **Services** (`src/main/java/io/aurigraph/v11/user/`)
   - `UserService.java` - Business logic with BCrypt password hashing
   - `RoleService.java` - Permission validation and default role initialization

3. **REST APIs** (`src/main/java/io/aurigraph/v11/user/`)
   - `UserResource.java` - Reactive user management endpoints
   - `RoleResource.java` - Reactive role management endpoints

4. **Tests** (`src/test/java/io/aurigraph/v11/user/`)
   - `UserResourceTest.java` - 14 integration tests
   - `RoleResourceTest.java` - 19 integration tests

---

## Default Roles

The system initializes 5 default roles on startup:

| Role | Description | Permissions |
|------|-------------|-------------|
| `ADMIN` | Full system access | All resources (*) |
| `USER` | Standard user | transactions, contracts (read/create) |
| `DEVOPS` | DevOps access | system, monitoring, logs |
| `API_USER` | API integration | api, transactions (read/write) |
| `READONLY` | Read-only access | All resources (read only) |

---

## User Management API

### Create User

```bash
curl -X POST http://localhost:9003/api/v11/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@aurigraph.io",
    "password": "SecureP@ss123",
    "roleName": "USER"
  }'
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_doe",
  "email": "john@aurigraph.io",
  "roleName": "USER",
  "roleId": "660e8400-e29b-41d4-a716-446655440001",
  "status": "ACTIVE",
  "createdAt": "2025-10-16T00:00:00.000Z",
  "updatedAt": "2025-10-16T00:00:00.000Z",
  "lastLoginAt": null,
  "failedLoginAttempts": 0,
  "isLocked": false
}
```

### List Users (Paginated)

```bash
curl "http://localhost:9003/api/v11/users?page=0&size=20"
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "john_doe",
      "email": "john@aurigraph.io",
      "roleName": "USER",
      "status": "ACTIVE",
      "createdAt": "2025-10-16T00:00:00.000Z",
      "updatedAt": "2025-10-16T00:00:00.000Z",
      "lastLoginAt": null,
      "failedLoginAttempts": 0,
      "isLocked": false
    }
  ],
  "page": 0,
  "size": 20,
  "totalCount": 1
}
```

### Get User by ID

```bash
curl http://localhost:9003/api/v11/users/550e8400-e29b-41d4-a716-446655440000
```

### Update User

```bash
curl -X PUT http://localhost:9003/api/v11/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@aurigraph.io",
    "roleName": "ADMIN"
  }'
```

### Update User Role

```bash
curl -X PUT http://localhost:9003/api/v11/users/550e8400-e29b-41d4-a716-446655440000/role \
  -H "Content-Type: application/json" \
  -d '{
    "roleName": "DEVOPS"
  }'
```

### Update User Status

```bash
curl -X PUT http://localhost:9003/api/v11/users/550e8400-e29b-41d4-a716-446655440000/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "INACTIVE"
  }'
```

**Valid statuses**: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING_VERIFICATION`

### Update User Password

```bash
curl -X PUT http://localhost:9003/api/v11/users/550e8400-e29b-41d4-a716-446655440000/password \
  -H "Content-Type: application/json" \
  -d '{
    "newPassword": "NewSecureP@ss456"
  }'
```

### Authenticate User

```bash
curl -X POST http://localhost:9003/api/v11/users/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "SecureP@ss123"
  }'
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_doe",
  "email": "john@aurigraph.io",
  "roleName": "USER",
  "status": "ACTIVE",
  "lastLoginAt": "2025-10-16T00:30:00.000Z",
  "failedLoginAttempts": 0,
  "isLocked": false
}
```

### Delete User

```bash
curl -X DELETE http://localhost:9003/api/v11/users/550e8400-e29b-41d4-a716-446655440000
```

**Response** (204 No Content)

---

## Role Management API

### List All Roles

```bash
curl http://localhost:9003/api/v11/roles
```

### List System Roles Only

```bash
curl "http://localhost:9003/api/v11/roles?type=system"
```

### List Custom Roles Only

```bash
curl "http://localhost:9003/api/v11/roles?type=custom"
```

### Get Role by ID

```bash
curl http://localhost:9003/api/v11/roles/660e8400-e29b-41d4-a716-446655440001
```

### Create Custom Role

```bash
curl -X POST http://localhost:9003/api/v11/roles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AUDITOR",
    "description": "Audit and compliance access",
    "permissions": "{\"transactions\":[\"read\"],\"contracts\":[\"read\"],\"audit\":[\"read\",\"write\"]}"
  }'
```

**Permission Format** (JSON string):
```json
{
  "transactions": ["read", "write"],
  "contracts": ["read", "create", "update"],
  "tokens": ["read"],
  "admin": ["*"]
}
```

### Update Custom Role

```bash
curl -X PUT http://localhost:9003/api/v11/roles/660e8400-e29b-41d4-a716-446655440002 \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "permissions": "{\"transactions\":[\"read\",\"write\"],\"audit\":[\"read\",\"write\",\"delete\"]}"
  }'
```

### Get Role Permissions

```bash
curl http://localhost:9003/api/v11/roles/660e8400-e29b-41d4-a716-446655440001/permissions
```

### Check Role Permission

```bash
curl "http://localhost:9003/api/v11/roles/660e8400-e29b-41d4-a716-446655440001/permissions/check?resource=transactions&action=write"
```

**Response** (200 OK):
```json
{
  "roleId": "660e8400-e29b-41d4-a716-446655440001",
  "resource": "transactions",
  "action": "write",
  "hasPermission": true
}
```

### Get Role Statistics

```bash
curl http://localhost:9003/api/v11/roles/660e8400-e29b-41d4-a716-446655440001/statistics
```

**Response** (200 OK):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "USER",
  "userCount": 42,
  "isSystemRole": true,
  "createdAt": "2025-10-16T00:00:00.000Z"
}
```

### Delete Custom Role

```bash
curl -X DELETE http://localhost:9003/api/v11/roles/660e8400-e29b-41d4-a716-446655440002
```

**Response** (204 No Content)

**Note**: Cannot delete system roles or roles with active users.

---

## Password Policy

The system enforces strong password requirements:

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- At least 1 special character (`@$!%*?&`)

**Example**: `SecureP@ss123`

---

## Security Features

### Account Lockout

- **Failed Login Threshold**: 5 attempts
- **Lockout Duration**: 30 minutes
- **Auto-unlock**: After lockout period expires

### Password Hashing

- **Algorithm**: BCrypt
- **Cost Factor**: 12
- **Storage**: Salted hash (not reversible)

---

## Error Responses

### 400 Bad Request

```json
{
  "message": "Username already exists: john_doe"
}
```

### 401 Unauthorized

```json
{
  "message": "Invalid username or password"
}
```

### 404 Not Found

```json
{
  "message": "User not found: 550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Test Coverage

- **User Management**: 14 integration tests ✅
- **Role Management**: 19 integration tests ✅
- **Total**: 33 tests passing
- **Test Framework**: JUnit 5 + RestAssured + Quarkus Test

### Run Tests

```bash
cd aurigraph-v11-standalone
./mvnw test -Dtest=UserResourceTest,RoleResourceTest
```

---

## Frontend Integration Guide

### User Registration Flow

```typescript
// 1. Create user
const response = await fetch('http://localhost:9003/api/v11/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'john_doe',
    email: 'john@aurigraph.io',
    password: 'SecureP@ss123',
    roleName: 'USER'
  })
});

const user = await response.json();
console.log('User created:', user.id);
```

### User Login Flow

```typescript
// 1. Authenticate
const authResponse = await fetch('http://localhost:9003/api/v11/users/authenticate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'john_doe',
    password: 'SecureP@ss123'
  })
});

if (authResponse.ok) {
  const user = await authResponse.json();

  // 2. Store user session
  localStorage.setItem('userId', user.id);
  localStorage.setItem('roleName', user.roleName);

  // 3. Redirect to dashboard
  window.location.href = '/dashboard';
} else {
  const error = await authResponse.json();
  alert(error.message);
}
```

### Role-Based UI Rendering

```typescript
// Get current user role
const roleName = localStorage.getItem('roleName');

// Show/hide UI elements based on role
if (roleName === 'ADMIN') {
  document.getElementById('admin-panel').style.display = 'block';
}

if (['ADMIN', 'DEVOPS'].includes(roleName)) {
  document.getElementById('system-settings').style.display = 'block';
}
```

### Check Permission Before Action

```typescript
async function canUserPerformAction(roleId: string, resource: string, action: string): Promise<boolean> {
  const response = await fetch(
    `http://localhost:9003/api/v11/roles/${roleId}/permissions/check?resource=${resource}&action=${action}`
  );

  const result = await response.json();
  return result.hasPermission;
}

// Example usage
const roleId = localStorage.getItem('roleId');
if (await canUserPerformAction(roleId, 'transactions', 'write')) {
  // Show transaction creation button
  document.getElementById('create-transaction-btn').disabled = false;
}
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id),
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  last_login_at TIMESTAMP,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP
);

CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_status ON users(status);
```

### Roles Table

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  permissions TEXT,
  user_count INT DEFAULT 0,
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_role_name ON roles(name);
```

---

## Next Steps (Future Enhancements)

1. **JWT Integration**: Enable `@RolesAllowed` annotations
2. **Password Reset**: Email-based password recovery
3. **2FA Support**: Two-factor authentication
4. **Audit Logging**: Track all user and role changes
5. **LDAP Integration**: Enterprise directory support
6. **OAuth2/OIDC**: Social login support
7. **Session Management**: Active session tracking
8. **API Rate Limiting**: Per-user/per-role limits

---

## Support

For issues or questions, contact the Backend Development Team or create a JIRA ticket under project AV11.

**Author**: Backend Development Agent (BDA)
**Date**: October 16, 2025
**Version**: V11.3.1
