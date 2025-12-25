# Sprint 18: Consul TLS Configuration (Client)
# Production-grade TLS 1.3 for service nodes with mutual authentication

# ========== Basic Configuration ==========
datacenter = "aurigraph-cluster"
server = false
node_name = "consul-client"
ui = false

# ========== Port Configuration ==========
ports {
  http = -1                # Disable HTTP (require HTTPS)
  https = 8501             # HTTPS for API
  dns = 8600               # DNS (UDP, no TLS)
  server = 8301            # Server RPC (encrypted with TLS)
  serf_lan = 8301          # Serf LAN (encrypted with TLS)
  serf_wan = 8302          # Serf WAN (encrypted with TLS)
  grpc = 8502              # gRPC (encrypted with TLS)
  grpc_tls = 8503          # gRPC TLS (mutual auth)
}

# ========== Network Configuration ==========
advertise_addr = "NODE_IP_PLACEHOLDER"  # Will be set via environment
client_addr = "0.0.0.0"
bind_addr = "0.0.0.0"

# ========== Server Join Configuration ==========
# Retry join with TLS
retry_join = ["consul-server:8301"]
retry_interval = "30s"
retry_max = 0  # Infinite retries

# ========== TLS Configuration ==========
tls {
  defaults {
    # Certificate files (per-node)
    cert_file = "/opt/consul-certs/client.crt"
    key_file = "/opt/consul-certs/client.key"
    
    # CA certificate for verification
    ca_file = "/opt/consul-certs/ca.crt"
    ca_path = "/opt/consul-certs"
    
    # Verification settings
    verify_incoming = true      # Require client certificates
    verify_outgoing = true      # Verify server certificates
    verify_server_hostname = true
    
    # TLS version (1.3 only)
    tls_min_version = "TLSv1_3"
    tls_max_version = "TLSv1_3"
    
    # Cipher suites (TLS 1.3)
    tls_cipher_suites = [
      "TLS_AES_256_GCM_SHA384",
      "TLS_CHACHA20_POLY1305_SHA256"
    ]
    
    # Prefer server cipher suites
    tls_prefer_server_cipher_suites = true
  }
  
  # Internal RPC
  internal {
    tls_min_version = "TLSv1_3"
    tls_max_version = "TLSv1_3"
  }
}

# ========== ACL Configuration ==========
acl {
  # Inherit default policy from server
  enabled = true
  
  # Token for agent communication
  tokens {
    agent = "consul-agent-token"
    default = "consul-client-token"
  }
}

# ========== Auto Config ==========
auto_config {
  enabled = true
  auth_method {
    # Use default auth method from server
    name = "consul-default"
  }
}

# ========== Service Configuration ==========
# Consul client itself as a service
services {
  service {
    name = "consul-client"
    id = "consul-client-NODE_ID_PLACEHOLDER"
    port = 8501
    
    meta {
      version = "1.17.0"
      cluster = "aurigraph-cluster"
    }
    
    # Health check via HTTPS
    check {
      id = "tls-health"
      http = "https://localhost:8501/v1/status/leader"
      interval = "10s"
      timeout = "5s"
      tls_server_name = "consul-server"
      tls_skip_verify = false
    }
  }
}

# ========== Aurigraph Service Registration ==========
services {
  service {
    name = "aurigraph-v11"
    id = "aurigraph-v11-NODE_ID_PLACEHOLDER"
    
    # Will be overridden per node
    port = 9443
    address = "NODE_IP_PLACEHOLDER"
    
    meta {
      validator = "NODE_VALIDATOR_PLACEHOLDER"
      version = "11.0.0"
      cluster = "aurigraph-cluster"
      protocol = "HTTPS"
    }
    
    tags = [
      "v11",
      "consensus",
      "tls",
      "grpc"
    ]
    
    # HTTP/2 over TLS health check
    check {
      id = "http-health"
      http = "https://NODE_IP_PLACEHOLDER:9443/q/health"
      interval = "10s"
      timeout = "5s"
      tls_server_name = "NODE_NAME_PLACEHOLDER"
      tls_skip_verify = false
    }
    
    # gRPC health check (TLS)
    check {
      id = "grpc-health"
      grpc = "NODE_IP_PLACEHOLDER:9444"
      grpc_use_tls = true
      interval = "10s"
      timeout = "5s"
    }
    
    # TCP connectivity check
    check {
      id = "tcp-check"
      tcp = "NODE_IP_PLACEHOLDER:9443"
      interval = "10s"
      timeout = "5s"
    }
  }
}

# ========== DNS Configuration ==========
dns_config {
  only_passing = false
  max_stale = "5s"
  service_ttl = "30s"
  udp_answer_limit = 3
}

# ========== Performance Settings ==========
# Cache settings
cache {
  # Enable caching
  enabled = true
  
  # Max entries
  max_entries = 10000
  
  # TTL for cached entries
  ttl = "30s"
}

# ========== Replication ==========
# Enable server health status
server_health_status_min_version = "1.12.0"

# ========== Telemetry ==========
telemetry {
  # Prometheus metrics
  prometheus_retention_time = "30s"
  
  # Disable hostname
  disable_hostname = false
}

# ========== Logging ==========
log_level = "INFO"

# Detailed logging (uncomment for debugging)
# log_level = "DEBUG"

# ========== Security Hardening ==========
# Disable deprecated API endpoints
# deprecated_api_endpoints = [""]

# Limits for API requests
limits {
  # HTTP max request body size (10MB)
  http_max_body_size = 10485760
  
  # RPC max body size (100MB)
  rpc_max_body_size = 104857600
  
  # gRPC max concurrent streams
  grpc_max_concurrent_streams = 1000
}

# ========== Advanced Security ==========
# Certificate rotation settings
tls_rotation {
  # Automatic rotation enabled
  auto_rotate = true
  
  # Rotation threshold (30 days before expiry)
  auto_rotate_days = 30
  
  # Check interval
  check_interval = "24h"
}

# ========== DNS over TLS (DoT) ==========
# Enable DNS over TLS for secure DNS queries
dns_over_tls {
  enabled = true
  ca_file = "/opt/consul-certs/ca.crt"
  cert_file = "/opt/consul-certs/client.crt"
  key_file = "/opt/consul-certs/client.key"
}
