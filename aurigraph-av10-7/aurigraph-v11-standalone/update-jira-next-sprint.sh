#!/bin/bash

# JIRA Configuration
JIRA_EMAIL="subbu@aurigraph.io"
JIRA_API_TOKEN="ATATT3xFfGF0sFjaXc9iiBQuv-1jvWEfLDA5APUBvJvhVSrtzDDfS4B9k3ut3gCAyHUNU0YImVJSjcjglkR_3dmHtvRUYiV32nQJqkQ_HwKqCbS6oNs99XdYu5j_SmQqMQX4a7WekwS-sYNbDFtNBTrRuemXmlVHrjWa6dhMdCBuk0vdQvd_OYA=F7D4339F"
JIRA_BASE_URL="https://aurigraphdlt.atlassian.net"
PROJECT_KEY="AV11"

echo "=========================================="
echo "JIRA Ticket Creation - Next Sprint Tasks"
echo "Date: November 26, 2025"
echo "Sprint: gRPC Implementation & Critical Fixes"
echo "=========================================="
echo ""

# Function to create JIRA ticket
create_jira_ticket() {
    local summary="$1"
    local description="$2"
    local labels="$3"

    echo "Creating ticket: $summary"

    response=$(curl -s -X POST \
        -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
        -H "Content-Type: application/json" \
        "${JIRA_BASE_URL}/rest/api/3/issue" \
        -d '{
            "fields": {
                "project": {"key": "'"${PROJECT_KEY}"'"},
                "summary": "'"${summary}"'",
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "'"${description}"'"
                                }
                            ]
                        }
                    ]
                },
                "issuetype": {"name": "Task"},
                "labels": '"${labels}"'
            }
        }')

    ticket_key=$(echo "$response" | jq -r '.key // empty')

    if [ -n "$ticket_key" ]; then
        echo "✅ Created: $ticket_key"
        echo "📝 URL: ${JIRA_BASE_URL}/browse/${ticket_key}"
    else
        echo "❌ Failed to create ticket"
        echo "Response: $response"
    fi

    echo ""
}

# Task 1: Fix Remaining Persistence Configuration Issues
create_jira_ticket \
    "[CRITICAL] Fix Remaining 9 Entity Persistence Configuration Issues" \
    "OBJECTIVE: Complete persistence configuration to eliminate all entity warnings. CURRENT STATE: 9 entities still showing 'Could not find suitable persistence unit' warnings: AuthToken, AtomicSwapStateEntity, BridgeTransactionEntity, BridgeTransferHistoryEntity, ComplianceEntity, IdentityEntity, TransferAuditEntity, OracleVerificationEntity, WebSocketSubscription. SOLUTION: Review entity package registration and ensure all entity packages are properly included in quarkus.hibernate-orm.packages configuration. IMPACT: CRITICAL - Prevents data loss and ensures all entity types can persist correctly. Story Points: 3" \
    '["persistence", "configuration", "critical", "next-sprint"]'

# Task 2: Apply Global Interceptors to gRPC Services
create_jira_ticket \
    "[HIGH] Resolve gRPC Unused Interceptor Warnings" \
    "OBJECTIVE: Apply @GlobalInterceptor annotation to all 4 gRPC interceptors to enable global request/response handling. CURRENT STATE: Build warning shows unused interceptors: ExceptionInterceptor, AuthorizationInterceptor, LoggingInterceptor, MetricsInterceptor. SOLUTION: Already applied @GlobalInterceptor annotations in previous sprint. Need to verify application and resolve any remaining configuration issues. VERIFICATION: Run build and confirm warning is eliminated. IMPACT: HIGH - Enables comprehensive logging, authorization, metrics, and exception handling for all gRPC calls. Story Points: 2" \
    '["grpc", "interceptors", "configuration", "next-sprint"]'

# Task 3: Clean Up Duplicate Configuration Properties
create_jira_ticket \
    "[MEDIUM] Remove Duplicate Configuration Properties" \
    "OBJECTIVE: Clean up application.properties to eliminate duplicate configuration warnings. CURRENT STATE: Multiple duplicate property warnings: %dev.quarkus.log.level (DEBUG), %dev.quarkus.log.category.io.aurigraph.level (DEBUG), %prod.consensus.pipeline.depth (90), %test.quarkus.flyway.migrate-at-start (false), quarkus.hibernate-orm.packages. SOLUTION: Review application.properties and consolidate duplicate entries. Maintain single source of truth for each configuration property. FILES: src/main/resources/application.properties. IMPACT: MEDIUM - Improves configuration clarity and prevents potential conflicts. Story Points: 2" \
    '["configuration", "cleanup", "technical-debt", "next-sprint"]'

