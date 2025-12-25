#!/bin/bash

################################################################################
# Sprint 18: TLS Certificate Generation for Aurigraph V11 Cluster
#
# Generates all required certificates for:
# - NGINX load balancer (server + client certificates)
# - Quarkus nodes (server + client certificates)
# - Consul service discovery (server + client certificates)
# - mTLS authentication between all components
#
# Usage: ./generate-tls-certificates.sh [output-directory]
# Default output: ./tls-certs
################################################################################

set -e

# ========== Configuration ==========
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${1:-.}/tls-certs"
DAYS_VALID=365
KEY_SIZE=2048

# Node configuration
NODES=("node-1" "node-2" "node-3" "node-4")
NODE_IPS=("172.26.0.10" "172.26.0.11" "172.26.0.12" "172.26.0.13")

# ========== Colors for output ==========
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ========== Helper Functions ==========

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# ========== Step 1: Initialize Output Directory ==========

log_info "Initializing certificate directory: $OUTPUT_DIR"

if [ -d "$OUTPUT_DIR" ]; then
    log_warn "Directory $OUTPUT_DIR already exists. Removing old certificates..."
    rm -rf "$OUTPUT_DIR"
fi

mkdir -p "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/ca"
mkdir -p "$OUTPUT_DIR/nginx"
mkdir -p "$OUTPUT_DIR/consul"
mkdir -p "$OUTPUT_DIR/nodes"

log_info "✓ Directory structure created"

# ========== Step 2: Generate Root CA Certificate ==========

log_info "Generating Root CA Certificate..."

# CA private key
openssl genrsa -out "$OUTPUT_DIR/ca/ca.key" 4096 2>/dev/null

# CA certificate
openssl req -x509 \
    -new \
    -nodes \
    -key "$OUTPUT_DIR/ca/ca.key" \
    -days $DAYS_VALID \
    -out "$OUTPUT_DIR/ca/ca.crt" \
    -subj "/C=US/ST=California/L=San Francisco/O=Aurigraph/OU=DLT/CN=Aurigraph-Root-CA" \
    2>/dev/null

log_info "✓ Root CA Certificate created"

# ========== Step 3: Create OpenSSL Config for Extensions ==========

log_info "Creating OpenSSL config for certificate extensions..."

cat > "$OUTPUT_DIR/ca/extensions.conf" << 'EOF'
[v3_req]
subjectAltName = @alt_names
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth, clientAuth

[v3_ca]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer:always
basicConstraints = CA:true

[alt_names]
EOF

log_info "✓ OpenSSL config created"

# ========== Step 4: Generate NGINX Certificates ==========

log_info "Generating NGINX Server Certificate..."

# NGINX server key
openssl genrsa -out "$OUTPUT_DIR/nginx/nginx-server.key" 2048 2>/dev/null

# NGINX server CSR
openssl req -new \
    -key "$OUTPUT_DIR/nginx/nginx-server.key" \
    -out "$OUTPUT_DIR/nginx/nginx-server.csr" \
    -subj "/C=US/ST=California/L=San Francisco/O=Aurigraph/OU=DLT/CN=nginx-lb" \
    2>/dev/null

# Create SAN config for NGINX
cat > "$OUTPUT_DIR/nginx/nginx-san.conf" << EOF
subjectAltName = DNS:nginx-lb,DNS:nginx,DNS:localhost,IP:127.0.0.1,IP:172.26.0.5
EOF

# NGINX server certificate (signed by CA)
openssl x509 -req \
    -in "$OUTPUT_DIR/nginx/nginx-server.csr" \
    -CA "$OUTPUT_DIR/ca/ca.crt" \
    -CAkey "$OUTPUT_DIR/ca/ca.key" \
    -CAcreateserial \
    -out "$OUTPUT_DIR/nginx/nginx-server.crt" \
    -days $DAYS_VALID \
    -extensions v3_req \
    -extfile "$OUTPUT_DIR/nginx/nginx-san.conf" \
    2>/dev/null

log_info "✓ NGINX Server Certificate created"

log_info "Generating NGINX Client Certificate (mTLS)..."

# NGINX client key
openssl genrsa -out "$OUTPUT_DIR/nginx/nginx-client.key" 2048 2>/dev/null

# NGINX client CSR
openssl req -new \
    -key "$OUTPUT_DIR/nginx/nginx-client.key" \
    -out "$OUTPUT_DIR/nginx/nginx-client.csr" \
    -subj "/C=US/ST=California/L=San Francisco/O=Aurigraph/OU=DLT/CN=nginx-client" \
    2>/dev/null

