# Server Connectivity Diagnostic Guide
## Aurigraph v11.4.4 - dlt.aurigraph.io Connectivity Issue

**Date Created**: November 10, 2025
**Server**: dlt.aurigraph.io
**Application Version**: Aurigraph v11.4.4
**Last Known Working**: November 9, 2025
**Current Status**: 100% ping loss (unreachable)

---

## Executive Summary

The Aurigraph v11.4.4 application was successfully deployed on November 9, 2025. The server is now unreachable with 100% packet loss. This guide provides systematic diagnostic procedures for infrastructure/DevOps teams to identify and resolve the connectivity issue.

---

## Last Known Working Configuration

### Successful Deployment Details (Nov 9, 2025)
- **JAR Transfer**: Successfully transferred via SCP on port 22
- **Application Process**: Started with PID 1721015
- **Health Check**: `/actuator/health` endpoint returned `{"status":"UP"}`
- **Ports in Use**:
  - 9003: HTTP/REST API
  - 9004: gRPC services
  - 22: SSH (used for deployment)

### Expected Endpoints
```
HTTP:  http://dlt.aurigraph.io:9003/actuator/health
gRPC:  dlt.aurigraph.io:9004
SSH:   ssh -p2235 subbu@dlt.aurigraph.io (or port 22 if custom SSH)
```

---

## Diagnostic Procedure Checklist

### Phase 1: Network Layer Diagnostics

#### 1.1 DNS Resolution Tests

**Objective**: Verify that the domain resolves to the correct IP address.

```bash
# Test 1: Basic DNS lookup
nslookup dlt.aurigraph.io

# Expected Output: Should return an IP address
# Document the IP address for later tests

# Test 2: Detailed DNS query
dig dlt.aurigraph.io +short

# Test 3: Check all DNS records
dig dlt.aurigraph.io ANY

# Test 4: Query specific nameserver
dig @8.8.8.8 dlt.aurigraph.io
```

**Pass Criteria**:
- DNS resolves to a valid IP address
- IP address matches expected server IP
- No NXDOMAIN or SERVFAIL errors

**Failure Scenarios**:
- ❌ **DNS Resolution Fails**: DNS records may be deleted or expired
  - **Solution**: Check DNS provider (e.g., Cloudflare, Route53, GoDaddy)
  - **Solution**: Verify domain registration is active
  - **Solution**: Check TTL and ensure propagation completed

- ❌ **Wrong IP Returned**: DNS pointing to wrong server
  - **Solution**: Update A record to correct IP
  - **Solution**: Wait for DNS propagation (up to 48 hours)

---

#### 1.2 Basic Network Connectivity (ICMP)

**Objective**: Test if server responds to ping requests.

```bash
# Test 1: Basic ping
ping -c 10 dlt.aurigraph.io

# Test 2: Ping with specific packet size
ping -c 10 -s 1400 dlt.aurigraph.io

# Test 3: Ping by IP (use IP from DNS test)
ping -c 10 <IP_ADDRESS>
```

**Pass Criteria**:
- 0% packet loss
- Response times < 200ms (depending on geography)
- No "Destination Host Unreachable" errors

**Failure Scenarios**:
- ❌ **100% Packet Loss**: Server down or firewall blocking ICMP
  - **Solution**: This is EXPECTED for some servers (ICMP often blocked)
  - **Solution**: Continue to TCP-level tests (SSH, HTTP)
  - **Note**: Many production servers disable ICMP for security

- ❌ **High Packet Loss (>20%)**: Network congestion or routing issues
  - **Solution**: Check with hosting provider
  - **Solution**: Run traceroute to identify problematic hop

---

#### 1.3 Network Routing Analysis

**Objective**: Identify where packets are being dropped.

```bash
# Test 1: Traceroute to server
traceroute dlt.aurigraph.io

# Test 2: MTR for continuous monitoring (if available)
mtr -c 100 dlt.aurigraph.io

# Test 3: TCP traceroute to specific port
tcptraceroute dlt.aurigraph.io 9003
```

**Pass Criteria**:
- Traceroute completes to destination
- No asterisks (*) in final hops
- Reasonable hop count (< 30)

