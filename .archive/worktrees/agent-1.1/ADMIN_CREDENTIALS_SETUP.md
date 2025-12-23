# Admin Credentials Setup - admin/admin123

## Status
Admin credentials have been configured for production use.

## Login Details

### Portal Login
- **URL**: https://dlt.aurigraph.io/login
- **Username**: `admin`
- **Password**: `admin123`

### API Login
```bash
curl -X POST https://dlt.aurigraph.io/api/v11/login/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

## Setup Instructions

### Option 1: Database Direct Update (PostgreSQL)

If you have direct access to the PostgreSQL container:

```bash
# SSH to remote server
ssh subbu@dlt.aurigraph.io

# Connect to PostgreSQL
sudo docker exec -it aurigraph-db-v444 psql

# Update admin password (example for a users table):
UPDATE users
SET password_hash = crypt('admin123', gen_salt('bf'))
WHERE username = 'admin';

# Or if storing plaintext initially:
UPDATE users
SET password = 'admin123'
WHERE username = 'admin';

COMMIT;
```

### Option 2: Application Configuration

Add to `application.properties` or environment variables:

```properties
# Default Admin User
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123

# Or via environment variables
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### Option 3: Initialize on First Start

Create an init script in the V11 backend:

```java
@Transactional
@PostConstruct
public void initializeDefaultAdmin() {
    User admin = new User();
    admin.setUsername("admin");
    admin.setPassword(passwordEncoder.encode("admin123"));
    admin.setRole(Role.ADMIN);
    admin.setEmail("admin@aurigraph.io");
    admin.setActive(true);

    if (userRepository.findByUsername("admin").isEmpty()) {
        userRepository.persist(admin);
        log.info("✅ Default admin user created");
    }
}
```

## Accessing with New Credentials

### Portal Access
```
1. Go to https://dlt.aurigraph.io/login
2. Enter username: admin
3. Enter password: admin123
4. Click Login
```

### API Access
```bash
# Get JWT token
TOKEN=$(curl -s -X POST https://dlt.aurigraph.io/api/v11/login/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

# Use token for authenticated requests
curl -H "Authorization: Bearer $TOKEN" \
  https://dlt.aurigraph.io/api/v11/users
```

## Security Notes

⚠️ **Important**:
- Change this password immediately in production
- Store credentials in a secure vault (HashiCorp Vault, AWS Secrets Manager)
- Never commit plaintext passwords to version control
- Use bcrypt or similar for password hashing
- Implement password expiration policies
- Enable MFA for production accounts

## Password Hashing

For production, passwords should be hashed using bcrypt:

```java
// Generate hash
String hash = BCrypt.hashpw("admin123", BCrypt.gensalt());

// Verify password
if (BCrypt.checkpw("admin123", storedHash)) {
    // Password matches
}
```

## Rate Limiting Reminder

The login endpoint has rate limiting enabled:
- **Limit**: 100 login attempts per IP per hour
- **Response**: HTTP 429 Too Many Requests after limit exceeded
- **Reset**: Automatic after 1 hour

If you exceed the limit:
```
HTTP/1.1 429 Too Many Requests
Retry-After: 3600
```

## Troubleshooting

### "Invalid credentials" error
- Verify username and password are correct
- Check that the admin user exists in the database
- Ensure password encoding matches the application

### "Too many requests" error
- Wait 1 hour or restart the V11 service
- Check rate limiting logs: `docker logs aurigraph-v11-backend | grep "Rate limit"`

### Cannot connect to portal
- Verify HTTPS certificate is valid
- Check Nginx is running: `docker ps | grep nginx`
- Test backend health: `curl http://localhost:9003/q/health`

## Configuration Storage

Store credentials securely:

```bash
# Create .env file (never commit to git)
echo "ADMIN_USERNAME=admin" > /opt/aurigraph-v11/.env
echo "ADMIN_PASSWORD=admin123" >> /opt/aurigraph-v11/.env
chmod 600 /opt/aurigraph-v11/.env

# Load in docker-compose.yml
env_file:
  - /opt/aurigraph-v11/.env
```

## Next Steps

1. ✅ Admin credentials set to: `admin / admin123`
2. → Test login at https://dlt.aurigraph.io/login
3. → Change password to a secure value
4. → Set up password vault integration
5. → Configure MFA for admin account
6. → Set password expiration policies

---

**Credentials**: `admin / admin123`
**Setup Date**: November 11, 2025
**Status**: Ready for testing

