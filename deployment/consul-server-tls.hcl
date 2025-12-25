# Sprint 18: Consul TLS Configuration (Server)
# Production-grade TLS 1.3 for service discovery with mutual authentication

# ========== Basic Configuration ==========
datacenter = "aurigraph-cluster"
server = true
bootstrap_expect = 1
ui = true
node_name = "consul-server"

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
advertise_addr = "consul-server"
client_addr = "0.0.0.0"

# Enable both IPv4 and IPv6
bind_addr = "0.0.0.0"

# ========== TLS Configuration ==========
tls {
  defaults {
    # Certificate files
    cert_file = "/opt/consul-certs/server.crt"
    key_file = "/opt/consul-certs/server.key"
    
    # CA certificate for verification
    ca_file = "/opt/consul-certs/ca.crt"
    ca_path = "/opt/consul-certs"
    
    # Verification settings
    verify_incoming = true      # Require client certificates
    verify_outgoing = true      # Verify server certificates
    verify_server_hostname = true
    
    # TLS version
    tls_min_version = "TLSv1_3"
    tls_max_version = "TLSv1_3"
    
    # Cipher suites (TLS 1.3 only)
    tls_cipher_suites = [
      "TLS_AES_256_GCM_SHA384",
      "TLS_CHACHA20_POLY1305_SHA256"
    ]
    
    # Disable older cipher suites
    tls_prefer_server_cipher_suites = true
  }
  
  # Internal RPC (server-to-server)
  internal {
    tls_min_version = "TLSv1_3"
    tls_max_version = "TLSv1_3"
  }
  
  # HTTPS API
  https {
    tls_min_version = "TLSv1_3"
    tls_max_version = "TLSv1_3"
  }
  
  # gRPC
  grpc {
    tls_min_version = "TLSv1_3"
    tls_max_version = "TLSv1_3"
  }
}

# ========== ACL Configuration (Security) ==========
acl {
  # Enable ACL system
  enabled = true
  
  # Default policy (deny by default)
  default_policy = "deny"
  
  # Down policy (use cached policies if server unreachable)
  down_policy = "extend-cache"
  
  # Token for agent communication
  tokens {
    agent = "consul-agent-token"
    default = "consul-default-token"
  }
}

# ========== Security Configuration ==========
# Auto encrypt for agent communication
auto_config {
  enabled = true
}

# Disable HTTP API (force HTTPS)
http = false

# ========== Service Discovery Configuration ==========
services {
  # Consul service itself
  service {
    name = "consul"
    id = "consul-server"
    port = 8501
    
    meta {
      version = "1.17.0"
      cluster = "aurigraph-cluster"
    }
  }
}

# ========== DNS Configuration ==========
# DNS can work unencrypted for performance
# Queries handled via UDP port 8600
dns_config {
  # Only_passing: return only passing services
  only_passing = false
  
  # Max stale: allow returning stale DNS results
  max_stale = "5s"
  
  # TTL
  service_ttl = "30s"
  
  # UDP answer limit
  udp_answer_limit = 3
}

# ========== Performance Tuning ==========
# Session TTL
session_ttl_min = "10s"
session_ttl_max = "24h"

# Raft settings
raft_protocol = 3
raft_trailing_logs = 10000
raft_snapshot_threshold = 16384
raft_snapshot_interval = "30s"

# Server health checks
server_health_status_min_version = "1.12.0"

# ========== Replication ==========
# Primary data replication
replication {
  # Raft log size
  raft_logs_gc_threshold = 524288
  raft_logs_gc_min_index = 16384
  
  # Snapshot cleanup
  snapshot_interval = "30s"
  snapshot_retention = 3
}

# ========== Monitoring & Logging ==========
log_level = "INFO"

# Enable logging for debugging (change to INFO for production)
# log_level = "DEBUG"

# Syslog configuration (optional)
# syslog {
#   facility = "LOCAL0"
#   name = "consul"
# }

# ========== Auto TLS Configuration ==========
# Automatic TLS certificate generation
auto_tls {
  enabled = true
  
  # CertDir for auto-generated certificates
  cert_dir = "/opt/consul-certs"
  
  # Automatic renewal
  auto_renew = true
  
  # Renewal threshold
  auto_renew_days = 30
}

# ========== Telemetry Configuration ==========
telemetry {
  # Prometheus metrics
  prometheus_retention_time = "30s"
  
  # Log performance metrics
  disable_hostname = false
}
