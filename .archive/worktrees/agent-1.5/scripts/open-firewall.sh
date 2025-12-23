#!/bin/bash

echo "🔓 Opening firewall port for Aurigraph V11"
echo "=========================================="
echo ""

REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PORT="2235"
REMOTE_PASS="subbuFuture@2025"

# Function to execute remote commands
remote_exec() {
    sshpass -p "${REMOTE_PASS}" ssh -p ${REMOTE_PORT} -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "$1"
}

echo "Step 1: Checking current firewall status..."
remote_exec "
sudo ufw status 2>/dev/null || echo 'UFW not installed'
"

echo ""
echo "Step 2: Opening port 9003..."
remote_exec "
# Open port 9003
sudo ufw allow 9003/tcp 2>/dev/null || echo 'Firewall not configured'

# Also ensure iptables allows it
sudo iptables -A INPUT -p tcp --dport 9003 -j ACCEPT 2>/dev/null || true
sudo iptables -A OUTPUT -p tcp --sport 9003 -j ACCEPT 2>/dev/null || true

echo 'Port 9003 opened'
"

echo ""
echo "Step 3: Checking service status..."
remote_exec "
# Check if service is running
sudo systemctl status aurigraph-v11 --no-pager | grep 'Active:'

# Check if it's listening on the port
sudo netstat -tlnp | grep 9003 || echo 'Not listening on 9003'

# Check logs
echo ''
echo 'Recent logs:'
sudo journalctl -u aurigraph-v11 --no-pager -n 5
"

echo ""
echo "Step 4: Testing local connectivity on server..."
remote_exec "
curl -s http://localhost:9003/q/health | head -20 || echo 'Service not responding locally'
"

echo ""
echo "✅ Firewall configuration complete!"
echo ""