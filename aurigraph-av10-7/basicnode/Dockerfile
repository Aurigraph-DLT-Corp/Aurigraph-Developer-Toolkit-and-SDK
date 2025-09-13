# Aurigraph Basic Node - Multi-stage Docker build
# Optimized for GraalVM native compilation with <100MB target size

## Stage 1: Build stage with Maven and GraalVM
FROM quay.io/quarkus/ubi-quarkus-graalvm:24-java24 AS build

# Set working directory
WORKDIR /code

# Copy Maven configuration
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

# Download dependencies (cached layer)
RUN ./mvnw dependency:go-offline -q

# Copy source code
COPY src src

# Build native executable
RUN ./mvnw package -Dnative -DskipTests=true -q

## Stage 2: Runtime stage - minimal container
FROM quay.io/quarkus/ubi-quarkus-micro-image:2.0

# Container metadata
LABEL name="aurigraph-basicnode" \
      version="10.19.0" \
      description="Aurigraph Basic Node - User-friendly Docker + Quarkus implementation" \
      maintainer="Aurigraph Development Team"

# Performance and security configurations
ENV JAVA_OPTS_APPEND="-Xmx512m -XX:+UseG1GC -XX:+UseStringDeduplication" \
    QUARKUS_HTTP_HOST="0.0.0.0" \
    QUARKUS_HTTP_PORT="8080"

# Create non-root user for security
USER 1001

# Copy native executable from build stage
COPY --from=build --chown=1001 /code/target/*-runner /work/application

# Set working directory
WORKDIR /work

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/q/health || exit 1

# Expose application port
EXPOSE 8080

# Performance optimization for container startup
ENV QUARKUS_NATIVE_ADDITIONAL_BUILD_ARGS="--initialize-at-run-time=sun.security.provider.NativePRNG"

# Run the native application
CMD ["./application", "-Dquarkus.http.host=0.0.0.0"]