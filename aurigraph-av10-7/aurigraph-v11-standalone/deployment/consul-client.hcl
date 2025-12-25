# Sprint 17: Consul Client Configuration Template
# Applied to each validator node in the cluster
# Registers services and performs health checks

# Datacenter configuration
datacenter = "aurigraph-cluster"
domain = "consul"

# Client mode (not server)
server = false

# Retry join configuration (discovers Consul server)
retry_join = ["consul-server:8301"]

# Node name (populated per client)
node_name = "consul-client-${NODE_ID}"
node_id = "consul-client-${NODE_ID}"

# Bind address (0.0.0.0 for Docker)
bind_addr = "0.0.0.0"

# HTTP API configuration
http_config {
  bind_addr = "0.0.0.0"
  port = 8500
}

# DNS configuration
dns_config {
  allow_stale = true
  max_stale = "5m"
  enable_truncate = true
}

# Ports configuration
ports {
  http = 8500
  https = -1
  grpc = 8502
  dns = 8600
  serf_lan = 8301
  serf_wan = -1
  server = -1
}

# Logging
log_level = "INFO"

# Services registration (Aurigraph V11)
# Automatically discovered by load balancer
services {
  name = "aurigraph-v11"
  id = "aurigraph-v11-${NODE_ID}"
  port = 9003
  
  # HTTP health check
  check {
    id = "http-health"
    name = "HTTP Health Check"
    http = "http://localhost:9003/q/health"
    interval = "10s"
    timeout = "5s"
    status = "passing"
  }
  
  # gRPC health check
  check {
    id = "grpc-health"
    name = "gRPC Health Check"
    grpc = "localhost:9004"
    interval = "10s"
    timeout = "5s"
    grpc_use_tls = false
    status = "passing"
  }
  
  # Metadata for service classification
  meta {
    validator = "true"
    network = "aurigraph"
    version = "11.0.0"
  }
}

# Telemetry and monitoring
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = false
}

# TLS disabled for testing
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
