# SSH Proxy Configuration Guide
## Connecting to dlt.aurigraph.io Through Corporate Proxy

**Status**: Need to configure SSH proxy to access remote deployment server

---

## Diagnosis

The SSH connection is being blocked by a proxy firewall. To connect through a corporate proxy, you need to configure SSH to tunnel through the proxy first.

---

## Solution Options

### Option 1: HTTP CONNECT Proxy (Recommended for Corporate Networks)

**Most common setup for corporate environments**

#### Step 1: Identify Your Proxy

Get proxy settings from your IT department or check:
```bash
# macOS
networksetup -getwebproxy en0
networksetup -getsecurewebproxy en0

# Linux
echo $http_proxy
echo $https_proxy

# Check system proxy
cat /etc/environment | grep proxy
```

Expected output:
```
Proxy Server: proxy.company.com
Proxy Port: 8080 (or 3128, 8888, etc.)
Authentication: Username/Password (optional)
```

#### Step 2: Update SSH Config

Edit `~/.ssh/config`:

```bash
nano ~/.ssh/config
```

Add this section:

```
Host dlt
    Hostname dlt.aurigraph.io
    User subbu
    Port 2235
    IdentityFile ~/.ssh/id_rsa
    ProxyCommand ssh -q -W %h:%p proxy.company.com:8080
```

Replace `proxy.company.com:8080` with your actual proxy server and port.

#### Step 3: Test Connection

```bash
ssh -v dlt "echo 'SSH connection successful'"
```

**Expected output**:
```
Connected to proxy via SSH...
Authentication successful
Connected to dlt.aurigraph.io
SSH connection successful
```

#### Step 4: Run Deployment

```bash
./deploy.sh deploy
# Or
ssh dlt "cd /opt/DLT && docker-compose up -d"
```

---

### Option 2: Proxy with Authentication

If your proxy requires username/password:

#### Method A: Using Environment Variables

```bash
# Set proxy credentials
export PROXY_USER="your_username"
export PROXY_PASS="your_password"

# Update SSH config to use them
nano ~/.ssh/config
```

```
Host dlt
    Hostname dlt.aurigraph.io
    User subbu
    Port 2235
    IdentityFile ~/.ssh/id_rsa
    ProxyCommand ssh -q -W %h:%p $PROXY_USER:$PROXY_PASS@proxy.company.com:8080
```

#### Method B: SSH Key-Based Proxy Authentication

This is more secure (no password in config):

```bash
# Create SSH key for proxy host (if not already done)
ssh-keygen -t ed25519 -f ~/.ssh/id_proxy -N "" -C "proxy-access"

# Add to proxy host's authorized_keys (work with your IT)
cat ~/.ssh/id_proxy.pub

# Update SSH config
nano ~/.ssh/config
```

```
Host dlt
    Hostname dlt.aurigraph.io
    User subbu
    Port 2235
    IdentityFile ~/.ssh/id_rsa
    ProxyCommand ssh -i ~/.ssh/id_proxy -q -W %h:%p proxy.company.com:8080
```

---

### Option 3: Jump Host / Bastion Host

If you need to hop through an intermediate server:

#### Setup

```bash
nano ~/.ssh/config
```

Add:

```
# Define the jump host
Host jump
    Hostname bastion.company.com
    User your_username
    Port 22
    IdentityFile ~/.ssh/id_rsa

# Access dlt through jump host
Host dlt
    Hostname dlt.aurigraph.io
    User subbu
    Port 2235
    IdentityFile ~/.ssh/id_rsa
    ProxyJump jump
    # Or for older SSH (< 7.3):
    # ProxyCommand ssh -q -W %h:%p jump
```

#### Test

```bash
ssh -v dlt "echo 'Connected via jump host'"
```

---

### Option 4: SOCKS Proxy / VPN Tunnel

If using a SOCKS proxy or VPN:

#### With Existing SOCKS Proxy (port 1080)

```bash
nano ~/.ssh/config
```

```
Host dlt
    Hostname dlt.aurigraph.io
    User subbu
    Port 2235
    IdentityFile ~/.ssh/id_rsa
    ProxyCommand nc -x localhost:1080 %h %p
```

#### Or with SSH tunnel setup

```bash
# In terminal 1: Create SOCKS tunnel
ssh -D 1080 -q -N proxy.company.com

# In terminal 2: Use the tunnel
ssh dlt
```

---

## Advanced SSH Configuration

### Add Connection Optimization

Update `~/.ssh/config`:

```
Host dlt
    Hostname dlt.aurigraph.io
    User subbu
    Port 2235
    IdentityFile ~/.ssh/id_rsa
    ProxyCommand ssh -q -W %h:%p proxy.company.com:8080

    # Connection timeout
    ConnectTimeout 30

    # Keep alive (prevents connection drops)
    ServerAliveInterval 60
    ServerAliveCountMax 3

    # Compression (helps with slow connections)
    Compression yes
    CompressionLevel 6

    # Connection reuse (faster subsequent connections)
    ControlMaster auto
    ControlPath ~/.ssh/control-%h-%p-%r
    ControlPersist 600
```

