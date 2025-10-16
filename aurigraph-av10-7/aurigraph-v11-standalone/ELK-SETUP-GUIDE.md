# ELK Stack Setup Guide for Aurigraph V11

## Overview

This guide provides comprehensive instructions for setting up the ELK (Elasticsearch, Logstash, Kibana) stack for Aurigraph DLT V11 logging and monitoring.

**Components:**
- **Elasticsearch 8.11.3**: Log storage and indexing
- **Logstash 8.11.3**: Log processing and enrichment
- **Kibana 8.11.3**: Visualization and dashboards
- **Filebeat 8.11.3**: Log shipping (optional)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Setup (Docker)](#development-setup-docker)
3. [Production Setup (Bare Metal)](#production-setup-bare-metal)
4. [Configuration](#configuration)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)
7. [Maintenance](#maintenance)

---

## Prerequisites

### Development Environment
- Docker 20.10+
- Docker Compose 2.0+
- 8GB RAM minimum (16GB recommended)
- 50GB disk space

### Production Environment (dlt.aurigraph.io)
- Ubuntu 24.04.3 LTS
- 16GB RAM minimum (49GB available on server)
- 100GB disk space for logs
- Java 11+ (for Logstash)
- Root or sudo access

---

## Development Setup (Docker)

### Step 1: Start ELK Stack

From the `aurigraph-v11-standalone` directory:

```bash
# Create necessary directories
mkdir -p logs elk-config

# Start all ELK services
docker-compose -f docker-compose-elk.yml up -d

# View logs
docker-compose -f docker-compose-elk.yml logs -f
```

### Step 2: Wait for Services to Start

Monitor service health:

```bash
# Check Elasticsearch health
curl http://localhost:9200/_cluster/health?pretty

# Check Logstash health
curl http://localhost:9600/_node/stats?pretty

# Check Kibana health
curl http://localhost:5601/api/status
```

Expected startup time:
- Elasticsearch: ~60 seconds
- Logstash: ~90 seconds
- Kibana: ~120 seconds

### Step 3: Start Aurigraph V11

```bash
# Start in dev mode (logs to console and file)
./mvnw quarkus:dev

# Or run the packaged application
java -jar target/quarkus-app/quarkus-run.jar
```

### Step 4: Access Kibana

1. Open browser: http://localhost:5601
2. Navigate to "Discover" to view logs
3. Create index pattern: `aurigraph-logs-*`
4. Import dashboards (see [Dashboard Guide](DASHBOARD-GUIDE.md))

### Step 5: Generate Test Traffic

```bash
# Generate logs with API requests
for i in {1..100}; do
  curl http://localhost:9003/api/v11/health
  curl http://localhost:9003/api/v11/performance?iterations=10000
  sleep 1
done
```

---

## Production Setup (Bare Metal)

### Step 1: Install Elasticsearch

```bash
# Add Elasticsearch GPG key
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo gpg --dearmor -o /usr/share/keyrings/elasticsearch-keyring.gpg

# Add repository
echo "deb [signed-by=/usr/share/keyrings/elasticsearch-keyring.gpg] https://artifacts.elastic.co/packages/8.x/apt stable main" | sudo tee /etc/apt/sources.list.d/elastic-8.x.list

# Install
sudo apt-get update
sudo apt-get install elasticsearch=8.11.3

# Configure
sudo cp elk-config/elasticsearch.yml /etc/elasticsearch/elasticsearch.yml

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable elasticsearch
sudo systemctl start elasticsearch

# Verify
curl http://localhost:9200/_cluster/health?pretty
```

### Step 2: Install Logstash

```bash
# Install Logstash (uses same repository as Elasticsearch)
sudo apt-get install logstash=1:8.11.3-1

# Copy configuration
sudo cp elk-config/logstash.yml /etc/logstash/logstash.yml
sudo cp elk-config/logstash.conf /etc/logstash/conf.d/logstash.conf

# Enable and start
sudo systemctl enable logstash
sudo systemctl start logstash

# Verify
curl http://localhost:9600/_node/stats?pretty
```

### Step 3: Install Kibana

```bash
# Install Kibana
sudo apt-get install kibana=8.11.3

# Copy configuration
sudo cp elk-config/kibana.yml /etc/kibana/kibana.yml

# Enable and start
sudo systemctl enable kibana
sudo systemctl start kibana

# Verify
curl http://localhost:5601/api/status
```

### Step 4: Install Filebeat (Optional)

```bash
# Install Filebeat
sudo apt-get install filebeat=8.11.3

# Copy configuration
sudo cp elk-config/filebeat.yml /etc/filebeat/filebeat.yml

# Enable and start
sudo systemctl enable filebeat
sudo systemctl start filebeat

# Verify
sudo filebeat test output
```

### Step 5: Configure Log Directory

```bash
# Create log directory
sudo mkdir -p /var/log/aurigraph
sudo chown -R aurigraph:aurigraph /var/log/aurigraph
sudo chmod 755 /var/log/aurigraph

# Create backup directory
sudo mkdir -p /var/lib/aurigraph/elk-backups
sudo chown elasticsearch:elasticsearch /var/lib/aurigraph/elk-backups
```

### Step 6: Configure Nginx (if applicable)

```nginx
# /etc/nginx/sites-available/kibana
server {
    listen 80;
    server_name kibana.aurigraph.io;

    location / {
        proxy_pass http://localhost:5601;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site and restart nginx
sudo ln -s /etc/nginx/sites-available/kibana /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Configuration

### Index Lifecycle Management (ILM)

Create ILM policy for automatic log rotation:

```bash
curl -X PUT "http://localhost:9200/_ilm/policy/aurigraph-logs-policy" -H 'Content-Type: application/json' -d'
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_size": "50GB",
            "max_age": "7d"
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "forcemerge": {
            "max_num_segments": 1
          }
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
'
```

### Index Template

Create index template for consistent mappings:

```bash
curl -X PUT "http://localhost:9200/_index_template/aurigraph-logs-template" -H 'Content-Type: application/json' -d'
{
  "index_patterns": ["aurigraph-logs-*"],
  "template": {
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0,
      "index.lifecycle.name": "aurigraph-logs-policy"
    },
    "mappings": {
      "properties": {
        "@timestamp": {"type": "date"},
        "log_level": {"type": "keyword"},
        "log_category": {"type": "keyword"},
        "service_name": {"type": "keyword"},
        "correlation_id": {"type": "keyword"},
        "transaction_id": {"type": "keyword"},
        "duration_ms": {"type": "float"},
        "transactions_per_second": {"type": "float"},
        "http_status": {"type": "integer"},
        "http_method": {"type": "keyword"},
        "http_path": {"type": "keyword"}
      }
    }
  }
}
'
```

---

## Verification

### Check Elasticsearch Indices

```bash
# List all indices
curl http://localhost:9200/_cat/indices?v

# Check index health
curl http://localhost:9200/_cluster/health?pretty

# View index statistics
curl http://localhost:9200/aurigraph-logs-*/_stats?pretty
```

### Check Logstash Pipeline

```bash
# Check pipeline status
curl http://localhost:9600/_node/stats/pipelines?pretty

# View active pipelines
curl http://localhost:9600/_node/pipelines?pretty
```

### Check Kibana Index Patterns

```bash
# List index patterns
curl http://localhost:5601/api/saved_objects/_find?type=index-pattern

# Create index pattern via API
curl -X POST "http://localhost:5601/api/saved_objects/index-pattern/aurigraph-logs" \
  -H 'kbn-xsrf: true' \
  -H 'Content-Type: application/json' \
  -d '{"attributes":{"title":"aurigraph-logs-*","timeFieldName":"@timestamp"}}'
```

### Verify Log Flow

```bash
# Tail application logs
tail -f ./logs/application.log

# Check Elasticsearch for recent logs
curl -X GET "http://localhost:9200/aurigraph-logs-*/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "range": {
      "@timestamp": {
        "gte": "now-1h"
      }
    }
  },
  "size": 10,
  "sort": [{"@timestamp": "desc"}]
}
'
```

---

## Troubleshooting

### Elasticsearch Issues

**Problem**: Elasticsearch won't start
```bash
# Check logs
sudo journalctl -u elasticsearch -f

