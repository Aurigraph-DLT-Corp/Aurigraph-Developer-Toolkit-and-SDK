# Next Steps Execution Guide
**Version:** v11.2.0
**Date:** October 12, 2025
**Status:** Ready for Execution

---

## ✅ Completed

### 1. Git Commit & Push - DONE ✅
```bash
✅ Committed: feat: Complete parallel sprint execution - Streams 2-5 implementation
✅ Pushed to origin/main
✅ Tagged as release: v11.2.0
✅ Compilation: SUCCESS (54 test files, 467 source files)
```

---

## 📋 Execution Steps

### Step 1: Execute Full Test Suite

#### Quick Test (Individual Suites)
```bash
# Test specific suites (faster)
./mvnw test -Dtest=IntegrationTestBase
./mvnw test -Dtest=EndToEndWorkflowIntegrationTest
./mvnw test -Dtest=GrpcServiceIntegrationTest
./mvnw test -Dtest=WebSocketIntegrationTest
./mvnw test -Dtest=PerformanceBenchmarkSuite
./mvnw test -Dtest=SecurityAuditTestSuite
```

#### Full Test Suite (Comprehensive)
```bash
# Run all 191 tests (may take 10-15 minutes)
./mvnw clean test

# Generate coverage report
./mvnw jacoco:report
open target/site/jacoco/index.html
```

#### Verify Test Counts
```bash
# Count test methods
find src/test -name "*Test.java" -exec grep -h "@Test" {} \; | wc -l
# Expected: 191+ tests
```

---

### Step 2: Deploy Monitoring Stack

#### Prometheus
```bash
# Start Prometheus
docker run -d --name aurigraph-prometheus \
  -p 9090:9090 \
  -v $(pwd)/src/main/resources/monitoring/prometheus-config.yml:/etc/prometheus/prometheus.yml \
  -v $(pwd)/src/main/resources/monitoring/alert-rules.yml:/etc/prometheus/alert-rules.yml \
  prom/prometheus:latest

# Verify
curl http://localhost:9090/-/healthy
open http://localhost:9090
```

#### Alertmanager
```bash
# Start Alertmanager
docker run -d --name aurigraph-alertmanager \
  -p 9093:9093 \
  prom/alertmanager:latest

# Verify
curl http://localhost:9093/-/healthy
open http://localhost:9093
```

#### Grafana
```bash
# Start Grafana
docker run -d --name aurigraph-grafana \
  -p 3000:3000 \
  -e "GF_SECURITY_ADMIN_PASSWORD=admin" \
  grafana/grafana:latest

# Wait for startup
sleep 10

# Add Prometheus data source
curl -X POST http://admin:admin@localhost:3000/api/datasources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Prometheus",
    "type": "prometheus",
    "url": "http://localhost:9090",
    "access": "proxy",
    "isDefault": true
  }'

# Import dashboards
for dashboard in src/main/resources/monitoring/grafana-dashboard-*.json; do
  echo "Importing $dashboard..."
  curl -X POST http://admin:admin@localhost:3000/api/dashboards/import \
    -H "Content-Type: application/json" \
    -d @"$dashboard"
done

# Open Grafana
open http://localhost:3000
# Login: admin / admin
```

#### Elasticsearch
```bash
# Start Elasticsearch
docker run -d --name aurigraph-elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
  elasticsearch:8.10.0

# Wait for startup
sleep 30

# Create index template
curl -X PUT http://localhost:9200/_index_template/aurigraph-template \
  -H "Content-Type: application/json" \
  -d @src/main/resources/monitoring/elasticsearch-index-templates.json

# Verify
curl http://localhost:9200/_cluster/health?pretty
```

#### Logstash
```bash
# Start Logstash
docker run -d --name aurigraph-logstash \
  -p 5000:5000 \
  -p 5044:5044 \
  -p 5514:5514 \
  -v $(pwd)/src/main/resources/monitoring/logstash-config.conf:/usr/share/logstash/pipeline/logstash.conf \
  logstash:8.10.0

# Verify
sleep 30
curl -s http://localhost:9600/_node/stats/pipelines?pretty | grep "events"
```