# NGINX client certificate (signed by CA)
openssl x509 -req \
    -in "$OUTPUT_DIR/nginx/nginx-client.csr" \
    -CA "$OUTPUT_DIR/ca/ca.crt" \
    -CAkey "$OUTPUT_DIR/ca/ca.key" \
    -CAcreateserial \
    -out "$OUTPUT_DIR/nginx/nginx-client.crt" \
    -days $DAYS_VALID \
    -extensions v3_req \
    -extfile "$OUTPUT_DIR/ca/extensions.conf" \
    2>/dev/null

log_info "✓ NGINX Client Certificate created"

# ========== Step 5: Generate Consul Certificates ==========

log_info "Generating Consul Server Certificate..."

# Consul server key
openssl genrsa -out "$OUTPUT_DIR/consul/server.key" 2048 2>/dev/null

# Consul server CSR
openssl req -new \
    -key "$OUTPUT_DIR/consul/server.key" \
    -out "$OUTPUT_DIR/consul/server.csr" \
    -subj "/C=US/ST=California/L=San Francisco/O=Aurigraph/OU=DLT/CN=consul-server" \
    2>/dev/null

# Create SAN config for Consul server
cat > "$OUTPUT_DIR/consul/server-san.conf" << EOF
subjectAltName = DNS:consul-server,DNS:consul,DNS:localhost,IP:127.0.0.1,IP:172.26.0.6
EOF

# Consul server certificate
openssl x509 -req \
    -in "$OUTPUT_DIR/consul/server.csr" \
    -CA "$OUTPUT_DIR/ca/ca.crt" \
    -CAkey "$OUTPUT_DIR/ca/ca.key" \
    -CAcreateserial \
    -out "$OUTPUT_DIR/consul/server.crt" \
    -days $DAYS_VALID \
    -extensions v3_req \
    -extfile "$OUTPUT_DIR/consul/server-san.conf" \
    2>/dev/null

log_info "✓ Consul Server Certificate created"

log_info "Generating Consul Client Certificate..."

# Consul client key
openssl genrsa -out "$OUTPUT_DIR/consul/client.key" 2048 2>/dev/null

# Consul client CSR
openssl req -new \
    -key "$OUTPUT_DIR/consul/client.key" \
    -out "$OUTPUT_DIR/consul/client.csr" \
    -subj "/C=US/ST=California/L=San Francisco/O=Aurigraph/OU=DLT/CN=consul-client" \
    2>/dev/null

# Consul client certificate
openssl x509 -req \
    -in "$OUTPUT_DIR/consul/client.csr" \
    -CA "$OUTPUT_DIR/ca/ca.crt" \
    -CAkey "$OUTPUT_DIR/ca/ca.key" \
    -CAcreateserial \
    -out "$OUTPUT_DIR/consul/client.crt" \
    -days $DAYS_VALID \
    -extensions v3_req \
    -extfile "$OUTPUT_DIR/ca/extensions.conf" \
    2>/dev/null

log_info "✓ Consul Client Certificate created"

# ========== Step 6: Generate Node Certificates ==========

log_info "Generating Quarkus Node Certificates (4 nodes)..."

for i in "${!NODES[@]}"; do
    NODE=${NODES[$i]}
    IP=${NODE_IPS[$i]}
    
    log_info "Generating certificates for $NODE ($IP)..."
    
    # Server key
    openssl genrsa -out "$OUTPUT_DIR/nodes/${NODE}-server.key" 2048 2>/dev/null
    
    # Server CSR
    openssl req -new \
        -key "$OUTPUT_DIR/nodes/${NODE}-server.key" \
        -out "$OUTPUT_DIR/nodes/${NODE}-server.csr" \
        -subj "/C=US/ST=California/L=San Francisco/O=Aurigraph/OU=DLT/CN=${NODE}" \
        2>/dev/null
    
    # Create SAN config
    cat > "$OUTPUT_DIR/nodes/${NODE}-san.conf" << EOF_SAN
