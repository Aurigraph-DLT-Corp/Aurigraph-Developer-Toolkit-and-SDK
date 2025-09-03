# Outputs for Aurigraph DLT Infrastructure

output "validator_endpoints" {
  description = "Validator node endpoints"
  value = [
    for container in [docker_container.validator] :
    "http://localhost:${container.ports[0].external}"
  ]
}

output "node_endpoints" {
  description = "Basic node endpoints"
  value = [
    "http://localhost:${docker_container.node_01.ports[0].external}",
    "http://localhost:${docker_container.node_02.ports[0].external}"
  ]
}

output "management_dashboard" {
  description = "Management dashboard URL"
  value       = "http://localhost:${docker_container.management.ports[0].external}"
}

output "vizor_dashboard" {
  description = "Vizor monitoring dashboard URL"
  value       = var.enable_monitoring ? "http://localhost:${docker_container.vizor.ports[0].external}" : null
}

output "prometheus_endpoint" {
  description = "Prometheus metrics endpoint"
  value       = var.enable_monitoring ? "http://localhost:${docker_container.prometheus.ports[0].external}" : null
}

output "network_name" {
  description = "Docker network name"
  value       = docker_network.aurigraph_network.name
}

output "container_names" {
  description = "Names of all created containers"
  value = {
    validator  = docker_container.validator.name
    node_01    = docker_container.node_01.name
    node_02    = docker_container.node_02.name
    management = docker_container.management.name
    vizor      = var.enable_monitoring ? docker_container.vizor.name : null
    prometheus = var.enable_monitoring ? docker_container.prometheus.name : null
  }
}

output "service_ports" {
  description = "External ports for all services"
  value = {
    validator  = docker_container.validator.ports[0].external
    node_01    = docker_container.node_01.ports[0].external
    node_02    = docker_container.node_02.ports[0].external
    management = docker_container.management.ports[0].external
    vizor      = var.enable_monitoring ? docker_container.vizor.ports[0].external : null
    prometheus = var.enable_monitoring ? docker_container.prometheus.ports[0].external : null
  }
}

output "infrastructure_status" {
  description = "Overall infrastructure deployment status"
  value = {
    environment        = var.environment
    consensus_algorithm = var.consensus_algorithm
    quantum_enabled    = var.quantum_enabled
    target_tps         = var.target_tps
    validator_count    = var.validator_count
    node_count        = var.node_count
    monitoring_enabled = var.enable_monitoring
    network_created   = docker_network.aurigraph_network.name
  }
}