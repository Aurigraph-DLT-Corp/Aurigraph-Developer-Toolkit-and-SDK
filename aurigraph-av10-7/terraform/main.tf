# Aurigraph DLT Infrastructure as Code
# Terraform configuration for AV10-7 platform

terraform {
  required_version = ">= 1.0"
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {
  host = "unix:///var/run/docker.sock"
}

# Network for Aurigraph services
resource "docker_network" "aurigraph_network" {
  name = "aurigraph-av10-network"
  driver = "bridge"
}

# Validator Node
resource "docker_container" "validator" {
  image = docker_image.aurigraph_validator.image_id
  name  = "aurigraph-validator-01"
  
  ports {
    internal = 8181
    external = 8181
  }
  
  networks_advanced {
    name = docker_network.aurigraph_network.name
  }
  
  env = [
    "NODE_TYPE=validator",
    "NODE_ID=VAL-001",
    "CONSENSUS_PORT=8181",
    "QUANTUM_ENABLED=true"
  ]
  
  volumes {
    host_path      = "${path.cwd}/config/validator"
    container_path = "/app/config"
  }
  
  restart = "unless-stopped"
}

# Basic Node 1 (Full)
resource "docker_container" "node_01" {
  image = docker_image.aurigraph_node.image_id
  name  = "aurigraph-node-01"
  
  ports {
    internal = 8201
    external = 8201
  }
  
  networks_advanced {
    name = docker_network.aurigraph_network.name
  }
  
  env = [
    "NODE_TYPE=full",
    "NODE_ID=NODE-001",
    "CONSENSUS_PORT=8201",
    "VALIDATOR_ENDPOINT=aurigraph-validator-01:8181"
  ]
  
  volumes {
    host_path      = "${path.cwd}/config/node01"
    container_path = "/app/config"
  }
  
  restart = "unless-stopped"
  depends_on = [docker_container.validator]
}

# Basic Node 2 (Light)
resource "docker_container" "node_02" {
  image = docker_image.aurigraph_node.image_id
  name  = "aurigraph-node-02"
  
  ports {
    internal = 8202
    external = 8202
  }
  
  networks_advanced {
    name = docker_network.aurigraph_network.name
  }
  
  env = [
    "NODE_TYPE=light",
    "NODE_ID=NODE-002",
    "CONSENSUS_PORT=8202",
    "VALIDATOR_ENDPOINT=aurigraph-validator-01:8181"
  ]
  
  volumes {
    host_path      = "${path.cwd}/config/node02"
    container_path = "/app/config"
  }
  
  restart = "unless-stopped"
  depends_on = [docker_container.validator]
}

# Management Dashboard
resource "docker_container" "management" {
  image = docker_image.aurigraph_management.image_id
  name  = "aurigraph-management"
  
  ports {
    internal = 3140
    external = 3140
  }
  
  networks_advanced {
    name = docker_network.aurigraph_network.name
  }
  
  env = [
    "MANAGEMENT_PORT=3140",
    "VALIDATOR_ENDPOINT=aurigraph-validator-01:8181",
    "NODE_ENDPOINTS=aurigraph-node-01:8201,aurigraph-node-02:8202"
  ]
  
  restart = "unless-stopped"
  depends_on = [
    docker_container.validator,
    docker_container.node_01,
    docker_container.node_02
  ]
}

# Monitoring (Prometheus)
resource "docker_container" "prometheus" {
  image = "prom/prometheus:latest"
  name  = "aurigraph-prometheus"
  
  ports {
    internal = 9090
    external = 9090
  }
  
  networks_advanced {
    name = docker_network.aurigraph_network.name
  }
  
  volumes {
    host_path      = "${path.cwd}/monitoring/prometheus.yml"
    container_path = "/etc/prometheus/prometheus.yml"
  }
  
  restart = "unless-stopped"
}

# Metrics Exporter (Vizor)
resource "docker_container" "vizor" {
  image = docker_image.aurigraph_vizor.image_id
  name  = "aurigraph-vizor"
  
  ports {
    internal = 3052
    external = 3052
  }
  
  networks_advanced {
    name = docker_network.aurigraph_network.name
  }
  
  env = [
    "VIZOR_PORT=3052",
    "PROMETHEUS_ENDPOINT=aurigraph-prometheus:9090"
  ]
  
  restart = "unless-stopped"
  depends_on = [docker_container.prometheus]
}