# Aurigraph DLT Infrastructure - Enhanced Configuration
# Complete infrastructure for AV10-7 platform with all components

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
  }
}

provider "docker" {
  host = "unix:///var/run/docker.sock"
}

# Random suffix for unique resource naming
resource "random_id" "deployment" {
  byte_length = 4
}

locals {
  deployment_id = random_id.deployment.hex
  common_labels = {
    "aurigraph.io/environment" = var.environment
    "aurigraph.io/version"     = "av10-7"
    "aurigraph.io/managed-by"  = "terraform"
    "aurigraph.io/deployment"  = local.deployment_id
  }
  
  # Port assignments
  validator_ports = [for i in range(var.validator_count) : var.network_ports.validator_base + i * 20]
  node_ports      = [for i in range(var.node_count) : var.network_ports.node_base + i]
}

# ============================================================================
# NETWORKING
# ============================================================================

resource "docker_network" "aurigraph_primary" {
  name   = "aurigraph-${var.environment}-network"
  driver = "bridge"
  
  ipam_config {
    subnet  = "172.30.0.0/24"
    gateway = "172.30.0.1"
  }
}

resource "docker_network" "aurigraph_monitoring" {
  name   = "aurigraph-${var.environment}-monitoring"
  driver = "bridge"
  
  ipam_config {
    subnet  = "172.31.0.0/24"
    gateway = "172.31.0.1"
  }
}

# ============================================================================
# VALIDATORS (HyperRAFT++ Consensus)
# ============================================================================

resource "docker_container" "validators" {
  count = var.validator_count
  
  name  = "aurigraph-${var.environment}-validator-${format("%02d", count.index + 1)}"
  image = docker_image.aurigraph_validator.image_id
  
  hostname = "validator-${format("%02d", count.index + 1)}"
  
  ports {
    internal = 8181
    external = local.validator_ports[count.index]
  }
  
  ports {
    internal = 9090
    external = 9090 + count.index
  }
  
  networks_advanced {
    name = docker_network.aurigraph_primary.name
    ipv4_address = "172.30.0.${10 + count.index}"
  }
  
  networks_advanced {
    name = docker_network.aurigraph_monitoring.name
  }
  
  env = [
    "NODE_TYPE=validator",
    "NODE_ID=VAL-${format("%03d", count.index + 1)}",
    "ENVIRONMENT=${var.environment}",
    "CONSENSUS_ALGORITHM=${var.consensus_algorithm}",
    "CONSENSUS_PORT=8181",
    "METRICS_PORT=9090",
    "TARGET_TPS=${var.target_tps}",
    "QUANTUM_ENABLED=${var.quantum_enabled}",
    "QUANTUM_LEVEL=NIST-6",
    "ZK_ENABLED=true",
    "AI_ENABLED=true",
    "VALIDATOR_INDEX=${count.index}",
    "TOTAL_VALIDATORS=${var.validator_count}",
    "BLOCK_TIME_MS=1000",
    "FINALITY_MS=500"
  ]
  
  volumes {
    host_path      = "${path.cwd}/data/${var.environment}/validator-${format("%02d", count.index + 1)}"
    container_path = "/app/data"
  }
  
  volumes {
    host_path      = "${path.cwd}/config/${var.environment}/validator"
    container_path = "/app/config"
    read_only      = true
  }
  
  volumes {
    host_path      = "${path.cwd}/logs/${var.environment}/validator-${format("%02d", count.index + 1)}"
    container_path = "/app/logs"
  }
  
  restart = "unless-stopped"
  
  # Labels removed due to provider compatibility
  
  healthcheck {
    test         = ["CMD", "curl", "-f", "http://localhost:8181/health"]
    interval     = "30s"
    timeout      = "10s"
    retries      = 3
    start_period = "60s"
  }
  
  memory = 65536  # 64GB
  cpu_shares = 16384  # 16 CPUs
  
  log_driver = "json-file"
  log_opts = {
    "max-size" = "100m"
    "max-file" = "10"
  }
}

# ============================================================================
# BASIC NODES (Full and Light)
# ============================================================================