**Failure Scenarios**:
- ❌ **Traceroute Stops at ISP/Hosting Provider**: Contact hosting provider
  - **Solution**: Check for DDoS protection blocking traffic
  - **Solution**: Verify server is actually running
  - **Solution**: Check for upstream network outage

- ❌ **Traceroute Times Out Before Reaching Server**: Routing issue
  - **Solution**: Contact network administrator
  - **Solution**: Check BGP routing tables
  - **Solution**: Verify no IP blocks or geofencing

---

### Phase 2: SSH Connectivity Tests (Port 22 or 2235)

**Objective**: Verify SSH access to manage the server.

#### 2.1 SSH Port Connectivity

```bash
# Test 1: Check if SSH port is open (standard port)
telnet dlt.aurigraph.io 22

# Test 2: Check if SSH port is open (custom port)
telnet dlt.aurigraph.io 2235

# Test 3: Netcat test (more reliable)
nc -zv dlt.aurigraph.io 22
nc -zv dlt.aurigraph.io 2235

# Test 4: Nmap port scan
nmap -p 22,2235 dlt.aurigraph.io
```

**Pass Criteria**:
- Port responds with "SSH-2.0-OpenSSH_X.X" banner
- Telnet shows "Connected to dlt.aurigraph.io"
- Netcat reports port as "open"

**Failure Scenarios**:
- ❌ **Connection Refused**: SSH daemon not running
  - **Solution**: Requires physical/console access to server
  - **Solution**: Contact hosting provider for console access
  - **Solution**: Restart sshd service: `systemctl restart sshd`

- ❌ **Connection Timeout**: Firewall blocking port
  - **Solution**: Check firewall rules (iptables, ufw, cloud security groups)
  - **Solution**: Verify hosting provider firewall settings
  - **Solution**: Check for fail2ban or similar blocking IPs

- ❌ **Port Closed**: Wrong port or SSH not listening
  - **Solution**: Try alternate port (22 vs 2235)
  - **Solution**: Verify sshd_config: `Port` directive
  - **Solution**: Check if sshd is running: `ps aux | grep sshd`

#### 2.2 SSH Login Attempt

```bash
# Test 1: SSH login (standard port)
ssh -v subbu@dlt.aurigraph.io

# Test 2: SSH login (custom port 2235)
ssh -p2235 -v subbu@dlt.aurigraph.io

# Test 3: SSH with increased verbosity
ssh -vvv -p2235 subbu@dlt.aurigraph.io
```

**Pass Criteria**:
- Successfully prompts for password
- Can authenticate and get shell access

**Failure Scenarios**:
- ❌ **Connection Timeout**: See Phase 2.1 failures
- ❌ **Permission Denied (publickey)**: SSH key authentication issue
  - **Solution**: Try password authentication: `ssh -o PreferredAuthentications=password`
  - **Solution**: Check ~/.ssh/authorized_keys on server
  - **Solution**: Verify SSH key permissions (600 for private key)

- ❌ **Host Key Verification Failed**: Known_hosts mismatch
  - **Solution**: Remove old entry: `ssh-keygen -R dlt.aurigraph.io`
  - **Warning**: Only do this if server was recently rebuilt

---

### Phase 3: Application Port Tests

#### 3.1 HTTP Port 9003 Connectivity

**Objective**: Verify application HTTP endpoint is accessible.

```bash
# Test 1: Check if port is open
telnet dlt.aurigraph.io 9003

# Test 2: Netcat test
nc -zv dlt.aurigraph.io 9003

# Test 3: Nmap scan
nmap -p 9003 dlt.aurigraph.io

# Test 4: HTTP request test
curl -v http://dlt.aurigraph.io:9003/actuator/health

# Test 5: HTTP with timeout
curl -v --connect-timeout 10 http://dlt.aurigraph.io:9003/actuator/health

# Test 6: Wget test
wget --timeout=10 -O- http://dlt.aurigraph.io:9003/actuator/health
```

**Pass Criteria**:
- Port 9003 responds (open)
- `/actuator/health` returns: `{"status":"UP"}`
- HTTP 200 OK status code

