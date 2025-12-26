# Aurigraph V11 Production Security Certificates Guide

## Overview

This guide covers comprehensive certificate management for Aurigraph V11 production deployment including:
- TLS/SSL certificate generation and installation
- Mutual TLS (mTLS) for gRPC services
- Certificate rotation automation
- Key management and security

## Prerequisites

- OpenSSL 1.1.1+
- Java 21 keytool
- Certificate Authority (CA) credentials
- Domain: dlt.aurigraph.io

## 1. Certificate Generation

### 1.1 Generate Root CA Certificate

```bash
# Create CA private key (4096-bit RSA)
openssl genrsa -out /opt/aurigraph/ca/ca-key.pem 4096

# Create CA certificate (valid 10 years)
openssl req -new -x509 -days 3650 -key /opt/aurigraph/ca/ca-key.pem \
  -out /opt/aurigraph/ca/ca-cert.pem \
  -subj "/C=US/ST=California/L=San Francisco/O=Aurigraph/CN=Aurigraph-CA"

# Display certificate
openssl x509 -in /opt/aurigraph/ca/ca-cert.pem -text -noout
```

### 1.2 Generate Server Certificate for Nginx

```bash
# Generate server private key
openssl genrsa -out /opt/aurigraph/certs/server-key.pem 2048

# Create certificate signing request (CSR)
openssl req -new -key /opt/aurigraph/certs/server-key.pem \
  -out /opt/aurigraph/certs/server.csr \
  -subj "/C=US/ST=California/L=San Francisco/O=Aurigraph/CN=dlt.aurigraph.io"

# Sign with CA certificate (valid 1 year)
openssl x509 -req -in /opt/aurigraph/certs/server.csr \
  -CA /opt/aurigraph/ca/ca-cert.pem \
  -CAkey /opt/aurigraph/ca/ca-key.pem \
  -CAcreateserial -out /opt/aurigraph/certs/server-cert.pem \
  -days 365 \
  -extfile <(printf "subjectAltName=DNS:dlt.aurigraph.io,DNS:*.aurigraph.io")

# Verify certificate
openssl x509 -in /opt/aurigraph/certs/server-cert.pem -text -noout
```

### 1.3 Create Certificate Bundle (PEM)

```bash
# Combine server certificate with CA certificate for Nginx
cat /opt/aurigraph/certs/server-cert.pem \
    /opt/aurigraph/ca/ca-cert.pem > \
    /opt/aurigraph/certs/server-chain.pem

# Verify bundle
openssl crl2pkcs7 -nocrl -certfile /opt/aurigraph/certs/server-chain.pem | \
  openssl pkcs7 -print_certs -text -noout
```

### 1.4 Generate mTLS Certificates for gRPC

#### Server-side gRPC Certificate

```bash
# Generate server key for gRPC
openssl genrsa -out /opt/aurigraph/grpc/server-key.pem 2048

# Create server CSR for gRPC
openssl req -new -key /opt/aurigraph/grpc/server-key.pem \
  -out /opt/aurigraph/grpc/server.csr \
  -subj "/C=US/ST=California/L=San Francisco/O=Aurigraph/CN=aurigraph-grpc-server"

# Sign with CA
openssl x509 -req -in /opt/aurigraph/grpc/server.csr \
  -CA /opt/aurigraph/ca/ca-cert.pem \
  -CAkey /opt/aurigraph/ca/ca-key.pem \
  -CAcreateserial -out /opt/aurigraph/grpc/server-cert.pem \
  -days 365 \
  -extfile <(printf "subjectAltName=DNS:localhost,DNS:aurigraph-v11-service")

chmod 400 /opt/aurigraph/grpc/server-key.pem
chmod 444 /opt/aurigraph/grpc/server-cert.pem
```

#### Client-side gRPC Certificate

