# Aurigraph V11 Multi-Stage Production Dockerfile
# Supports both Native and JVM deployments with optimized build stages

ARG BUILD_TYPE=native
ARG JAVA_VERSION=21

# ================================
# Stage 1: Build Environment Setup
# ================================
FROM registry.access.redhat.com/ubi9/openjdk-21:1.20-2.1726694316 as build-base

USER root

# Install build dependencies and GraalVM
RUN microdnf update -y && \
    microdnf install -y gcc glibc-devel zlib-devel libstdc++-devel gcc-c++ && \
    microdnf clean all

# Set up build environment
WORKDIR /code
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -q

# Copy source code
COPY src ./src

# ================================
# Stage 2A: Native Build (GraalVM)
# ================================
FROM build-base as native-build

# Build native executable with ultra optimization
RUN ./mvnw package -Pnative-ultra \
    -Dquarkus.native.container-build=true \
    -Dquarkus.native.builder-image=quay.io/quarkus/ubi-quarkus-mandrel-builder-image:jdk-21 \
    -Dquarkus.native.additional-build-args="--initialize-at-build-time=org.slf4j,--gc=G1,--optimize=2,-march=native,-H:+UnlockExperimentalVMOptions,-H:+UseG1GC" \
    -Dmaven.test.skip=true -q

# ================================
# Stage 2B: JVM Build (Standard JAR)
# ================================
FROM build-base as jvm-build

# Build standard JAR and uber-jar
RUN ./mvnw package -Dquarkus.package.jar.type=uber-jar \
    -Dmaven.test.skip=true -q && \
    cp target/quarkus-app/lib/ target/lib/ 2>/dev/null || true

# ================================
# Stage 3A: Native Runtime Image
# ================================
FROM registry.access.redhat.com/ubi9/ubi-minimal:9.6 as native-runtime

# Runtime dependencies for native binary
RUN microdnf update -y && \
    microdnf install -y ca-certificates tzdata && \
    microdnf clean all

# Security setup
RUN addgroup -g 1001 aurigraph && \
    adduser -u 1001 -g 1001 -s /bin/bash -m aurigraph

# Application setup
WORKDIR /deployments
COPY --from=native-build --chown=1001:1001 /code/target/*-runner /deployments/application

# Create necessary directories
RUN mkdir -p /deployments/config /deployments/data /deployments/logs && \
    chown -R 1001:1001 /deployments && \
    chmod +x /deployments/application

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:9003/q/health/ready || exit 1

# Security context
USER 1001

# Expose ports
EXPOSE 9003 9004

# Environment variables
ENV QUARKUS_PROFILE=prod \
    QUARKUS_HTTP_HOST=0.0.0.0 \
    QUARKUS_GRPC_SERVER_HOST=0.0.0.0 \
    AURIGRAPH_NATIVE_MODE=true \
    MALLOC_ARENA_MAX=1 \
    MALLOC_MMAP_THRESHOLD_=32768

# Startup command with optimized JVM options for containers
ENTRYPOINT ["./application", "-Dquarkus.http.host=0.0.0.0", "-Djava.util.logging.manager=org.jboss.logmanager.LogManager"]

# ================================
# Stage 3B: JVM Runtime Image
# ================================
FROM registry.access.redhat.com/ubi9/openjdk-21-runtime:1.20-2.1726694316 as jvm-runtime

# Environment setup
ENV LANGUAGE='en_US:en'

# Security setup
RUN addgroup -g 1001 aurigraph && \
    adduser -u 1001 -g 1001 -s /bin/bash -m aurigraph

# Application setup
WORKDIR /deployments

# Copy application artifacts
COPY --from=jvm-build --chown=1001:1001 /code/target/quarkus-app/lib/ /deployments/lib/
COPY --from=jvm-build --chown=1001:1001 /code/target/quarkus-app/*.jar /deployments/
COPY --from=jvm-build --chown=1001:1001 /code/target/quarkus-app/app/ /deployments/app/
COPY --from=jvm-build --chown=1001:1001 /code/target/quarkus-app/quarkus/ /deployments/quarkus/

# Create directories
RUN mkdir -p /deployments/config /deployments/data /deployments/logs && \
    chown -R 1001:1001 /deployments

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:9003/q/health/ready || exit 1

# Security context
USER 1001

# Expose ports
EXPOSE 9003 9004

# Environment variables optimized for production JVM
ENV QUARKUS_PROFILE=prod \
    QUARKUS_HTTP_HOST=0.0.0.0 \
    QUARKUS_GRPC_SERVER_HOST=0.0.0.0 \
    JAVA_OPTS_APPEND="-XX:+UseG1GC -XX:MaxGCPauseMillis=100 -XX:+UseStringDeduplication -XX:+OptimizeStringConcat" \
    JAVA_MAX_MEM_RATIO=75 \
    JAVA_INITIAL_MEM_RATIO=50

# Startup command
ENTRYPOINT ["java", "-jar", "/deployments/quarkus-run.jar"]

# ================================
# Final Stage: Multi-target Output
# ================================
FROM ${BUILD_TYPE}-runtime as final

# Metadata
LABEL maintainer="Aurigraph DLT Corp <info@aurigraph.io>" \
      version="11.0.0" \
      description="Aurigraph V11 High-Performance Blockchain Platform" \
      build-type="${BUILD_TYPE}" \
      java-version="${JAVA_VERSION}"

# Final configuration
VOLUME ["/deployments/config", "/deployments/data", "/deployments/logs"]