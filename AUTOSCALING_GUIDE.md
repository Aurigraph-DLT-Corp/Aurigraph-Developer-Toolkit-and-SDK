# Aurigraph DLT V4.4.4 - Node Autoscaling Guide

## Overview

The Aurigraph platform includes built-in autoscaling capabilities for node containers. The system automatically adjusts the number of running node instances based on real-time CPU and memory utilization, ensuring optimal resource efficiency while maintaining performance.

## Autoscaling Architecture

### Scaling Tiers

**Validator Nodes** (Consensus Layer)
- Minimum: 5 instances
- Maximum: 20 instances
- Target CPU: 70%
- Target Memory: 80%
- Scale-up threshold: 85% (CPU or Memory)
- Scale-down threshold: 20% (both CPU and Memory)

**Business Nodes Group 1** (Transaction Processing)
- Minimum: 8 instances
- Maximum: 32 instances
- Target CPU: 75%
- Target Memory: 80%
- Scale-up threshold: 85%
- Scale-down threshold: 25%

**Business Nodes Group 2** (Transaction Processing)
- Minimum: 7 instances
- Maximum: 28 instances
- Target CPU: 75%
- Target Memory: 80%
- Scale-up threshold: 85%
- Scale-down threshold: 25%

**Slim Nodes** (Edge/Archive)
- Minimum: 5 instances
- Maximum: 30 instances
- Target CPU: 70%
- Target Memory: 75%
- Scale-up threshold: 80%
- Scale-down threshold: 20%

## Enabling Autoscaling

### 1. Configuration via Docker Compose Labels

The `docker-compose-nodes.yml` file includes autoscaling metadata in container labels:

```yaml
services:
  validator-nodes-multi:
    labels:
      - "com.dlt.autoscale.min=5"
      - "com.dlt.autoscale.max=20"
      - "com.dlt.autoscale.target-cpu=70"
      - "com.dlt.autoscale.target-memory=80"
      - "com.dlt.autoscale.scale-up-threshold=85"
      - "com.dlt.autoscale.scale-down-threshold=20"
```

**Label Definitions**:
- `com.dlt.autoscale.min`: Minimum number of instances (lower bound)
- `com.dlt.autoscale.max`: Maximum number of instances (upper bound)
- `com.dlt.autoscale.target-cpu`: Ideal CPU utilization target
- `com.dlt.autoscale.target-memory`: Ideal memory utilization target
- `com.dlt.autoscale.scale-up-threshold`: Trigger scale-up when CPU or Memory exceed this %
- `com.dlt.autoscale.scale-down-threshold`: Trigger scale-down when both CPU and Memory fall below this %

### 2. Running the Autoscaler

```bash
# Start autoscaler in normal mode (checks every 30 seconds)
./autoscale-nodes.sh

# Custom check interval (every 60 seconds)
./autoscale-nodes.sh --check-interval 60

# Dry-run mode (preview scaling decisions without applying)
./autoscale-nodes.sh --dry-run

# Combined options
./autoscale-nodes.sh --check-interval 45 --dry-run
```

### 3. Running as a Background Service

To run autoscaling continuously in the background:

```bash
# Start in background with nohup
nohup ./autoscale-nodes.sh --check-interval 30 > autoscale.log 2>&1 &

# Or using tmux (if available)
tmux new-session -d -s autoscale './autoscale-nodes.sh --check-interval 30'

# Or as a Docker container (recommended for production)
docker run -d \
  --name dlt-autoscaler \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(pwd)/autoscale-nodes.sh:/app/autoscale.sh:ro \
  alpine:latest \
  sh /app/autoscale.sh --check-interval 30
```

### 4. Systemd Service (Optional for Linux)

Create `/etc/systemd/system/dlt-autoscaler.service`:

```ini
[Unit]
Description=Aurigraph DLT Node Autoscaler
After=docker.service
Requires=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/DLT
ExecStart=/opt/DLT/autoscale-nodes.sh --check-interval 30
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable dlt-autoscaler
sudo systemctl start dlt-autoscaler
sudo systemctl status dlt-autoscaler
```

## Scaling Behavior