```bash
# Generate client key for gRPC
openssl genrsa -out /opt/aurigraph/grpc/client-key.pem 2048

# Create client CSR
openssl req -new -key /opt/aurigraph/grpc/client-key.pem \
  -out /opt/aurigraph/grpc/client.csr \
  -subj "/C=US/ST=California/L=San Francisco/O=Aurigraph/CN=aurigraph-grpc-client"

# Sign with CA
openssl x509 -req -in /opt/aurigraph/grpc/client.csr \
  -CA /opt/aurigraph/ca/ca-cert.pem \
  -CAkey /opt/aurigraph/ca/ca-key.pem \
  -CAcreateserial -out /opt/aurigraph/grpc/client-cert.pem \
  -days 365

chmod 400 /opt/aurigraph/grpc/client-key.pem
chmod 444 /opt/aurigraph/grpc/client-cert.pem
```

## 2. Java Keystore Configuration

### 2.1 Create PKCS12 Keystore for Quarkus

```bash
# Combine certificate and key into PKCS12 format
# Use environment variable for password (set via secure means, not here)
export KEYSTORE_PASSWORD=$(openssl rand -base64 32)
openssl pkcs12 -export \
  -in /opt/aurigraph/certs/server-cert.pem \
  -inkey /opt/aurigraph/certs/server-key.pem \
  -out /opt/aurigraph/certs/keystore.p12 \
  -name aurigraph-server \
  -CAfile /opt/aurigraph/ca/ca-cert.pem \
  -caname root \
  -password pass:${KEYSTORE_PASSWORD} \
  -chain

# Verify keystore
keytool -list -v -keystore /opt/aurigraph/certs/keystore.p12 \
  -storepass ${KEYSTORE_PASSWORD}
```

### 2.2 Create Truststore (CA Certificate)

```bash
# Import CA certificate into truststore
# Use the same KEYSTORE_PASSWORD from 2.1
keytool -import -alias aurigraph-ca \
  -file /opt/aurigraph/ca/ca-cert.pem \
  -keystore /opt/aurigraph/certs/truststore.p12 \
  -storepass ${KEYSTORE_PASSWORD} \
  -noprompt

# Verify truststore
keytool -list -v -keystore /opt/aurigraph/certs/truststore.p12 \
  -storepass ${KEYSTORE_PASSWORD}
```

### 2.3 Set Proper Permissions

```bash
# Secure certificate files
chmod 700 /opt/aurigraph/certs/
chmod 600 /opt/aurigraph/certs/*.pem
chmod 600 /opt/aurigraph/certs/keystore.p12
chmod 600 /opt/aurigraph/certs/truststore.p12

# Set ownership
chown -R aurigraph:aurigraph /opt/aurigraph/certs/
chown -R aurigraph:aurigraph /opt/aurigraph/ca/
chown -R aurigraph:aurigraph /opt/aurigraph/grpc/
```

## 3. Quarkus Configuration for HTTPS

### 3.1 application-https.properties

```properties
# ==================== HTTPS/TLS CONFIGURATION ====================

# Enable HTTPS on port 8443
quarkus.http.ssl-port=8443
quarkus.http.ssl.certificate.key-store-file=certs/keystore.p12
quarkus.http.ssl.certificate.key-store-password=${KEYSTORE_PASSWORD}
quarkus.http.ssl.certificate.key-store-file-type=PKCS12

# TLS Protocol Configuration
quarkus.http.ssl.protocols=TLSv1.3,TLSv1.2
quarkus.http.ssl.cipher-suites=TLS_AES_256_GCM_SHA384,TLS_CHACHA20_POLY1305_SHA256,TLS_AES_128_GCM_SHA256

# Keystore alias
quarkus.http.ssl.certificate.key-alias=aurigraph-server

# Client authentication (optional, for mutual TLS)
quarkus.http.ssl.certificate.trust-store-file=certs/truststore.p12
quarkus.http.ssl.certificate.trust-store-password=${KEYSTORE_PASSWORD}
quarkus.http.ssl.certificate.trust-store-file-type=PKCS12

# HTTP/2 over TLS
quarkus.http.http2=true

# HSTS (HTTP Strict Transport Security)
quarkus.http.header."Strict-Transport-Security".value=max-age=31536000; includeSubDomains; preload

# CSP (Content Security Policy)
quarkus.http.header."Content-Security-Policy".value=default-src 'self'

# X-Frame-Options
quarkus.http.header."X-Frame-Options".value=DENY

# X-Content-Type-Options
quarkus.http.header."X-Content-Type-Options".value=nosniff

# Redirect HTTP to HTTPS
quarkus.http.redirect-to-https=true
```

