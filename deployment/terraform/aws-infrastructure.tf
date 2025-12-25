# Aurigraph V12 - AWS Infrastructure (Primary Region)
# Region: us-east-1
# Services: PostgreSQL HA, Redis, Validators, Business Nodes

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket         = "aurigraph-terraform-state"
    key            = "aws/prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "Aurigraph-DLT"
      Environment = "Production"
      Sprint      = "20-23"
      ManagedBy   = "Terraform"
    }
  }
}

# ============================================================
# VPC and Networking
# ============================================================

resource "aws_vpc" "aurigraph" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "aurigraph-vpc"
  }
}

resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.aurigraph.id
  cidr_block              = "10.0.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "aurigraph-public-subnet-${count.index + 1}"
  }
}

resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.aurigraph.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "aurigraph-private-subnet-${count.index + 1}"
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# ============================================================
# RDS PostgreSQL HA
# ============================================================

resource "aws_db_subnet_group" "aurigraph" {
  name       = "aurigraph-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "aurigraph-db-subnet-group"
  }
}

resource "aws_rds_cluster" "aurigraph" {
  cluster_identifier      = "aurigraph-db-cluster"
  engine                  = "aurora-postgresql"
  engine_version          = "16.1"
  database_name           = "aurigraph"
  master_username         = "aurigraph"
  master_password         = random_password.db_password.result
  db_subnet_group_name    = aws_db_subnet_group.aurigraph.name
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.aurigraph.name

  skip_final_snapshot       = false
  final_snapshot_identifier = "aurigraph-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  enabled_cloudwatch_logs_exports = [
    "postgresql"
  ]

  backup_retention_period = 30
  preferred_backup_window = "03:00-04:00"

  tags = {
    Name = "aurigraph-db-cluster"
  }
}

resource "aws_rds_cluster_instance" "aurigraph" {
  count              = 3
  cluster_identifier = aws_rds_cluster.aurigraph.id
  instance_class     = "db.r6i.xlarge"
  engine              = aws_rds_cluster.aurigraph.engine
  engine_version      = aws_rds_cluster.aurigraph.engine_version

  performance_insights_enabled    = true
  performance_insights_retention_period = 7

  tags = {
    Name = "aurigraph-db-instance-${count.index + 1}"
  }
}

resource "aws_rds_cluster_parameter_group" "aurigraph" {
  family      = "aurora-postgresql16"
  name        = "aurigraph-cluster-params"
  description = "Aurigraph Aurora PostgreSQL parameter group"

  parameter {
    name  = "max_connections"
    value = "1000"
  }

  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory/32768}"
  }

  tags = {
    Name = "aurigraph-cluster-params"
  }
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

# ============================================================
# ElastiCache Redis
# ============================================================

resource "aws_elasticache_subnet_group" "aurigraph" {
  name       = "aurigraph-cache-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "aurigraph-cache-subnet-group"
  }
}

resource "aws_elasticache_cluster" "aurigraph" {
  cluster_id           = "aurigraph-cache"
  engine               = "redis"
  node_type            = "cache.r6g.xlarge"
  num_cache_nodes      = 3
  parameter_group_name = aws_elasticache_parameter_group.aurigraph.name
  engine_version       = "7.0"
  port                 = 6379
  az_mode              = "cross-az"
  subnet_group_name    = aws_elasticache_subnet_group.aurigraph.name

  automatic_failover_enabled = true
  multi_az_enabled          = true

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.elasticache.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "engine-log"
  }

  tags = {
    Name = "aurigraph-cache"
  }
}

resource "aws_elasticache_parameter_group" "aurigraph" {
  name   = "aurigraph-cache-params"
  family = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "timeout"
    value = "300"
  }

  tags = {
    Name = "aurigraph-cache-params"
  }
}

# ============================================================
# ECS Cluster for Validators
# ============================================================

resource "aws_ecs_cluster" "aurigraph" {
  name = "aurigraph-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "aurigraph-cluster"
  }
}

resource "aws_ecs_cluster_capacity_providers" "aurigraph" {
  cluster_name = aws_ecs_cluster.aurigraph.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 2
    weight            = 100
    capacity_provider = "FARGATE"
  }

  default_capacity_provider_strategy {
    weight            = 50
    capacity_provider = "FARGATE_SPOT"
  }
}

# ============================================================
# CloudWatch Logs
# ============================================================

resource "aws_cloudwatch_log_group" "aurigraph" {
  name              = "/aws/ecs/aurigraph"
  retention_in_days = 30

  tags = {
    Name = "aurigraph-logs"
  }
}

resource "aws_cloudwatch_log_group" "elasticache" {
  name              = "/aws/elasticache/aurigraph"
  retention_in_days = 7

  tags = {
    Name = "elasticache-logs"
  }
}

# ============================================================
# Outputs
# ============================================================

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.aurigraph.id
}

output "rds_cluster_endpoint" {
  description = "RDS Cluster endpoint"
  value       = aws_rds_cluster.aurigraph.endpoint
  sensitive   = true
}

output "elasticache_endpoint" {
  description = "ElastiCache endpoint"
  value       = aws_elasticache_cluster.aurigraph.cache_nodes[0].address
}

output "ecs_cluster_name" {
  description = "ECS Cluster name"
  value       = aws_ecs_cluster.aurigraph.name
}

output "db_password_secret" {
  description = "Database password (store in AWS Secrets Manager)"
  value       = random_password.db_password.result
  sensitive   = true
}
