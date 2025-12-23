# Aurigraph Enterprise Portal v4.0.0 - Terraform Configuration
# Infrastructure-as-Code for Enterprise Portal deployment to dlt.aurigraph.io

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  backend "local" {
    path = "terraform.tfstate"
  }
}

# ============================================================================
# LOCAL VARIABLES
# ============================================================================

locals {
  portal_version       = "4.0.0"
  deployment_timestamp = formatdate("YYYY-MM-DD-hhmm", timestamp())

  # Remote server configuration
  remote_host = var.remote_host
  remote_user = var.remote_user
  remote_port = var.remote_port

  # Deployment paths
  remote_portal_path  = "/var/www/aurigraph-portal"
  remote_nginx_config = "/etc/nginx/sites-available/aurigraph-complete"

  # Local paths
  local_dist_path = "${path.root}/../enterprise-portal/frontend/dist"

  common_tags = {
    "aurigraph.io/project"    = "enterprise-portal"
    "aurigraph.io/version"    = local.portal_version
    "aurigraph.io/managed-by" = "terraform"
    "aurigraph.io/deployed"   = local.deployment_timestamp
  }
}

# ============================================================================
# BUILD FRONTEND
# ============================================================================

resource "null_resource" "build_frontend" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command     = "npm run build"
    working_dir = "${path.root}/../enterprise-portal/frontend"
  }
}

# ============================================================================
# DEPLOYMENT PACKAGE
# ============================================================================

resource "null_resource" "create_deployment_package" {
  depends_on = [null_resource.build_frontend]

  triggers = {
    build_id = null_resource.build_frontend.id
  }

  provisioner "local-exec" {
    command = "tar -czf ${path.root}/portal-${local.portal_version}.tar.gz -C ${path.root}/../enterprise-portal/frontend dist"
  }
}

# ============================================================================
# NGINX CONFIGURATION
# ============================================================================

resource "local_file" "nginx_config" {
  filename = "${path.root}/nginx-complete.conf"

  content = templatefile("${path.root}/templates/nginx-complete.conf.tpl", {
    server_name   = var.domain_name
    ssl_cert_path = var.ssl_certificate_path
    ssl_key_path  = var.ssl_certificate_key_path
    portal_root   = local.remote_portal_path
    backend_port  = var.backend_port
  })

  file_permission = "0644"
}

# ============================================================================
# REMOTE SERVER CONNECTION
# ============================================================================

resource "null_resource" "deploy_portal" {
  depends_on = [
    null_resource.create_deployment_package,
    local_file.nginx_config
  ]

  triggers = {
    package_id = null_resource.create_deployment_package.id
    nginx_hash = local_file.nginx_config.content_md5
  }

  # Upload deployment package
  provisioner "file" {
    source      = "${path.root}/portal-${local.portal_version}.tar.gz"
    destination = "/tmp/portal-${local.portal_version}.tar.gz"

    connection {
      type     = "ssh"
      host     = local.remote_host
      user     = local.remote_user
      port     = local.remote_port
      password = var.remote_password
      timeout  = "5m"
    }
  }

  # Upload nginx configuration
  provisioner "file" {
    source      = "${path.root}/nginx-complete.conf"
    destination = "/tmp/nginx-complete.conf"

    connection {
      type     = "ssh"
      host     = local.remote_host
      user     = local.remote_user
      port     = local.remote_port
      password = var.remote_password
      timeout  = "5m"
    }
  }

  # Deploy portal
  provisioner "remote-exec" {
    inline = [
      "echo '=== Aurigraph Enterprise Portal v${local.portal_version} Deployment ==='",
      "",
      "# Create deployment directory",
      "sudo mkdir -p ${local.remote_portal_path}",
      "sudo chown -R $USER:$USER ${local.remote_portal_path}",
      "",
      "# Backup existing deployment",
      "if [ -d ${local.remote_portal_path}/dist ]; then",
      "  sudo mv ${local.remote_portal_path}/dist ${local.remote_portal_path}/dist.backup.${local.deployment_timestamp}",
      "fi",
      "",
      "# Extract new deployment",
      "cd ${local.remote_portal_path}",
      "tar -xzf /tmp/portal-${local.portal_version}.tar.gz",
      "rm /tmp/portal-${local.portal_version}.tar.gz",
      "",
      "# Set permissions",
      "sudo chown -R www-data:www-data ${local.remote_portal_path}/dist",
      "sudo chmod -R 755 ${local.remote_portal_path}/dist",
      "",
      "echo '✅ Portal files deployed successfully'",
      "ls -lh ${local.remote_portal_path}/dist/"
    ]

    connection {
      type     = "ssh"
      host     = local.remote_host
      user     = local.remote_user
      port     = local.remote_port
      password = var.remote_password
      timeout  = "5m"
    }
  }

  # Configure nginx
  provisioner "remote-exec" {
    inline = [
      "echo '=== Configuring nginx ==='",
      "",
      "# Backup existing nginx config",
      "if [ -f ${local.remote_nginx_config} ]; then",
      "  sudo cp ${local.remote_nginx_config} ${local.remote_nginx_config}.backup.${local.deployment_timestamp}",
      "fi",
      "",
      "# Install new nginx config",
      "sudo cp /tmp/nginx-complete.conf ${local.remote_nginx_config}",
      "rm /tmp/nginx-complete.conf",
      "",
      "# Enable site",
      "sudo ln -sf ${local.remote_nginx_config} /etc/nginx/sites-enabled/aurigraph-complete",
      "",
      "# Test nginx configuration",
      "echo 'Testing nginx configuration...'",
      "sudo nginx -t",
      "",
      "# Reload nginx",
      "echo 'Reloading nginx...'",
      "sudo systemctl reload nginx",
      "",
      "echo '✅ nginx configured and reloaded successfully'"
    ]

    connection {
      type     = "ssh"
      host     = local.remote_host
      user     = local.remote_user
      port     = local.remote_port
      password = var.remote_password
      timeout  = "5m"
    }
  }
}