### 3.2 gRPC mTLS Configuration

```properties
# ==================== GRPC MUTUAL TLS CONFIGURATION ====================

# gRPC Server TLS
quarkus.grpc.server.use-separate-server=true
quarkus.grpc.server.port=9443
quarkus.grpc.server.ssl.certificate=certs/server-cert.pem
quarkus.grpc.server.ssl.key=certs/server-key.pem
quarkus.grpc.server.ssl.key-type=PEM

# Require client certificates
quarkus.grpc.server.ssl.client-auth=REQUIRE
quarkus.grpc.server.ssl.trust-certificate-chain=certs/ca-cert.pem

# gRPC Client TLS for service-to-service communication
quarkus.grpc.clients.consensus.use-quarkus-grpc-client=true
quarkus.grpc.clients.consensus.port=9443
quarkus.grpc.clients.consensus.use-quarkus-netty=true

# Client-side certificate
quarkus.grpc.clients.consensus.ssl.certificate=certs/client-cert.pem
quarkus.grpc.clients.consensus.ssl.key=certs/client-key.pem
quarkus.grpc.clients.consensus.ssl.key-type=PEM
quarkus.grpc.clients.consensus.ssl.trust-certificate-chain=certs/ca-cert.pem
```

## 4. Nginx Configuration with TLS

### 4.1 Nginx SSL Configuration

Create `/etc/nginx/conf.d/aurigraph-ssl.conf`:

```nginx
# SSL Protocol and Ciphers
ssl_protocols TLSv1.3 TLSv1.2;
ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers on;

# Certificate and Key
ssl_certificate /opt/aurigraph/certs/server-chain.pem;
ssl_certificate_key /opt/aurigraph/certs/server-key.pem;

# Session Configuration
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:256m;
ssl_session_tickets off;

# HSTS (HTTP Strict Transport Security)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Additional Security Headers
add_header Content-Security-Policy "default-src 'self'" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# OCSP Stapling (if applicable)
# ssl_stapling on;
# ssl_stapling_verify on;
# ssl_trusted_certificate /path/to/chain.pem;

# Server block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dlt.aurigraph.io *.aurigraph.io;

    # API Gateway to V11 Service
    location /api/v11/ {
        proxy_pass http://localhost:9000/;

        # TLS headers
        proxy_ssl_trusted_certificate /opt/aurigraph/certs/ca-cert.pem;
        proxy_ssl_verify on;
        proxy_ssl_verify_depth 2;

        # Proxy headers
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header X-Real-IP $remote_addr;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # gRPC to separate gRPC server
    location /grpc {
        grpc_pass grpcs://localhost:9443;

        # TLS configuration
        grpc_ssl_trusted_certificate /opt/aurigraph/certs/ca-cert.pem;
        grpc_ssl_verify on;
        grpc_ssl_verify_depth 2;
        grpc_ssl_session_reuse on;

        # Headers
        grpc_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        grpc_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 5. Certificate Rotation Automation

### 5.1 Rotation Script

Create `/opt/aurigraph/scripts/rotate-certificates.sh`:

```bash
#!/bin/bash
set -e

CERT_DIR="/opt/aurigraph/certs"
CA_DIR="/opt/aurigraph/ca"
BACKUP_DIR="/opt/aurigraph/certs-backup/$(date +%Y%m%d-%H%M%S)"
DOMAIN="dlt.aurigraph.io"
CERT_VALIDITY_DAYS=365
WARNING_DAYS=30

