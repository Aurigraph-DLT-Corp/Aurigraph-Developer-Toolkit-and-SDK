# Docker Images for Aurigraph DLT Components

# Validator Image
resource "docker_image" "aurigraph_validator" {
  name = "aurigraph/validator:av10-7"
  build {
    context    = ".."
    dockerfile = "Dockerfile.validator"
    tag        = ["aurigraph/validator:av10-7"]
    build_args = {
      NODE_TYPE = "validator"
    }
  }
  keep_locally = true
}

# Basic Node Image
resource "docker_image" "aurigraph_node" {
  name = "aurigraph/node:av10-7"
  build {
    context    = ".."
    dockerfile = "Dockerfile.node"
    tag        = ["aurigraph/node:av10-7"]
    build_args = {
      NODE_TYPE = "node"
    }
  }
  keep_locally = true
}

# Management Dashboard Image
resource "docker_image" "aurigraph_management" {
  name = "aurigraph/management:av10-7"
  build {
    context    = ".."
    dockerfile = "Dockerfile.management"
    tag        = ["aurigraph/management:av10-7"]
    build_args = {
      SERVICE_TYPE = "management"
    }
  }
  keep_locally = true
}

# Vizor Dashboard Image
resource "docker_image" "aurigraph_vizor" {
  name = "aurigraph/vizor:av10-7"
  build {
    context    = ".."
    dockerfile = "Dockerfile.vizor"
    tag        = ["aurigraph/vizor:av10-7"]
    build_args = {
      SERVICE_TYPE = "vizor"
    }
  }
  keep_locally = true
}

# Metrics Exporter Image
resource "docker_image" "aurigraph_metrics" {
  name = "aurigraph/metrics:av10-7"
  build {
    context    = ".."
    dockerfile = "Dockerfile.metrics"
    tag        = ["aurigraph/metrics:av10-7"]
    build_args = {
      SERVICE_TYPE = "metrics"
    }
  }
  keep_locally = true
}