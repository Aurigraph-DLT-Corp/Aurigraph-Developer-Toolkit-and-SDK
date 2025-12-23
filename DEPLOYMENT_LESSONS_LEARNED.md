# AURDLT Deployment Lessons Learned - Critical NGINX Proxy Issues

**Date**: November 17, 2025
**Deployment**: V4.4.4 Production
**Focus**: Preventing recurring proxy configuration mistakes

---

## 🔴 CRITICAL ISSUES - ROOT CAUSES & PREVENTION

### Issue 1: Invalid `set` Directive in HTTP Block

**What Went Wrong**:
- Placed `set $upstream_variable` directives in the `http { }` block
- NGINX syntax only allows `set` in `server { }` or `location { }` blocks
- Error: `"set" directive is not allowed here in /etc/nginx/nginx.conf:60`

**Root Cause**:
- Agent assumed `set` could initialize variables anywhere
- Lack of NGINX directive scope validation in template

**Prevention Rules**:
```
✅ DO:
- Use set directives ONLY in server{} or location{} blocks
- Define upstream servers with explicit server declarations
- Use variables within the context where they're needed

❌ DON'T:
- Put set directives in http{} or main block
- Try to use variables outside their defined scope
- Assume all directives work in all blocks
```

**Correct Pattern**:
```nginx
# ✅ CORRECT - upstream defined in http block
http {
    upstream backend {
        server backend-service:9000;
    }

    server {
        # ✅ Can use upstream here
        location / {
            proxy_pass http://backend;
        }
    }
}
```

---

### Issue 2: Missing Docker DNS Resolver

**What Went Wrong**:
- NGINX couldn't resolve Docker container hostnames
- Service discovery failed intermittently
- Upstream connection errors: "failed to resolve host"

**Root Cause**:
- Agent didn't understand Docker's internal DNS (127.0.0.11:53)
- Assumed standard system DNS would work in containers
- No error handling for transient lookup failures

**Prevention Rules**:
```
✅ Docker Container Hostname Resolution:
resolver 127.0.0.11 valid=10s;  # Docker's embedded DNS server
resolver_timeout 5s;             # Timeout for resolution

✅ Error Recovery:
proxy_next_upstream error timeout invalid_header http_500 http_502;
proxy_next_upstream_tries 2;     # Retry logic
proxy_next_upstream_timeout 10s; # Max time for retries

❌ DON'T:
- Rely on /etc/hosts in containers
- Assume standard DNS works inside Docker
- Skip error handling for upstream failures
- Use static IPs instead of service names
```

**Mandatory Pattern for Docker NGINX**:
```nginx
http {
    # Always add this for Docker deployments
    resolver 127.0.0.11 valid=10s;
    resolver_timeout 5s;

    upstream backend {
        server service-name:port;  # Use service names, not IPs
    }

    server {
        location / {
            proxy_pass http://backend;

            # Always add this for resilience
            proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
            proxy_next_upstream_tries 2;
            proxy_next_upstream_timeout 10s;
        }
    }
}
```

---

### Issue 3: No Automatic Failover Logic

**What Went Wrong**:
- Single transient error caused permanent failure
- No retry mechanism for temporary service disruptions
- Health checks failed because upstream was temporarily unavailable

**Root Cause**:
- Agent didn't implement `proxy_next_upstream` configuration
- Assumed "if service is down, request fails forever"
- Missing understanding of graceful degradation patterns

**Prevention Rules**:
```
✅ MANDATORY for all proxy locations:
- Add proxy_next_upstream with error conditions
- Set reasonable retry counts (2-3 attempts)
- Use short timeout windows (10-30 seconds)

❌ DON'T:
- Leave any proxy without error handling
- Set unlimited retries (causes cascading failures)
- Use 0 second timeouts (will timeout immediately)
```

