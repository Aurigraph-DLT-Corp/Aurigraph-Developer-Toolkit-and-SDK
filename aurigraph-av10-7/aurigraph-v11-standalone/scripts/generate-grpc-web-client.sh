#!/bin/bash

# ==============================================================================
# Aurigraph V12 gRPC-Web TypeScript Client Generator
# ==============================================================================
#
# Generates TypeScript client code from Protocol Buffer definitions for
# browser-based gRPC-Web streaming.
#
# Prerequisites:
#   - protoc (Protocol Buffer Compiler)
#   - protoc-gen-ts (TypeScript plugin)
#   - protoc-gen-grpc-web (gRPC-Web plugin)
#
# Install:
#   brew install protobuf
#   npm install -g ts-protoc-gen @nicepkg/grpc-web-gen
#
# Usage:
#   ./scripts/generate-grpc-web-client.sh [output-dir]
#
# Output:
#   Generated TypeScript files in:
#   - enterprise-portal/frontend/src/generated/proto/
#
# ==============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."
PROTO_DIR="${PROJECT_ROOT}/src/main/proto"
OUTPUT_DIR="${1:-${PROJECT_ROOT}/../../local_test/enterprise-portal/enterprise-portal/frontend/src/generated/proto}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Aurigraph gRPC-Web Client Generator${NC}"
echo -e "${GREEN}========================================${NC}"

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v protoc &> /dev/null; then
    echo -e "${RED}Error: protoc not found. Install with: brew install protobuf${NC}"
    exit 1
fi

echo "  protoc: $(protoc --version)"

# Create output directory
echo -e "\n${YELLOW}Creating output directory...${NC}"
mkdir -p "${OUTPUT_DIR}"
echo "  Output: ${OUTPUT_DIR}"

# List proto files to process
echo -e "\n${YELLOW}Proto files to process:${NC}"
PROTO_FILES=$(find "${PROTO_DIR}" -name "*.proto" -type f)
for proto in ${PROTO_FILES}; do
    echo "  - $(basename ${proto})"
done

# Generate TypeScript client code
echo -e "\n${YELLOW}Generating TypeScript gRPC-Web clients...${NC}"

# Use protoc with grpc-web plugin
for proto in ${PROTO_FILES}; do
    proto_name=$(basename "${proto}" .proto)
    echo "  Generating: ${proto_name}..."

    # Generate TypeScript definitions using grpc-web
    protoc \
        --proto_path="${PROTO_DIR}" \
        --proto_path="${PROTO_DIR}/../resources" \
        --js_out=import_style=commonjs,binary:"${OUTPUT_DIR}" \
        --grpc-web_out=import_style=typescript,mode=grpcwebtext:"${OUTPUT_DIR}" \
        "${proto}" 2>/dev/null || {
            echo -e "    ${YELLOW}Note: Some imports may need manual resolution${NC}"
        }
done

# Create index.ts export file
echo -e "\n${YELLOW}Creating index.ts...${NC}"
cat > "${OUTPUT_DIR}/index.ts" << 'EOF'
/**
 * Aurigraph V12 gRPC-Web Client
 *
 * Auto-generated TypeScript clients for gRPC streaming services.
 * Use these clients instead of WebSocket for real-time data.
 *
 * Services:
 *   - MetricsStreamServiceClient
 *   - ConsensusStreamServiceClient
 *   - NetworkStreamServiceClient
 *   - ValidatorStreamServiceClient
 *   - ChannelStreamServiceClient
 *   - AnalyticsStreamServiceClient
 *
 * Usage:
 *   import { MetricsStreamServiceClient } from './proto';
 *
 *   const client = new MetricsStreamServiceClient('https://grpc.dlt.aurigraph.io');
 *   const stream = client.streamMetrics(subscription);
 *   stream.on('data', (metrics) => console.log(metrics));
 *
 * @generated
 */

// Export all generated clients
export * from './metrics-stream_pb';
export * from './consensus-stream_pb';
export * from './network-stream_pb';
export * from './validator-stream_pb';
export * from './channel-stream_pb';
export * from './analytics-stream_pb';
export * from './common_pb';

// Export service clients (generated with grpc-web plugin)
// Note: Actual exports depend on generated files
EOF

# Create gRPC-Web client wrapper
echo -e "\n${YELLOW}Creating gRPC-Web client wrapper...${NC}"
cat > "${OUTPUT_DIR}/grpc-web-client.ts" << 'EOF'
/**
 * Aurigraph V12 gRPC-Web Client Wrapper
 *
 * Provides a simplified interface for streaming services.
 * Replaces WebSocket connections with gRPC-Web streaming.
 *
 * Benefits:
 *   - Binary protocol (50% smaller payloads)
 *   - Type-safe API (from .proto definitions)
 *   - Better error handling
 *   - HTTP/2 multiplexing
 *
 * @module grpc-web-client
 */

// Configuration
export const GRPC_WEB_ENDPOINT = process.env.REACT_APP_GRPC_WEB_URL || 'http://localhost:8080';
export const GRPC_WEB_SECURE_ENDPOINT = process.env.REACT_APP_GRPC_WEB_SECURE_URL || 'https://grpc.dlt.aurigraph.io';

/**
 * gRPC-Web client configuration
 */
export interface GrpcWebConfig {
  endpoint: string;
  secure: boolean;
  credentials?: 'include' | 'same-origin' | 'omit';
  timeout?: number;
}

/**
 * Default configuration
 */
export const defaultConfig: GrpcWebConfig = {
  endpoint: typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? GRPC_WEB_SECURE_ENDPOINT
    : GRPC_WEB_ENDPOINT,
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
  credentials: 'include',
  timeout: 30000,
};

/**
 * Stream event handler types
 */
export type StreamDataHandler<T> = (data: T) => void;
export type StreamErrorHandler = (error: Error) => void;
export type StreamEndHandler = () => void;

/**
 * Generic stream subscription interface
 */
export interface StreamSubscription<T> {
  onData(handler: StreamDataHandler<T>): StreamSubscription<T>;
  onError(handler: StreamErrorHandler): StreamSubscription<T>;
  onEnd(handler: StreamEndHandler): StreamSubscription<T>;
  cancel(): void;
}

/**
 * Check if gRPC-Web is available (client-side only)
 */
export function isGrpcWebAvailable(): boolean {
  return typeof window !== 'undefined' && 'grpc' in window;
}

/**
 * Migration helper: Log deprecation warning for WebSocket usage
 */
export function warnWebSocketDeprecated(endpoint: string): void {
  console.warn(
    `[DEPRECATED] WebSocket endpoint ${endpoint} is deprecated. ` +
    `Please migrate to gRPC-Web streaming for better performance. ` +
    `See: docs/migration/websocket-to-grpc-web.md`
  );
}
EOF

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Generation complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nNext steps:"
echo -e "  1. Add gRPC-Web dependencies to package.json:"
echo -e "     npm install grpc-web google-protobuf @types/google-protobuf"
echo -e "  2. Import clients in your React components:"
echo -e "     import { MetricsStreamServiceClient } from './generated/proto';"
echo -e "  3. Configure CORS for gRPC-Web in nginx/envoy"
echo -e "\nSee: docs/migration/websocket-to-grpc-web.md"