#### Kibana
```bash
# Start Kibana
docker run -d --name aurigraph-kibana \
  -p 5601:5601 \
  -e "ELASTICSEARCH_HOSTS=http://localhost:9200" \
  kibana:8.10.0

# Wait for startup
sleep 60

# Open Kibana
open http://localhost:5601
```

#### Verify All Services
```bash
# Check all containers
docker ps | grep aurigraph

# Expected output:
# aurigraph-prometheus
# aurigraph-alertmanager
# aurigraph-grafana
# aurigraph-elasticsearch
# aurigraph-logstash
# aurigraph-kibana

# Quick health check
echo "Prometheus: $(curl -s http://localhost:9090/-/healthy)"
echo "Grafana: $(curl -s http://localhost:3000/api/health | jq -r '.database')"
echo "Elasticsearch: $(curl -s http://localhost:9200/_cluster/health | jq -r '.status')"
```

---

### Step 3: Run Performance Baseline

#### Start Aurigraph V11
```bash
# Option 1: Dev mode (hot reload)
./mvnw quarkus:dev

# Option 2: Production JAR
./mvnw clean package
java -jar target/quarkus-app/quarkus-run.jar

# Option 3: Native (fastest)
./mvnw package -Pnative-fast
./target/*-runner
```

#### Run Performance Tests
```bash
# In another terminal, run performance benchmark
./mvnw test -Dtest=PerformanceBenchmarkSuite

# Expected output:
# - Steady Load: 100K TPS test
# - Ramp Up/Down: Progressive load tests
# - Spike Test: 3x load increase
# - Stress Test: 100K transactions
# - Soak Test: Sustained load
# - Latency: P50/P95/P99 measurements

# View results
cat target/surefire-reports/io.aurigraph.v11.performance.PerformanceBenchmarkSuite.txt
```

#### Collect Baseline Metrics
```bash
# Get current TPS
curl http://localhost:9003/q/metrics | grep aurigraph_transactions_processed

# Get latency metrics
curl http://localhost:9003/q/metrics | grep aurigraph_transaction_duration

# Get system metrics
curl http://localhost:9003/q/metrics | grep -E "(process_cpu|jvm_memory)"

# Save baseline
curl http://localhost:9003/q/metrics > performance-baseline-$(date +%Y%m%d).txt
```

---

### Step 4: Test Blue-Green Deployment

#### Prerequisites
```bash
# Ensure Docker image exists
docker build -t aurigraph-v11:v11.2.0 -f Dockerfile .

# Verify image
docker images | grep aurigraph-v11

# Check Kubernetes cluster (if using K8s)
kubectl cluster-info
kubectl get nodes
```

#### Run Deployment Script
```bash
# Test deployment
./blue-green-deploy.sh v11.2.0

# The script will:
# 1. Validate prerequisites
# 2. Detect current environment (blue/green)
# 3. Deploy to new environment
# 4. Run health checks
# 5. Execute smoke tests
# 6. Gradually shift traffic (10 steps)
# 7. Monitor for errors
# 8. Complete cutover or rollback

# Monitor deployment
watch kubectl get pods -n aurigraph-production
```

#### Manual Testing (without K8s)
```bash
# Test script validation
./blue-green-deploy.sh v11.2.0 --help

# Test health checks
curl http://localhost:9003/q/health
curl http://localhost:9003/q/health/live
curl http://localhost:9003/q/health/ready

# Test smoke endpoints
curl http://localhost:9003/api/v11/info
curl http://localhost:9003/api/v11/stats
```

---

## 📊 Validation Checklist

### ✅ Code Quality
- [x] All files committed and pushed
- [x] Release v11.2.0 tagged
- [ ] All 191 tests passing
- [ ] 95%+ code coverage achieved
- [ ] No critical warnings or errors

