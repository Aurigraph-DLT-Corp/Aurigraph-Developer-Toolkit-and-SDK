# Aurigraph V11 - AWS Variables
# Variable definitions for AWS infrastructure

variable "primary_region" {
  description = "Primary AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for deployment"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "aurigraph-v11"
}

variable "domain_name" {
  description = "Domain name for Route 53"
  type        = string
  default     = "dlt.aurigraph.io"
}

# Instance Configuration
variable "validator_instance_type" {
  description = "EC2 instance type for validator nodes"
  type        = string
  default     = "c6i.4xlarge"  # 16 vCPUs, 32GB RAM
}

variable "business_instance_type" {
  description = "EC2 instance type for business nodes"
  type        = string
  default     = "c6i.2xlarge"  # 8 vCPUs, 16GB RAM
}

variable "slim_instance_type" {
  description = "EC2 instance type for slim nodes"
  type        = string
  default     = "t3.large"     # 2 vCPUs, 8GB RAM
}

variable "key_name" {
  description = "EC2 key pair name for SSH access"
  type        = string
}

# Database Configuration
variable "db_username" {
  description = "Master username for RDS PostgreSQL"
  type        = string
  default     = "aurigraph_admin"
  sensitive   = true
}

variable "db_password" {
  description = "Master password for RDS PostgreSQL"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.xlarge"  # 4 vCPUs, 32GB RAM
}

# Redis Configuration
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.r6g.large"  # 2 vCPUs, 13.07GB RAM
}

# Networking
variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access the infrastructure"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # Restrict in production
}

# Monitoring
variable "enable_enhanced_monitoring" {
  description = "Enable enhanced monitoring for RDS"
  type        = bool
  default     = true
}

variable "cloudwatch_retention_days" {
  description = "CloudWatch logs retention in days"
  type        = number
  default     = 30
}

# Auto Scaling
variable "enable_auto_scaling" {
  description = "Enable auto-scaling for business and slim nodes"
  type        = bool
  default     = true
}

variable "auto_scaling_min_size" {
  description = "Minimum number of instances in auto-scaling group"
  type        = number
  default     = 2
}

variable "auto_scaling_max_size" {
  description = "Maximum number of instances in auto-scaling group"
  type        = number
  default     = 10
}

# Backup Configuration
variable "db_backup_retention_period" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 30
}

variable "db_backup_window" {
  description = "Preferred backup window (UTC)"
  type        = string
  default     = "03:00-04:00"
}

variable "db_maintenance_window" {
  description = "Preferred maintenance window (UTC)"
  type        = string
  default     = "mon:04:00-mon:05:00"
}

# Tags
variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project    = "Aurigraph-V11"
    ManagedBy  = "Terraform"
    Owner      = "DevOps-Team"
  }
}
