#!/bin/bash

################################################################################
# SSL Certificate Validation Script
#
# Purpose: Validate SSL/TLS certificate configuration for Aurigraph V11
# Author: Security Team
# Version: 1.0.0
# Last Updated: 2025-11-12
#
# Usage:
#   ./ssl-certificate-validator.sh <domain>
#   ./ssl-certificate-validator.sh dlt.aurigraph.io
#
# Requirements:
#   - openssl
#   - curl
#   - nmap (optional, for cipher suite testing)
################################################################################

set -euo pipefail

# Configuration
DOMAIN="${1:-dlt.aurigraph.io}"
PORT="${2:-443}"
MIN_TLS_VERSION="1.3"
REQUIRED_CIPHERS=(
    "TLS_AES_256_GCM_SHA384"
    "TLS_CHACHA20_POLY1305_SHA256"
)
CERT_EXPIRY_WARNING_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNED=0

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_test() {
    echo -ne "Testing: $1... "
}

print_pass() {
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
}

print_fail() {
    echo -e "${RED}✗ FAIL${NC}"
    echo -e "${RED}  Reason: $1${NC}"
    ((TESTS_FAILED++))
}

print_warn() {
    echo -e "${YELLOW}⚠ WARNING${NC}"
    echo -e "${YELLOW}  Reason: $1${NC}"
    ((TESTS_WARNED++))
}

print_info() {
    echo -e "${BLUE}ℹ Info: $1${NC}"
}

################################################################################
# Test Functions
################################################################################

test_connectivity() {
    print_test "SSL/TLS connectivity to $DOMAIN:$PORT"

    if timeout 5 openssl s_client -connect "$DOMAIN:$PORT" -brief </dev/null 2>&1 | grep -q "Verification: OK"; then
        print_pass
    else
        print_fail "Cannot establish SSL/TLS connection"
    fi
}

test_tls_version() {
    print_test "TLS version (minimum $MIN_TLS_VERSION)"

    TLS_VERSION=$(echo | openssl s_client -connect "$DOMAIN:$PORT" 2>/dev/null | grep "Protocol" | awk '{print $3}')

    if [[ "$TLS_VERSION" == "TLSv1.3" ]]; then
        print_pass
        print_info "TLS version: $TLS_VERSION"
    elif [[ "$TLS_VERSION" == "TLSv1.2" ]]; then
        print_warn "TLS 1.2 detected. Upgrade to TLS 1.3 recommended"
        print_info "TLS version: $TLS_VERSION"
    else
        print_fail "TLS version $TLS_VERSION is below minimum ($MIN_TLS_VERSION)"
    fi
}

test_weak_protocols() {
    print_test "Weak TLS protocols (SSLv2, SSLv3, TLS 1.0, TLS 1.1)"

    WEAK_PROTOCOLS=0

    for PROTOCOL in ssl2 ssl3 tls1 tls1_1; do
        if echo | openssl s_client -"$PROTOCOL" -connect "$DOMAIN:$PORT" 2>&1 | grep -q "Cipher"; then
            ((WEAK_PROTOCOLS++))
            echo -e "${RED}    Vulnerable to $PROTOCOL${NC}"
        fi
    done

    if [ $WEAK_PROTOCOLS -eq 0 ]; then
        print_pass
    else
        print_fail "Weak protocols detected: $WEAK_PROTOCOLS"
    fi
}

test_cipher_suites() {
    print_test "Strong cipher suites"

    CIPHER_OUTPUT=$(echo | openssl s_client -connect "$DOMAIN:$PORT" -cipher 'HIGH:!aNULL:!MD5:!3DES' 2>/dev/null | grep "Cipher")

    if echo "$CIPHER_OUTPUT" | grep -q "AES256-GCM-SHA384\|CHACHA20-POLY1305"; then
        print_pass
        print_info "Cipher: $(echo "$CIPHER_OUTPUT" | awk '{print $3}')"
    else
        print_fail "Weak cipher suites detected"
    fi
}

