#!/bin/bash

# Create gRPC JIRA Tickets with Correct Flags
# ===========================================

echo "🎫 Creating JIRA Tickets for gRPC/HTTP/2 Migration"
echo "=================================================="

# Key ticket
echo "Creating AV10-GRPC-01: gRPC Infrastructure Setup..."
jira issue create \
    -p"AV10" \
    -t"Task" \
    -s"[AV10-GRPC-01] Implement gRPC Infrastructure with Protocol Buffers" \
    -y"High" \
    -lgRPC,HTTP/2,performance,infrastructure \
    -P"AV10-7" \
    -b"## Objective
Implement gRPC infrastructure with Protocol Buffers for internal service communication using HTTP/2

## Acceptance Criteria
- ✅ Protocol Buffer definitions for all services
- ✅ gRPC server implementation with HTTP/2
- ✅ Service discovery and load balancing
- ✅ TLS/mTLS authentication
- ✅ 3x performance improvement over REST

## Technical Requirements
- Use proto3 syntax
- Implement streaming for real-time updates
- Support backward compatibility
- Enable reflection for debugging

## Dependencies
- Node.js gRPC libraries
- Protocol Buffer compiler
- HTTP/2 support

## Estimated Effort
2 weeks" --web

echo "✅ Created AV10-GRPC-01"

echo ""
echo "Creating additional tickets manually via JIRA web interface..."
echo "Navigate to: https://aurigraphdlt.atlassian.net/jira/software/projects/AV10"
echo ""
echo "Remaining tickets to create:"
echo "2. AV10-GRPC-02: Protocol Buffer Schema Design (1 week)"
echo "3. AV10-GRPC-03: gRPC Server Implementation (2 weeks)"
echo "4. AV10-GRPC-04: REST to gRPC Migration (3 weeks)"
echo "5. AV10-GRPC-05: Client Library Implementation (2 weeks)"
echo "6. AV10-GRPC-06: Performance Testing (1 week)"
echo "7. AV10-GRPC-07: HTTP/3 Planning (2 weeks)"
echo "8. AV10-GRPC-08: Monitoring & Observability (1 week)"
echo "9. AV10-GRPC-09: Security Implementation (2 weeks)"
echo "10. AV10-GRPC-10: Documentation & Training (1 week)"