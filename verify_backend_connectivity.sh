#!/bin/bash

# Verify V11 Backend Connectivity
# Port: 9004

echo "Testing V11 Backend Connectivity on Port 9004..."

# 1. Check Health Endpoint
echo "1. Checking Health Endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9004/q/health)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ Health Check Passed (HTTP 200)"
else
    echo "❌ Health Check Failed (HTTP $HTTP_CODE)"
    echo "   Ensure the backend is running: ./quick-local-deploy.sh start"
    exit 1
fi

# 2. Check Ready Endpoint
echo "2. Checking Ready Endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9004/q/health/ready)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ Ready Check Passed (HTTP 200)"
else
    echo "❌ Ready Check Failed (HTTP $HTTP_CODE)"
    exit 1
fi

# 3. Check Stats Endpoint (if available without auth, or just check 401/403 is better than connection refused)
echo "3. Checking API Stats Endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9004/api/v11/stats)

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ]; then
    echo "✅ API Endpoint Reachable (HTTP $HTTP_CODE)"
else
    echo "❌ API Endpoint Unreachable (HTTP $HTTP_CODE)"
    exit 1
fi

echo "🎉 All Connectivity Tests Passed!"
exit 0