### Scale-Up Trigger

When CPU OR memory usage exceeds the scale-up threshold:
```
IF (CPU% > scale_up_threshold) OR (Memory% > scale_up_threshold) THEN
  IF current_instances < max_instances THEN
    INCREMENT instances by 1
  END IF
END IF
```

**Example (Validator Nodes)**:
- Scale-up threshold: 85%
- If CPU reaches 86% and current instances = 5
- New instances = 6 (up to max 20)

### Scale-Down Trigger

When BOTH CPU AND memory usage fall below the scale-down threshold:
```
IF (CPU% < scale_down_threshold) AND (Memory% < scale_down_threshold) THEN
  IF current_instances > min_instances THEN
    DECREMENT instances by 1
  END IF
END IF
```

**Example (Validator Nodes)**:
- Scale-down threshold: 20%
- If CPU = 18% AND Memory = 15% and current instances = 10
- New instances = 9 (down to min 5)

### Scale-Down Safety

- Minimum instances are **always maintained** (ensures fault tolerance)
- Scale-down only happens when **both** CPU and Memory are low (conservative approach)
- Scale-up happens immediately when either metric is high (aggressive approach)

## Monitoring Autoscaling

### View Autoscaler Logs

```bash
# If running with nohup
tail -f autoscale.log

# If running as systemd service
sudo journalctl -u dlt-autoscaler -f

# Get last 50 lines
sudo journalctl -u dlt-autoscaler -n 50
```

### Check Container Metrics Manually

```bash
# View real-time metrics for all containers
docker stats --no-stream

# Filter for specific containers
docker stats --no-stream dlt-validator-nodes-multi

# Get detailed metrics
docker inspect dlt-validator-nodes-multi --format='{{json .State.Health}}' | jq .
```

### Monitor Scaling Events

```bash
# Watch for scaling decisions
watch -n 10 'docker ps -a --format "table {{.Names}}\t{{.Status}}"'

# Check autoscaler process
ps aux | grep autoscale

# View current node instance count
docker exec dlt-validator-nodes-multi ps aux | grep quarkus | wc -l
```

## Manual Scaling Override

### Disable Autoscaling for a Container

Remove or modify the autoscale labels:

```bash
# Edit docker-compose-nodes.yml and remove autoscale labels
# Then restart the container
docker-compose -f docker-compose-nodes.yml up -d validator-nodes-multi
```

### Manually Scale to Specific Count

```bash
# Set NODE_COUNT environment variable
docker exec dlt-validator-nodes-multi env NODE_COUNT=15

# Or modify docker-compose-nodes.yml
environment:
  - NODE_COUNT=15
```

## Performance Impact

### Expected Scaling Latency
- Detection: ~30 seconds (check interval)
- Scaling action: 5-10 seconds
- **Total**: ~40 seconds from metric threshold to scaling complete

### Resource Overhead
- Autoscaler process: <50MB memory, <1% CPU
- Monitoring overhead: Minimal (uses docker stats)

### Scaling Rate
- Maximum 1 instance per check cycle
- Prevents thrashing (rapid scale-up/down oscillations)
- Conservative approach maintains stability

## Advanced Configuration

### Custom Thresholds per Tier

Adjust thresholds in `docker-compose-nodes.yml`:

```yaml
# Aggressive scaling (respond quickly to load changes)
labels:
  - "com.dlt.autoscale.scale-up-threshold=75"      # Scale up at 75%
  - "com.dlt.autoscale.scale-down-threshold=30"    # Scale down at 30%

# Conservative scaling (maintain more instances)
labels:
  - "com.dlt.autoscale.scale-up-threshold=90"      # Scale up at 90%
  - "com.dlt.autoscale.scale-down-threshold=10"    # Scale down at 10%
```

### Adjust Min/Max Instances

```yaml
# For high-traffic scenarios
labels:
  - "com.dlt.autoscale.min=10"   # Increase minimum
  - "com.dlt.autoscale.max=50"   # Increase maximum

# For cost optimization
labels:
  - "com.dlt.autoscale.min=3"    # Decrease minimum
  - "com.dlt.autoscale.max=10"   # Decrease maximum
```

