# Variables for Aurigraph DLT Infrastructure

variable "environment" {
  description = "Environment name (dev, test, prod)"
  type        = string
  default     = "dev"
}

variable "validator_count" {
  description = "Number of validator nodes"
  type        = number
  default     = 1
  validation {
    condition     = var.validator_count >= 1 && var.validator_count <= 10
    error_message = "Validator count must be between 1 and 10."
  }
}

variable "node_count" {
  description = "Number of basic nodes"
  type        = number
  default     = 2
  validation {
    condition     = var.node_count >= 1 && var.node_count <= 50
    error_message = "Node count must be between 1 and 50."
  }
}

variable "enable_monitoring" {
  description = "Enable Prometheus and Vizor monitoring"
  type        = bool
  default     = true
}

variable "quantum_enabled" {
  description = "Enable quantum-resistant cryptography"
  type        = bool
  default     = true
}

variable "consensus_algorithm" {
  description = "Consensus algorithm to use"
  type        = string
  default     = "HyperRAFT++"
  validation {
    condition = contains([
      "HyperRAFT++",
      "PBFT",
      "HotStuff"
    ], var.consensus_algorithm)
    error_message = "Consensus algorithm must be one of: HyperRAFT++, PBFT, HotStuff."
  }
}

variable "target_tps" {
  description = "Target transactions per second"
  type        = number
  default     = 1000000
}

variable "network_ports" {
  description = "Port configuration for services"
  type = object({
    validator_base   = number
    node_base       = number
    management      = number
    vizor          = number
    prometheus     = number
  })
  default = {
    validator_base = 8180
    node_base     = 8200
    management    = 3140
    vizor        = 3052
    prometheus   = 9090
  }
}

variable "resource_limits" {
  description = "Resource limits for containers"
  type = object({
    validator_memory = string
    node_memory     = string
    management_memory = string
  })
  default = {
    validator_memory = "4096m"
    node_memory     = "2048m"
    management_memory = "1024m"
  }
}