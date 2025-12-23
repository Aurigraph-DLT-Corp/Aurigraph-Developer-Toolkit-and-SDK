# Aurigraph V11 - GCP Multi-Region Infrastructure
# Terraform Configuration for GCP Deployment
# Version: 1.0.0
# Regions: us-central1 (primary), us-west1 (secondary)

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "aurigraph-terraform-state"
    prefix = "v11/gcp"
  }
}

provider "google" {
  project = var.project_id
  region  = var.primary_region
}

# VPC Network (Global)
resource "google_compute_network" "vpc" {
  name                    = "${var.project_name}-vpc"
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
}

# Subnets - Primary Region (us-central1)
resource "google_compute_subnetwork" "primary_public" {
  name          = "${var.project_name}-subnet-primary-public"
  ip_cidr_range = "10.20.1.0/24"
  region        = var.primary_region
  network       = google_compute_network.vpc.id

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.20.10.0/24"
  }

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.20.20.0/24"
  }
}

resource "google_compute_subnetwork" "primary_private" {
  name          = "${var.project_name}-subnet-primary-private"
  ip_cidr_range = "10.20.2.0/24"
  region        = var.primary_region
  network       = google_compute_network.vpc.id
}

# Subnets - Secondary Region (us-west1)
resource "google_compute_subnetwork" "secondary_public" {
  name          = "${var.project_name}-subnet-secondary-public"
  ip_cidr_range = "10.21.1.0/24"
  region        = var.secondary_region
  network       = google_compute_network.vpc.id
}

resource "google_compute_subnetwork" "secondary_private" {
  name          = "${var.project_name}-subnet-secondary-private"
  ip_cidr_range = "10.21.2.0/24"
  region        = var.secondary_region
  network       = google_compute_network.vpc.id
}

# Firewall Rules
resource "google_compute_firewall" "allow_internal" {
  name    = "${var.project_name}-allow-internal"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = ["10.20.0.0/16", "10.21.0.0/16"]
}

resource "google_compute_firewall" "allow_https" {
  name    = "${var.project_name}-allow-https"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["https-server"]
}

resource "google_compute_firewall" "allow_aurigraph_api" {
  name    = "${var.project_name}-allow-api"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["9003", "9004"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["aurigraph-api"]
}

resource "google_compute_firewall" "allow_ssh" {
  name    = "${var.project_name}-allow-ssh"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = [var.admin_cidr]
  target_tags   = ["ssh-access"]
}

resource "google_compute_firewall" "allow_health_check" {
  name    = "${var.project_name}-allow-health-check"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["9003"]
  }

  source_ranges = ["35.191.0.0/16", "130.211.0.0/22"]  # GCP health check ranges
  target_tags   = ["aurigraph-api"]
}

# Cloud Router and NAT (for private instances)
resource "google_compute_router" "primary" {
  name    = "${var.project_name}-router-primary"
  region  = var.primary_region
  network = google_compute_network.vpc.id
}

resource "google_compute_router_nat" "primary" {
  name                               = "${var.project_name}-nat-primary"
  router                             = google_compute_router.primary.name
  region                             = google_compute_router.primary.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}

resource "google_compute_router" "secondary" {
  name    = "${var.project_name}-router-secondary"
  region  = var.secondary_region
  network = google_compute_network.vpc.id
}

resource "google_compute_router_nat" "secondary" {
  name                               = "${var.project_name}-nat-secondary"
  router                             = google_compute_router.secondary.name
  region                             = google_compute_router.secondary.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}

