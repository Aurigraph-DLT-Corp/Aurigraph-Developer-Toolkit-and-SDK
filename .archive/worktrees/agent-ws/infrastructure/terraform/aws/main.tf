# Aurigraph V11 - AWS Multi-Region Infrastructure
# Terraform Configuration for AWS Deployment
# Version: 1.0.0
# Regions: us-east-1 (primary), us-west-2 (secondary)

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "aurigraph-terraform-state"
    key            = "v11/aws/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "aurigraph-terraform-locks"
  }
}

# Primary Region Provider (us-east-1)
provider "aws" {
  region = var.primary_region
  alias  = "primary"

  default_tags {
    tags = {
      Project     = "Aurigraph-V11"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Region      = "primary"
      CreatedBy   = "Agent-4-MultiCloud"
    }
  }
}

# Secondary Region Provider (us-west-2)
provider "aws" {
  region = var.secondary_region
  alias  = "secondary"

  default_tags {
    tags = {
      Project     = "Aurigraph-V11"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Region      = "secondary"
      CreatedBy   = "Agent-4-MultiCloud"
    }
  }
}

# Primary Region Resources
module "vpc_primary" {
  source = "./modules/vpc"

  providers = {
    aws = aws.primary
  }

  region              = var.primary_region
  vpc_cidr            = "10.0.0.0/16"
  availability_zones  = ["us-east-1a", "us-east-1b", "us-east-1c"]
  environment         = var.environment
  project_name        = var.project_name
}

module "validators_primary" {
  source = "./modules/compute"

  providers = {
    aws = aws.primary
  }

  region             = var.primary_region
  vpc_id             = module.vpc_primary.vpc_id
  private_subnet_ids = module.vpc_primary.private_subnet_ids

  node_type          = "validator"
  instance_type      = var.validator_instance_type
  instance_count     = 4
  key_name           = var.key_name

  environment        = var.environment
  project_name       = var.project_name
}

module "business_primary" {
  source = "./modules/compute"

  providers = {
    aws = aws.primary
  }

  region             = var.primary_region
  vpc_id             = module.vpc_primary.vpc_id
  private_subnet_ids = module.vpc_primary.private_subnet_ids

  node_type          = "business"
  instance_type      = var.business_instance_type
  instance_count     = 6
  key_name           = var.key_name

  environment        = var.environment
  project_name       = var.project_name
}

module "slim_primary" {
  source = "./modules/compute"

  providers = {
    aws = aws.primary
  }

  region             = var.primary_region
  vpc_id             = module.vpc_primary.vpc_id
  private_subnet_ids = module.vpc_primary.private_subnet_ids

  node_type          = "slim"
  instance_type      = var.slim_instance_type
  instance_count     = 12
  key_name           = var.key_name

  environment        = var.environment
  project_name       = var.project_name
}

module "rds_primary" {
  source = "./modules/rds"

  providers = {
    aws = aws.primary
  }

  region                 = var.primary_region
  vpc_id                 = module.vpc_primary.vpc_id
  database_subnet_ids    = module.vpc_primary.database_subnet_ids

  db_name                = "aurigraph_db"
  db_username            = var.db_username
  db_password            = var.db_password
  db_instance_class      = var.db_instance_class
  multi_az               = true

  environment            = var.environment
  project_name           = var.project_name
}

module "elasticache_primary" {
  source = "./modules/elasticache"

  providers = {
    aws = aws.primary
  }

  region                 = var.primary_region
  vpc_id                 = module.vpc_primary.vpc_id
  private_subnet_ids     = module.vpc_primary.private_subnet_ids

  cluster_id             = "aurigraph-redis-primary"
  node_type              = var.redis_node_type
  num_cache_nodes        = 3

  environment            = var.environment
  project_name           = var.project_name
}

module "load_balancer_primary" {
  source = "./modules/load-balancer"

  providers = {
    aws = aws.primary
  }

  region             = var.primary_region
  vpc_id             = module.vpc_primary.vpc_id
  public_subnet_ids  = module.vpc_primary.public_subnet_ids

  validator_instance_ids = module.validators_primary.instance_ids
  business_instance_ids  = module.business_primary.instance_ids
  slim_instance_ids      = module.slim_primary.instance_ids

  environment        = var.environment
  project_name       = var.project_name
}

# Secondary Region Resources
module "vpc_secondary" {
  source = "./modules/vpc"

  providers = {
    aws = aws.secondary
  }

  region              = var.secondary_region
  vpc_cidr            = "10.1.0.0/16"
  availability_zones  = ["us-west-2a", "us-west-2b", "us-west-2c"]
  environment         = var.environment
  project_name        = var.project_name
}

module "validators_secondary" {
  source = "./modules/compute"

  providers = {
    aws = aws.secondary
  }

  region             = var.secondary_region
  vpc_id             = module.vpc_secondary.vpc_id
  private_subnet_ids = module.vpc_secondary.private_subnet_ids

  node_type          = "validator"
  instance_type      = var.validator_instance_type
  instance_count     = 2
  key_name           = var.key_name

  environment        = var.environment
  project_name       = var.project_name
}

module "business_secondary" {
  source = "./modules/compute"

  providers = {
    aws = aws.secondary
  }

  region             = var.secondary_region
  vpc_id             = module.vpc_secondary.vpc_id
  private_subnet_ids = module.vpc_secondary.private_subnet_ids

