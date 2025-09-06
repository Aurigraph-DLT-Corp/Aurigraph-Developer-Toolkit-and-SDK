# Outputs for Aurigraph DLT Infrastructure - Enhanced Configuration

output "validator_endpoints" {
  description = "Validator node endpoints"
  value = [
    for i, container in docker_container.validators :
    "http://localhost:${container.ports[0].external}"
  ]
}

output "node_endpoints" {
  description = "Basic node endpoints"
  value = [
    for i, container in docker_container.nodes :
    "http://localhost:${container.ports[0].external}"
  ]
}

output "management_dashboard" {
  description = "Management dashboard URL"
  value       = "http://localhost:${docker_container.management_dashboard.ports[0].external}"
}

output "vizor_dashboard" {
  description = "Vizor monitoring dashboard URL"
  value       = var.enable_monitoring ? "http://localhost:${docker_container.vizor[0].ports[0].external}" : null
}

output "prometheus_endpoint" {
  description = "Prometheus metrics endpoint"
  value       = var.enable_monitoring ? "http://localhost:${docker_container.prometheus[0].ports[0].external}" : null
}

output "grafana_dashboard" {
  description = "Grafana dashboard URL (default password: aurigraph-admin)"
  value       = var.enable_monitoring ? "http://localhost:${docker_container.grafana[0].ports[0].external}" : null
}

output "cross_chain_bridge" {
  description = "Cross-chain bridge endpoint"
  value       = var.consensus_algorithm == "HyperRAFT++" ? "http://localhost:${docker_container.cross_chain_bridge[0].ports[0].external}" : null
}

output "quantum_kms" {
  description = "Quantum KMS endpoint"
  value       = var.quantum_enabled ? "https://localhost:${docker_container.quantum_kms[0].ports[0].external}" : null
}

output "network_info" {
  description = "Docker network information"
  value = {
    primary_network    = docker_network.aurigraph_primary.name
    monitoring_network = docker_network.aurigraph_monitoring.name
  }
}

output "container_names" {
  description = "Names of all created containers"
  value = {
    validators = [for c in docker_container.validators : c.name]
    nodes      = [for c in docker_container.nodes : c.name]
    management = docker_container.management_dashboard.name
    monitoring = var.enable_monitoring ? {
      vizor      = docker_container.vizor[0].name
      prometheus = docker_container.prometheus[0].name
      grafana    = docker_container.grafana[0].name
    } : null
    bridge     = var.consensus_algorithm == "HyperRAFT++" ? docker_container.cross_chain_bridge[0].name : null
    quantum    = var.quantum_enabled ? docker_container.quantum_kms[0].name : null
  }
}

output "service_ports" {
  description = "External ports for all services"
  value = {
    validators = [for c in docker_container.validators : c.ports[0].external]
    nodes      = [for c in docker_container.nodes : c.ports[0].external]
    management = docker_container.management_dashboard.ports[0].external
    monitoring = var.enable_monitoring ? {
      vizor      = docker_container.vizor[0].ports[0].external
      prometheus = docker_container.prometheus[0].ports[0].external
      grafana    = docker_container.grafana[0].ports[0].external
    } : null
    bridge     = var.consensus_algorithm == "HyperRAFT++" ? docker_container.cross_chain_bridge[0].ports[0].external : null
    quantum    = var.quantum_enabled ? docker_container.quantum_kms[0].ports[0].external : null
  }
}

output "infrastructure_status" {
  description = "Overall infrastructure deployment status"
  value = {
    environment         = var.environment
    deployment_id       = local.deployment_id
    consensus_algorithm = var.consensus_algorithm
    quantum_enabled     = var.quantum_enabled
    target_tps          = var.target_tps
    validator_count     = var.validator_count
    node_count          = var.node_count
    monitoring_enabled  = var.enable_monitoring
    networks_created    = {
      primary    = docker_network.aurigraph_primary.name
      monitoring = docker_network.aurigraph_monitoring.name
    }
    features = {
      cross_chain_bridge = var.consensus_algorithm == "HyperRAFT++"
      quantum_kms        = var.quantum_enabled
      full_monitoring    = var.enable_monitoring
    }
  }
}

output "quick_start_commands" {
  description = "Commands to interact with the deployed infrastructure"
  value = {
    check_health = "curl http://localhost:${docker_container.management_dashboard.ports[0].external}/health"
    view_metrics = var.enable_monitoring ? "curl http://localhost:${docker_container.prometheus[0].ports[0].external}/metrics" : "Monitoring disabled"
    access_dashboard = "open http://localhost:${docker_container.management_dashboard.ports[0].external}"
    grafana_login = var.enable_monitoring ? "open http://localhost:${docker_container.grafana[0].ports[0].external} (admin/aurigraph-admin)" : "Monitoring disabled"
  }
}