test_certificate_validity() {
    print_test "Certificate validity period"

    CERT_DATES=$(echo | openssl s_client -connect "$DOMAIN:$PORT" 2>/dev/null | openssl x509 -noout -dates)

    NOT_BEFORE=$(echo "$CERT_DATES" | grep "notBefore" | cut -d= -f2)
    NOT_AFTER=$(echo "$CERT_DATES" | grep "notAfter" | cut -d= -f2)

    EXPIRY_EPOCH=$(date -j -f "%b %d %H:%M:%S %Y %Z" "$NOT_AFTER" "+%s" 2>/dev/null || date -d "$NOT_AFTER" "+%s" 2>/dev/null)
    CURRENT_EPOCH=$(date "+%s")
    DAYS_REMAINING=$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))

    if [ "$DAYS_REMAINING" -lt 0 ]; then
        print_fail "Certificate expired $((DAYS_REMAINING * -1)) days ago"
    elif [ "$DAYS_REMAINING" -lt "$CERT_EXPIRY_WARNING_DAYS" ]; then
        print_warn "Certificate expires in $DAYS_REMAINING days"
        print_info "Expiry date: $NOT_AFTER"
    else
        print_pass
        print_info "Certificate valid for $DAYS_REMAINING more days"
        print_info "Not Before: $NOT_BEFORE"
        print_info "Not After: $NOT_AFTER"
    fi
}

test_certificate_chain() {
    print_test "Certificate chain validity"

    CHAIN_VERIFY=$(echo | openssl s_client -connect "$DOMAIN:$PORT" -showcerts 2>/dev/null | openssl verify 2>&1)

    if echo "$CHAIN_VERIFY" | grep -q "OK"; then
        print_pass
    else
        print_fail "Certificate chain verification failed"
        echo -e "${RED}  $CHAIN_VERIFY${NC}"
    fi
}

test_common_name() {
    print_test "Certificate CN/SAN matches domain"

    CERT_INFO=$(echo | openssl s_client -connect "$DOMAIN:$PORT" 2>/dev/null | openssl x509 -noout -subject -ext subjectAltName)

    if echo "$CERT_INFO" | grep -q "$DOMAIN"; then
        print_pass
        CN=$(echo "$CERT_INFO" | grep "CN=" | sed 's/.*CN=\([^,]*\).*/\1/')
        print_info "Common Name: $CN"
    else
        print_fail "Domain $DOMAIN not found in certificate CN or SAN"
    fi
}

test_key_size() {
    print_test "Public key size (minimum 2048-bit)"

    KEY_SIZE=$(echo | openssl s_client -connect "$DOMAIN:$PORT" 2>/dev/null | openssl x509 -noout -text | grep "Public-Key:" | sed 's/.*(\(.*\) bit).*/\1/')

    if [ "$KEY_SIZE" -ge 2048 ]; then
        print_pass
        print_info "Key size: $KEY_SIZE bits"
    else
        print_fail "Key size $KEY_SIZE is below minimum (2048 bits)"
    fi
}

test_signature_algorithm() {
    print_test "Signature algorithm strength"

    SIG_ALG=$(echo | openssl s_client -connect "$DOMAIN:$PORT" 2>/dev/null | openssl x509 -noout -text | grep "Signature Algorithm" | head -1 | awk '{print $3}')

    if echo "$SIG_ALG" | grep -Eq "sha256|sha384|sha512"; then
        print_pass
        print_info "Signature algorithm: $SIG_ALG"
    else
        print_fail "Weak signature algorithm: $SIG_ALG"
    fi
}

test_ocsp_stapling() {
    print_test "OCSP stapling"

    OCSP_STATUS=$(echo | openssl s_client -connect "$DOMAIN:$PORT" -status 2>/dev/null | grep "OCSP Response Status")

    if echo "$OCSP_STATUS" | grep -q "successful"; then
        print_pass
        print_info "OCSP stapling enabled and working"
    else
        print_warn "OCSP stapling not detected or failed"
    fi
}

test_hsts_header() {
    print_test "HSTS (HTTP Strict Transport Security) header"

    HSTS_HEADER=$(curl -I -s "https://$DOMAIN" | grep -i "Strict-Transport-Security")

    if [ -n "$HSTS_HEADER" ]; then
        MAX_AGE=$(echo "$HSTS_HEADER" | grep -o "max-age=[0-9]*" | cut -d= -f2)

        # Check for at least 1 year (31536000 seconds)
        if [ "$MAX_AGE" -ge 31536000 ]; then
            print_pass
            print_info "$HSTS_HEADER"
        else
            print_warn "HSTS max-age is less than 1 year ($MAX_AGE seconds)"
        fi
    else
        print_fail "HSTS header not found"
    fi
}

test_http_to_https_redirect() {
    print_test "HTTP to HTTPS redirect"

    HTTP_REDIRECT=$(curl -I -s -L "http://$DOMAIN" | grep -i "location.*https")

    if [ -n "$HTTP_REDIRECT" ]; then
        print_pass
        print_info "HTTP redirects to HTTPS"
    else
        print_fail "HTTP does not redirect to HTTPS"
    fi
}

