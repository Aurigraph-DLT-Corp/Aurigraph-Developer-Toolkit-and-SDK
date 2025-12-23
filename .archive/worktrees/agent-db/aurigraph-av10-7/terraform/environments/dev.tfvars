# Development Environment Configuration for Aurigraph DLT

environment = "dev"
validator_count = 1
node_count = 2
enable_monitoring = true
quantum_enabled = true
consensus_algorithm = "HyperRAFT++"
target_tps = 1000000

network_ports = {
  validator_base = 8180
  node_base     = 8200
  management    = 3140
  vizor        = 3052
  prometheus   = 9090
}

resource_limits = {
  validator_memory = "2048m"
  node_memory     = "1024m"
  management_memory = "512m"
}