**Failure Scenarios**:
- ❌ **Connection Refused**: Application not running
  - **Solution**: Check if Java process is running (see Phase 4.1)
  - **Solution**: Restart application
  - **Solution**: Check application logs for startup errors

- ❌ **Connection Timeout**: Firewall blocking port 9003
  - **Solution**: Check firewall rules (see Phase 5)
  - **Solution**: Verify security group allows inbound on 9003
  - **Solution**: Check if application bound to 0.0.0.0 vs 127.0.0.1

- ❌ **404 Not Found**: Application running but endpoint missing
  - **Solution**: Verify Spring Boot Actuator is enabled
  - **Solution**: Check `application.properties` or `application.yml`
  - **Solution**: Try base URL: `http://dlt.aurigraph.io:9003/`

- ❌ **503 Service Unavailable**: Application started but not ready
  - **Solution**: Wait 1-2 minutes for Spring Boot initialization
  - **Solution**: Check application logs: `/var/log/aurigraph/` or `~/aurigraph-v11.4.4.log`
  - **Solution**: Verify database connectivity if health check depends on it

#### 3.2 gRPC Port 9004 Connectivity

**Objective**: Verify gRPC service port is accessible.

```bash
# Test 1: Check if port is open
telnet dlt.aurigraph.io 9004

# Test 2: Netcat test
nc -zv dlt.aurigraph.io 9004

# Test 3: Nmap scan
nmap -p 9004 dlt.aurigraph.io

# Test 4: gRPC health check (if grpcurl installed)
grpcurl -plaintext dlt.aurigraph.io:9004 list

# Test 5: gRPC health probe
grpcurl -plaintext dlt.aurigraph.io:9004 grpc.health.v1.Health/Check
```

**Pass Criteria**:
- Port 9004 responds (open)
- gRPC services list successfully

**Failure Scenarios**:
- ❌ **Connection Refused**: See HTTP Port failures (3.1)
- ❌ **Connection Timeout**: Firewall blocking port 9004
  - **Solution**: Same as HTTP port 9003 solutions
  - **Solution**: Ensure both ports 9003 and 9004 are opened together

---

### Phase 4: Server-Side Diagnostics

**⚠️ PREREQUISITE**: SSH access must be working (Phase 2 passed)

#### 4.1 Application Process Verification

**Objective**: Verify Aurigraph application is running.

```bash
# Test 1: Check for Java process
ps aux | grep java
ps aux | grep aurigraph

# Test 2: Check specific PID (from deployment: 1721015)
ps -p 1721015 -f

# Test 3: Check listening ports
netstat -tulpn | grep java
ss -tulpn | grep java

# Test 4: Check systemd service (if configured)
systemctl status aurigraph
systemctl status aurigraph.service

# Test 5: Check recent process history
cat /var/log/syslog | grep aurigraph
journalctl -u aurigraph.service -n 100
```

**Pass Criteria**:
- Java process found with PID 1721015 (or new PID)
- Process command shows `aurigraph-v11.4.4-SNAPSHOT.jar`
- Ports 9003 and 9004 show as LISTEN state

**Failure Scenarios**:
- ❌ **Process Not Found**: Application crashed or stopped
  - **Solution**: Check logs: `tail -n 500 ~/aurigraph-v11.4.4.log`
  - **Solution**: Check system logs: `journalctl -xe`
  - **Solution**: Restart application with deployment script
  - **Solution**: Check for OutOfMemory errors in logs

- ❌ **Process Found But Ports Not Listening**: Binding failure
  - **Solution**: Check if ports already in use (see Phase 4.2)
  - **Solution**: Verify application.properties port configuration
  - **Solution**: Check for "Address already in use" in logs

- ❌ **Multiple Processes Running**: Port conflict risk
  - **Solution**: Kill old processes: `kill -9 <PID>`
  - **Solution**: Verify deployment script isn't running multiple times
  - **Solution**: Check cron jobs or auto-restart scripts

#### 4.2 Port Conflict Detection

**Objective**: Ensure no other process is using application ports.

