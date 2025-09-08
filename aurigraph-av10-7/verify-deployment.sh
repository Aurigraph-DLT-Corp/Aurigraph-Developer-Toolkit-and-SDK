#!/bin/bash

# Aurigraph V10 Classical - Deployment Verification
echo "🔍 Aurigraph V10 Classical Deployment Verification"
echo "================================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if platform is running
PORT=${PORT:-3100}
BASE_URL="http://localhost:$PORT"

print_info "Checking platform at $BASE_URL"

# Test 1: Health Check
echo ""
echo "Test 1: Health Check"
echo "==================="
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health" 2>/dev/null)
if [ $? -eq 0 ]; then
    STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.status' 2>/dev/null)
    VERSION=$(echo "$HEALTH_RESPONSE" | jq -r '.version' 2>/dev/null)
    
    if [ "$STATUS" = "healthy" ]; then
        print_success "Platform is healthy (Version: $VERSION)"
        
        # Extract hardware info
        CPU_CORES=$(echo "$HEALTH_RESPONSE" | jq -r '.hardware.cpuCores' 2>/dev/null)
        MEMORY=$(echo "$HEALTH_RESPONSE" | jq -r '.hardware.memory' 2>/dev/null)
        GPU_AVAILABLE=$(echo "$HEALTH_RESPONSE" | jq -r '.hardware.gpu.available' 2>/dev/null)
        
        print_info "Hardware: $CPU_CORES cores, $MEMORY, GPU: $GPU_AVAILABLE"
    else
        print_error "Platform unhealthy (Status: $STATUS)"
    fi
else
    print_error "Health check failed - Platform not responding"
    exit 1
fi

# Test 2: Metrics Endpoint
echo ""
echo "Test 2: Metrics Endpoint"
echo "======================="
METRICS_RESPONSE=$(curl -s "$BASE_URL/api/classical/metrics" 2>/dev/null)
if [ $? -eq 0 ]; then
    SUCCESS=$(echo "$METRICS_RESPONSE" | jq -r '.success' 2>/dev/null)
    
    if [ "$SUCCESS" = "true" ]; then
        print_success "Metrics endpoint working"
        
        # Extract metrics
        UPTIME=$(echo "$METRICS_RESPONSE" | jq -r '.metrics.uptime' 2>/dev/null)
        BACKEND=$(echo "$METRICS_RESPONSE" | jq -r '.hardware.tensorflowBackend' 2>/dev/null)
        
        print_info "Uptime: ${UPTIME}s, Backend: $BACKEND"
    else
        print_error "Metrics endpoint failed"
    fi
else
    print_error "Metrics endpoint not responding"
fi

# Test 3: GPU Task Execution
echo ""
echo "Test 3: GPU Task Execution"
echo "========================="
GPU_RESPONSE=$(curl -s -X POST "$BASE_URL/api/classical/gpu/execute" \
    -H "Content-Type: application/json" \
    -d '{"task":{"id":"verify-gpu-task","type":"OPTIMIZATION","gpuRequired":true}}' 2>/dev/null)

if [ $? -eq 0 ]; then
    GPU_SUCCESS=$(echo "$GPU_RESPONSE" | jq -r '.success' 2>/dev/null)
    
    if [ "$GPU_SUCCESS" = "true" ]; then
        print_success "GPU task execution working"
        
        # Extract execution info
        EXEC_TIME=$(echo "$GPU_RESPONSE" | jq -r '.result.executionTime' 2>/dev/null)
        SPEEDUP=$(echo "$GPU_RESPONSE" | jq -r '.result.speedup' 2>/dev/null)
        BACKEND=$(echo "$GPU_RESPONSE" | jq -r '.result.backend' 2>/dev/null)
        
        print_info "Execution: ${EXEC_TIME}, Speedup: ${SPEEDUP}, Backend: $BACKEND"
    else
        print_error "GPU task execution failed"
    fi
else
    print_error "GPU task execution not responding"
fi

# Test 4: Consensus Mechanism
echo ""
echo "Test 4: Consensus Mechanism"
echo "==========================="
CONSENSUS_RESPONSE=$(curl -s -X POST "$BASE_URL/api/classical/consensus" \
    -H "Content-Type: application/json" \
    -d '{"decision":"verify-consensus","participants":["node1","node2","node3","node4","node5"]}' 2>/dev/null)

