# Aurigraph V11 - Azure Multi-Region Infrastructure
# Terraform Configuration for Azure Deployment
# Version: 1.0.0
# Regions: eastus (primary), westus (secondary)

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "aurigraph-terraform-state"
    storage_account_name = "aurigraphtfstate"
    container_name       = "tfstate"
    key                  = "v11/azure/terraform.tfstate"
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

# Resource Groups
resource "azurerm_resource_group" "primary" {
  name     = "${var.project_name}-${var.environment}-eastus"
  location = var.primary_region

  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Region      = "primary"
  }
}

resource "azurerm_resource_group" "secondary" {
  name     = "${var.project_name}-${var.environment}-westus"
  location = var.secondary_region

  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Region      = "secondary"
  }
}

# Virtual Networks - Primary Region
resource "azurerm_virtual_network" "primary" {
  name                = "${var.project_name}-vnet-primary"
  location            = azurerm_resource_group.primary.location
  resource_group_name = azurerm_resource_group.primary.name
  address_space       = ["10.10.0.0/16"]

  tags = azurerm_resource_group.primary.tags
}

resource "azurerm_subnet" "primary_public" {
  count                = 3
  name                 = "${var.project_name}-subnet-public-${count.index + 1}"
  resource_group_name  = azurerm_resource_group.primary.name
  virtual_network_name = azurerm_virtual_network.primary.name
  address_prefixes     = ["10.10.${count.index + 1}.0/24"]
}

resource "azurerm_subnet" "primary_private" {
  count                = 3
  name                 = "${var.project_name}-subnet-private-${count.index + 1}"
  resource_group_name  = azurerm_resource_group.primary.name
  virtual_network_name = azurerm_virtual_network.primary.name
  address_prefixes     = ["10.10.${count.index + 11}.0/24"]
}

resource "azurerm_subnet" "primary_database" {
  name                 = "${var.project_name}-subnet-database"
  resource_group_name  = azurerm_resource_group.primary.name
  virtual_network_name = azurerm_virtual_network.primary.name
  address_prefixes     = ["10.10.21.0/24"]

  delegation {
    name = "postgres-delegation"
    service_delegation {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action",
      ]
    }
  }
}

# Virtual Networks - Secondary Region
resource "azurerm_virtual_network" "secondary" {
  name                = "${var.project_name}-vnet-secondary"
  location            = azurerm_resource_group.secondary.location
  resource_group_name = azurerm_resource_group.secondary.name
  address_space       = ["10.11.0.0/16"]

  tags = azurerm_resource_group.secondary.tags
}

resource "azurerm_subnet" "secondary_public" {
  count                = 3
  name                 = "${var.project_name}-subnet-public-${count.index + 1}"
  resource_group_name  = azurerm_resource_group.secondary.name
  virtual_network_name = azurerm_virtual_network.secondary.name
  address_prefixes     = ["10.11.${count.index + 1}.0/24"]
}

resource "azurerm_subnet" "secondary_private" {
  count                = 3
  name                 = "${var.project_name}-subnet-private-${count.index + 1}"
  resource_group_name  = azurerm_resource_group.secondary.name
  virtual_network_name = azurerm_virtual_network.secondary.name
  address_prefixes     = ["10.11.${count.index + 11}.0/24"]
}

# VNet Peering
resource "azurerm_virtual_network_peering" "primary_to_secondary" {
  name                      = "${var.project_name}-peer-primary-to-secondary"
  resource_group_name       = azurerm_resource_group.primary.name
  virtual_network_name      = azurerm_virtual_network.primary.name
  remote_virtual_network_id = azurerm_virtual_network.secondary.id
  allow_forwarded_traffic   = true
  allow_gateway_transit     = true
}

resource "azurerm_virtual_network_peering" "secondary_to_primary" {
  name                      = "${var.project_name}-peer-secondary-to-primary"
  resource_group_name       = azurerm_resource_group.secondary.name
  virtual_network_name      = azurerm_virtual_network.secondary.name
  remote_virtual_network_id = azurerm_virtual_network.primary.id
  allow_forwarded_traffic   = true
  use_remote_gateways       = true

  depends_on = [azurerm_virtual_network_peering.primary_to_secondary]
}

# Network Security Groups
resource "azurerm_network_security_group" "primary" {
  name                = "${var.project_name}-nsg-primary"
  location            = azurerm_resource_group.primary.location
  resource_group_name = azurerm_resource_group.primary.name

  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowAurigraphAPI"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "9003"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowSSH"
    priority                   = 120
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = var.admin_cidr
    destination_address_prefix = "*"
  }

  tags = azurerm_resource_group.primary.tags
}

# Validator Nodes - Primary Region
module "validators_primary" {
  source = "./modules/compute"

  resource_group_name = azurerm_resource_group.primary.name
  location            = azurerm_resource_group.primary.location
  subnet_id           = azurerm_subnet.primary_private[0].id
  nsg_id              = azurerm_network_security_group.primary.id

  node_type           = "validator"
  vm_size             = var.validator_vm_size
  instance_count      = 4
  admin_username      = var.admin_username
  ssh_public_key      = var.ssh_public_key