  node_type          = "business"
  instance_type      = var.business_instance_type
  instance_count     = 6
  key_name           = var.key_name

  environment        = var.environment
  project_name       = var.project_name
}

module "slim_secondary" {
  source = "./modules/compute"

  providers = {
    aws = aws.secondary
  }

  region             = var.secondary_region
  vpc_id             = module.vpc_secondary.vpc_id
  private_subnet_ids = module.vpc_secondary.private_subnet_ids

  node_type          = "slim"
  instance_type      = var.slim_instance_type
  instance_count     = 12
  key_name           = var.key_name

  environment        = var.environment
  project_name       = var.project_name
}

module "rds_secondary" {
  source = "./modules/rds"

  providers = {
    aws = aws.secondary
  }

  region                 = var.secondary_region
  vpc_id                 = module.vpc_secondary.vpc_id
  database_subnet_ids    = module.vpc_secondary.database_subnet_ids

  db_name                = "aurigraph_db"
  db_username            = var.db_username
  db_password            = var.db_password
  db_instance_class      = var.db_instance_class
  multi_az               = true

  environment            = var.environment
  project_name           = var.project_name
}

module "elasticache_secondary" {
  source = "./modules/elasticache"

  providers = {
    aws = aws.secondary
  }

  region                 = var.secondary_region
  vpc_id                 = module.vpc_secondary.vpc_id
  private_subnet_ids     = module.vpc_secondary.private_subnet_ids

  cluster_id             = "aurigraph-redis-secondary"
  node_type              = var.redis_node_type
  num_cache_nodes        = 3

  environment            = var.environment
  project_name           = var.project_name
}

module "load_balancer_secondary" {
  source = "./modules/load-balancer"

  providers = {
    aws = aws.secondary
  }

  region             = var.secondary_region
  vpc_id             = module.vpc_secondary.vpc_id
  public_subnet_ids  = module.vpc_secondary.public_subnet_ids

  validator_instance_ids = module.validators_secondary.instance_ids
  business_instance_ids  = module.business_secondary.instance_ids
  slim_instance_ids      = module.slim_secondary.instance_ids

  environment        = var.environment
  project_name       = var.project_name
}

# VPC Peering between regions
resource "aws_vpc_peering_connection" "primary_to_secondary" {
  provider    = aws.primary
  vpc_id      = module.vpc_primary.vpc_id
  peer_vpc_id = module.vpc_secondary.vpc_id
  peer_region = var.secondary_region
  auto_accept = false

  tags = {
    Name = "${var.project_name}-vpc-peering"
  }
}

resource "aws_vpc_peering_connection_accepter" "secondary_accept" {
  provider                  = aws.secondary
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  auto_accept               = true
}

# Route 53 DNS Configuration
module "route53" {
  source = "./modules/route53"

  providers = {
    aws = aws.primary
  }

  domain_name = var.domain_name

  primary_lb_dns   = module.load_balancer_primary.alb_dns_name
  primary_lb_zone  = module.load_balancer_primary.alb_zone_id

  secondary_lb_dns = module.load_balancer_secondary.alb_dns_name
  secondary_lb_zone = module.load_balancer_secondary.alb_zone_id

  environment = var.environment
  project_name = var.project_name
}

# S3 Bucket for Blockchain Data
resource "aws_s3_bucket" "blockchain_data" {
  provider = aws.primary
  bucket   = "${var.project_name}-blockchain-data-${var.environment}"

  tags = {
    Name = "${var.project_name}-blockchain-data"
  }
}

resource "aws_s3_bucket_versioning" "blockchain_data" {
  provider = aws.primary
  bucket   = aws_s3_bucket.blockchain_data.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "blockchain_data" {
  provider = aws.primary
  bucket   = aws_s3_bucket.blockchain_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.blockchain_data.arn
    }
  }
}

# KMS Key for Encryption
resource "aws_kms_key" "blockchain_data" {
  provider                = aws.primary
  description             = "KMS key for Aurigraph blockchain data encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name = "${var.project_name}-kms-key"
  }
}

resource "aws_kms_alias" "blockchain_data" {
  provider      = aws.primary
  name          = "alias/${var.project_name}-blockchain-data"
  target_key_id = aws_kms_key.blockchain_data.key_id
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "aurigraph" {
  provider          = aws.primary
  name              = "/aws/aurigraph/${var.environment}"
  retention_in_days = 30

  tags = {
    Name = "${var.project_name}-logs"
  }
}

# Outputs
output "primary_vpc_id" {
  description = "Primary VPC ID"
  value       = module.vpc_primary.vpc_id
}

output "secondary_vpc_id" {
  description = "Secondary VPC ID"
  value       = module.vpc_secondary.vpc_id
}

output "primary_alb_dns" {
  description = "Primary ALB DNS name"
  value       = module.load_balancer_primary.alb_dns_name
}

output "secondary_alb_dns" {
  description = "Secondary ALB DNS name"
  value       = module.load_balancer_secondary.alb_dns_name
}

output "primary_rds_endpoint" {
  description = "Primary RDS endpoint"
  value       = module.rds_primary.db_endpoint
  sensitive   = true
}

output "secondary_rds_endpoint" {
  description = "Secondary RDS endpoint"
  value       = module.rds_secondary.db_endpoint
  sensitive   = true
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = module.route53.zone_id
}

output "s3_bucket_name" {
  description = "S3 bucket for blockchain data"
  value       = aws_s3_bucket.blockchain_data.id
}
