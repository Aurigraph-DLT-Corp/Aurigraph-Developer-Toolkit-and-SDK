#!/bin/bash
# ================================================================================
# AUREX LAUNCHPAD™ HEALTH CHECK SCRIPT
# Comprehensive health monitoring for production deployment
# Agent: DevOps Orchestration Agent
# ================================================================================

set -e

# Configuration
APP_NAME="aurex-launchpad"
SERVER_HOST="dev.aurigraph.io"
SERVER_PORT="2224"
APP_USER="yogesh"
REMOTE_DIR="/opt/aurex-platform/launchpad"
HEALTH_ENDPOINT="http://$SERVER_HOST/health"
API_ENDPOINT="http://$SERVER_HOST/api/v1/health/detailed"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check HTTP endpoint
check_http_endpoint() {
    local endpoint=$1
    local description=$2
    
    log_info "Checking $description..."
    
    if response=$(curl -s -w "%{http_code}" "$endpoint" 2>/dev/null); then
        http_code="${response: -3}"
        body="${response%???}"
        
        if [[ $http_code -eq 200 ]]; then
            log_success "$description is healthy (HTTP $http_code)"
            return 0
        else
            log_error "$description returned HTTP $http_code"
            return 1
        fi
    else
        log_error "$description is unreachable"
        return 1
    fi
}

# Check service status on remote server
check_service_status() {
    log_info "Checking service status on remote server..."
    
    if ssh -p $SERVER_PORT -o ConnectTimeout=10 $APP_USER@$SERVER_HOST "
        sudo systemctl is-active --quiet aurex-launchpad.service
    " >/dev/null 2>&1; then
        log_success "Aurex Launchpad service is running"
        
        # Get detailed service status
        ssh -p $SERVER_PORT $APP_USER@$SERVER_HOST "
            echo 'Service Status:'
            sudo systemctl status aurex-launchpad.service --no-pager -l
            echo
            echo 'Recent Logs:'
            sudo journalctl -u aurex-launchpad.service --no-pager -n 10
        "
        return 0
    else
        log_error "Aurex Launchpad service is not running"
        return 1
    fi
}

