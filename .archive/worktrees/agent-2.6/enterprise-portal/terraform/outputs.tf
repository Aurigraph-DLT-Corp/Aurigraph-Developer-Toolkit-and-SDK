# Aurigraph Enterprise Portal v4.0.0 - Terraform Outputs

output "portal_url" {
  description = "Enterprise Portal HTTPS URL"
  value       = "https://${var.domain_name}"
}

output "portal_version" {
  description = "Deployed portal version"
  value       = local.portal_version
}

output "deployment_timestamp" {
  description = "Deployment timestamp"
  value       = local.deployment_timestamp
}

output "remote_server" {
  description = "Remote server details"
  value = {
    host = var.remote_host
    port = var.remote_port
    user = var.remote_user
  }
}

output "portal_path" {
  description = "Portal deployment path on remote server"
  value       = local.remote_portal_path
}

output "nginx_config_path" {
  description = "nginx configuration file path"
  value       = local.remote_nginx_config
}

output "backend_endpoint" {
  description = "V11 Backend endpoint"
  value       = "http://localhost:${var.backend_port}"
}

output "ssl_certificate" {
  description = "SSL certificate configuration"
  value = {
    domain     = var.domain_name
    cert_path  = var.ssl_certificate_path
    key_path   = var.ssl_certificate_key_path
    auto_setup = var.auto_setup_ssl
  }
}

output "deployment_summary" {
  description = "Complete deployment summary"
  value       = <<-EOT

    ╔════════════════════════════════════════════════════════════╗
    ║   Aurigraph Enterprise Portal v${local.portal_version} - Deployed    ║
    ╚════════════════════════════════════════════════════════════╝

    🌐 Portal URL:     https://${var.domain_name}
    🔒 SSL:            Enabled (Let's Encrypt)
    📦 Version:        ${local.portal_version}
    ⏰ Deployed:       ${local.deployment_timestamp}
    🖥️  Server:         ${var.remote_host}:${var.remote_port}
    📁 Path:           ${local.remote_portal_path}/dist
    🔧 nginx Config:   ${local.remote_nginx_config}
    🏥 Backend:        localhost:${var.backend_port}
    🌍 Environment:    ${var.environment}

    Portal Features:
    ✅ Tab 1: Dashboard (Main overview)
    ✅ Tab 2: Monitoring (System metrics)
    ✅ Tab 3: Node Visualization Demo
    ✅ Tab 4: Settings

    Health Checks:
    • Portal:  https://${var.domain_name}
    • Backend: https://${var.domain_name}/q/health
    • Metrics: https://${var.domain_name}/q/metrics

    Management Commands:
    • Check logs:   ssh ${var.remote_user}@${var.remote_host} -p ${var.remote_port} "sudo tail -f /var/log/nginx/aurigraph-access.log"
    • nginx status: ssh ${var.remote_user}@${var.remote_host} -p ${var.remote_port} "sudo systemctl status nginx"
    • Redeploy:     terraform apply -auto-approve

  EOT
}
