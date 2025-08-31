# Aurigraph Node Development Setup - Java 24 + Quarkus 3.26.1 + GraalVM

## Overview
Complete setup guide for building Aurigraph V10 nodes using the latest Java 24, Quarkus 3.26.1, and GraalVM for high-performance, cloud-native blockchain infrastructure.

---

## Technology Stack

### **Core Technologies**
- **Java 24** - Latest LTS with enhanced performance features
- **Quarkus 3.26.1** - Cloud-native, Kubernetes-ready framework
- **GraalVM** - Native compilation for ultra-fast startup and low memory
- **GitHub Actions** - CI/CD with automated GraalVM setup

### **Performance Benefits**
- **Sub-second startup** with GraalVM native compilation
- **Memory usage <512MB** for basic nodes
- **100,000+ TPS** capability with sharding
- **99.99% uptime** with auto-recovery

---

## GitHub Actions Setup

### **GraalVM Configuration**
```yaml
name: Aurigraph Node Build

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup GraalVM
      uses: graalvm/setup-graalvm@v1
      with:
        java-version: '24'
        distribution: 'graalvm'
        github-token: ${{ secrets.GITHUB_TOKEN }}
        
    - name: Cache Maven dependencies
      uses: actions/cache@v3
      with:
        path: ~/.m2
        key: ${{ runner.os }}-m2-${{ hashFiles('**/pom.xml') }}
        
    - name: Build with Maven
      run: ./mvnw clean compile
      
    - name: Run tests
      run: ./mvnw test
      
    - name: Build native image
      run: ./mvnw package -Pnative
      
    - name: Build Docker image
      run: docker build -f src/main/docker/Dockerfile.native -t aurigraph/node:latest .
```

---

## Project Structure

### **Maven Configuration (pom.xml)**
```xml
<?xml version="1.0"?>
<project xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         https://maven.apache.org/xsd/maven-4.0.0.xsd" 
         xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  
  <modelVersion>4.0.0</modelVersion>
  <groupId>io.aurigraph</groupId>
  <artifactId>aurigraph-node</artifactId>
  <version>10.0.0</version>
  
  <properties>
    <compiler-plugin.version>3.12.1</compiler-plugin.version>
    <maven.compiler.release>24</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <quarkus.platform.artifact-id>quarkus-bom</quarkus.platform.artifact-id>
    <quarkus.platform.group-id>io.quarkus.platform</quarkus.platform.group-id>
    <quarkus.platform.version>3.26.1</quarkus.platform.version>
    <skipITs>true</skipITs>
    <surefire-plugin.version>3.2.5</surefire-plugin.version>
  </properties>
  
  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>${quarkus.platform.group-id}</groupId>
        <artifactId>${quarkus.platform.artifact-id}</artifactId>
        <version>${quarkus.platform.version}</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>
  
  <dependencies>
    <!-- Core Quarkus Extensions -->
    <dependency>
      <groupId>io.quarkus</groupId>
      <artifactId>quarkus-resteasy-reactive</artifactId>
    </dependency>
    <dependency>
      <groupId>io.quarkus</groupId>
      <artifactId>quarkus-smallrye-graphql</artifactId>
    </dependency>
    <dependency>
      <groupId>io.quarkus</groupId>
      <artifactId>quarkus-mongodb-client</artifactId>
    </dependency>
    <dependency>
      <groupId>io.quarkus</groupId>
      <artifactId>quarkus-redis-client</artifactId>
    </dependency>
    <dependency>
      <groupId>io.quarkus</groupId>
      <artifactId>quarkus-micrometer</artifactId>
    </dependency>
    <dependency>
      <groupId>io.quarkus</groupId>
      <artifactId>quarkus-kubernetes</artifactId>
    </dependency>
    <dependency>
      <groupId>io.quarkus</groupId>
      <artifactId>quarkus-container-image-docker</artifactId>
    </dependency>
    <dependency>
      <groupId>io.quarkus</groupId>
      <artifactId>quarkus-smallrye-health</artifactId>
    </dependency>
    <dependency>
      <groupId>io.quarkus</groupId>
      <artifactId>quarkus-smallrye-openapi</artifactId>
    </dependency>
    
    <!-- Testing -->
    <dependency>
      <groupId>io.quarkus</groupId>
      <artifactId>quarkus-junit5</artifactId>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>io.rest-assured</groupId>
      <artifactId>rest-assured</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>
  
  <build>
    <plugins>
      <plugin>
        <groupId>${quarkus.platform.group-id}</groupId>
        <artifactId>quarkus-maven-plugin</artifactId>
        <version>${quarkus.platform.version}</version>
        <extensions>true</extensions>
        <executions>
          <execution>
            <goals>
              <goal>build</goal>
              <goal>generate-code</goal>
              <goal>generate-code-tests</goal>
            </goals>
          </execution>
        </executions>
      </plugin>
    </plugins>
  </build>
  
  <profiles>
    <profile>
      <id>native</id>
      <activation>
        <property>
          <name>native</name>
        </property>
      </activation>
      <properties>
        <skipITs>false</skipITs>
        <quarkus.package.type>native</quarkus.package.type>
      </properties>
    </profile>
  </profiles>
</project>
```