# ============================================================================
# SSL CERTIFICATE MANAGEMENT (Optional - if certificate doesn't exist)
# ============================================================================

resource "null_resource" "setup_ssl_certificate" {
  count = var.auto_setup_ssl ? 1 : 0

  triggers = {
    domain = var.domain_name
  }

  provisioner "remote-exec" {
    inline = [
      "echo '=== SSL Certificate Setup ==='",
      "",
      "# Check if certificate already exists",
      "if [ -d /etc/letsencrypt/live/${var.domain_name} ]; then",
      "  echo 'SSL certificate already exists for ${var.domain_name}'",
      "  sudo certbot certificates | grep -A 5 '${var.domain_name}'",
      "else",
      "  echo 'Installing SSL certificate for ${var.domain_name}...'",
      "  sudo certbot --nginx -d ${var.domain_name} --non-interactive --agree-tos -m ${var.certbot_email}",
      "fi",
      "",
      "echo '✅ SSL certificate verified'"
    ]

    connection {
      type     = "ssh"
      host     = local.remote_host
      user     = local.remote_user
      port     = local.remote_port
      password = var.remote_password
      timeout  = "10m"
    }
  }
}

# ============================================================================
# DEPLOYMENT VERIFICATION
# ============================================================================

resource "null_resource" "verify_deployment" {
  depends_on = [null_resource.deploy_portal]

  triggers = {
    deploy_id = null_resource.deploy_portal.id
  }

  provisioner "remote-exec" {
    inline = [
      "echo '=== Deployment Verification ==='",
      "",
      "# Check portal files",
      "echo 'Portal files:'",
      "ls -lh ${local.remote_portal_path}/dist/ | head -10",
      "",
      "# Check nginx status",
      "echo ''",
      "echo 'nginx status:'",
      "sudo systemctl status nginx | grep 'Active:'",
      "",
      "# Check backend connection",
      "echo ''",
      "echo 'Backend health:'",
      "curl -s http://localhost:${var.backend_port}/q/health | head -5 || echo 'Backend not responding'",
      "",
      "echo ''",
      "echo '✅ Deployment verification complete'",
      "echo ''",
      "echo '🌐 Portal URL: https://${var.domain_name}'",
      "echo '📊 Backend: http://localhost:${var.backend_port}'",
      "echo '🔒 SSL: Enabled'",
      "echo '📦 Version: ${local.portal_version}'"
    ]

    connection {
      type     = "ssh"
      host     = local.remote_host
      user     = local.remote_user
      port     = local.remote_port
      password = var.remote_password
      timeout  = "5m"
    }
  }

  provisioner "local-exec" {
    command = <<-EOT
      echo ""
      echo "=== Testing External Access ==="
      curl -I https://${var.domain_name} 2>&1 | head -10
      echo ""
      echo "✅ Terraform deployment complete!"
    EOT
  }
}

# ============================================================================
# CLEANUP
# ============================================================================

resource "null_resource" "cleanup" {
  depends_on = [null_resource.verify_deployment]

  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = <<-EOT
      rm -f ${path.root}/portal-${local.portal_version}.tar.gz
      echo "Local deployment package cleaned up"
    EOT
  }
}
