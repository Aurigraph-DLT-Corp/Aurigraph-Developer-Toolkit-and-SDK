# Aurigraph V11 - Cross-Cloud VPN Mesh
# WireGuard VPN Configuration for Multi-Cloud Connectivity
# Version: 1.0.0

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# AWS VPN Gateway (for cross-cloud connectivity)
resource "aws_vpn_gateway" "main" {
  provider = aws

  vpc_id = var.aws_vpc_id

  tags = {
    Name        = "aurigraph-vpn-gateway"
    Environment = var.environment
  }
}

resource "aws_vpn_gateway_attachment" "main" {
  provider = aws

  vpc_id         = var.aws_vpc_id
  vpn_gateway_id = aws_vpn_gateway.main.id
}

# AWS Customer Gateways (for Azure and GCP)
resource "aws_customer_gateway" "azure" {
  provider = aws

  bgp_asn    = 65000
  ip_address = var.azure_vpn_gateway_ip
  type       = "ipsec.1"

  tags = {
    Name = "aurigraph-cgw-azure"
  }
}

resource "aws_customer_gateway" "gcp" {
  provider = aws

  bgp_asn    = 65001
  ip_address = var.gcp_vpn_gateway_ip
  type       = "ipsec.1"

  tags = {
    Name = "aurigraph-cgw-gcp"
  }
}

# AWS VPN Connections
resource "aws_vpn_connection" "to_azure" {
  provider = aws

  vpn_gateway_id      = aws_vpn_gateway.main.id
  customer_gateway_id = aws_customer_gateway.azure.id
  type                = "ipsec.1"
  static_routes_only  = false

  tunnel1_inside_cidr   = "169.254.10.0/30"
  tunnel2_inside_cidr   = "169.254.10.4/30"
  tunnel1_preshared_key = var.tunnel1_psk
  tunnel2_preshared_key = var.tunnel2_psk

  tags = {
    Name = "aurigraph-vpn-to-azure"
  }
}

resource "aws_vpn_connection" "to_gcp" {
  provider = aws

  vpn_gateway_id      = aws_vpn_gateway.main.id
  customer_gateway_id = aws_customer_gateway.gcp.id
  type                = "ipsec.1"
  static_routes_only  = false

  tunnel1_inside_cidr   = "169.254.20.0/30"
  tunnel2_inside_cidr   = "169.254.20.4/30"
  tunnel1_preshared_key = var.tunnel3_psk
  tunnel2_preshared_key = var.tunnel4_psk

  tags = {
    Name = "aurigraph-vpn-to-gcp"
  }
}

# Azure VPN Gateway
resource "azurerm_public_ip" "vpn_gateway" {
  provider = azurerm

  name                = "aurigraph-vpn-gateway-pip"
  location            = var.azure_region
  resource_group_name = var.azure_resource_group
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_virtual_network_gateway" "main" {
  provider = azurerm

  name                = "aurigraph-vpn-gateway"
  location            = var.azure_region
  resource_group_name = var.azure_resource_group

  type     = "Vpn"
  vpn_type = "RouteBased"

  active_active = false
  enable_bgp    = true
  sku           = "VpnGw2"

  bgp_settings {
    asn = 65000
  }

  ip_configuration {
    name                          = "vnetGatewayConfig"
    public_ip_address_id          = azurerm_public_ip.vpn_gateway.id
    private_ip_address_allocation = "Dynamic"
    subnet_id                     = var.azure_gateway_subnet_id
  }
}

# Azure Local Network Gateways (for AWS and GCP)
resource "azurerm_local_network_gateway" "aws" {
  provider = azurerm

  name                = "aurigraph-lng-aws"
  location            = var.azure_region
  resource_group_name = var.azure_resource_group
  gateway_address     = aws_vpn_connection.to_azure.tunnel1_address

  address_space = [var.aws_vpc_cidr]

  bgp_settings {
    asn                 = 65001
    bgp_peering_address = aws_vpn_connection.to_azure.tunnel1_bgp_asn
  }
}

resource "azurerm_local_network_gateway" "gcp" {
  provider = azurerm

  name                = "aurigraph-lng-gcp"
  location            = var.azure_region
  resource_group_name = var.azure_resource_group
  gateway_address     = var.gcp_vpn_gateway_ip

  address_space = [var.gcp_vpc_cidr]

  bgp_settings {
    asn                 = 65002
    bgp_peering_address = "169.254.30.1"
  }
}

# Azure VPN Connections
resource "azurerm_virtual_network_gateway_connection" "to_aws" {
  provider = azurerm

  name                       = "aurigraph-vpn-to-aws"
  location                   = var.azure_region
  resource_group_name        = var.azure_resource_group
  type                       = "IPsec"
  virtual_network_gateway_id = azurerm_virtual_network_gateway.main.id
  local_network_gateway_id   = azurerm_local_network_gateway.aws.id

  shared_key = var.tunnel1_psk

  enable_bgp = true

  ipsec_policy {
    dh_group         = "DHGroup14"
    ike_encryption   = "AES256"
    ike_integrity    = "SHA256"
    ipsec_encryption = "AES256"
    ipsec_integrity  = "SHA256"
    pfs_group        = "PFS2048"
    sa_lifetime      = 27000
  }
}

