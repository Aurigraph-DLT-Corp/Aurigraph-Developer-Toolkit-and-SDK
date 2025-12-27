# Aurigraph V11 Monitoring Stack

Comprehensive monitoring and logging infrastructure for Aurigraph V11 using Prometheus, Grafana, ELK Stack, and Kubernetes.

## Components

### Prometheus + Grafana
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and alerting dashboards
- **Retention**: 30 days
- **Scrape Interval**: 15 seconds

### ELK Stack
- **Elasticsearch**: Centralized log storage (8GB capacity)
- **Logstash**: Log aggregation and processing
- **Kibana**: Log visualization and analysis
- **Filebeat**: Docker container log collection
- **Retention**: 30 days

### Exporters
- PostgreSQL Exporter
- Redis Exporter
- Node Exporter
- Custom application metrics

## Deployment

### Development Environment
```bash
# Start monitoring stack
docker-compose -f infra/docker/docker-compose.dev.yml up -d

# Access services
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000
# Kibana: http://localhost:5601
```

### Production Environment
```bash
# Start with self-hosted runners
# Kubernetes deployment via CI/CD pipeline
kubectl apply -f infra/kubernetes/

# Verify deployment
kubectl get deployments -n aurigraph
```

## Metrics

### Key Metrics Tracked
- **Throughput**: Transactions per second (TPS)
- **Latency**: P50, P95, P99 response times
- **Error Rate**: HTTP 5xx errors and exceptions
- **Resource Usage**: CPU, Memory, Disk I/O
- **Database**: Query time, connection count
- **Cache**: Hit rate, eviction rate
- **Network**: Bandwidth, packet loss

### Alert Rules
- TPS drops below 100K
- Error rate exceeds 1%
- P99 latency > 1 second
- CPU usage > 80%
- Memory usage > 85%
- Disk usage > 90%
- Database connections > 90% of pool

## Dashboards

### Grafana Dashboards
1. **System Overview**: Overall health metrics
2. **Application Performance**: Request metrics
3. **Database**: PostgreSQL metrics
4. **Cache**: Redis metrics
5. **Infrastructure**: Kubernetes resources

### Kibana Logs
1. **Application Logs**: Structured JSON logs
2. **System Logs**: syslog and kernel logs
3. **Error Analysis**: Error rate trends
4. **Audit Logs**: Access and security events

## Maintenance

### Backup
- Daily Elasticsearch snapshots to S3
- Prometheus WAL backup hourly
- 30-day retention policy

### Scaling
- Elasticsearch cluster: Add 3+ nodes
- Prometheus: Implement federation
- Grafana: Use high availability setup

## Troubleshooting

### Elasticsearch Issues
```bash
# Check cluster health
curl http://localhost:9200/_cluster/health

# View indices
curl http://localhost:9200/_cat/indices

# Delete old indices
curl -X DELETE http://localhost:9200/aurigraph-logs-2024.01.*
```

### Prometheus Issues
```bash
# Check scrape targets
curl http://localhost:9090/api/v1/targets

# Reload configuration
curl -X POST http://localhost:9090/-/reload
```

### Grafana Issues
```bash
# Check data source connectivity
# Settings > Data Sources > Test
# Verify Prometheus URL and credentials
```

## Performance Targets

- **Metrics Latency**: < 1 second
- **Log Ingestion**: < 5 second latency
- **Dashboard Load**: < 2 seconds
- **Query Response**: < 5 seconds
- **Alert Latency**: < 1 minute

## Security

- All passwords stored in Kubernetes Secrets
- Elasticsearch X-Pack: Disabled in dev, enabled in prod
- Prometheus: Basic auth in production
- Grafana: OAuth2 integration
- Kibana: OAuth2 integration
- Network policies: Restrict access to monitoring namespace

## Cost Optimization

- Archive logs older than 90 days to S3
- Aggregate metrics hourly after 7 days
- Delete Elasticsearch snapshots after 30 days
- Use spot instances for non-critical nodes
- Monitor storage costs monthly

## Documentation

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Elasticsearch Guide](https://www.elastic.co/guide/en/elasticsearch/reference/current/)
- [Kubernetes Monitoring](https://kubernetes.io/docs/tasks/debug-application-cluster/resource-metrics-pipeline/)