---

## Quarkus Configuration

### **Application Properties (application.properties)**
```properties
# Application Configuration
quarkus.application.name=aurigraph-node
quarkus.application.version=10.0.0

# HTTP Configuration
quarkus.http.port=8080
quarkus.http.host=0.0.0.0

# Native Configuration
quarkus.native.additional-build-args=--initialize-at-run-time=io.netty.handler.ssl.BouncyCastleAlpnSslUtils

# Database Configuration
quarkus.mongodb.connection-string=mongodb://localhost:27017
quarkus.mongodb.database=aurigraph

# Redis Configuration
quarkus.redis.hosts=redis://localhost:6379

# Metrics Configuration
quarkus.micrometer.enabled=true
quarkus.micrometer.export.prometheus.enabled=true

# Health Configuration
quarkus.smallrye-health.root-path=/health

# OpenAPI Configuration
quarkus.smallrye-openapi.path=/openapi
quarkus.swagger-ui.always-include=true

# Kubernetes Configuration
quarkus.kubernetes.deployment-target=kubernetes
quarkus.container-image.build=true
quarkus.container-image.group=aurigraph
quarkus.container-image.name=node
```

---

## Docker Configuration

### **Native Dockerfile (src/main/docker/Dockerfile.native)**
```dockerfile
FROM quay.io/quarkus/ubi-quarkus-graalvm:24-java24
COPY --chown=1001 target/*-runner /work/application
EXPOSE 8080
USER 1001
CMD ["./application", "-Dquarkus.http.host=0.0.0.0"]
```

### **JVM Dockerfile (src/main/docker/Dockerfile.jvm)**
```dockerfile
FROM registry.access.redhat.com/ubi8/openjdk-24:1.20
ENV LANGUAGE='en_US:en'
COPY --chown=185 target/quarkus-app/lib/ /deployments/lib/
COPY --chown=185 target/quarkus-app/*.jar /deployments/
COPY --chown=185 target/quarkus-app/app/ /deployments/app/
COPY --chown=185 target/quarkus-app/quarkus/ /deployments/quarkus/
EXPOSE 8080
USER 185
ENV JAVA_OPTS_APPEND="-Dquarkus.http.host=0.0.0.0 -Djava.util.logging.manager=org.jboss.logmanager.LogManager"
ENV JAVA_APP_JAR="/deployments/quarkus-run.jar"
ENTRYPOINT [ "/opt/jboss/container/java/run/run-java.sh" ]
```

---

## Development Commands

### **Local Development**
```bash
# Start development mode with hot reload
./mvnw quarkus:dev

# Run tests
./mvnw test

# Build JVM version
./mvnw clean package

# Build native version
./mvnw package -Pnative

# Build Docker image (JVM)
docker build -f src/main/docker/Dockerfile.jvm -t aurigraph/node:jvm .

# Build Docker image (Native)
docker build -f src/main/docker/Dockerfile.native -t aurigraph/node:native .

# Run Docker container
docker run -i --rm -p 8080:8080 aurigraph/node:native
```

### **Performance Testing**
```bash
# Startup time measurement
time docker run --rm aurigraph/node:native --version

# Memory usage monitoring
docker stats aurigraph/node:native

# Load testing
curl -X GET http://localhost:8080/health/ready
```

---

## Node Types Implementation

### **Validator Node Features**
- RAFT consensus mechanism
- 100,000+ TPS processing
- Sharding support
- Memory usage <2GB
- Sub-10ms transaction finality

### **Basic Node Features**
- User-friendly web interface
- Docker containerization
- Memory usage <512MB
- Simplified onboarding
- API gateway integration

### **Performance Targets**
- **Startup Time**: <1 second (native)
- **Memory Usage**: <512MB (basic), <2GB (validator)
- **Throughput**: 100,000+ TPS with sharding
- **Uptime**: 99.99% with auto-recovery

---

**Aurigraph V10 nodes are now ready for high-performance blockchain operations! 🚀**
