# Sprint 17: Consul Server Configuration
# Service discovery and health checking for multi-node cluster
# Enables automatic service registration and DNS resolution

# Datacenter configuration
datacenter = "aurigraph-cluster"
domain = "consul"

# Server mode (not client)
server = true
bootstrap_expect = 1

# Node name and ID
node_name = "consul-server-1"
node_id = "consul-server-1"

# UI and HTTP API
ui_config {
  enabled = true
  metrics_provider = "prometheus"
}

# HTTP API configuration
http_config {
  bind_addr = "0.0.0.0"
  port = 8500
}

# DNS configuration
dns_config {
  allow_stale = true
  max_stale = "5m"
}

# Ports configuration
ports {
  http = 8500
  https = -1
  grpc = 8502
  dns = 8600
  serf_lan = 8301
  serf_wan = 8302
  server = 8300
}

# Logging
log_level = "INFO"

# Performance tuning
performance {
  raft_multiplier = 1
}

# TLS disabled for testing (would be enabled in production)
tls {
  defaults {
    ca_file = ""
    cert_file = ""
    key_file = ""
    verify_incoming = false
    verify_outgoing = false
  }
}

# ACLs disabled for testing
acl {
  enabled = false
  default_policy = "allow"
}

# Metrics
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = false
}