  environment         = var.environment
  project_name        = var.project_name
}

# Business Nodes - Primary Region
module "business_primary" {
  source = "./modules/compute"

  resource_group_name = azurerm_resource_group.primary.name
  location            = azurerm_resource_group.primary.location
  subnet_id           = azurerm_subnet.primary_private[1].id
  nsg_id              = azurerm_network_security_group.primary.id

  node_type           = "business"
  vm_size             = var.business_vm_size
  instance_count      = 6
  admin_username      = var.admin_username
  ssh_public_key      = var.ssh_public_key

  environment         = var.environment
  project_name        = var.project_name
}

# Slim Nodes - Primary Region
module "slim_primary" {
  source = "./modules/compute"

  resource_group_name = azurerm_resource_group.primary.name
  location            = azurerm_resource_group.primary.location
  subnet_id           = azurerm_subnet.primary_private[2].id
  nsg_id              = azurerm_network_security_group.primary.id

  node_type           = "slim"
  vm_size             = var.slim_vm_size
  instance_count      = 12
  admin_username      = var.admin_username
  ssh_public_key      = var.ssh_public_key

  environment         = var.environment
  project_name        = var.project_name
}

# PostgreSQL - Primary Region
resource "azurerm_postgresql_flexible_server" "primary" {
  name                   = "${var.project_name}-postgres-primary"
  resource_group_name    = azurerm_resource_group.primary.name
  location               = azurerm_resource_group.primary.location
  version                = "16"
  administrator_login    = var.db_admin_username
  administrator_password = var.db_admin_password
  zone                   = "1"

  sku_name   = var.db_sku_name
  storage_mb = 524288  # 512 GB

  backup_retention_days        = 30
  geo_redundant_backup_enabled = true

  high_availability {
    mode                      = "ZoneRedundant"
    standby_availability_zone = "2"
  }

  delegated_subnet_id = azurerm_subnet.primary_database.id

  tags = azurerm_resource_group.primary.tags
}

resource "azurerm_postgresql_flexible_server_database" "primary" {
  name      = "aurigraph_db"
  server_id = azurerm_postgresql_flexible_server.primary.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Redis Cache - Primary Region
resource "azurerm_redis_cache" "primary" {
  name                = "${var.project_name}-redis-primary"
  location            = azurerm_resource_group.primary.location
  resource_group_name = azurerm_resource_group.primary.name
  capacity            = 1
  family              = "P"
  sku_name            = "Premium"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"

  redis_configuration {
    enable_authentication = true
  }

  zones = ["1", "2", "3"]

  tags = azurerm_resource_group.primary.tags
}

# Application Gateway (Load Balancer) - Primary
resource "azurerm_public_ip" "primary_appgw" {
  name                = "${var.project_name}-appgw-pip-primary"
  resource_group_name = azurerm_resource_group.primary.name
  location            = azurerm_resource_group.primary.location
  allocation_method   = "Static"
  sku                 = "Standard"

  tags = azurerm_resource_group.primary.tags
}

# Key Vault for Secrets
resource "azurerm_key_vault" "primary" {
  name                       = "${var.project_name}-kv-${substr(uuid(), 0, 8)}"
  location                   = azurerm_resource_group.primary.location
  resource_group_name        = azurerm_resource_group.primary.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "premium"
  soft_delete_retention_days = 90
  purge_protection_enabled   = true

  network_acls {
    bypass         = "AzureServices"
    default_action = "Deny"
  }

  tags = azurerm_resource_group.primary.tags
}

data "azurerm_client_config" "current" {}

# Storage Account for Blockchain Data
resource "azurerm_storage_account" "blockchain_data" {
  name                     = "${var.project_name}blockchain${var.environment}"
  resource_group_name      = azurerm_resource_group.primary.name
  location                 = azurerm_resource_group.primary.location
  account_tier             = "Standard"
  account_replication_type = "GRS"  # Geo-redundant
  account_kind             = "StorageV2"
  access_tier              = "Hot"

  blob_properties {
    versioning_enabled = true
  }

  tags = azurerm_resource_group.primary.tags
}

resource "azurerm_storage_container" "blockchain_data" {
  name                  = "blockchain-data"
  storage_account_name  = azurerm_storage_account.blockchain_data.name
  container_access_type = "private"
}

# Outputs
output "primary_vnet_id" {
  description = "Primary VNet ID"
  value       = azurerm_virtual_network.primary.id
}

output "secondary_vnet_id" {
  description = "Secondary VNet ID"
  value       = azurerm_virtual_network.secondary.id
}

output "primary_postgres_fqdn" {
  description = "Primary PostgreSQL FQDN"
  value       = azurerm_postgresql_flexible_server.primary.fqdn
  sensitive   = true
}

output "primary_redis_hostname" {
  description = "Primary Redis hostname"
  value       = azurerm_redis_cache.primary.hostname
  sensitive   = true
}

output "storage_account_name" {
  description = "Storage account name"
  value       = azurerm_storage_account.blockchain_data.name
}

output "key_vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.primary.vault_uri
}