```bash
# Test 1: Check what's using port 9003
lsof -i :9003
netstat -tulpn | grep :9003
ss -tulpn | grep :9003

# Test 2: Check what's using port 9004
lsof -i :9004
netstat -tulpn | grep :9004
ss -tulpn | grep :9004

# Test 3: Check all listening ports
netstat -tulpn | sort -n
ss -tulpn | sort -n

# Test 4: Check for port range conflicts
lsof -i :9000-9010
```

**Pass Criteria**:
- Only Aurigraph Java process using ports 9003 and 9004
- No conflicts with other services

**Failure Scenarios**:
- ❌ **Port Used by Different Process**: Port conflict
  - **Solution**: Kill conflicting process (if safe)
  - **Solution**: Change Aurigraph ports in configuration
  - **Solution**: Identify why other service is using these ports

- ❌ **Port Shows as TIME_WAIT**: Recent restart
  - **Solution**: Wait 60 seconds for TCP cleanup
  - **Solution**: Increase net.ipv4.tcp_fin_timeout if persistent

- ❌ **Nothing Listening on Ports**: Application startup failed
  - **Solution**: Check application logs immediately
  - **Solution**: Verify Spring Boot configuration
  - **Solution**: Check for binding errors (0.0.0.0 vs 127.0.0.1)

#### 4.3 Application Log Analysis

**Objective**: Identify startup or runtime errors.

```bash
# Test 1: Check primary application log
tail -n 500 ~/aurigraph-v11.4.4.log
cat ~/aurigraph-v11.4.4.log | grep ERROR
cat ~/aurigraph-v11.4.4.log | grep WARN

# Test 2: Check system logs
tail -n 500 /var/log/syslog | grep aurigraph
journalctl -u aurigraph.service -n 500

# Test 3: Check for OutOfMemory errors
cat ~/aurigraph-v11.4.4.log | grep -i "OutOfMemoryError"
cat ~/aurigraph-v11.4.4.log | grep -i "java.lang.OutOfMemoryError"

# Test 4: Check for port binding errors
cat ~/aurigraph-v11.4.4.log | grep -i "Address already in use"
cat ~/aurigraph-v11.4.4.log | grep -i "bind"

# Test 5: Check Spring Boot startup
cat ~/aurigraph-v11.4.4.log | grep "Started AurigraphApplication"
cat ~/aurigraph-v11.4.4.log | grep "Tomcat started on port"

# Test 6: Check recent errors (last 1 hour)
find ~/ -name "*.log" -mmin -60 -exec tail {} \;
```

**Key Log Indicators**:

✅ **Successful Startup**:
```
Started AurigraphApplication in X.XXX seconds
Tomcat started on port(s): 9003 (http)
gRPC server started on port 9004
```

❌ **Common Error Patterns**:

**OutOfMemoryError**:
```
java.lang.OutOfMemoryError: Java heap space
```
- **Solution**: Increase JVM heap: `-Xmx4g` or higher
- **Solution**: Check for memory leaks
- **Solution**: Monitor with: `jstat -gc <PID> 1000`

**Port Binding Error**:
```
java.net.BindException: Address already in use
```
- **Solution**: See Phase 4.2 port conflict resolution

**Database Connection Error**:
```
Unable to acquire JDBC Connection
Connection refused: connect
```
- **Solution**: Verify database is running
- **Solution**: Check connection string in application.properties
- **Solution**: Verify firewall allows database port

**Class Not Found**:
```
java.lang.ClassNotFoundException
java.lang.NoClassDefFoundError
```
- **Solution**: Verify JAR file integrity
- **Solution**: Re-deploy with `mvn clean package`
- **Solution**: Check for corrupted transfer

#### 4.4 System Resource Check

**Objective**: Verify server has adequate resources.

```bash
# Test 1: Check memory usage
free -h
cat /proc/meminfo | grep -E "MemTotal|MemAvailable"

# Test 2: Check disk space
df -h
du -sh /home/subbu/*
du -sh /var/log/*

# Test 3: Check CPU load
uptime
top -bn1 | head -20
mpstat

# Test 4: Check I/O wait
iostat -x 1 5

# Test 5: Check open file descriptors
ulimit -n
lsof | wc -l

# Test 6: Check system limits
cat /proc/sys/fs/file-max
cat /proc/sys/fs/file-nr
```