resource "docker_container" "nodes" {
  count = var.node_count
  
  name  = "aurigraph-${var.environment}-node-${format("%02d", count.index + 1)}"
  image = docker_image.aurigraph_node.image_id
  
  hostname = "node-${format("%02d", count.index + 1)}"
  
  ports {
    internal = 8201
    external = local.node_ports[count.index]
  }
  
  ports {
    internal = 9090
    external = 9100 + count.index
  }
  
  networks_advanced {
    name = docker_network.aurigraph_primary.name
    ipv4_address = "172.30.0.${50 + count.index}"
  }
  
  networks_advanced {
    name = docker_network.aurigraph_monitoring.name
  }
  
  env = [
    "NODE_TYPE=${count.index % 2 == 0 ? "full" : "light"}",
    "NODE_ID=NODE-${format("%03d", count.index + 1)}",
    "ENVIRONMENT=${var.environment}",
    "CONSENSUS_PORT=8201",
    "METRICS_PORT=9090",
    "VALIDATOR_ENDPOINTS=${join(",", [for i in range(var.validator_count) : "validator-${format("%02d", i + 1)}:8181"])}",
    "QUANTUM_ENABLED=${var.quantum_enabled}",
    "ZK_ENABLED=true",
    "CROSS_CHAIN_ENABLED=true"
  ]
  
  volumes {
    host_path      = "${path.cwd}/data/${var.environment}/node-${format("%02d", count.index + 1)}"
    container_path = "/app/data"
  }
  
  volumes {
    host_path      = "${path.cwd}/config/${var.environment}/node${format("%02d", count.index + 1)}"
    container_path = "/app/config"
    read_only      = true
  }
  
  restart = "unless-stopped"
  
  depends_on = [docker_container.validators]
  
  healthcheck {
    test         = ["CMD", "curl", "-f", "http://localhost:8201/health"]
    interval     = "30s"
    timeout      = "10s"
    retries      = 3
    start_period = "45s"
  }
  
  memory = count.index % 2 == 0 ? 32768 : 16384  # 32GB for full, 16GB for light
  cpu_shares = count.index % 2 == 0 ? 8192 : 4096  # 8 CPUs for full, 4 for light
  
  log_driver = "json-file"
  log_opts = {
    "max-size" = "50m"
    "max-file" = "5"
  }
}

# ============================================================================
# MANAGEMENT DASHBOARD
# ============================================================================

resource "docker_container" "management_dashboard" {
  name  = "aurigraph-${var.environment}-management"
  image = docker_image.aurigraph_management.image_id
  
  hostname = "management"
  
  ports {
    internal = 3140
    external = var.network_ports.management
  }
  
  networks_advanced {
    name = docker_network.aurigraph_primary.name
    ipv4_address = "172.30.0.100"
  }
  
  networks_advanced {
    name = docker_network.aurigraph_monitoring.name
  }
  
  env = [
    "ENVIRONMENT=${var.environment}",
    "MANAGEMENT_PORT=3140",
    "VALIDATOR_ENDPOINTS=${join(",", [for i in range(var.validator_count) : "validator-${format("%02d", i + 1)}:8181"])}",
    "NODE_ENDPOINTS=${join(",", [for i in range(var.node_count) : "node-${format("%02d", i + 1)}:8201"])}",
    "PROMETHEUS_ENDPOINT=prometheus:9090",
    "VIZOR_ENDPOINT=vizor:3052"
  ]
  
  restart = "unless-stopped"
  
  depends_on = [
    docker_container.validators,
    docker_container.nodes
  ]
  
  healthcheck {
    test         = ["CMD", "curl", "-f", "http://localhost:3140/health"]
    interval     = "30s"
    timeout      = "10s"
    retries      = 3
  }
  
  memory = 2048
  cpu_shares = 2048
  
  log_driver = "json-file"
  log_opts = {
    "max-size" = "20m"
    "max-file" = "3"
  }
}

# ============================================================================
# MONITORING STACK
# ============================================================================

# Prometheus
resource "docker_container" "prometheus" {
  count = var.enable_monitoring ? 1 : 0
  
  name  = "aurigraph-${var.environment}-prometheus"
  image = "prom/prometheus:latest"
  
  hostname = "prometheus"
  
  ports {
    internal = 9090
    external = var.network_ports.prometheus
  }
  
  networks_advanced {
    name = docker_network.aurigraph_monitoring.name
    ipv4_address = "172.31.0.10"
  }
  
  networks_advanced {
    name = docker_network.aurigraph_primary.name
  }
  
  volumes {
    host_path      = "${path.cwd}/monitoring/prometheus-${var.environment}.yml"
    container_path = "/etc/prometheus/prometheus.yml"
    read_only      = true
  }
  
  volumes {
    host_path      = "${path.cwd}/data/${var.environment}/prometheus"
    container_path = "/prometheus"
  }
  
  command = [
    "--config.file=/etc/prometheus/prometheus.yml",
    "--storage.tsdb.path=/prometheus",
    "--storage.tsdb.retention.time=30d",
    "--web.console.libraries=/usr/share/prometheus/console_libraries",
    "--web.console.templates=/usr/share/prometheus/consoles",
    "--web.enable-lifecycle"
  ]
  
  restart = "unless-stopped"
  
  
  memory = 4096
  cpu_shares = 2048
}

