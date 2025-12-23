# Aurigraph Enterprise Portal v4.0.0 - Terraform Variables

# ============================================================================
# REMOTE SERVER CONFIGURATION
# ============================================================================

variable "remote_host" {
  description = "Remote server hostname or IP address"
  type        = string
  default     = "dlt.aurigraph.io"
}

variable "remote_user" {
  description = "SSH username for remote server"
  type        = string
  default     = "subbu"
}

variable "remote_port" {
  description = "SSH port for remote server"
  type        = number
  default     = 22
}

variable "remote_password" {
  description = "SSH password for remote server (use environment variable TF_VAR_remote_password)"
  type        = string
  sensitive   = true
}

# ============================================================================
# DOMAIN AND SSL CONFIGURATION
# ============================================================================

variable "domain_name" {
  description = "Domain name for the enterprise portal"
  type        = string
  default     = "dlt.aurigraph.io"
}

variable "ssl_certificate_path" {
  description = "Path to SSL certificate on remote server"
  type        = string
  default     = "/etc/letsencrypt/live/dlt.aurigraph.io-0001/fullchain.pem"
}

variable "ssl_certificate_key_path" {
  description = "Path to SSL certificate key on remote server"
  type        = string
  default     = "/etc/letsencrypt/live/dlt.aurigraph.io-0001/privkey.pem"
}

variable "auto_setup_ssl" {
  description = "Automatically setup SSL certificate with certbot if not exists"
  type        = bool
  default     = false
}

variable "certbot_email" {
  description = "Email address for Let's Encrypt certbot registration"
  type        = string
  default     = "subbu@aurigraph.io"
}

# ============================================================================
# BACKEND CONFIGURATION
# ============================================================================

variable "backend_port" {
  description = "Port number for Aurigraph V11 backend"
  type        = number
  default     = 8443
}

# ============================================================================
# DEPLOYMENT CONFIGURATION
# ============================================================================

variable "environment" {
  description = "Deployment environment (dev, staging, production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: dev, staging, production"
  }
}

variable "enable_backup" {
  description = "Enable automatic backup of previous deployment"
  type        = bool
  default     = true
}

variable "retention_days" {
  description = "Number of days to retain deployment backups"
  type        = number
  default     = 7
}

# ============================================================================
# MONITORING CONFIGURATION
# ============================================================================

variable "enable_monitoring" {
  description = "Enable deployment monitoring and health checks"
  type        = bool
  default     = true
}

variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 30
}

# ============================================================================
# SECURITY CONFIGURATION
# ============================================================================

variable "allowed_ips" {
  description = "List of allowed IP addresses for SSH access (optional)"
  type        = list(string)
  default     = []
}

variable "enable_fail2ban" {
  description = "Enable fail2ban for SSH protection"
  type        = bool
  default     = true
}

# ============================================================================
# ADVANCED CONFIGURATION
# ============================================================================

variable "nginx_worker_processes" {
  description = "Number of nginx worker processes"
  type        = number
  default     = 16
}

variable "nginx_worker_connections" {
  description = "Maximum number of nginx worker connections"
  type        = number
  default     = 2048
}

variable "enable_http2" {
  description = "Enable HTTP/2 protocol"
  type        = bool
  default     = true
}

variable "enable_gzip" {
  description = "Enable gzip compression"
  type        = bool
  default     = true
}

variable "gzip_compression_level" {
  description = "Gzip compression level (1-9)"
  type        = number
  default     = 6

  validation {
    condition     = var.gzip_compression_level >= 1 && var.gzip_compression_level <= 9
    error_message = "Gzip compression level must be between 1 and 9"
  }
}