# Instance Templates - Validator
resource "google_compute_instance_template" "validator" {
  name_prefix  = "${var.project_name}-validator-"
  machine_type = var.validator_machine_type
  region       = var.primary_region

  tags = ["aurigraph-api", "validator", "ssh-access"]

  disk {
    source_image = "debian-cloud/debian-11"
    auto_delete  = true
    boot         = true
    disk_size_gb = 100
  }

  disk {
    disk_type    = "pd-ssd"
    disk_size_gb = 500
    auto_delete  = true
    boot         = false
  }

  network_interface {
    subnetwork = google_compute_subnetwork.primary_private.id

    access_config {
      // Ephemeral public IP
    }
  }

  metadata = {
    ssh-keys = "${var.admin_username}:${var.ssh_public_key}"
  }

  service_account {
    email  = google_service_account.aurigraph.email
    scopes = ["cloud-platform"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Managed Instance Groups - Validators Primary
resource "google_compute_instance_group_manager" "validators_primary" {
  name               = "${var.project_name}-validators-primary"
  base_instance_name = "${var.project_name}-validator"
  zone               = "${var.primary_region}-a"
  target_size        = 4

  version {
    instance_template = google_compute_instance_template.validator.id
  }

  named_port {
    name = "http"
    port = 9003
  }

  auto_healing_policies {
    health_check      = google_compute_health_check.aurigraph.id
    initial_delay_sec = 300
  }
}

# Instance Templates - Business Nodes
resource "google_compute_instance_template" "business" {
  name_prefix  = "${var.project_name}-business-"
  machine_type = var.business_machine_type
  region       = var.primary_region

  tags = ["aurigraph-api", "business", "ssh-access"]

  disk {
    source_image = "debian-cloud/debian-11"
    auto_delete  = true
    boot         = true
    disk_size_gb = 100
  }

  disk {
    disk_type    = "pd-ssd"
    disk_size_gb = 250
    auto_delete  = true
    boot         = false
  }

  network_interface {
    subnetwork = google_compute_subnetwork.primary_private.id

    access_config {
      // Ephemeral public IP
    }
  }

  metadata = {
    ssh-keys = "${var.admin_username}:${var.ssh_public_key}"
  }

  service_account {
    email  = google_service_account.aurigraph.email
    scopes = ["cloud-platform"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Managed Instance Groups - Business Primary
resource "google_compute_instance_group_manager" "business_primary" {
  name               = "${var.project_name}-business-primary"
  base_instance_name = "${var.project_name}-business"
  zone               = "${var.primary_region}-a"
  target_size        = 6

  version {
    instance_template = google_compute_instance_template.business.id
  }

  named_port {
    name = "http"
    port = 9003
  }

  auto_healing_policies {
    health_check      = google_compute_health_check.aurigraph.id
    initial_delay_sec = 300
  }
}

# Cloud SQL (PostgreSQL) - Primary
resource "google_sql_database_instance" "primary" {
  name             = "${var.project_name}-postgres-primary"
  database_version = "POSTGRES_16"
  region           = var.primary_region

  settings {
    tier              = var.db_tier
    availability_type = "REGIONAL"  # High availability
    disk_type         = "PD_SSD"
    disk_size         = 500

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "03:00"
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 30
      }
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
      require_ssl     = true
    }

    database_flags {
      name  = "max_connections"
      value = "200"
    }

    database_flags {
      name  = "shared_buffers"
      value = "8192000"  # 8GB in 8KB pages
    }
  }

  deletion_protection = true

  depends_on = [google_service_networking_connection.private_vpc_connection]
}

resource "google_sql_database" "aurigraph" {
  name     = "aurigraph_db"
  instance = google_sql_database_instance.primary.name
}

resource "google_sql_user" "aurigraph" {
  name     = var.db_admin_username
  instance = google_sql_database_instance.primary.name
  password = var.db_admin_password
}

# Private VPC Connection for Cloud SQL
resource "google_compute_global_address" "private_ip_address" {
  name          = "${var.project_name}-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}

# Memorystore (Redis) - Primary
resource "google_redis_instance" "primary" {
  name               = "${var.project_name}-redis-primary"
  tier               = "STANDARD_HA"
  memory_size_gb     = 5
  region             = var.primary_region
  redis_version      = "REDIS_7_0"
  auth_enabled       = true
  transit_encryption_mode = "SERVER_AUTHENTICATION"

  authorized_network = google_compute_network.vpc.id

  replica_count = 1
  read_replicas_mode = "READ_REPLICAS_ENABLED"
}

# Cloud Load Balancer (Global)
resource "google_compute_health_check" "aurigraph" {
  name = "${var.project_name}-health-check"

  http_health_check {
    port         = 9003
    request_path = "/q/health"
  }

  check_interval_sec  = 10
  timeout_sec         = 5
  healthy_threshold   = 2
  unhealthy_threshold = 3
}

resource "google_compute_backend_service" "aurigraph" {
  name                  = "${var.project_name}-backend-service"
  protocol              = "HTTP"
  port_name             = "http"
  timeout_sec           = 30
  enable_cdn            = false
  health_checks         = [google_compute_health_check.aurigraph.id]
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group           = google_compute_instance_group_manager.validators_primary.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
  }

  backend {
    group           = google_compute_instance_group_manager.business_primary.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1.0
  }
}

resource "google_compute_url_map" "aurigraph" {
  name            = "${var.project_name}-url-map"
  default_service = google_compute_backend_service.aurigraph.id
}

resource "google_compute_target_http_proxy" "aurigraph" {
  name    = "${var.project_name}-http-proxy"
  url_map = google_compute_url_map.aurigraph.id
}

resource "google_compute_global_forwarding_rule" "aurigraph" {
  name                  = "${var.project_name}-forwarding-rule"
  ip_protocol           = "TCP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_range            = "80"
  target                = google_compute_target_http_proxy.aurigraph.id
}

# Cloud Storage Bucket for Blockchain Data
resource "google_storage_bucket" "blockchain_data" {
  name          = "${var.project_name}-blockchain-data-${var.project_id}"
  location      = "US"  # Multi-region
  storage_class = "STANDARD"

  versioning {
    enabled = true
  }

  encryption {
    default_kms_key_name = google_kms_crypto_key.blockchain_data.id
  }

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }
}

# KMS for Encryption
resource "google_kms_key_ring" "aurigraph" {
  name     = "${var.project_name}-keyring"
  location = var.primary_region
}

resource "google_kms_crypto_key" "blockchain_data" {
  name            = "${var.project_name}-blockchain-key"
  key_ring        = google_kms_key_ring.aurigraph.id
  rotation_period = "7776000s"  # 90 days

  lifecycle {
    prevent_destroy = true
  }
}

# Service Account
resource "google_service_account" "aurigraph" {
  account_id   = "${var.project_name}-sa"
  display_name = "Aurigraph V11 Service Account"
}

resource "google_project_iam_member" "aurigraph_compute" {
  project = var.project_id
  role    = "roles/compute.instanceAdmin.v1"
  member  = "serviceAccount:${google_service_account.aurigraph.email}"
}

resource "google_project_iam_member" "aurigraph_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.aurigraph.email}"
}

# Cloud DNS
resource "google_dns_managed_zone" "aurigraph" {
  name     = "${var.project_name}-dns-zone"
  dns_name = "${var.domain_name}."

  description = "DNS zone for Aurigraph V11"
}

# Outputs
output "vpc_id" {
  description = "VPC Network ID"
  value       = google_compute_network.vpc.id
}

output "primary_subnet_id" {
  description = "Primary subnet ID"
  value       = google_compute_subnetwork.primary_private.id
}

output "load_balancer_ip" {
  description = "Load balancer IP address"
  value       = google_compute_global_forwarding_rule.aurigraph.ip_address
}

output "postgres_connection_name" {
  description = "Cloud SQL connection name"
  value       = google_sql_database_instance.primary.connection_name
  sensitive   = true
}

output "postgres_private_ip" {
  description = "Cloud SQL private IP"
  value       = google_sql_database_instance.primary.private_ip_address
  sensitive   = true
}

output "redis_host" {
  description = "Redis host"
  value       = google_redis_instance.primary.host
  sensitive   = true
}

output "storage_bucket_name" {
  description = "Cloud Storage bucket name"
  value       = google_storage_bucket.blockchain_data.name
}