# Create backup
mkdir -p "$BACKUP_DIR"
cp -r "$CERT_DIR"/* "$BACKUP_DIR/"
echo "Certificates backed up to: $BACKUP_DIR"

# Check if certificate needs renewal
CERT_EXPIRY=$(openssl x509 -in "$CERT_DIR/server-cert.pem" -noout -dates | \
  grep "notAfter" | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s)
NOW_EPOCH=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

echo "Certificate expires in $DAYS_UNTIL_EXPIRY days"

if [ $DAYS_UNTIL_EXPIRY -gt $WARNING_DAYS ]; then
    echo "Certificate still valid. Skipping renewal."
    exit 0
fi

echo "Renewing certificate..."

# Generate new private key
openssl genrsa -out "$CERT_DIR/server-key.pem.new" 2048

# Create CSR
openssl req -new -key "$CERT_DIR/server-key.pem.new" \
  -out "$CERT_DIR/server.csr" \
  -subj "/C=US/ST=California/L=San Francisco/O=Aurigraph/CN=$DOMAIN"

# Sign certificate
openssl x509 -req -in "$CERT_DIR/server.csr" \
  -CA "$CA_DIR/ca-cert.pem" \
  -CAkey "$CA_DIR/ca-key.pem" \
  -CAcreateserial -out "$CERT_DIR/server-cert.pem.new" \
  -days $CERT_VALIDITY_DAYS \
  -extfile <(printf "subjectAltName=DNS:$DOMAIN,DNS:*.$DOMAIN")

# Backup old key and replace with new
mv "$CERT_DIR/server-key.pem" "$CERT_DIR/server-key.pem.old"
mv "$CERT_DIR/server-key.pem.new" "$CERT_DIR/server-key.pem"
mv "$CERT_DIR/server-cert.pem" "$CERT_DIR/server-cert.pem.old"
mv "$CERT_DIR/server-cert.pem.new" "$CERT_DIR/server-cert.pem"

# Update certificate chain
cat "$CERT_DIR/server-cert.pem" "$CA_DIR/ca-cert.pem" > \
    "$CERT_DIR/server-chain.pem"

# Update PKCS12 keystore
# Use KEYSTORE_PASSWORD from environment (must be set before running this script)
openssl pkcs12 -export \
  -in "$CERT_DIR/server-cert.pem" \
  -inkey "$CERT_DIR/server-key.pem" \
  -out "$CERT_DIR/keystore.p12.new" \
  -name aurigraph-server \
  -CAfile "$CA_DIR/ca-cert.pem" \
  -caname root \
  -password pass:${KEYSTORE_PASSWORD} \
  -chain

mv "$CERT_DIR/keystore.p12.new" "$CERT_DIR/keystore.p12"

# Set permissions
chmod 600 "$CERT_DIR"/server-*.pem
chmod 600 "$CERT_DIR/keystore.p12"

echo "Certificate renewed successfully"
echo "Old certificates backed up to: $BACKUP_DIR"

# Reload Nginx
nginx -t && systemctl reload nginx

echo "Nginx reloaded with new certificate"
```

### 5.2 Automated Rotation via Cron

```bash
# Add to crontab for daily certificate check and renewal
0 2 * * * /opt/aurigraph/scripts/rotate-certificates.sh >> /var/log/aurigraph/cert-rotation.log 2>&1

# Or use systemd timer for Quarkus certificate rotation
mkdir -p /etc/systemd/system/
```

Create `/etc/systemd/system/aurigraph-cert-rotation.service`:

```ini
[Unit]
Description=Aurigraph Certificate Rotation Service
After=network.target

[Service]
Type=oneshot
ExecStart=/opt/aurigraph/scripts/rotate-certificates.sh
StandardOutput=journal
StandardError=journal
```

Create `/etc/systemd/system/aurigraph-cert-rotation.timer`:

```ini
[Unit]
Description=Daily Aurigraph Certificate Rotation
Requires=aurigraph-cert-rotation.service

[Timer]
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
```

## 6. Certificate Monitoring

### 6.1 Certificate Expiry Alerting

Add to Prometheus rules:

```yaml
- alert: CertificateExpiryWarning
  expr: (ssl_certificate_expiry_seconds - time()) / 86400 < 30
  for: 1h
  annotations:
    summary: "Certificate expiring in {{ $value }} days"
```

### 6.2 Monitoring Script

Create `/opt/aurigraph/scripts/check-cert-expiry.py`:

```python
#!/usr/bin/env python3

import ssl
import socket
from datetime import datetime, timedelta
import sys

def check_certificate_expiry(hostname, port=443):
    context = ssl.create_default_context()

    with socket.create_connection((hostname, port)) as sock:
        with context.wrap_socket(sock, server_hostname=hostname) as ssock:
            cert = ssock.getpeercert()

    cert_der = ssock.getpeercert(binary_form=True)
    cert_pem = ssl.DER_cert_to_PEM_cert(cert_der)

    # Parse expiry date
    import OpenSSL
    cert_obj = OpenSSL.crypto.load_certificate(
        OpenSSL.crypto.FILETYPE_PEM, cert_pem)

    expiry_str = cert_obj.get_notAfter().decode('utf-8')
    expiry_date = datetime.strptime(expiry_str, '%Y%m%d%H%M%SZ')

    days_remaining = (expiry_date - datetime.utcnow()).days

    print(f"Certificate for {hostname}:")
    print(f"  Expires: {expiry_date}")
    print(f"  Days remaining: {days_remaining}")

    if days_remaining < 30:
        print("  ⚠️  WARNING: Certificate expiring soon!")
        return 1
    elif days_remaining < 7:
        print("  ⛔ CRITICAL: Certificate expiring very soon!")
        return 2

    return 0

if __name__ == "__main__":
    sys.exit(check_certificate_expiry("dlt.aurigraph.io"))
```

## 7. Security Checklist

### 7.1 Pre-Deployment Checklist

- [ ] Generate all required certificates
- [ ] Verify certificate validity and expiry
- [ ] Test TLS handshake
- [ ] Configure HSTS headers
- [ ] Enable HTTP/2
- [ ] Configure strong ciphers
- [ ] Test certificate chain validation
- [ ] Set up certificate rotation automation
- [ ] Configure monitoring and alerting
- [ ] Document certificate locations
- [ ] Backup certificates securely
- [ ] Test failover scenarios

### 7.2 Post-Deployment Verification

```bash
# Test TLS connectivity
curl -v https://dlt.aurigraph.io/api/v11/health

# Verify certificate chain
openssl s_client -connect dlt.aurigraph.io:443 -showcerts

# Check TLS version and ciphers
openssl s_client -connect dlt.aurigraph.io:443 -tls1_3

# Verify HSTS header
curl -I https://dlt.aurigraph.io/api/v11/health | grep -i "Strict-Transport"

# Test gRPC with mTLS
grpcurl -d '{}' \
  -cacert /opt/aurigraph/certs/ca-cert.pem \
  -cert /opt/aurigraph/grpc/client-cert.pem \
  -key /opt/aurigraph/grpc/client-key.pem \
  localhost:9443 aurigraph.proto.HealthService/Check
```

## 8. Troubleshooting

### 8.1 Certificate Issues

| Issue | Solution |
|-------|----------|
| "SSL_ERROR_RX_RECORD_TOO_LONG" | Check port number (should be 443 for HTTPS) |
| Certificate not recognized | Import CA cert into truststore |
| "peer certificate cannot be authenticated" | Verify certificate chain |
| "certificate verify failed" | Check certificate dates and validity |
| mTLS handshake fails | Verify client certificate is signed by CA |

### 8.2 Common Commands

```bash
# View certificate details
openssl x509 -in /opt/aurigraph/certs/server-cert.pem -text -noout

# Verify certificate chain
openssl verify -CAfile /opt/aurigraph/ca/ca-cert.pem \
  /opt/aurigraph/certs/server-cert.pem

# Check certificate expiry
openssl x509 -in /opt/aurigraph/certs/server-cert.pem \
  -noout -dates

# Test TLS connection
openssl s_client -connect localhost:8443 -showcerts

# Convert certificate formats
openssl x509 -inform PEM -in cert.pem -outform DER -out cert.der
```

## 9. Production Deployment Checklist

- [ ] Generate production certificates
- [ ] Configure HTTPS on Nginx
- [ ] Enable gRPC mTLS
- [ ] Set up certificate rotation automation
- [ ] Configure monitoring and alerting
- [ ] Test all certificate renewal paths
- [ ] Document certificate procedures
- [ ] Train team on certificate management
- [ ] Set up backup and recovery procedures
- [ ] Verify compliance requirements
- [ ] Plan for certificate expiry incidents

## References

- RFC 5246: TLS 1.2
- RFC 8446: TLS 1.3
- OpenSSL Documentation
- Nginx SSL Configuration
- Quarkus Security Guide
