# Kibana Dashboard Guide for Aurigraph V11

## Overview

This guide explains how to use and customize Kibana dashboards for monitoring Aurigraph V11 blockchain platform.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Pre-built Dashboards](#pre-built-dashboards)
3. [Creating Custom Visualizations](#creating-custom-visualizations)
4. [Query Examples](#query-examples)
5. [Alerting](#alerting)
6. [Performance Tips](#performance-tips)

---

## Getting Started

### Accessing Kibana

1. **Development**: http://localhost:5601
2. **Production**: http://kibana.aurigraph.io (or configured domain)

### First-Time Setup

1. Navigate to **Stack Management** → **Index Patterns**
2. Click **Create index pattern**
3. Enter pattern: `aurigraph-logs-*`
4. Select time field: `@timestamp`
5. Click **Create index pattern**

### Import Pre-built Dashboards

1. Navigate to **Stack Management** → **Saved Objects**
2. Click **Import**
3. Select file: `elk-config/kibana-dashboards/*.ndjson`
4. Click **Import**

---

## Pre-built Dashboards

### 1. Application Overview Dashboard

**Purpose**: High-level view of application health and performance

**Key Metrics**:
- Total requests per second
- Error rate (percentage)
- Average response time
- Service uptime

**Visualizations**:
- **Requests Over Time**: Line chart showing HTTP requests/sec
- **Error Rate**: Bar chart showing errors by type
- **Response Time Distribution**: Histogram of response times
- **Top Endpoints**: Table of most-called APIs

**KQL Query**:
```
service_name:"aurigraph-v11" and log_category:HTTP
```

**How to Use**:
1. Select time range (last 15m, 1h, 24h, etc.)
2. Look for spikes in error rate
3. Identify slow endpoints (>1s response time)
4. Monitor request patterns

### 2. Transaction Monitoring Dashboard

**Purpose**: Monitor blockchain transaction processing

**Key Metrics**:
- Transactions per second (TPS)
- Transaction success rate
- Average processing time
- Failed transaction count

**Visualizations**:
- **TPS Over Time**: Area chart showing throughput
- **Transaction Status**: Pie chart (SUBMITTED, CONFIRMED, FAILED)
- **Processing Time**: Line chart of average duration
- **Failed Transactions**: Data table with details

**KQL Query**:
```
log_category:TRANSACTION
```

**How to Use**:
1. Monitor TPS to ensure 2M+ target
2. Investigate failed transactions
3. Track transaction finality time
4. Identify bottlenecks

### 3. Error Analysis Dashboard

**Purpose**: Detailed error tracking and analysis

**Key Metrics**:
- Error count by severity
- Error rate trend
- Most common errors
- Error distribution by service

**Visualizations**:
- **Errors by Type**: Bar chart
- **Error Trend**: Line chart over time
- **Error Messages**: Tag cloud
- **Stack Traces**: Data table

**KQL Query**:
```
log_level:ERROR or log_level:WARN
```

**How to Use**:
1. Identify recurring errors
2. Drill down into stack traces
3. Filter by correlation ID for request tracing
4. Set up alerts for critical errors

### 4. Security Monitoring Dashboard

**Purpose**: Track security events and suspicious activity

**Key Metrics**:
- Failed authentication attempts
- Suspicious activity count
- Access patterns
- Security event types

**Visualizations**:
- **Failed Logins**: Time series chart
- **Security Events**: Bar chart by type
- **Geographic Distribution**: Map of access locations
- **User Activity**: Table of user actions

**KQL Query**:
```
log_category:SECURITY
```

**How to Use**:
1. Monitor failed login attempts
2. Detect brute force attacks
3. Track unusual access patterns
4. Audit user actions

### 5. Performance Metrics Dashboard

**Purpose**: System performance and resource utilization

**Key Metrics**:
- CPU usage percentage
- Memory usage
- GC pause time
- Thread pool utilization

**Visualizations**:
- **CPU Usage**: Gauge chart
- **Memory**: Area chart
- **GC Activity**: Bar chart
- **Thread Pools**: Heat map

**KQL Query**:
```
log_category:PERFORMANCE
```

**How to Use**:
1. Monitor resource utilization
2. Identify performance degradation
3. Track GC impact
4. Optimize thread allocation

### 6. Consensus Performance Dashboard

**Purpose**: Monitor HyperRAFT++ consensus operations

**Key Metrics**:
- Consensus latency
- Leader elections
- Commit index progression
- Node states

**Visualizations**:
- **Consensus Latency**: Line chart
- **Leader Elections**: Timeline
- **Commit Index**: Area chart
- **Node States**: Status indicator

**KQL Query**:
```
log_category:CONSENSUS
```

**How to Use**:
1. Ensure consensus is healthy
2. Monitor leader stability
3. Track commit progression
4. Detect network partitions

---

## Creating Custom Visualizations

### Step-by-Step: Create a Visualization

#### Example: Average TPS by Hour

1. Navigate to **Visualize Library**
2. Click **Create visualization**
3. Select **Lens** (recommended) or **TSVB**
4. Configure:
   - **Index pattern**: aurigraph-logs-*
   - **Metric**: Average of `transactions_per_second`
   - **Time bucket**: 1 hour
   - **Filter**: `log_category:PERFORMANCE`

5. Customize:
   - Add threshold line at 2M TPS target
   - Change colors (green for good, red for poor)
   - Add legend and labels

6. Click **Save** and name it "TPS by Hour"

### Visualization Types

**Line Chart**
- Use for: Time-series data (TPS, response time, errors)
- Best for: Trends over time

**Bar Chart**
- Use for: Comparing categories (errors by type, endpoints)
- Best for: Top N analysis

**Pie/Donut Chart**
- Use for: Proportions (status distribution, log levels)
- Best for: Quick overview of composition

**Data Table**
- Use for: Detailed records (error logs, transactions)
- Best for: Drill-down analysis

**Gauge**
- Use for: Single metric (current TPS, CPU usage)
- Best for: Real-time monitoring

**Heat Map**
- Use for: Intensity across dimensions (errors by hour/day)
- Best for: Pattern identification

---

## Query Examples

### Kibana Query Language (KQL)

**Basic Queries**:

```kql
# All errors
log_level:ERROR

# Specific transaction
transaction_id:"tx_12345"

# HTTP 5xx errors
http_status >= 500

# Slow requests (>1s)
duration_ms > 1000

# Specific service
service_name:"aurigraph-v11"

# Time range (last 15 minutes)
@timestamp >= now-15m
```

**Advanced Queries**:

```kql
# Failed transactions with high amounts
log_category:TRANSACTION and status:FAILED and amount > 10000

# Security events from specific IP
log_category:SECURITY and remoteAddr:"192.168.1.100"

# Errors excluding specific types
log_level:ERROR and not exceptionClass:"java.util.concurrent.TimeoutException"

# Performance issues (high TPS but slow response)
transactions_per_second > 1000000 and duration_ms > 100
```

### Elasticsearch Query DSL

**Aggregation Queries**:

```json
POST /aurigraph-logs-*/_search
{
  "size": 0,
  "query": {
    "range": {
      "@timestamp": {
        "gte": "now-1h"
      }
    }
  },
  "aggs": {
    "tps_stats": {
      "stats": {
        "field": "transactions_per_second"
      }
    },
    "errors_by_type": {
      "terms": {
        "field": "exceptionClass",
        "size": 10
      }
    }
  }
}
```

**Complex Filter**:

```json
POST /aurigraph-logs-*/_search
{
  "query": {
    "bool": {
      "must": [
        {"term": {"log_category": "TRANSACTION"}},
        {"range": {"amount": {"gte": 1000}}}
      ],
      "filter": [
        {"range": {"@timestamp": {"gte": "now-1h"}}}
      ],
      "must_not": [
        {"term": {"status": "FAILED"}}
      ]
    }
  }
}
```

---

## Alerting

### Create Alerts in Kibana

#### Example: High Error Rate Alert

1. Navigate to **Stack Management** → **Rules and Connectors**
2. Click **Create rule**
3. Configure:
   - **Name**: High Error Rate
   - **Rule type**: Elasticsearch query
   - **Index**: aurigraph-logs-*
   - **Query**: `log_level:ERROR`
   - **Condition**: Count > 100 in last 5 minutes
   - **Actions**: Send email/Slack message

4. Test and save

### Common Alert Scenarios

**1. Error Rate Spike**
- Condition: Error count > 100 in 5 minutes
- Action: Email to ops team

**2. Low TPS**
- Condition: Average TPS < 1,000,000 for 10 minutes
- Action: Slack alert to performance team

**3. Failed Authentication**
- Condition: Failed login attempts > 10 from same IP
- Action: Security team notification

**4. Service Down**
- Condition: No logs received for 5 minutes
- Action: Page on-call engineer

**5. High Latency**
- Condition: Average response time > 1s for 10 minutes
- Action: Slack alert

### Alert Actions

Supported actions:
- **Email**: SMTP configuration required
- **Slack**: Webhook URL required
- **PagerDuty**: Integration key required
- **Webhook**: Custom HTTP endpoint

---

## Performance Tips

### Optimize Queries

**DO**:
- Use index patterns with wildcards: `aurigraph-logs-*`
- Filter by time range first
- Use field filters before full-text search
- Limit result size with pagination

**DON'T**:
- Avoid `*` wildcards in queries
- Don't query all indices at once
- Minimize expensive aggregations
- Avoid deep pagination (use search after)

### Dashboard Best Practices

1. **Limit visualizations**: Max 10-12 per dashboard
2. **Set appropriate time ranges**: Default to last 15m or 1h
3. **Use saved searches**: Reuse common queries
4. **Enable auto-refresh**: 30s or 1m for monitoring
5. **Cache frequently accessed dashboards**

### Index Management

**Optimize storage**:
```bash
# Force merge old indices
curl -X POST "http://localhost:9200/aurigraph-logs-2025.10.01/_forcemerge?max_num_segments=1"

# Delete old indices
curl -X DELETE "http://localhost:9200/aurigraph-logs-2025.09.*"
```

**Monitor index health**:
```bash
curl "http://localhost:9200/_cat/indices/aurigraph-*?v&s=store.size:desc"
```

---

## Advanced Features

### Drilldowns

Create interactive drilldowns:
1. Select visualization
2. Click **Panel settings** → **Drilldowns**
3. Add drilldown to another dashboard or URL
4. Configure filters to pass context

### Annotations

Add event markers to time-series charts:
1. Edit visualization
2. Click **Annotations**
3. Add index pattern and query
4. Customize marker style

### Markdown Widgets

Add custom text and links:
1. Add **Markdown** visualization
2. Use Markdown syntax
3. Include links, images, and formatted text

Example:
```markdown
## Aurigraph V11 Monitoring

**Quick Links**:
- [Documentation](https://docs.aurigraph.io)
- [JIRA Board](https://aurigraphdlt.atlassian.net)
- [GitHub](https://github.com/Aurigraph-DLT-Corp)

**Current Status**: All systems operational
```

---

## Troubleshooting

### Dashboard Loading Slowly

**Solution**:
1. Reduce time range
2. Limit visualizations per dashboard
3. Check Elasticsearch query performance
4. Increase Kibana memory

### Data Not Appearing

**Solution**:
1. Verify index pattern: `aurigraph-logs-*`
2. Check time range selection
3. Refresh index pattern: Stack Management → Index Patterns → Refresh
4. Verify Logstash is running and processing logs

### Visualizations Not Updating

**Solution**:
1. Check auto-refresh is enabled
2. Clear browser cache
3. Refresh index pattern
4. Check Elasticsearch connection

---

## Keyboard Shortcuts

- **Ctrl/Cmd + /** : Quick search
- **Ctrl/Cmd + S** : Save dashboard
- **Ctrl/Cmd + F** : Find in dashboard
- **Esc** : Exit full screen

---

## Export and Share

### Export Dashboard

1. Navigate to **Stack Management** → **Saved Objects**
2. Select dashboard
3. Click **Export**
4. Save `.ndjson` file

### Share Dashboard

1. Open dashboard
2. Click **Share**
3. Options:
   - **Copy link**: Share URL
   - **Embed**: Get iframe code
   - **PDF/PNG**: Generate report
   - **CSV**: Export data

### Schedule Reports

1. Click **Share** → **PDF Reports**
2. Configure:
   - Schedule (daily, weekly, monthly)
   - Recipients
   - Time zone
3. Save report schedule

---

## Additional Resources

- [Kibana Documentation](https://www.elastic.co/guide/en/kibana/current/index.html)
- [KQL Syntax](https://www.elastic.co/guide/en/kibana/current/kuery-query.html)
- [Lens Tutorial](https://www.elastic.co/guide/en/kibana/current/lens.html)
- [Dashboard Best Practices](https://www.elastic.co/guide/en/kibana/current/dashboard.html)

---

## Support

For dashboard issues:
- GitHub: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues
- JIRA: https://aurigraphdlt.atlassian.net/
- Email: support@aurigraph.io