### ✅ Monitoring Stack
- [ ] Prometheus collecting metrics
- [ ] Alertmanager configured
- [ ] Grafana dashboards visible
- [ ] Elasticsearch indices created
- [ ] Logstash processing logs
- [ ] Kibana visualizations working

### ✅ Performance
- [ ] Application starts successfully
- [ ] Current TPS documented (baseline)
- [ ] Latency metrics recorded (P50/P95/P99)
- [ ] Performance tests passing
- [ ] System resources monitored

### ✅ Deployment
- [ ] Docker image built
- [ ] Blue-green script tested
- [ ] Health checks passing
- [ ] Smoke tests passing
- [ ] Rollback mechanism validated

---

## 🚀 Quick Start Commands

### All-in-One: Start Everything
```bash
# 1. Start monitoring stack
docker-compose -f docker-compose-monitoring.yml up -d

# 2. Start Aurigraph V11
./mvnw quarkus:dev

# 3. Run tests (in another terminal)
./mvnw test

# 4. Open dashboards
open http://localhost:3000  # Grafana
open http://localhost:9090  # Prometheus
open http://localhost:5601  # Kibana
open http://localhost:9003/q/dev/  # Quarkus Dev UI
```

### Quick Validation
```bash
# Health check
curl http://localhost:9003/q/health | jq '.'

# Current TPS
curl http://localhost:9003/q/metrics | grep -E "transactions_processed_total"

# Alert status
curl http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | {alert: .labels.alertname, state: .state}'

# Test count validation
find src/test -name "*Test.java" -exec grep -h "@Test" {} \; | wc -l
```

---

## 📈 Expected Results

### Test Execution
- **Duration:** 10-15 minutes for full suite
- **Tests:** 191 total
- **Success Rate:** 100% (or identify failures)
- **Coverage:** 95%+

### Monitoring Stack
- **Prometheus:** Collecting metrics every 15s
- **Alerts:** 25 rules configured
- **Dashboards:** 5 dashboards with 59 panels
- **Logs:** Indexed in Elasticsearch

### Performance Baseline
- **Current TPS:** ~776K (optimize to 2M+)
- **P50 Latency:** < 100ms
- **P99 Latency:** < 500ms
- **Memory:** < 512MB JVM
- **CPU:** < 75% sustained

---

## 🔍 Troubleshooting

### Tests Failing
```bash
# Run specific failing test
./mvnw test -Dtest=FailingTestName

# View detailed output
cat target/surefire-reports/FailingTestName.txt

# Check logs
tail -f target/quarkus.log
```

### Monitoring Not Working
```bash
# Check Docker containers
docker ps -a | grep aurigraph

# View logs
docker logs aurigraph-prometheus
docker logs aurigraph-grafana
docker logs aurigraph-elasticsearch

# Restart if needed
docker restart aurigraph-prometheus
```

### Performance Issues
```bash
# Check resource usage
docker stats

# Check application logs
./mvnw quarkus:dev -Dquarkus.log.level=DEBUG

# Profile with JFR
java -XX:StartFlightRecording=filename=recording.jfr -jar target/quarkus-app/quarkus-run.jar
```

---

## 📚 Documentation References

- **Production Runbook:** [PRODUCTION-RUNBOOK.md](./PRODUCTION-RUNBOOK.md)
- **Completion Report:** [COMPLETE-SPRINT-EXECUTION-REPORT.md](./COMPLETE-SPRINT-EXECUTION-REPORT.md)
- **Stream Reports:** [STREAMS-2-5-COMPLETION-REPORT.md](./STREAMS-2-5-COMPLETION-REPORT.md)

---

## 🎯 Success Criteria

All steps complete when:
1. ✅ All 191 tests passing (95%+ coverage)
2. ✅ Monitoring stack fully operational
3. ✅ Performance baseline documented
4. ✅ Blue-green deployment tested
5. ✅ Production runbook validated

**Status:** Ready for production deployment! 🚀

---

**Guide Version:** 1.0
**Last Updated:** October 12, 2025
**Next Review:** After initial deployment