# Common issues:
# 1. Memory lock not enabled
sudo sysctl -w vm.max_map_count=262144

# 2. Insufficient disk space
df -h /var/lib/elasticsearch

# 3. Port already in use
sudo lsof -i :9200
```

**Problem**: Cluster health is RED
```bash
# Check cluster health
curl http://localhost:9200/_cluster/health?pretty

# Check shard allocation
curl http://localhost:9200/_cat/shards?v

# Force shard allocation
curl -X POST "http://localhost:9200/_cluster/reroute?retry_failed=true"
```

### Logstash Issues

**Problem**: Logstash not processing logs
```bash
# Check Logstash logs
sudo journalctl -u logstash -f

# Test configuration
sudo -u logstash /usr/share/logstash/bin/logstash --config.test_and_exit -f /etc/logstash/conf.d/logstash.conf

# Check pipeline stats
curl http://localhost:9600/_node/stats/pipelines?pretty
```

**Problem**: Logs not reaching Elasticsearch
```bash
# Check Logstash dead letter queue
ls -la /var/lib/logstash/dead_letter_queue/

# Test Elasticsearch connection from Logstash
curl -X POST "http://localhost:9200/_bulk" -H 'Content-Type: application/json' --data-binary @test.json
```

### Kibana Issues

**Problem**: Kibana won't connect to Elasticsearch
```bash
# Check Kibana logs
sudo journalctl -u kibana -f

# Verify Elasticsearch URL in configuration
grep elasticsearch.hosts /etc/kibana/kibana.yml

# Test connection manually
curl http://localhost:9200/
```

**Problem**: Cannot create index pattern
```bash
# Check if indices exist
curl http://localhost:9200/_cat/indices?v

# Refresh index pattern
curl -X POST "http://localhost:5601/api/index_patterns/_refresh_fields/aurigraph-logs-*" -H 'kbn-xsrf: true'
```

### Performance Issues

**Problem**: High CPU usage
```bash
# Check Elasticsearch thread pools
curl http://localhost:9200/_cat/thread_pool?v