test_pfs() {
    print_test "Perfect Forward Secrecy (PFS)"

    PFS_CIPHER=$(echo | openssl s_client -connect "$DOMAIN:$PORT" 2>/dev/null | grep "Cipher" | grep -E "ECDHE|DHE")

    if [ -n "$PFS_CIPHER" ]; then
        print_pass
        print_info "PFS enabled (cipher: $(echo "$PFS_CIPHER" | awk '{print $3}'))"
    else
        print_fail "Perfect Forward Secrecy not enabled"
    fi
}

test_compression() {
    print_test "TLS compression disabled (CRIME attack prevention)"

    COMPRESSION=$(echo | openssl s_client -connect "$DOMAIN:$PORT" 2>/dev/null | grep "Compression:")

    if echo "$COMPRESSION" | grep -q "NONE"; then
        print_pass
    else
        print_fail "TLS compression is enabled (vulnerable to CRIME attack)"
    fi
}

test_heartbleed() {
    print_test "Heartbleed vulnerability (CVE-2014-0160)"

    # Simple check: OpenSSL 1.0.1 through 1.0.1f are vulnerable
    OPENSSL_VERSION=$(echo | openssl s_client -connect "$DOMAIN:$PORT" 2>/dev/null | grep "^Server public key")

    # More accurate: check if server supports heartbeat extension
    HEARTBEAT=$(echo | openssl s_client -connect "$DOMAIN:$PORT" -tlsextdebug 2>/dev/null | grep "heartbeat")

    if [ -z "$HEARTBEAT" ]; then
        print_pass
        print_info "Heartbeat extension not supported"
    else
        print_warn "Heartbeat extension supported (manual verification recommended)"
    fi
}

################################################################################
# External Service Tests (Optional)
################################################################################

test_ssl_labs() {
    if command -v jq &> /dev/null; then
        print_test "SSL Labs grade (external API)"

        print_info "Checking SSL Labs API (this may take a few minutes)..."

        # Start new scan
        API_URL="https://api.ssllabs.com/api/v3/analyze?host=$DOMAIN&publish=off&all=done"

        # Poll for results (max 5 minutes)
        for i in {1..30}; do
            RESULT=$(curl -s "$API_URL")
            STATUS=$(echo "$RESULT" | jq -r '.status' 2>/dev/null || echo "error")

            if [ "$STATUS" == "READY" ]; then
                GRADE=$(echo "$RESULT" | jq -r '.endpoints[0].grade' 2>/dev/null)

                case "$GRADE" in
                    A+|A|A-)
                        print_pass
                        print_info "SSL Labs grade: $GRADE"
                        ;;
                    B|C)
                        print_warn "SSL Labs grade: $GRADE (improvement recommended)"
                        ;;
                    *)
                        print_fail "SSL Labs grade: $GRADE"
                        ;;
                esac
                break
            fi

            sleep 10
        done

        if [ "$STATUS" != "READY" ]; then
            print_warn "SSL Labs scan timed out or failed"
        fi
    else
        print_info "jq not installed, skipping SSL Labs test"
    fi
}

################################################################################
# Main Execution
################################################################################

main() {
    print_header "Aurigraph V11 SSL/TLS Certificate Validator"
    echo "Domain: $DOMAIN"
    echo "Port: $PORT"
    echo "Date: $(date)"
    echo ""

    # Dependency checks
    if ! command -v openssl &> /dev/null; then
        echo -e "${RED}Error: openssl is not installed${NC}"
        exit 1
    fi

    if ! command -v curl &> /dev/null; then
        echo -e "${RED}Error: curl is not installed${NC}"
        exit 1
    fi

    # Run tests
    print_header "Running SSL/TLS Tests"

    test_connectivity
    test_tls_version
    test_weak_protocols
    test_cipher_suites
    test_certificate_validity
    test_certificate_chain
    test_common_name
    test_key_size
    test_signature_algorithm
    test_ocsp_stapling
    test_hsts_header
    test_http_to_https_redirect
    test_pfs
    test_compression
    test_heartbleed

    # Optional external tests
    # test_ssl_labs  # Uncomment to enable SSL Labs testing

    # Summary
    echo ""
    print_header "Test Summary"
    echo -e "Passed:  ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Warned:  ${YELLOW}$TESTS_WARNED${NC}"
    echo -e "Failed:  ${RED}$TESTS_FAILED${NC}"
    echo ""

    # Exit code
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ All critical tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}✗ $TESTS_FAILED test(s) failed. Review required.${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