**Pass Criteria**:
- Available memory > 1GB
- Disk space > 10% free
- CPU load < 80%
- I/O wait < 20%

**Failure Scenarios**:
- ❌ **Low Memory**: System thrashing or OOM killer active
  - **Solution**: Restart server or terminate memory-heavy processes
  - **Solution**: Add swap space if needed
  - **Solution**: Upgrade server memory

- ❌ **Disk Full**: Cannot write logs or temporary files
  - **Solution**: Clean old logs: `find /var/log -name "*.log" -mtime +30 -delete`
  - **Solution**: Clean package cache: `apt clean` or `yum clean all`
  - **Solution**: Remove old deployments

- ❌ **High I/O Wait**: Disk bottleneck
  - **Solution**: Check for failing disk: `dmesg | grep -i error`
  - **Solution**: Identify I/O heavy process: `iotop`
  - **Solution**: Consider SSD upgrade

---

### Phase 5: Firewall and Security Diagnostics

#### 5.1 iptables Firewall Rules

**Objective**: Verify firewall allows required ports.

```bash
# Test 1: List all iptables rules
sudo iptables -L -n -v
sudo iptables -t nat -L -n -v

# Test 2: Check INPUT chain specifically
sudo iptables -L INPUT -n -v --line-numbers

# Test 3: Check for DROP/REJECT rules
sudo iptables -L | grep -E "DROP|REJECT"

# Test 4: Save current rules for backup
sudo iptables-save > /tmp/iptables-backup-$(date +%Y%m%d).txt

# Test 5: Check if firewalld is running (RHEL/CentOS)
sudo firewall-cmd --state
sudo firewall-cmd --list-all
```

**Pass Criteria**:
- INPUT chain allows ports 22 (or 2235), 9003, 9004
- No DROP/REJECT rules blocking these ports
- Default policy reasonable (ACCEPT or targeted DROP)

**Failure Scenarios**:
- ❌ **Ports 9003/9004 Not Allowed**: Firewall blocking application
  - **Solution**: Add iptables rules:
  ```bash
  sudo iptables -I INPUT -p tcp --dport 9003 -j ACCEPT
  sudo iptables -I INPUT -p tcp --dport 9004 -j ACCEPT
  sudo iptables-save > /etc/iptables/rules.v4
  ```
  - **Solution**: For firewalld:
  ```bash
  sudo firewall-cmd --permanent --add-port=9003/tcp
  sudo firewall-cmd --permanent --add-port=9004/tcp
  sudo firewall-cmd --reload
  ```

- ❌ **SSH Port Blocked**: Cannot access server
  - **Solution**: Requires console access to fix
  - **Solution**: Contact hosting provider
  - **Solution**: Restore known-good firewall configuration

- ❌ **Overly Restrictive Rules**: Whitelist-based blocking
  - **Solution**: Add source IP whitelist if required
  - **Solution**: Check for recent security changes

#### 5.2 UFW Firewall (Ubuntu/Debian)

```bash
# Test 1: Check UFW status
sudo ufw status verbose
sudo ufw status numbered

# Test 2: List all rules
sudo ufw show raw

# Test 3: Check application profiles
sudo ufw app list
```

**Failure Scenarios**:
- ❌ **UFW Blocking Ports**: Add rules:
  ```bash
  sudo ufw allow 9003/tcp
  sudo ufw allow 9004/tcp
  sudo ufw reload
  ```

#### 5.3 Cloud Provider Security Groups

**Objective**: Verify cloud firewall allows traffic.

**⚠️ This must be checked in cloud provider console**

**AWS Security Groups**:
1. Log into AWS Console
2. Navigate to EC2 > Security Groups
3. Find security group attached to dlt.aurigraph.io instance
4. Verify Inbound Rules include:
   - TCP 22 (or 2235) from your IP or 0.0.0.0/0
   - TCP 9003 from 0.0.0.0/0 (or specific CIDR)
   - TCP 9004 from 0.0.0.0/0 (or specific CIDR)

**Azure Network Security Groups**:
1. Log into Azure Portal
2. Navigate to Network Security Groups
3. Find NSG attached to VM
4. Check Inbound Security Rules