# Adjust Elasticsearch heap size
sudo vim /etc/elasticsearch/jvm.options
# Set: -Xms4g -Xmx4g (adjust based on available RAM)

sudo systemctl restart elasticsearch
```

**Problem**: Slow queries
```bash
# Enable slow log
curl -X PUT "http://localhost:9200/aurigraph-logs-*/_settings" -H 'Content-Type: application/json' -d'
{
  "index.search.slowlog.threshold.query.warn": "10s",
  "index.search.slowlog.threshold.query.info": "5s"
}
'

# View slow log
tail -f /var/log/elasticsearch/aurigraph-elk_index_search_slowlog.log
```

---

## Maintenance

### Daily Tasks

```bash
# Check cluster health
curl http://localhost:9200/_cluster/health?pretty

# Check disk usage
curl http://localhost:9200/_cat/allocation?v

# Check index sizes
curl http://localhost:9200/_cat/indices?v&s=store.size:desc
```

### Weekly Tasks

```bash
# Force merge old indices
curl -X POST "http://localhost:9200/aurigraph-logs-*/_forcemerge?max_num_segments=1"

# Clear cache
curl -X POST "http://localhost:9200/_cache/clear"

# Backup Elasticsearch indices
./scripts/backup-elk.sh
```

### Monthly Tasks

```bash
# Update ILM policy if needed
# Review and adjust retention periods
# Archive old logs to cold storage
# Review and optimize index mappings
```

### Backup Script

```bash
#!/bin/bash
# backup-elk.sh

BACKUP_DIR="/var/lib/aurigraph/elk-backups"
DATE=$(date +%Y%m%d-%H%M%S)

# Create snapshot repository (one-time setup)
curl -X PUT "http://localhost:9200/_snapshot/elk_backup" -H 'Content-Type: application/json' -d"
{
  \"type\": \"fs\",
  \"settings\": {
    \"location\": \"$BACKUP_DIR\"
  }
}
"

# Create snapshot
curl -X PUT "http://localhost:9200/_snapshot/elk_backup/snapshot_$DATE?wait_for_completion=true" -H 'Content-Type: application/json' -d'
{
  "indices": "aurigraph-logs-*",
  "ignore_unavailable": true,
  "include_global_state": false
}
'

echo "Backup completed: snapshot_$DATE"
```

### Restore from Backup

```bash
# List available snapshots
curl http://localhost:9200/_snapshot/elk_backup/_all?pretty

# Restore specific snapshot
curl -X POST "http://localhost:9200/_snapshot/elk_backup/snapshot_YYYYMMDD-HHMMSS/_restore" -H 'Content-Type: application/json' -d'
{
  "indices": "aurigraph-logs-*",
  "ignore_unavailable": true,
  "include_global_state": false
}
'
```

---

## Security Hardening (Production)

### Enable X-Pack Security

```bash
# Generate certificates
sudo /usr/share/elasticsearch/bin/elasticsearch-certutil ca
sudo /usr/share/elasticsearch/bin/elasticsearch-certutil cert --ca elastic-stack-ca.p12

# Enable security in elasticsearch.yml
xpack.security.enabled: true
xpack.security.transport.ssl.enabled: true

# Set passwords
sudo /usr/share/elasticsearch/bin/elasticsearch-setup-passwords interactive
```

### Configure Firewall

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 9200/tcp  # Elasticsearch (internal only)
sudo ufw allow 5601/tcp  # Kibana (via nginx)
sudo ufw allow 9003/tcp  # Aurigraph V11

sudo ufw enable
```

---

## Performance Optimization

### Elasticsearch JVM Heap

```bash
# /etc/elasticsearch/jvm.options
# Set to 50% of available RAM (max 31GB)
-Xms8g
-Xmx8g
```

### Logstash Workers

```bash
# /etc/logstash/logstash.yml
pipeline.workers: 8
pipeline.batch.size: 250
pipeline.batch.delay: 50
```

### Kibana Cache

```bash
# /etc/kibana/kibana.yml
server.maxPayload: 10485760
elasticsearch.requestTimeout: 90000
```

---

## Monitoring

### Elasticsearch Monitoring

```bash
# Enable monitoring
curl -X PUT "http://localhost:9200/_cluster/settings" -H 'Content-Type: application/json' -d'
{
  "persistent": {
    "xpack.monitoring.collection.enabled": true
  }
}
'
```

### Alerting (Kibana)

Create alerts in Kibana:
1. Navigate to Stack Management → Alerts and Insights → Rules
2. Create rule for high error rate
3. Configure email/Slack notifications

---

## Additional Resources

- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/8.11/index.html)
- [Logstash Documentation](https://www.elastic.co/guide/en/logstash/8.11/index.html)
- [Kibana Documentation](https://www.elastic.co/guide/en/kibana/8.11/index.html)
- [Aurigraph Logging Best Practices](LOGGING-BEST-PRACTICES.md)
- [Aurigraph Dashboard Guide](DASHBOARD-GUIDE.md)

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues
- JIRA: https://aurigraphdlt.atlassian.net/
- Email: support@aurigraph.io