# Check database connectivity
check_database() {
    log_info "Checking database connectivity..."
    
    if ssh -p $SERVER_PORT $APP_USER@$SERVER_HOST "
        cd $REMOTE_DIR/app
        source venv/bin/activate
        python -c '
from sqlalchemy import create_engine, text
from config import get_settings
import sys

try:
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text(\"SELECT 1\"))
        print(\"Database connection successful\")
        sys.exit(0)
except Exception as e:
    print(f\"Database connection failed: {e}\")
    sys.exit(1)
'
    " >/dev/null 2>&1; then
        log_success "Database connection is healthy"
        return 0
    else
        log_error "Database connection failed"
        return 1
    fi
}

# Check nginx status
check_nginx() {
    log_info "Checking Nginx status..."
    
    if ssh -p $SERVER_PORT $APP_USER@$SERVER_HOST "
        sudo systemctl is-active --quiet nginx
    " >/dev/null 2>&1; then
        log_success "Nginx is running"
        
        # Check nginx configuration
        if ssh -p $SERVER_PORT $APP_USER@$SERVER_HOST "
            sudo nginx -t
        " >/dev/null 2>&1; then
            log_success "Nginx configuration is valid"
            return 0
        else
            log_error "Nginx configuration is invalid"
            return 1
        fi
    else
        log_error "Nginx is not running"
        return 1
    fi
}

# Check system resources
check_system_resources() {
    log_info "Checking system resources..."
    
    ssh -p $SERVER_PORT $APP_USER@$SERVER_HOST "
        echo 'System Resource Usage:'
        echo '======================'
        
        # CPU usage
        cpu_usage=\$(top -bn1 | grep load | awk '{printf \"%.2f\", \$(NF-2)}')
        echo \"CPU Load Average: \$cpu_usage\"
        
        # Memory usage
        memory_info=\$(free -h | awk 'NR==2{printf \"Memory: %s/%s (%.2f%%)\", \$3, \$2, \$3*100/\$2}')
        echo \"\$memory_info\"
        
        # Disk usage
        disk_usage=\$(df -h / | awk 'NR==2{printf \"Disk: %s/%s (%s)\", \$3, \$2, \$5}')
        echo \"\$disk_usage\"
        
        # Check if application process is running
        app_processes=\$(pgrep -f 'gunicorn.*aurex-launchpad' | wc -l)
        echo \"Application Processes: \$app_processes\"
        
        # Check port 8001
        if netstat -tlnp | grep ':8001 ' >/dev/null; then
            echo 'Port 8001: LISTENING'
        else
            echo 'Port 8001: NOT LISTENING'
        fi
    "
}

# Check application logs for errors
check_logs() {
    log_info "Checking recent logs for errors..."
    
    ssh -p $SERVER_PORT $APP_USER@$SERVER_HOST "
        echo 'Recent Application Logs:'
        echo '========================'
        
        # Check systemd logs for errors
        error_count=\$(sudo journalctl -u aurex-launchpad.service --since '1 hour ago' --no-pager | grep -i error | wc -l)
        if [ \$error_count -gt 0 ]; then
            echo \"⚠️  Found \$error_count errors in the last hour:\"
            sudo journalctl -u aurex-launchpad.service --since '1 hour ago' --no-pager | grep -i error | tail -5
        else
            echo '✅ No errors found in recent logs'
        fi
        
        # Check nginx error logs
        if [ -f /var/log/nginx/error.log ]; then
            nginx_errors=\$(sudo tail -100 /var/log/nginx/error.log | grep \"\$(date +'%Y/%m/%d')\" | wc -l)
            if [ \$nginx_errors -gt 0 ]; then
                echo \"⚠️  Found \$nginx_errors nginx errors today\"
            else
                echo '✅ No nginx errors today'
            fi
        fi
    "
}

# Comprehensive health check
comprehensive_health_check() {
    local failed_checks=0
    
    echo "🏥 AUREX LAUNCHPAD™ HEALTH CHECK"
    echo "================================"
    echo "Server: $SERVER_HOST"
    echo "Timestamp: $(date)"
    echo
    
    # Basic HTTP health check
    if ! check_http_endpoint "$HEALTH_ENDPOINT" "Basic health endpoint"; then
        ((failed_checks++))
    fi
    echo
    
    # Detailed API health check
    if ! check_http_endpoint "$API_ENDPOINT" "Detailed API health endpoint"; then
        ((failed_checks++))
    fi
    echo
    
    # Service status check
    if ! check_service_status; then
        ((failed_checks++))
    fi
    echo
    
    # Database check
    if ! check_database; then
        ((failed_checks++))
    fi
    echo
    
    # Nginx check
    if ! check_nginx; then
        ((failed_checks++))
    fi
    echo
    
    # System resources
    check_system_resources
    echo
    
    # Log analysis
    check_logs
    echo
    
    # Summary
    echo "HEALTH CHECK SUMMARY"
    echo "===================="
    if [ $failed_checks -eq 0 ]; then
        log_success "All health checks passed! ✅"
        echo "🎉 Aurex Launchpad is running smoothly"
        return 0
    else
        log_error "$failed_checks health check(s) failed! ❌"
        echo "🚨 Aurex Launchpad needs attention"
        return 1
    fi
}

# Quick health check (just HTTP endpoints)
quick_health_check() {
    log_info "Quick health check..."
    
    if check_http_endpoint "$HEALTH_ENDPOINT" "Application"; then
        log_success "✅ Application is healthy"
        return 0
    else
        log_error "❌ Application health check failed"
        return 1
    fi
}

# Monitor mode (continuous checking)
monitor_mode() {
    local interval=${1:-30}
    
    log_info "Starting monitoring mode (checking every ${interval}s)..."
    log_info "Press Ctrl+C to stop"
    
    while true; do
        echo "$(date): Checking health..."
        if quick_health_check; then
            echo "✅ OK"
        else
            echo "❌ ISSUE DETECTED"
            # Could send alerts here
        fi
        sleep $interval
    done
}

# Usage information
usage() {
    echo "Usage: $0 [quick|full|monitor|logs]"
    echo
    echo "Commands:"
    echo "  quick    - Quick HTTP health check (default)"
    echo "  full     - Comprehensive health check"
    echo "  monitor  - Continuous monitoring mode"
    echo "  logs     - Show recent application logs"
    echo
    echo "Examples:"
    echo "  $0              # Quick health check"
    echo "  $0 full         # Full health check"
    echo "  $0 monitor 60   # Monitor every 60 seconds"
    echo
    exit 1
}

# Show recent logs
show_logs() {
    log_info "Fetching recent application logs..."
    
    ssh -p $SERVER_PORT $APP_USER@$SERVER_HOST "
        echo 'Recent Application Logs (last 50 lines):'
        echo '========================================'
        sudo journalctl -u aurex-launchpad.service --no-pager -n 50
        
        echo
        echo 'Nginx Access Logs (last 20 lines):'
        echo '==================================='
        sudo tail -20 /var/log/nginx/access.log 2>/dev/null || echo 'No nginx access logs found'
        
        echo
        echo 'Nginx Error Logs (last 10 lines):'
        echo '=================================='
        sudo tail -10 /var/log/nginx/error.log 2>/dev/null || echo 'No nginx error logs found'
    "
}

# Main script logic
case "${1:-quick}" in
    quick)
        quick_health_check
        ;;
    full)
        comprehensive_health_check
        ;;
    monitor)
        monitor_mode "${2:-30}"
        ;;
    logs)
        show_logs
        ;;
    *)
        usage
        ;;
esac