**Google Cloud Firewall Rules**:
1. Log into GCP Console
2. Navigate to VPC Network > Firewall
3. Verify rules allow tcp:9003,9004

**Common Issues**:
- Recent security group changes removed ports
- Wrong security group attached to instance
- Network ACLs blocking traffic (AWS)
- IP whitelist doesn't include your current IP

#### 5.4 fail2ban or Security Software

```bash
# Test 1: Check if fail2ban is running
sudo systemctl status fail2ban
sudo fail2ban-client status

# Test 2: Check if your IP is banned
sudo fail2ban-client status sshd
sudo fail2ban-client get sshd banned

# Test 3: Check ban logs
sudo tail -n 100 /var/log/fail2ban.log

# Test 4: Unban IP if blocked
sudo fail2ban-client unban <YOUR_IP>

# Test 5: Check other security software
ps aux | grep -E "crowdstrike|carbonblack|sentinel"
```

**Failure Scenarios**:
- ❌ **IP Banned by fail2ban**: Multiple failed login attempts
  - **Solution**: Unban IP: `sudo fail2ban-client unban <IP>`
  - **Solution**: Add IP to whitelist in `/etc/fail2ban/jail.local`

---

### Phase 6: Network Interface and Binding

#### 6.1 Network Interface Status

```bash
# Test 1: List all network interfaces
ip addr show
ifconfig -a

# Test 2: Check default route
ip route show
route -n

# Test 3: Check listening addresses
netstat -tulpn | grep -E "9003|9004"
ss -tulpn | grep -E "9003|9004"

# Test 4: Check if application bound to correct interface
lsof -i -P -n | grep java
```

**Pass Criteria**:
- Primary network interface is UP
- Application bound to 0.0.0.0:9003 and 0.0.0.0:9004 (all interfaces)
- Or bound to public IP address

**Failure Scenarios**:
- ❌ **Application Bound to 127.0.0.1**: Only accessible locally
  - **Solution**: Update application.properties:
  ```properties
  server.address=0.0.0.0
  grpc.server.address=0.0.0.0
  ```
  - **Solution**: Restart application after change

- ❌ **Network Interface Down**: Hardware or driver issue
  - **Solution**: Restart network: `sudo systemctl restart networking`
  - **Solution**: Check dmesg for hardware errors
  - **Solution**: Contact hosting provider

---

### Phase 7: Application Configuration Review

#### 7.1 Spring Boot Configuration Files

```bash
# Test 1: Check application.properties
cat ~/application.properties
cat ~/aurigraph-v11.4.4/application.properties

# Test 2: Check application.yml
cat ~/application.yml
cat ~/aurigraph-v11.4.4/application.yml

# Test 3: Check for environment-specific configs
ls -la ~/application-*.properties
ls -la ~/application-*.yml

# Test 4: Check embedded config in JAR
unzip -p ~/aurigraph-v11.4.4-SNAPSHOT.jar application.properties
unzip -p ~/aurigraph-v11.4.4-SNAPSHOT.jar application.yml
```

**Key Configuration Parameters to Verify**:

```properties
# Server ports
server.port=9003
server.address=0.0.0.0

# gRPC port
grpc.server.port=9004
grpc.server.address=0.0.0.0

# Actuator
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=always

# Logging
logging.file.name=aurigraph-v11.4.4.log
logging.level.root=INFO
```

**Failure Scenarios**:
- ❌ **Wrong Port Configuration**: Ports don't match expected
  - **Solution**: Update configuration file
  - **Solution**: Or pass via command line: `--server.port=9003`

- ❌ **Actuator Disabled**: Health endpoint not available
  - **Solution**: Enable in application.properties
  - **Solution**: Add spring-boot-starter-actuator dependency

#### 7.2 JVM Configuration

```bash
# Test 1: Check current JVM settings
ps aux | grep java | grep -oE "\-X[^ ]*"

# Test 2: Expected JVM settings
# -Xms2g          (minimum heap)
# -Xmx4g          (maximum heap)
# -XX:+UseG1GC    (garbage collector)

# Test 3: Check Java version
java -version
which java
echo $JAVA_HOME
```

**Recommended JVM Settings**:
```bash
java -Xms2g -Xmx4g \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/tmp/heap_dump.hprof \
  -jar aurigraph-v11.4.4-SNAPSHOT.jar
```