## Troubleshooting

### Autoscaler Not Scaling Up

**Symptoms**: Containers remain at minimum despite high load

**Causes and Solutions**:
1. Check autoscaler is running: `ps aux | grep autoscale`
2. Verify Docker daemon is accessible: `docker ps`
3. Check container labels: `docker inspect <container> --format='{{.Config.Labels}}'`
4. Review autoscaler logs for errors
5. Ensure container has actual load (metrics might not reflect it)

### Autoscaler Crashes

**Causes and Solutions**:
1. Docker socket permission issue: Ensure user can access `/var/run/docker.sock`
2. Out of memory: Monitor system resources
3. Script error: Check syntax with `bash -n autoscale-nodes.sh`
4. Missing dependencies: Ensure `bc` command is available

### Scaling Oscillation

**Symptoms**: Instances rapidly scale up and down

**Causes and Solutions**:
1. Thresholds too close together (gap < 30%): Increase gap
2. Check interval too short: Increase to 60+ seconds
3. Workload genuinely fluctuating: Consider higher thresholds

### Instances Not Respecting Min/Max

**Check**:
1. Verify labels are correctly set in docker-compose-nodes.yml
2. Restart container for labels to take effect
3. Check autoscaler logs for configuration reading

## Best Practices

### Optimal Configuration
1. **Set scale-down threshold** below 50% to maintain headroom
2. **Space thresholds** at least 30% apart to avoid oscillation
3. **Use moderate check intervals** (30-60 seconds) for responsiveness
4. **Monitor during peak hours** to ensure scaling keeps up with demand

### Sizing Guidance
- **Min instances**: Set to handle baseline load (typically 60-70% of average)
- **Max instances**: Set to max supported by hardware (typically 3-5x min)
- **Target utilization**: Aim for 70-80% for balance between efficiency and headroom

### Production Deployment
1. Test autoscaling in non-production first
2. Enable dry-run mode during testing
3. Monitor scaling behavior for 24 hours
4. Adjust thresholds based on actual load patterns
5. Document final configuration for team

## Metrics and Dashboards

### Grafana Dashboard Setup

Add panels to monitor autoscaling:

```
Panel 1: Current Node Instances
  Query: docker_container_status_running{container_name=~".*-nodes-multi"}

Panel 2: Container CPU Usage
  Query: docker_container_cpu_usage{container_name=~".*-nodes-multi"}

Panel 3: Container Memory Usage
  Query: docker_container_memory_usage{container_name=~".*-nodes-multi"}

Panel 4: Scaling Events
  Query: dlt_node_scale_events
```

## Support and Debugging

### Enable Verbose Logging

Modify `autoscale-nodes.sh` to add debugging:

```bash
# Add set -x for debugging
set -x  # Enable debug output

# Or run with bash debug mode
bash -x autoscale-nodes.sh
```

### Collect Diagnostic Information

```bash
# System info
docker version
docker info

# Container status
docker ps -a

# Container metrics
docker stats --no-stream

# Autoscaler logs
tail -100 autoscale.log

# System resource usage
df -h
free -h
```

### Contact Support

When reporting issues, include:
1. Docker version
2. `docker-compose-nodes.yml` (sanitized)
3. Last 100 lines of autoscaler logs
4. Output of diagnostic commands above
5. Current load/metrics at time of issue

---

## Summary

**Autoscaling Advantages**:
- ✅ Automatic load-based scaling
- ✅ Resource efficiency
- ✅ Cost optimization
- ✅ Fault tolerance (maintains minimum instances)
- ✅ Simple configuration via labels
- ✅ No code changes required

**Deployment Checklist**:
- [ ] Review autoscale thresholds for your workload
- [ ] Test in non-production environment
- [ ] Enable autoscaler with appropriate check interval
- [ ] Monitor for 24-48 hours
- [ ] Adjust thresholds based on observed behavior
- [ ] Enable systemd service for production
- [ ] Document final configuration
- [ ] Set up monitoring/alerting

---

**Last Updated**: November 21, 2025
**Version**: 1.0
**Status**: Production Ready