# Grafana
resource "docker_container" "grafana" {
  count = var.enable_monitoring ? 1 : 0
  
  name  = "aurigraph-${var.environment}-grafana"
  image = "grafana/grafana:latest"
  
  hostname = "grafana"
  
  ports {
    internal = 3000
    external = 3000
  }
  
  networks_advanced {
    name = docker_network.aurigraph_monitoring.name
    ipv4_address = "172.31.0.11"
  }
  
  env = [
    "GF_SECURITY_ADMIN_PASSWORD=aurigraph-admin",
    "GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource",
    "GF_SERVER_ROOT_URL=http://localhost:3000"
  ]
  
  volumes {
    host_path      = "${path.cwd}/data/${var.environment}/grafana"
    container_path = "/var/lib/grafana"
  }
  
  volumes {
    host_path      = "${path.cwd}/monitoring/grafana/dashboards"
    container_path = "/etc/grafana/provisioning/dashboards"
    read_only      = true
  }
  
  volumes {
    host_path      = "${path.cwd}/monitoring/grafana/datasources"
    container_path = "/etc/grafana/provisioning/datasources"
    read_only      = true
  }
  
  restart = "unless-stopped"
  
  depends_on = [docker_container.prometheus]
  
  
  memory = 2048
  cpu_shares = 1024
}

# Vizor Dashboard
resource "docker_container" "vizor" {
  count = var.enable_monitoring ? 1 : 0
  
  name  = "aurigraph-${var.environment}-vizor"
  image = docker_image.aurigraph_vizor.image_id
  
  hostname = "vizor"
  
  ports {
    internal = 3052
    external = var.network_ports.vizor
  }
  
  networks_advanced {
    name = docker_network.aurigraph_monitoring.name
    ipv4_address = "172.31.0.12"
  }
  
  networks_advanced {
    name = docker_network.aurigraph_primary.name
  }
  
  env = [
    "ENVIRONMENT=${var.environment}",
    "VIZOR_PORT=3052",
    "PROMETHEUS_ENDPOINT=prometheus:9090",
    "VALIDATOR_ENDPOINTS=${join(",", [for i in range(var.validator_count) : "validator-${format("%02d", i + 1)}:9090"])}",
    "NODE_ENDPOINTS=${join(",", [for i in range(var.node_count) : "node-${format("%02d", i + 1)}:9090"])}"
  ]
  
  restart = "unless-stopped"
  
  depends_on = [
    docker_container.prometheus,
    docker_container.validators,
    docker_container.nodes
  ]
  
  
  memory = 2048
  cpu_shares = 1024
}

# ============================================================================
# CROSS-CHAIN BRIDGE
# ============================================================================

resource "docker_container" "cross_chain_bridge" {
  count = var.consensus_algorithm == "HyperRAFT++" ? 1 : 0
  
  name  = "aurigraph-${var.environment}-bridge"
  image = docker_image.aurigraph_bridge.image_id
  
  hostname = "bridge"
  
  ports {
    internal = 8888
    external = 8888
  }
  
  networks_advanced {
    name = docker_network.aurigraph_primary.name
    ipv4_address = "172.30.0.200"
  }
  
  env = [
    "ENVIRONMENT=${var.environment}",
    "BRIDGE_PORT=8888",
    "SUPPORTED_CHAINS=ethereum,polygon,bsc,avalanche,solana",
    "VALIDATOR_ENDPOINTS=${join(",", [for i in range(var.validator_count) : "validator-${format("%02d", i + 1)}:8181"])}",
    "QUANTUM_ENABLED=${var.quantum_enabled}"
  ]
  
  restart = "unless-stopped"
  
  depends_on = [docker_container.validators]
  
  memory = 8192
  cpu_shares = 4096
}

# ============================================================================
# QUANTUM KEY MANAGEMENT SERVICE
# ============================================================================

resource "docker_container" "quantum_kms" {
  count = var.quantum_enabled ? 1 : 0
  
  name  = "aurigraph-${var.environment}-quantum-kms"
  image = docker_image.aurigraph_quantum.image_id
  
  hostname = "quantum-kms"
  
  ports {
    internal = 9443
    external = 9443
  }
  
  networks_advanced {
    name = docker_network.aurigraph_primary.name
    ipv4_address = "172.30.0.250"
  }
  
  env = [
    "ENVIRONMENT=${var.environment}",
    "KMS_PORT=9443",
    "SECURITY_LEVEL=NIST-6",
    "KEY_ROTATION_INTERVAL=3600",
    "HSM_ENABLED=false"
  ]
  
  volumes {
    host_path      = "${path.cwd}/data/${var.environment}/quantum-keys"
    container_path = "/app/keys"
  }
  
  restart = "unless-stopped"
  
  
  memory = 4096
  cpu_shares = 2048
}