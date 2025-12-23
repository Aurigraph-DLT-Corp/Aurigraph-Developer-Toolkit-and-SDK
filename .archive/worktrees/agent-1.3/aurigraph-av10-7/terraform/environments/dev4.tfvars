# Dev4 Environment Configuration for Aurigraph AV10-7 Platform
# Optimized for 800K+ TPS performance testing with full AV10 component suite

environment = "dev4"

# Node Configuration - Scaled for High Performance
validator_count = 3  # Multiple validators for consensus testing
node_count = 5      # Multiple nodes for load distribution

# Performance Configuration
target_tps = 800000  # 800K+ TPS target for dev4
quantum_enabled = true
consensus_algorithm = "HyperRAFT++"

# Monitoring Configuration
enable_monitoring = true

# Port Configuration - Dev4 specific ranges
network_ports = {
  validator_base = 8180  # 8180, 8181, 8182 for 3 validators
  node_base     = 8200   # 8200-8204 for 5 nodes
  management    = 3240   # Dev4 management port
  vizor         = 3252   # Dev4 vizor port
  prometheus    = 9190   # Dev4 prometheus port
}

# Resource Limits - Enhanced for Performance Testing
resource_limits = {
  validator_memory = "8192m"  # 8GB for each validator
  node_memory     = "4096m"   # 4GB for each node
  management_memory = "2048m" # 2GB for management dashboard
}

# Dev4-specific Features
dev4_features = {
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

# Security Configuration
security_config = {
  quantum_level = "NIST-6"
  encryption_enabled = true
  multi_signature = true
  zk_proofs = true
}

# Network Configuration
network_config = {
  p2p_enabled = true
  cross_chain_bridges = 50
  encrypted_channels = true
  load_balancing = true
}