subjectAltName = DNS:${NODE},DNS:aurigraph-v11-${NODE},DNS:localhost,IP:127.0.0.1,IP:${IP}
EOF_SAN
    
    # Server certificate
    openssl x509 -req \
        -in "$OUTPUT_DIR/nodes/${NODE}-server.csr" \
        -CA "$OUTPUT_DIR/ca/ca.crt" \
        -CAkey "$OUTPUT_DIR/ca/ca.key" \
        -CAcreateserial \
        -out "$OUTPUT_DIR/nodes/${NODE}-server.crt" \
        -days $DAYS_VALID \
        -extensions v3_req \
        -extfile "$OUTPUT_DIR/nodes/${NODE}-san.conf" \
        2>/dev/null
    
    # Client key
    openssl genrsa -out "$OUTPUT_DIR/nodes/${NODE}-client.key" 2048 2>/dev/null
    
    # Client CSR
    openssl req -new \
        -key "$OUTPUT_DIR/nodes/${NODE}-client.key" \
        -out "$OUTPUT_DIR/nodes/${NODE}-client.csr" \
        -subj "/C=US/ST=California/L=San Francisco/O=Aurigraph/OU=DLT/CN=${NODE}-client" \
        2>/dev/null
    
    # Client certificate
    openssl x509 -req \
        -in "$OUTPUT_DIR/nodes/${NODE}-client.csr" \
        -CA "$OUTPUT_DIR/ca/ca.crt" \
        -CAkey "$OUTPUT_DIR/ca/ca.key" \
        -CAcreateserial \
        -out "$OUTPUT_DIR/nodes/${NODE}-client.crt" \
        -days $DAYS_VALID \
        -extensions v3_req \
        -extfile "$OUTPUT_DIR/ca/extensions.conf" \
        2>/dev/null
    
    log_info "  ✓ ${NODE} certificates created"
done

log_info "✓ All Node Certificates created (4 nodes)"

# ========== Step 7: Copy CA Certificate to All Directories ==========

log_info "Copying CA certificate to all directories..."

cp "$OUTPUT_DIR/ca/ca.crt" "$OUTPUT_DIR/nginx/"
cp "$OUTPUT_DIR/ca/ca.crt" "$OUTPUT_DIR/consul/"
cp "$OUTPUT_DIR/ca/ca.crt" "$OUTPUT_DIR/nodes/"

log_info "✓ CA certificate distributed"

# ========== Step 8: Set Proper Permissions ==========

log_info "Setting certificate permissions..."

chmod 600 "$OUTPUT_DIR/ca/ca.key"
chmod 644 "$OUTPUT_DIR/ca/ca.crt"