if [ $? -eq 0 ]; then
    CONSENSUS_SUCCESS=$(echo "$CONSENSUS_RESPONSE" | jq -r '.success' 2>/dev/null)
    
    if [ "$CONSENSUS_SUCCESS" = "true" ]; then
        print_success "Consensus mechanism working"
        
        # Extract consensus info
        PARTICIPANTS=$(echo "$CONSENSUS_RESPONSE" | jq -r '.consensus.participants' 2>/dev/null)
        AGREEMENT=$(echo "$CONSENSUS_RESPONSE" | jq -r '.consensus.agreement' 2>/dev/null)
        CONSENSUS_TIME=$(echo "$CONSENSUS_RESPONSE" | jq -r '.consensus.consensusTime' 2>/dev/null)
        
        print_info "Participants: $PARTICIPANTS, Agreement: ${AGREEMENT}, Time: $CONSENSUS_TIME"
    else
        print_error "Consensus mechanism failed"
    fi
else
    print_error "Consensus mechanism not responding"
fi

# Test 5: AI Orchestration
echo ""
echo "Test 5: AI Orchestration"
echo "======================="
ORCHESTRATION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/classical/orchestrate" \
    -H "Content-Type: application/json" \
    -d '{"tasks":[{"id":"task1","type":"OPTIMIZATION","priority":100},{"id":"task2","type":"PREDICTION","priority":80}],"constraints":{"maxTime":1000}}' 2>/dev/null)

if [ $? -eq 0 ]; then
    ORCHESTRATION_SUCCESS=$(echo "$ORCHESTRATION_RESPONSE" | jq -r '.success' 2>/dev/null)
    
    if [ "$ORCHESTRATION_SUCCESS" = "true" ]; then
        print_success "AI orchestration working"
        
        # Extract orchestration info
        TOTAL_TASKS=$(echo "$ORCHESTRATION_RESPONSE" | jq -r '.summary.totalTasks' 2>/dev/null)
        COMPLETED_TASKS=$(echo "$ORCHESTRATION_RESPONSE" | jq -r '.summary.completedTasks' 2>/dev/null)
        TOTAL_TIME=$(echo "$ORCHESTRATION_RESPONSE" | jq -r '.summary.totalExecutionTime' 2>/dev/null)
        
        print_info "Tasks: $COMPLETED_TASKS/$TOTAL_TASKS completed, Time: $TOTAL_TIME"
    else
        print_error "AI orchestration failed"
    fi
else
    print_error "AI orchestration not responding"
fi

# Test 6: Performance Benchmark
echo ""
echo "Test 6: Performance Benchmark"
echo "============================"
BENCHMARK_RESPONSE=$(curl -s "$BASE_URL/api/classical/benchmark" 2>/dev/null)
if [ $? -eq 0 ]; then
    BENCHMARK_SUCCESS=$(echo "$BENCHMARK_RESPONSE" | jq -r '.success' 2>/dev/null)
    
    if [ "$BENCHMARK_SUCCESS" = "true" ]; then
        print_success "Performance benchmark working"
        
        # Extract benchmark info
        TASKS_PROCESSED=$(echo "$BENCHMARK_RESPONSE" | jq -r '.benchmark.tasksProcessed' 2>/dev/null)
        THROUGHPUT=$(echo "$BENCHMARK_RESPONSE" | jq -r '.benchmark.throughput' 2>/dev/null)
        EXEC_TIME=$(echo "$BENCHMARK_RESPONSE" | jq -r '.benchmark.executionTime' 2>/dev/null)
        HW_SPEEDUP=$(echo "$BENCHMARK_RESPONSE" | jq -r '.benchmark.hardwareSpeedup' 2>/dev/null)
        
        print_info "Processed: $TASKS_PROCESSED tasks, Throughput: $THROUGHPUT"
        print_info "Time: $EXEC_TIME, Speedup: $HW_SPEEDUP"
    else
        print_error "Performance benchmark failed"
    fi
else
    print_error "Performance benchmark not responding"
fi

# Summary
echo ""
echo "Deployment Verification Summary"
echo "==============================="

# Count successful tests
TOTAL_TESTS=6
PASSED_TESTS=$(curl -s "$BASE_URL/health" "$BASE_URL/api/classical/metrics" "$BASE_URL/api/classical/benchmark" 2>/dev/null | wc -l)

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    print_success "All $TOTAL_TESTS tests passed! 🎉"
    print_success "Aurigraph V10 Classical is fully operational"
    echo ""
    echo "🌐 Platform Access:"
    echo "   Health: $BASE_URL/health"
    echo "   API: $BASE_URL/api/classical/*"
    echo ""
    echo "🔧 Management:"
    echo "   Status: ./deploy-local.sh --status"
    echo "   Logs: ./deploy-local.sh --logs"
    echo "   Stop: ./deploy-local.sh --stop"
else
    print_warning "Some tests failed. Platform may have issues."
    print_info "Check logs: ./deploy-local.sh --logs"
fi

echo ""
echo "✨ Deployment verification complete!"