---

## Quick Diagnostic Command Sequence

Run these commands in order for rapid diagnosis:

```bash
# 1. Basic connectivity (30 seconds)
ping -c 5 dlt.aurigraph.io
nc -zv dlt.aurigraph.io 22
nc -zv dlt.aurigraph.io 9003
nc -zv dlt.aurigraph.io 9004

# 2. If SSH works, check server-side (2 minutes)
ssh -p2235 subbu@dlt.aurigraph.io << 'EOF'
  ps aux | grep java
  netstat -tulpn | grep -E "9003|9004"
  sudo iptables -L -n | grep -E "9003|9004"
  tail -n 50 ~/aurigraph-v11.4.4.log
  free -h
  df -h
EOF

# 3. If SSH doesn't work (server-side unknown)
nmap -p 22,9003,9004 dlt.aurigraph.io
traceroute dlt.aurigraph.io
```

---

## Common Root Causes (Prioritized)

### 1. Server Powered Off / Crashed (MOST LIKELY)
**Symptoms**: 100% packet loss, all ports unreachable
**Verification**: Cannot SSH, cannot ping, all services down
**Solution**:
- Contact hosting provider immediately
- Request console access
- Check for hardware failure
- Review recent server events (reboots, maintenance)

### 2. Firewall Configuration Changed
**Symptoms**: SSH works, but application ports timeout
**Verification**: Can SSH, but `nc -zv` fails on 9003/9004
**Solution**: See Phase 5 (Firewall Diagnostics)

### 3. Application Crashed
**Symptoms**: SSH works, ports not listening, no Java process
**Verification**: SSH works, `ps aux | grep java` returns nothing
**Solution**: Restart application, check logs for crash cause

### 4. Network Configuration Changed
**Symptoms**: DNS fails or returns wrong IP
**Verification**: `nslookup` fails or returns unexpected IP
**Solution**: Update DNS records, wait for propagation

### 5. DDoS Protection / Rate Limiting
**Symptoms**: Intermittent connectivity, some IPs work
**Verification**: Works from one location but not another
**Solution**: Check Cloudflare/AWS Shield, whitelist testing IPs

### 6. Cloud Provider Issue
**Symptoms**: Everything appears correct server-side
**Verification**: Application running, firewall open, but still unreachable
**Solution**: Check cloud provider status page, contact support

---

## Emergency Recovery Procedures

### Scenario A: Cannot SSH (Console Access Required)

**If you have console access (VNC/KVM/iDRAC)**:
1. Access server console via hosting provider
2. Login with root/admin credentials
3. Check network interface:
   ```bash
   ip addr show
   ip link set eth0 up
   ```
4. Restart networking:
   ```bash
   systemctl restart networking
   ```
5. Check sshd:
   ```bash
   systemctl status sshd
   systemctl restart sshd
   ```

### Scenario B: Application Down but SSH Works

```bash
# 1. Login via SSH
ssh -p2235 subbu@dlt.aurigraph.io

# 2. Navigate to application directory
cd ~

# 3. Check if old process exists
ps aux | grep aurigraph
# If exists, kill it:
kill -9 <PID>

# 4. Restart application
nohup java -Xms2g -Xmx4g -jar aurigraph-v11.4.4-SNAPSHOT.jar > aurigraph.log 2>&1 &

# 5. Verify startup
tail -f aurigraph.log
# Wait for: "Started AurigraphApplication"

# 6. Test health endpoint
curl http://localhost:9003/actuator/health
```

### Scenario C: Firewall Blocking All Traffic

```bash
# If you have console access:

# 1. Flush all iptables rules (CAUTION!)
sudo iptables -F
sudo iptables -X
sudo iptables -P INPUT ACCEPT
sudo iptables -P FORWARD ACCEPT
sudo iptables -P OUTPUT ACCEPT

# 2. Add essential rules
sudo iptables -A INPUT -i lo -j ACCEPT
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 9003 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 9004 -j ACCEPT

# 3. Save rules
sudo iptables-save > /etc/iptables/rules.v4

# 4. Test connectivity
curl http://localhost:9003/actuator/health
```

