#!/bin/bash

# Aurigraph V11 - 15-Core Xeon Gold Performance Test
# Optimized for 15 cores / 30 threads + 64GB RAM

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
TARGET_TPS=${1:-1600000}  # Default 1.6M TPS target
DURATION=${2:-60}         # Default 60 second test
BASE_URL="http://localhost:9003"

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}🚀 Aurigraph V11 - 15-Core Performance Test${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

print_system_info() {
    echo -e "${PURPLE}📊 System Information:${NC}"
    echo "CPU: $(grep 'model name' /proc/cpuinfo | head -1 | cut -d':' -f2 | xargs)"
    echo "Cores: $(nproc) logical processors"
    echo "Memory: $(free -h | grep 'Mem:' | awk '{print $2}') total"
    echo "Java: $(java -version 2>&1 | head -1)"
    echo ""
}

check_service() {
    echo -e "${YELLOW}🔍 Checking Aurigraph V11 service...${NC}"
    
    if ! curl -sf "$BASE_URL/api/v11/health" > /dev/null; then
        echo -e "${RED}❌ Service not responding. Please start V11:${NC}"
        echo "   ./mvnw quarkus:dev -Dquarkus.profile=15core-optimized"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Service is running${NC}"
}

optimize_system() {
    echo -e "${YELLOW}⚡ Applying 15-core optimizations...${NC}"
    
    # CPU governor
    if [ -w /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor ]; then
        echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor > /dev/null
        echo -e "${GREEN}✅ CPU governor set to performance${NC}"
    fi
    
    # Transparent huge pages
    if [ -w /sys/kernel/mm/transparent_hugepage/enabled ]; then
        echo always | sudo tee /sys/kernel/mm/transparent_hugepage/enabled > /dev/null
        echo -e "${GREEN}✅ Transparent huge pages enabled${NC}"
    fi
    
    # Process priority
    sudo renice -n -10 -p $$ 2>/dev/null || echo -e "${YELLOW}⚠️  Could not set high priority${NC}"
    
    echo ""
}

run_baseline_test() {
    echo -e "${PURPLE}📈 Baseline Performance Test${NC}"
    echo "Target TPS: $(printf "%'d" $TARGET_TPS)"
    echo "Duration: ${DURATION} seconds"
    echo ""
    
    # Get initial stats
    INITIAL_STATS=$(curl -s "$BASE_URL/api/v11/stats" | jq '.')
    INITIAL_TPS=$(echo "$INITIAL_STATS" | jq -r '.transactions.current_tps // 0')
    
    echo -e "${BLUE}Initial TPS:${NC} $(printf "%'d" $INITIAL_TPS)"
    
    # Start monitoring
    echo -e "${YELLOW}Starting ${DURATION}s performance test...${NC}"
    
    START_TIME=$(date +%s)
    SAMPLE_COUNT=0
    TPS_SAMPLES=()
    CPU_SAMPLES=()
    MEM_SAMPLES=()
    
    while [ $(($(date +%s) - START_TIME)) -lt $DURATION ]; do
        # Collect performance metrics
        STATS=$(curl -s "$BASE_URL/api/v11/stats" 2>/dev/null | jq '.' 2>/dev/null || echo '{}')
        CURRENT_TPS=$(echo "$STATS" | jq -r '.transactions.current_tps // 0')
        
        # System metrics
        CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
        MEM_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
        
        # Store samples
        TPS_SAMPLES+=($CURRENT_TPS)
        CPU_SAMPLES+=($CPU_USAGE)
        MEM_SAMPLES+=($MEM_USAGE)
        
        SAMPLE_COUNT=$((SAMPLE_COUNT + 1))
        PROGRESS=$((100 * ($(date +%s) - START_TIME) / DURATION))
        
        printf "\r${YELLOW}Progress: [%3d%%] TPS: %'8d CPU: %5.1f%% MEM: %5.1f%%${NC}" \
               $PROGRESS $CURRENT_TPS $CPU_USAGE $MEM_USAGE
        
        sleep 2
    done
    
    echo ""
    echo ""
}

calculate_statistics() {
    echo -e "${PURPLE}📊 Performance Statistics${NC}"
    
    # Calculate TPS statistics
    TPS_SUM=0
    TPS_MAX=0
    TPS_MIN=9999999
    
    for tps in "${TPS_SAMPLES[@]}"; do
        TPS_SUM=$((TPS_SUM + tps))
        if [ $tps -gt $TPS_MAX ]; then TPS_MAX=$tps; fi
        if [ $tps -lt $TPS_MIN ]; then TPS_MIN=$tps; fi
    done
    
    TPS_AVG=$((TPS_SUM / ${#TPS_SAMPLES[@]}))
    
    # Calculate CPU statistics
    CPU_SUM=0
    for cpu in "${CPU_SAMPLES[@]}"; do
        CPU_SUM=$(echo "$CPU_SUM + $cpu" | bc -l)
    done
    CPU_AVG=$(echo "scale=1; $CPU_SUM / ${#CPU_SAMPLES[@]}" | bc -l)
    
    # Calculate memory statistics
    MEM_SUM=0
    for mem in "${MEM_SAMPLES[@]}"; do
        MEM_SUM=$(echo "$MEM_SUM + $mem" | bc -l)
    done
    MEM_AVG=$(echo "scale=1; $MEM_SUM / ${#MEM_SAMPLES[@]}" | bc -l)
    
    # Performance efficiency
    EFFICIENCY=$(echo "scale=1; $TPS_AVG / 15 / 1000" | bc -l)  # TPS per core in K
    
    echo ""
    echo -e "${BLUE}TPS Performance:${NC}"
    echo "  Average: $(printf "%'d" $TPS_AVG) TPS"
    echo "  Peak:    $(printf "%'d" $TPS_MAX) TPS"
    echo "  Minimum: $(printf "%'d" $TPS_MIN) TPS"
    echo ""
    echo -e "${BLUE}Resource Utilization:${NC}"
    echo "  CPU Usage:    ${CPU_AVG}% (15 cores)"
    echo "  Memory Usage: ${MEM_AVG}% (64GB)"
    echo "  Efficiency:   ${EFFICIENCY}K TPS per core"
    echo ""
    
    # Performance grade
    if [ $TPS_AVG -ge 2000000 ]; then
        GRADE="${GREEN}🏆 EXCEPTIONAL (2M+ TPS)${NC}"
    elif [ $TPS_AVG -ge 1600000 ]; then
        GRADE="${GREEN}🥇 EXCELLENT (1.6M+ TPS)${NC}"
    elif [ $TPS_AVG -ge 1200000 ]; then
        GRADE="${YELLOW}🥈 VERY GOOD (1.2M+ TPS)${NC}"
    elif [ $TPS_AVG -ge 800000 ]; then
        GRADE="${YELLOW}🥉 GOOD (800K+ TPS)${NC}"
    else
        GRADE="${RED}📈 NEEDS OPTIMIZATION${NC}"
    fi
    
    echo -e "${BLUE}Performance Grade:${NC} $GRADE"
    echo ""
}

target_analysis() {
    TARGET_ACHIEVEMENT=$(echo "scale=1; $TPS_AVG * 100 / $TARGET_TPS" | bc -l)
    
    echo -e "${PURPLE}🎯 Target Analysis${NC}"
    echo "Target TPS:    $(printf "%'d" $TARGET_TPS)"
    echo "Achieved TPS:  $(printf "%'d" $TPS_AVG)"
    echo "Achievement:   ${TARGET_ACHIEVEMENT}%"
    echo ""
    
    if (( $(echo "$TARGET_ACHIEVEMENT >= 100" | bc -l) )); then
        echo -e "${GREEN}✅ TARGET ACHIEVED!${NC}"
        OVERAGE=$(echo "scale=1; $TARGET_ACHIEVEMENT - 100" | bc -l)
        echo -e "${GREEN}🚀 Exceeded target by ${OVERAGE}%${NC}"
    elif (( $(echo "$TARGET_ACHIEVEMENT >= 90" | bc -l) )); then
        echo -e "${YELLOW}🔶 CLOSE TO TARGET (${TARGET_ACHIEVEMENT}%)${NC}"
        echo -e "${YELLOW}💡 Consider minor optimizations${NC}"
    else
        echo -e "${RED}❌ TARGET NOT MET (${TARGET_ACHIEVEMENT}%)${NC}"
        echo -e "${RED}🔧 Significant optimization needed${NC}"
    fi
    echo ""
}

optimization_recommendations() {
    echo -e "${PURPLE}💡 Optimization Recommendations for 15-Core Setup${NC}"
    
    if (( $(echo "$CPU_AVG < 70" | bc -l) )); then
        echo "🔹 CPU utilization low (${CPU_AVG}%) - increase parallel threads"
        echo "   consensus.parallel.threads=30"
        echo "   ai.executor.ai.processing.threads=20"
    fi
    
    if (( $(echo "$MEM_AVG < 20" | bc -l) )); then
        echo "🔹 Memory utilization low (${MEM_AVG}%) - increase batch sizes"
        echo "   consensus.batch.size=100000"
        echo "   ai.batch.target.size=150000"
    fi
    
    if [ $TPS_AVG -lt 1600000 ]; then
        echo "🔹 Consider native compilation for additional performance:"
        echo "   ./mvnw package -Pnative-fast"
        echo "🔹 Enable CPU-specific optimizations:"
        echo "   -march=native compiler flags"
    fi
    
    echo ""
}

detailed_metrics() {
    echo -e "${PURPLE}📋 Detailed System Metrics${NC}"
    
    # Final service stats
    FINAL_STATS=$(curl -s "$BASE_URL/api/v11/stats" | jq '.')
    
    echo -e "${BLUE}Consensus Performance:${NC}"
    echo "$FINAL_STATS" | jq -r '.consensus // {} | to_entries[] | "  \(.key): \(.value)"'
    
    echo ""
    echo -e "${BLUE}AI Optimization Status:${NC}"
    echo "$FINAL_STATS" | jq -r '.ai_optimization // {} | to_entries[] | "  \(.key): \(.value)"'
    
    echo ""
    echo -e "${BLUE}Network Performance:${NC}"
    echo "$FINAL_STATS" | jq -r '.network // {} | to_entries[] | "  \(.key): \(.value)"'
    
    echo ""
}

main() {
    print_header
    print_system_info
    check_service
    optimize_system
    run_baseline_test
    calculate_statistics
    target_analysis
    optimization_recommendations
    detailed_metrics
    
    echo -e "${GREEN}🎉 Performance test completed!${NC}"
    echo -e "${BLUE}ℹ️  For continuous monitoring: watch -n 5 'curl -s $BASE_URL/api/v11/stats | jq .'${NC}"
}

# Install required tools if missing
command -v jq >/dev/null 2>&1 || { echo "Installing jq..."; sudo apt-get install -y jq bc 2>/dev/null || echo "Please install jq and bc"; }

main "$@"