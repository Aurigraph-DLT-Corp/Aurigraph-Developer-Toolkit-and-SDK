# Production Environment Configuration for Aurigraph AV10-7 Platform
# Full-scale deployment with maximum performance and security

environment = "prod"

# Node Configuration - Production Scale
validator_count = 7   # Increased validators for production consensus
node_count = 20      # Multiple nodes for global distribution

# Performance Configuration
target_tps = 1000000  # 1M+ TPS target for production
quantum_enabled = true
consensus_algorithm = "HyperRAFT++"

# Monitoring Configuration
enable_monitoring = true

# Port Configuration - Production ports
network_ports = {
  validator_base = 8180
  node_base     = 8200
  management    = 3140
  vizor         = 3052
  prometheus    = 9090
}

# Resource Limits - Production Scale
resource_limits = {
  validator_memory = "65536m"  # 64GB for each validator
  node_memory     = "32768m"   # 32GB for each node
  management_memory = "4096m"  # 4GB for management dashboard
}

# Production Features - All Enabled
prod_features = {
  enable_quantum_sharding = true    # AV10-08
  enable_rwa_platform = true        # AV10-20/21/22
  enable_smart_contracts = true     # AV10-23
  enable_compliance = true          # AV10-24
  enable_analytics = true           # AV10-26
  enable_neural_networks = true     # AV10-28
  enable_ntru_crypto = true         # AV10-30
  enable_node_density = true        # AV10-32
  enable_topology_manager = true    # AV10-34
  enable_enhanced_nodes = true      # AV10-36
}

# Security Configuration - Maximum Security
security_config = {
  quantum_level = "NIST-6"
  encryption_enabled = true
  multi_signature = true
  zk_proofs = true
  hsm_enabled = true
  audit_logging = true
}

# Network Configuration - Global Scale
network_config = {
  p2p_enabled = true
  cross_chain_bridges = 50
  encrypted_channels = true
  load_balancing = true
  geo_distribution = true
  ddos_protection = true
}

# Backup Configuration
backup_config = {
  enabled = true
  retention_days = 90
  geo_redundancy = true
  snapshot_interval = "1h"
}

# High Availability
ha_config = {
  enabled = true
  auto_failover = true
  health_check_interval = "10s"
  recovery_time_objective = "30s"
}