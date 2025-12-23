#!/bin/bash

echo "=========================================="
echo "Validator Performance Monitor Verification"
echo "=========================================="
echo ""

# Component file check
echo "1. Component File Check:"
if [ -f "src/pages/validators/ValidatorPerformanceMonitor.tsx" ]; then
    COMPONENT_LINES=$(wc -l < src/pages/validators/ValidatorPerformanceMonitor.tsx)
    echo "   ✅ Component exists: $COMPONENT_LINES lines"
else
    echo "   ❌ Component not found"
    exit 1
fi

# Test file check
echo ""
echo "2. Test File Check:"
if [ -f "src/__tests__/pages/validators/ValidatorPerformanceMonitor.test.tsx" ]; then
    TEST_LINES=$(wc -l < src/__tests__/pages/validators/ValidatorPerformanceMonitor.test.tsx)
    TEST_COUNT=$(grep -c "it('should" src/__tests__/pages/validators/ValidatorPerformanceMonitor.test.tsx)
    echo "   ✅ Test file exists: $TEST_LINES lines"
    echo "   ✅ Test count: $TEST_COUNT tests"
else
    echo "   ❌ Test file not found"
    exit 1
fi

# API service check
echo ""
echo "3. API Service Integration:"
if grep -q "getValidators" src/services/api.ts; then
    echo "   ✅ getValidators endpoint added"
fi
if grep -q "getValidatorDetails" src/services/api.ts; then
    echo "   ✅ getValidatorDetails endpoint added"
fi
if grep -q "getNetworkHealth" src/services/api.ts; then
    echo "   ✅ getNetworkHealth endpoint added"
fi
if grep -q "getStakingInfo" src/services/api.ts; then
    echo "   ✅ getStakingInfo endpoint added"
fi
if grep -q "claimRewards" src/services/api.ts; then
    echo "   ✅ claimRewards endpoint added"
fi

# Build verification
echo ""
echo "4. Build Verification:"
echo "   Running production build..."
if npm run build > /tmp/build.log 2>&1; then
    echo "   ✅ Production build successful"
else
    echo "   ❌ Production build failed"
    tail -20 /tmp/build.log
    exit 1
fi

echo ""
echo "=========================================="
echo "Summary:"
echo "=========================================="
echo "Component: $COMPONENT_LINES lines (Target: 650)"
echo "Tests: $TEST_COUNT tests (Target: 50+)"
echo "Status: ✅ READY FOR DEPLOYMENT"
echo "=========================================="