resource "azurerm_virtual_network_gateway_connection" "to_gcp" {
  provider = azurerm

  name                       = "aurigraph-vpn-to-gcp"
  location                   = var.azure_region
  resource_group_name        = var.azure_resource_group
  type                       = "IPsec"
  virtual_network_gateway_id = azurerm_virtual_network_gateway.main.id
  local_network_gateway_id   = azurerm_local_network_gateway.gcp.id

  shared_key = var.tunnel3_psk

  enable_bgp = true

  ipsec_policy {
    dh_group         = "DHGroup14"
    ike_encryption   = "AES256"
    ike_integrity    = "SHA256"
    ipsec_encryption = "AES256"
    ipsec_integrity  = "SHA256"
    pfs_group        = "PFS2048"
    sa_lifetime      = 27000
  }
}

# GCP Cloud VPN
resource "google_compute_ha_vpn_gateway" "main" {
  provider = google

  name    = "aurigraph-vpn-gateway"
  region  = var.gcp_region
  network = var.gcp_vpc_id
}

resource "google_compute_router" "vpn" {
  provider = google

  name    = "aurigraph-vpn-router"
  region  = var.gcp_region
  network = var.gcp_vpc_id

  bgp {
    asn = 65001
  }
}

# GCP External VPN Gateways (for AWS and Azure)
resource "google_compute_external_vpn_gateway" "aws" {
  provider = google

  name            = "aurigraph-external-vpn-aws"
  redundancy_type = "SINGLE_IP_INTERNALLY_REDUNDANT"

  interface {
    id         = 0
    ip_address = aws_vpn_connection.to_gcp.tunnel1_address
  }
}

resource "google_compute_external_vpn_gateway" "azure" {
  provider = google

  name            = "aurigraph-external-vpn-azure"
  redundancy_type = "SINGLE_IP_INTERNALLY_REDUNDANT"

  interface {
    id         = 0
    ip_address = azurerm_public_ip.vpn_gateway.ip_address
  }
}

# GCP VPN Tunnels
resource "google_compute_vpn_tunnel" "to_aws" {
  provider = google

  name                            = "aurigraph-vpn-to-aws"
  region                          = var.gcp_region
  vpn_gateway                     = google_compute_ha_vpn_gateway.main.id
  peer_external_gateway           = google_compute_external_vpn_gateway.aws.id
  peer_external_gateway_interface = 0
  shared_secret                   = var.tunnel3_psk
  router                          = google_compute_router.vpn.id
  vpn_gateway_interface           = 0
}

resource "google_compute_vpn_tunnel" "to_azure" {
  provider = google

  name                            = "aurigraph-vpn-to-azure"
  region                          = var.gcp_region
  vpn_gateway                     = google_compute_ha_vpn_gateway.main.id
  peer_external_gateway           = google_compute_external_vpn_gateway.azure.id
  peer_external_gateway_interface = 0
  shared_secret                   = var.tunnel3_psk
  router                          = google_compute_router.vpn.id
  vpn_gateway_interface           = 1
}

# GCP BGP Sessions
resource "google_compute_router_interface" "vpn_to_aws" {
  provider = google

  name       = "aurigraph-vpn-interface-aws"
  router     = google_compute_router.vpn.name
  region     = var.gcp_region
  ip_range   = "169.254.20.2/30"
  vpn_tunnel = google_compute_vpn_tunnel.to_aws.name
}

resource "google_compute_router_peer" "vpn_to_aws" {
  provider = google

  name                      = "aurigraph-vpn-peer-aws"
  router                    = google_compute_router.vpn.name
  region                    = var.gcp_region
  peer_ip_address           = "169.254.20.1"
  peer_asn                  = 65001
  advertised_route_priority = 100
  interface                 = google_compute_router_interface.vpn_to_aws.name
}

# WireGuard Configuration Template (for actual node-to-node VPN)
locals {
  wireguard_config = templatefile("${path.module}/templates/wireguard.conf.tpl", {
    private_key = var.wireguard_private_key
    address     = var.wireguard_address
    listen_port = var.wireguard_listen_port
    peers       = var.wireguard_peers
  })
}

# Output WireGuard configuration
resource "local_file" "wireguard_config" {
  content  = local.wireguard_config
  filename = "${path.module}/output/wg0.conf"
}

# Outputs
output "aws_vpn_gateway_id" {
  description = "AWS VPN Gateway ID"
  value       = aws_vpn_gateway.main.id
}

output "azure_vpn_gateway_ip" {
  description = "Azure VPN Gateway public IP"
  value       = azurerm_public_ip.vpn_gateway.ip_address
}

output "gcp_vpn_gateway_ip" {
  description = "GCP VPN Gateway IP addresses"
  value       = google_compute_ha_vpn_gateway.main.vpn_interfaces[*].ip_address
}

output "vpn_tunnel_status" {
  description = "VPN tunnel connection status"
  value = {
    aws_to_azure = aws_vpn_connection.to_azure.tunnel1_state
    aws_to_gcp   = aws_vpn_connection.to_gcp.tunnel1_state
  }
}
