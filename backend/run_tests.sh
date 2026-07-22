#!/bin/bash
# Complete test runner script for Phase 1

echo "🧪 ICTIP Phase 1 Test Runner"
echo "============================"
echo ""

# Setup test environment
export TESTING=true
export DATABASE_URL=postgresql://ictip_user:secure_password@postgres:5432/ictip_test

# Run tests with coverage
echo "📊 Running tests with coverage..."
pytest tests/ \
    --cov=. \
    --cov-report=html \
    --cov-report=term \
    --cov-report=xml \
    --maxfail=5 \
    -v \
    -m "not slow"

# Check coverage threshold
echo ""
echo "📈 Checking coverage threshold..."
COVERAGE=$(coverage report | grep TOTAL | awk '{print $4}' | sed 's/%//')
if [ $COVERAGE -ge 90 ]; then
    echo "✅ Coverage ${COVERAGE}% - PASSED (threshold: 90%)"
else
    echo "❌ Coverage ${COVERAGE}% - FAILED (threshold: 90%)"
    exit 1
fi

# Run performance tests
echo ""
echo "⚡ Running performance tests..."
pytest tests/test_performance.py -v

# Run integration tests
echo ""
echo "🔗 Running integration tests..."
pytest tests/test_integration.py -v

# Generate test report
echo ""
echo "📄 Generating test report..."
pytest --html=test-reports/report.html --self-contained-html

echo ""
echo "✅ Phase 1 tests completed successfully!"
echo "📊 Coverage report: coverage/index.html"
echo "📄 Test report: test-reports/report.html"
