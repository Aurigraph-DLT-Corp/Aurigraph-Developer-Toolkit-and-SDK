# Test Environment Configuration for Aurigraph AV10-7 Platform
# Balanced configuration for integration testing

environment = "test"

# Node Configuration - Test Scale
validator_count = 3   # Standard validators for testing
node_count = 5       # Multiple nodes for test scenarios

# Performance Configuration
target_tps = 500000  # 500K TPS for testing
quantum_enabled = true
consensus_algorithm = "HyperRAFT++"

# Monitoring Configuration
enable_monitoring = true

# Port Configuration - Test environment ports
network_ports = {
  validator_base = 8280  # Different range from dev/prod
  node_base     = 8300
  management    = 3340
  vizor         = 3352
  prometheus    = 9290
}

# Resource Limits - Test Scale
resource_limits = {
  validator_memory = "16384m"  # 16GB for each validator
  node_memory     = "8192m"    # 8GB for each node
  management_memory = "2048m"  # 2GB for management dashboard
}

# Test Features - All Enabled for Testing
test_features = {
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

# Security Configuration - Test Environment
security_config = {
  quantum_level = "NIST-5"  # Slightly lower for faster testing
  encryption_enabled = true
  multi_signature = true
  zk_proofs = true
  test_mode = true  # Enable test-specific features
}

# Network Configuration - Test Scale
network_config = {
  p2p_enabled = true
  cross_chain_bridges = 10  # Reduced for testing
  encrypted_channels = true
  load_balancing = true
  chaos_testing = true  # Enable chaos testing features
}

# Test-Specific Configuration
test_config = {
  enable_debug_logging = true
  enable_performance_profiling = true
  enable_test_fixtures = true
  synthetic_load_generation = true
  failure_injection = true
}