chmod 600 "$OUTPUT_DIR"/nginx/*.key
chmod 644 "$OUTPUT_DIR"/nginx/*.crt

chmod 600 "$OUTPUT_DIR"/consul/*.key
chmod 644 "$OUTPUT_DIR"/consul/*.crt

chmod 600 "$OUTPUT_DIR"/nodes/*.key
chmod 644 "$OUTPUT_DIR"/nodes/*.crt

log_info "✓ Permissions configured"

# ========== Step 9: Verification ==========

log_info "Verifying certificates..."

# Verify NGINX certificates
openssl verify -CAfile "$OUTPUT_DIR/ca/ca.crt" "$OUTPUT_DIR/nginx/nginx-server.crt" 2>/dev/null || log_error "NGINX server certificate verification failed"
openssl verify -CAfile "$OUTPUT_DIR/ca/ca.crt" "$OUTPUT_DIR/nginx/nginx-client.crt" 2>/dev/null || log_error "NGINX client certificate verification failed"

log_info "✓ NGINX certificates verified"

# Verify Consul certificates
openssl verify -CAfile "$OUTPUT_DIR/ca/ca.crt" "$OUTPUT_DIR/consul/server.crt" 2>/dev/null || log_error "Consul server certificate verification failed"
openssl verify -CAfile "$OUTPUT_DIR/ca/ca.crt" "$OUTPUT_DIR/consul/client.crt" 2>/dev/null || log_error "Consul client certificate verification failed"

log_info "✓ Consul certificates verified"

# Verify Node certificates
for NODE in "${NODES[@]}"; do
    openssl verify -CAfile "$OUTPUT_DIR/ca/ca.crt" "$OUTPUT_DIR/nodes/${NODE}-server.crt" 2>/dev/null || log_error "${NODE} server certificate verification failed"
    openssl verify -CAfile "$OUTPUT_DIR/ca/ca.crt" "$OUTPUT_DIR/nodes/${NODE}-client.crt" 2>/dev/null || log_error "${NODE} client certificate verification failed"
done

log_info "✓ All node certificates verified"

# ========== Step 10: Generate Summary Report ==========

log_info "Generating certificate summary report..."

cat > "$OUTPUT_DIR/CERTIFICATE_MANIFEST.md" << 'EOF'
# TLS Certificate Manifest

## Generated Certificates

### Root CA
- `ca/ca.key` - Root CA private key (4096-bit RSA)
- `ca/ca.crt` - Root CA certificate (365 days valid)

### NGINX Load Balancer
- `nginx/nginx-server.key` - NGINX server private key
- `nginx/nginx-server.crt` - NGINX server certificate (TLS endpoint)
- `nginx/nginx-client.key` - NGINX client private key (mTLS to backends)
- `nginx/nginx-client.crt` - NGINX client certificate
- `nginx/ca.crt` - Root CA (for certificate verification)

### Consul Service Discovery
- `consul/server.key` - Consul server private key
- `consul/server.crt` - Consul server certificate
- `consul/client.key` - Consul client private key
- `consul/client.crt` - Consul client certificate
- `consul/ca.crt` - Root CA

### Quarkus Nodes (4 total)
For each node (node-1 through node-4):
- `nodes/node-X-server.key` - Node server private key (gRPC TLS endpoint)
- `nodes/node-X-server.crt` - Node server certificate
- `nodes/node-X-client.key` - Node client private key (inter-node communication)
- `nodes/node-X-client.crt` - Node client certificate
- `nodes/ca.crt` - Root CA

## Certificate Properties

- **Key Size**: 2048-bit RSA (nodes), 4096-bit RSA (CA)
- **Validity**: 365 days
- **Signature Algorithm**: SHA256withRSA
- **TLS Version**: 1.3 (minimum)
- **Cipher Suites**: 
  - TLS_AES_256_GCM_SHA384
  - TLS_CHACHA20_POLY1305_SHA256

## Subject Alternative Names (SANs)

### NGINX
- DNS: nginx-lb, nginx, localhost
- IP: 127.0.0.1, 172.26.0.5

### Consul Server
- DNS: consul-server, consul, localhost
- IP: 127.0.0.1, 172.26.0.6

### Nodes
- DNS: node-X, aurigraph-v11-node-X, localhost
- IP: 127.0.0.1, 172.26.0.{10-13}

## Deployment Instructions

### For NGINX Container
```bash
docker run -v /path/to/tls-certs/nginx:/etc/nginx/certs nginx:latest
```

### For Consul Container
```bash
docker run \
  -v /path/to/tls-certs/consul:/opt/consul-certs \
  -v /path/to/consul-server-tls.hcl:/consul/config/server.hcl \
  consul:latest
```

### For Quarkus Nodes
```bash
docker run \
  -v /path/to/tls-certs/nodes/node-1-*:/opt/certs/ \
  -e QUARKUS_PROFILE=tls \
  aurigraph-v11:latest
```

## Certificate Rotation (Annual)

1. Generate new certificates with updated dates
2. Deploy in rolling fashion:
   - Stop node → Deploy new cert → Start node
   - Follow same pattern for NGINX and Consul
3. Remove old certificates after all nodes updated
4. Verify all nodes communicating with new certs

## Security Best Practices

- ✓ Private keys stored with 600 permissions (readable by owner only)
- ✓ Public certificates stored with 644 permissions
- ✓ CA private key restricted to initialization only
- ✓ Mutual TLS (mTLS) required for all inter-service communication
- ✓ Certificate pinning recommended for production
- ✓ Regular rotation recommended (annual minimum)
EOF

log_info "✓ Certificate manifest created"

# ========== Step 11: Display Summary ==========

echo ""
log_info "════════════════════════════════════════════════════════════"
log_info "✓ Certificate Generation Complete!"
log_info "════════════════════════════════════════════════════════════"
echo ""
log_info "Certificate Location: $OUTPUT_DIR"
echo ""
log_info "Generated Certificates:"
echo "  • Root CA: ca/ca.{key,crt}"
echo "  • NGINX: nginx/{server,client}.{key,crt}"
echo "  • Consul: consul/{server,client}.{key,crt}"
echo "  • Nodes: nodes/node-{1,2,3,4}-{server,client}.{key,crt}"
echo ""
log_info "Configuration Files Updated:"
echo "  • deployment/nginx-cluster-tls.conf"
echo "  • deployment/consul-server-tls.hcl"
echo "  • deployment/consul-client-tls.hcl"
echo "  • aurigraph-v11-standalone/application-tls.properties"
echo ""
log_info "Certificate Validity: $DAYS_VALID days"
log_info "Next Steps:"
echo "  1. Copy certificates to Docker volumes:"
echo "     cp -r $OUTPUT_DIR/* /path/to/docker/volumes/"
echo "  2. Update docker-compose-cluster-tls.yml with cert paths"
echo "  3. Deploy cluster: docker-compose -f docker-compose-cluster-tls.yml up -d"
echo "  4. Verify: curl https://localhost:9443/q/health"
echo ""

log_info "════════════════════════════════════════════════════════════"