**Complete Resilient Proxy Template**:
```nginx
location /api/ {
    # Service discovery
    proxy_pass http://backend;

    # Protocol settings
    proxy_http_version 1.1;
    proxy_set_header Connection "";

    # DNS resolution
    set $upstream "service-name:port";
    proxy_pass http://$upstream;  # Enable resolver use

    # Error handling (ALWAYS required)
    proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
    proxy_next_upstream_tries 2;
    proxy_next_upstream_timeout 10s;

    # Timeouts
    proxy_connect_timeout 30s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

---

## 🔧 DEPLOYMENT AGENT CHECKLIST

### Before Deploying ANY NGINX Configuration:

- [ ] **Syntax Validation**
  - [ ] Verify all `set` directives are in `server{}` or `location{}` blocks
  - [ ] Check upstream definitions are in `http{}` block
  - [ ] Test with `nginx -t` before deployment

- [ ] **Docker Networking**
  - [ ] Include `resolver 127.0.0.11 valid=10s;` in http block
  - [ ] Use service names (not IPs) in upstream definitions
  - [ ] All service names match docker-compose service names exactly

- [ ] **Error Handling**
  - [ ] Every `proxy_pass` has `proxy_next_upstream` configured
  - [ ] Retry count is between 1-3 (never 0, rarely >3)
  - [ ] Timeout is reasonable for service startup (10-30s typical)

- [ ] **Health Checks**
  - [ ] Health check endpoints configured correctly
  - [ ] Health check doesn't cascade failures
  - [ ] Different timeout for health vs normal requests

---

## 📋 NGINX CONFIGURATION VALIDATION RULES

### Rule 1: Directive Scope Validation
```
http {}      → Can contain: upstream, server, directives (no set)
server {}    → Can contain: location, directives, set (with value from request)
location {}  → Can contain: directives, set (with value from request)
```

### Rule 2: Variable Resolution
```
✅ Works:
- proxy_pass http://$upstream_var;  (in server/location block)

❌ Fails:
- set $var value;  (in http block - WRONG SCOPE)
- proxy_pass http://$var;  (if var set in http block)
```

### Rule 3: Docker Service Names
```
✅ Correct:
- upstream web { server web-service:3000; }  (matches docker-compose service name)

❌ Wrong:
- upstream web { server 172.20.0.4:3000; }   (hardcoded IP, won't work on restart)
- upstream web { server localhost:3000; }    (localhost = container itself)
```

---

## 🚀 AGENT INSTRUCTION FOR FUTURE DEPLOYMENTS

### When Creating NGINX Configuration for Docker:

1. **Always Start With This Template**:
```nginx
http {
    # DNS Resolution for Docker
    resolver 127.0.0.11 valid=10s;
    resolver_timeout 5s;

    # Upstream definitions (NO set directives here!)
    upstream backend {
        least_conn;
        server backend-service:9000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    server {
        listen 80;
        server_name _;

        location / {
            proxy_pass http://backend;

            # Error handling (REQUIRED)
            proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
            proxy_next_upstream_tries 2;
            proxy_next_upstream_timeout 10s;

            # Timeouts
            proxy_connect_timeout 30s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
    }
}
```

2. **Before Deployment**:
```bash
# Validate syntax
nginx -t

# Check for common mistakes:
grep -n "set \$" /path/to/nginx.conf | grep -v "server\|location"
# Should return nothing - any matches are scope errors
```

3. **Common Docker Services Pattern**:
```nginx
# For multiple backend services
upstream api {
    server api-service:8000;
}

upstream web {
    server web-service:3000;
}

upstream cache {
    server cache-service:6379;
}

server {
    location /api/ { proxy_pass http://api/; }
    location /web/ { proxy_pass http://web/; }
}
```

---

## ❌ MISTAKES THAT WILL REPEAT IF NOT PREVENTED

### Mistake 1: Variable Initialization in Wrong Block
```nginx
# ❌ WRONG - will cause: "set" directive is not allowed here
http {
    set $upstream "backend-service:9000";  # ERROR!
}

# ✅ CORRECT - use upstream block
http {
    upstream backend {
        server backend-service:9000;
    }
}
```

### Mistake 2: Not Adding Docker DNS Resolver
```nginx
# ❌ WRONG - hostname resolution will fail randomly
upstream backend {
    server service-name:9000;
}

# ✅ CORRECT - always add resolver for Docker
http {
    resolver 127.0.0.11 valid=10s;
    upstream backend {
        server service-name:9000;
    }
}
```

### Mistake 3: No Error Handling
```nginx
# ❌ WRONG - any error causes permanent 502
location / {
    proxy_pass http://backend;
}

# ✅ CORRECT - add retry logic
location / {
    proxy_pass http://backend;
    proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
    proxy_next_upstream_tries 2;
    proxy_next_upstream_timeout 10s;
}
```

### Mistake 4: Hardcoding IPs Instead of Service Names
```nginx
# ❌ WRONG - breaks on container restart
upstream backend {
    server 172.21.1.10:9000;  # This IP will change!
}

# ✅ CORRECT - use service names
upstream backend {
    server backend-service:9000;  # Name is stable
}
```

---

## 🎯 SUMMARY FOR AGENTS

**The Single Most Important Rule**:
> **For Docker NGINX deployments, ALWAYS include:**
> 1. `resolver 127.0.0.11 valid=10s;` in http block
> 2. `proxy_next_upstream ...` in every proxy location
> 3. Service names (not IPs) in upstream definitions
> 4. `set` directives ONLY in server/location blocks

**If these three things are missing, the deployment will fail in Docker.**

---

**Last Updated**: 2025-11-17
**Deployment**: AURDLT V4.4.4
**Status**: Documented to prevent future repetition