# Task 4: Implement TransactionGrpcService (Day 2 of gRPC Plan)
create_jira_ticket \
    "[HIGH] Implement TransactionGrpcService with 5 Core Methods" \
    "OBJECTIVE: Implement first production gRPC service for transaction processing following GRPC-IMPLEMENTATION-PLAN.md Day 2. SCOPE: Create TransactionGrpcService with 5 reactive methods: (1) submitTransaction - Uni<SubmitTransactionResponse>, (2) getTransaction - Uni<GetTransactionResponse>, (3) queryTransactions - Multi<Transaction>, (4) subscribeToTransactions - Multi<Transaction>, (5) validateTransaction - Uni<ValidationResponse>. REQUIREMENTS: Use Mutiny reactive programming (Uni/Multi), integrate with existing TransactionService, implement error handling with Status codes, add comprehensive logging. TESTING: Unit tests with Mockito, integration tests with TestContainers. DELIVERABLE: Fully functional gRPC service with 5x performance improvement over REST. Story Points: 8" \
    '["grpc", "implementation", "transaction-service", "next-sprint"]'

# Task 5: Implement BlockchainGrpcService
create_jira_ticket \
    "[MEDIUM] Implement BlockchainGrpcService with Core Operations" \
    "OBJECTIVE: Implement gRPC service for blockchain operations following GRPC-IMPLEMENTATION-PLAN.md Day 3. SCOPE: Create BlockchainGrpcService with methods: (1) getBlock - Retrieve block by hash/height, (2) getBlockRange - Query multiple blocks, (3) subscribeToBlocks - Real-time block notifications, (4) getBlockchainInfo - Current chain state. REQUIREMENTS: Use Mutiny for reactive streaming, integrate with HyperRAFTConsensusService, implement pagination for block queries. DEPENDENCIES: Requires TransactionGrpcService completion. TESTING: Integration tests with consensus service. Story Points: 5" \
    '["grpc", "blockchain", "consensus", "next-sprint"]'

# Task 6: Create gRPC Performance Testing Suite
create_jira_ticket \
    "[HIGH] Create gRPC Performance Testing Suite with ghz" \
    "OBJECTIVE: Implement comprehensive performance testing for gRPC services using ghz benchmarking tool. SCOPE: (1) Install and configure ghz for load testing, (2) Create test scenarios for all gRPC methods, (3) Benchmark against 2M+ TPS target, (4) Compare gRPC vs REST performance, (5) Generate performance reports. TEST SCENARIOS: Single transaction (latency), bulk transactions (throughput), concurrent streams, error handling under load. METRICS: Requests/sec, latency (p50, p95, p99), error rate, resource utilization. DELIVERABLE: Automated performance test suite integrated into CI/CD. Story Points: 5" \
    '["testing", "performance", "grpc", "benchmarking", "next-sprint"]'

# Task 7: Fix Unrecognized Configuration Keys
create_jira_ticket \
    "[LOW] Resolve Unrecognized Configuration Key Warnings" \
    "OBJECTIVE: Investigate and resolve 26 unrecognized configuration key warnings in application.properties. EXAMPLES: quarkus.grpc.server.permit-keep-alive-time, quarkus.cache.type, quarkus.http.tcp-keep-alive, quarkus.virtual-threads.max-pooled, quarkus.opentelemetry.enabled, etc. SOLUTION: (1) Verify if extensions are properly included in pom.xml, (2) Check Quarkus version compatibility for each property, (3) Update or remove deprecated properties, (4) Add missing extensions if needed. IMPACT: LOW - Most configurations still work, but cleanup improves maintainability. Story Points: 3" \
    '["configuration", "quarkus", "technical-debt", "next-sprint"]'

# Task 8: Implement Bridge gRPC Service
create_jira_ticket \
    "[MEDIUM] Implement CrossChainBridgeGrpcService" \
    "OBJECTIVE: Implement gRPC service for cross-chain bridge operations. SCOPE: Create CrossChainBridgeGrpcService with methods: (1) initiateBridgeTransfer - Start cross-chain transfer, (2) getBridgeTransferStatus - Query transfer state, (3) confirmBridgeTransfer - Finalize transfer, (4) subscribeToBridgeEvents - Real-time notifications. REQUIREMENTS: Integrate with CrossChainBridgeService, implement atomic swap logic, handle multi-chain state synchronization. SECURITY: JWT authentication, transfer validation, fraud detection. TESTING: Multi-chain integration tests. Story Points: 8" \
    '["grpc", "bridge", "cross-chain", "next-sprint"]'

echo "=========================================="
echo "✅ All next sprint JIRA tickets created"
echo "Total Story Points: 36 SP"
echo "=========================================="