---

## Troubleshooting

### Test 1: Basic SSH Syntax

```bash
# Test SSH config syntax
ssh -G dlt

# Should output configuration without errors
```

### Test 2: Verbose Connection

```bash
# See detailed connection information
ssh -vvv dlt "echo 'test'"

# Look for:
# - "Trying proxy via SSH" (success)
# - "Connected to X" (success)
# - "Connection refused" (wrong proxy/port)
# - "Permission denied" (proxy authentication failed)
```

### Test 3: Check Proxy Connectivity

```bash
# Test if proxy is reachable
telnet proxy.company.com 8080
# or
nc -zv proxy.company.com 8080

# Expected: Connected (not connection refused)
```

### Test 4: Check SSH Key

```bash
# Verify SSH key is working
ssh-keyscan -p 2235 dlt.aurigraph.io

# Should show RSA key information
```

### Common Issues

**Issue: "Connection refused"**
```
Cause: Wrong proxy server/port
Solution:
  1. Verify proxy with IT department
  2. Check spelling in SSH config
  3. Test with telnet: telnet proxy.company.com 8080
```

**Issue: "Permission denied (publickey)"**
```
Cause: SSH key not authorized on remote server
Solution:
  1. Verify SSH key exists: ls ~/.ssh/id_rsa
  2. Check public key is on server: ssh dlt "cat ~/.ssh/authorized_keys"
  3. Add key if needed: ssh-copy-id -i ~/.ssh/id_rsa -p 2235 subbu@dlt.aurigraph.io
```

**Issue: "Broken pipe" or connection drops**
```
Cause: Proxy closing idle connections
Solution: Add to ~/.ssh/config:
  ServerAliveInterval 60
  ServerAliveCountMax 3
```

**Issue: "ProxyCommand failed"**
```
Cause: SSH not installed on proxy or wrong command
Solution:
  1. Try netcat instead: ProxyCommand nc -q1 %h %p
  2. Or: ProxyCommand /bin/nc -q1 %h %p
  3. Or use jump host: ProxyJump jump-host
```

---

## Deployment After SSH is Working

Once SSH connection is working:

### Quick Test

```bash
ssh dlt "pwd"
# Should return: /home/subbu
```

### Run Deployment

```bash
# Option 1: Automated
./deploy.sh deploy

# Option 2: Manual
ssh dlt "cd /opt/DLT && docker-compose up -d"

# Monitor
ssh dlt "docker-compose logs -f"
```

### Verify Services

```bash
# Check status
ssh dlt "docker-compose ps"

# Test health
ssh dlt "curl http://localhost:9003/q/health"

# View logs
ssh dlt "docker-compose logs --tail=50"
```

---

## SSH Config Template

Copy this template and fill in your proxy details:

```bash
# Edit SSH config
nano ~/.ssh/config

# Add this section:
Host dlt
    Hostname dlt.aurigraph.io
    User subbu
    Port 2235
    IdentityFile ~/.ssh/id_rsa

    # REPLACE THESE WITH YOUR PROXY DETAILS:
    ProxyCommand ssh -q -W %h:%p YOUR_PROXY_HOST:YOUR_PROXY_PORT

    # Connection optimization
    ConnectTimeout 30
    ServerAliveInterval 60
    ServerAliveCountMax 3
    Compression yes
    ControlMaster auto
    ControlPath ~/.ssh/control-%h-%p-%r
    ControlPersist 600
```

---

## Files

- **Reference Config**: `~/.ssh/config.proxy-setup` (contains all options)
- **Deployment Script**: `./deploy.sh` (executes deployment via SSH)
- **Manual Guide**: `MANUAL-DEPLOYMENT.md` (step-by-step procedures)

---

## Next Steps

1. **Identify proxy**: Get proxy server and port from IT
2. **Update SSH config**: Add ProxyCommand to ~/.ssh/config
3. **Test connection**: `ssh -v dlt "echo test"`
4. **Run deployment**: `./deploy.sh deploy`
5. **Monitor progress**: Watch logs with `ssh dlt "docker-compose logs -f"`

---

## Support

For SSH configuration help:
- See `/tmp/.ssh/config.proxy-setup` for all template options
- Run `ssh -v dlt "test"` to see detailed connection info
- Check proxy settings with IT department

---

**After SSH is configured, deployment is one command away:**

```bash
./deploy.sh deploy
```

Expected timeline:
- First run (build images): 30-40 minutes
- Subsequent runs: 2-5 minutes
- Service startup: 1-2 minutes

**Total time to production: ~5-10 minutes of setup + deployment time**