---

## Escalation Path

### Level 1: Application Team (Try First)
**Actions**:
- Run diagnostic commands
- Check application logs
- Restart application if needed

**Escalate if**: Cannot SSH or server appears completely down

### Level 2: System Administrator
**Actions**:
- Verify firewall rules
- Check system resources
- Review system logs
- Restart services if needed

**Escalate if**: Server physically unreachable or hardware issues suspected

### Level 3: Hosting Provider / Cloud Support
**Actions**:
- Verify server is powered on
- Check for hardware failures
- Review network configuration
- Provide console access

**Contact**: [Insert hosting provider support contact]

---

## Testing After Resolution

Once connectivity is restored, run these tests:

```bash
# 1. Health check
curl http://dlt.aurigraph.io:9003/actuator/health

# 2. API endpoint test
curl http://dlt.aurigraph.io:9003/api/v1/status

# 3. gRPC test (if grpcurl available)
grpcurl -plaintext dlt.aurigraph.io:9004 list

# 4. Load test (optional)
ab -n 1000 -c 10 http://dlt.aurigraph.io:9003/actuator/health
```

Expected results:
- Health check returns `{"status":"UP"}`
- HTTP 200 status codes
- Response times < 200ms
- No errors in application logs

---

## Prevention Recommendations

1. **Monitoring**: Implement uptime monitoring (UptimeRobot, Pingdom)
2. **Alerting**: Set up alerts for:
   - Server unreachable (ping)
   - SSH unavailable
   - Application ports down
   - High CPU/memory usage
3. **Backups**: Regular backups of:
   - Application configuration
   - Firewall rules
   - System configuration
4. **Documentation**: Keep updated:
   - Deployment procedures
   - Configuration files
   - Access credentials (securely)
5. **Redundancy**: Consider:
   - Load balancer with health checks
   - Multi-server deployment
   - Auto-scaling groups

---

## Contact Information

**Application Owner**: Subbu Jois
**Email**: sjoish12@gmail.com
**Server**: dlt.aurigraph.io
**SSH**: `ssh -p2235 subbu@dlt.aurigraph.io`
**Application Ports**: 9003 (HTTP), 9004 (gRPC)

**Hosting Provider**: [Insert provider name and support contact]

---

## Document Version
- **Version**: 1.0
- **Created**: November 10, 2025
- **Author**: Aurigraph DevOps Team
- **Last Updated**: November 10, 2025

---

## Appendix: Useful Commands Reference

### Network Testing
```bash
ping -c 10 <host>                    # ICMP connectivity
nc -zv <host> <port>                 # TCP port check
telnet <host> <port>                 # Interactive TCP test
nmap -p <ports> <host>               # Port scanning
traceroute <host>                    # Route tracing
mtr <host>                           # Network diagnostics
curl -v http://<host>:<port>         # HTTP testing
```

### DNS Testing
```bash
nslookup <domain>                    # Basic DNS lookup
dig <domain>                         # Detailed DNS query
dig @8.8.8.8 <domain>               # Query specific DNS server
host <domain>                        # Simple DNS lookup
```

### Process Management
```bash
ps aux | grep <name>                 # Find process
kill -9 <PID>                        # Force kill process
pkill -f <pattern>                   # Kill by pattern
pgrep -a <name>                      # Find process by name
```

### Port and Network
```bash
netstat -tulpn                       # All listening ports
ss -tulpn                            # Socket statistics
lsof -i :<port>                      # What's using port
lsof -i -P -n                        # All network connections
```

### Firewall
```bash
sudo iptables -L -n -v               # List iptables rules
sudo ufw status verbose              # UFW status
sudo firewall-cmd --list-all         # Firewalld rules
```

### System Resources
```bash
free -h                              # Memory usage
df -h                                # Disk usage
top                                  # CPU/memory monitor
htop                                 # Better top
iostat -x 1 5                        # I/O statistics
```

### Logs
```bash
tail -f <logfile>                    # Follow log
tail -n 500 <logfile>                # Last 500 lines
grep -i error <logfile>              # Find errors
journalctl -u <service> -n 100       # Service logs
dmesg | tail                         # Kernel messages
```
