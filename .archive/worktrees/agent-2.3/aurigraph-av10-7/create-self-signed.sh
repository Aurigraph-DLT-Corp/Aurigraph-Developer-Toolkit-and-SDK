#!/bin/bash
# Create self-signed certificate for testing

DOMAIN="dlt.aurigraph.io"
CERT_DIR="./ssl"

mkdir -p $CERT_DIR

# Generate private key
openssl genrsa -out $CERT_DIR/privkey.pem 2048

# Generate certificate signing request
openssl req -new -key $CERT_DIR/privkey.pem \
    -out $CERT_DIR/cert.csr \
    -subj "/C=US/ST=State/L=City/O=Aurigraph DLT/CN=$DOMAIN"

# Generate self-signed certificate
openssl x509 -req -days 365 \
    -in $CERT_DIR/cert.csr \
    -signkey $CERT_DIR/privkey.pem \
    -out $CERT_DIR/fullchain.pem

echo "Self-signed certificate created in $CERT_DIR/"
echo "Warning: Browsers will show security warning for self-signed certificates"
