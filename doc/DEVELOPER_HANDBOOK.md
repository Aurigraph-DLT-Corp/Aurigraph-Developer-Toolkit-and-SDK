# Aurigraph DLT Developer Handbook

> **Version**: 1.0.0 | **Last Updated**: November 28, 2025
> **Target Audience**: All developers and agents working on Aurigraph DLT

---

## Table of Contents

1. [Quick Start (15 minutes)](#quick-start-15-minutes)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Structure](#project-structure)
4. [Multi-Agent Development](#multi-agent-development)
5. [Git Workflow](#git-workflow)
6. [Building & Running](#building--running)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Common Tasks](#common-tasks)
10. [Troubleshooting](#troubleshooting)
11. [Emergency Procedures](#emergency-procedures)

---

## Quick Start (15 minutes)

### Prerequisites Checklist

```bash
# Verify all prerequisites before starting
java --version          # Requires Java 21+
mvn --version           # Requires Maven 3.9+
docker --version        # Requires Docker 24+
node --version          # Requires Node.js 20+ (for portal)
git --version           # Requires Git 2.40+
```

### One-Command Setup

```bash
# Run the automated setup script
./scripts/onboard-developer.sh <your-name> <agent-id>

# Example:
./scripts/onboard-developer.sh "John Doe" agent-1.1
```

### Manual Setup (if script fails)

```bash
# 1. Clone the repository
git clone git@github.com:Aurigraph-DLT-Corp/Aurigraph-DLT.git
cd Aurigraph-DLT

# 2. Copy credentials template
cp doc/Credentials.md.example doc/Credentials.md
# Edit doc/Credentials.md with your actual credentials

# 3. Setup environment
cp .env.example .env

# 4. Build the project
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean package -DskipTests

# 5. Start development server
./mvnw quarkus:dev
```

### Verify Setup

```bash
# Health check (should return "healthy")
curl http://localhost:9003/api/v11/health

# Run validation script
./scripts/validate-dev-env.sh
```

---

## Development Environment Setup

### Required Software

| Software | Version | Installation |
|----------|---------|-------------|
| **Java** | 21+ | `brew install openjdk@21` (macOS) |
| **Maven** | 3.9+ | `brew install maven` |
| **Docker** | 24+ | [Docker Desktop](https://www.docker.com/products/docker-desktop) |
| **Node.js** | 20+ | `brew install node@20` |
| **Git** | 2.40+ | `brew install git` |

### IDE Configuration

#### VS Code (Recommended)
```json
// .vscode/settings.json
{
  "java.configuration.runtimes": [
    {
      "name": "JavaSE-21",
      "path": "/opt/homebrew/opt/openjdk@21",
      "default": true
    }
  ],
  "java.compile.nullAnalysis.mode": "automatic",
  "editor.formatOnSave": true
}
```

#### IntelliJ IDEA
1. File → Project Structure → SDK → Add JDK 21
2. Import Maven project from `aurigraph-av10-7/aurigraph-v11-standalone/pom.xml`
3. Enable annotation processing for Quarkus

### Environment Variables

```bash
# Add to ~/.bashrc or ~/.zshrc
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export PATH=$JAVA_HOME/bin:$PATH
export AURIGRAPH_HOME=~/path/to/Aurigraph-DLT

# Load Aurigraph credentials
source $AURIGRAPH_HOME/doc/setup-credentials.sh
```

---

## Project Structure

```
Aurigraph-DLT/
├── aurigraph-av10-7/                    # Main V11/V12 Development
│   ├── aurigraph-v11-standalone/        # Production service (Quarkus)
│   │   ├── src/main/java/io/aurigraph/v11/
│   │   │   ├── api/                     # REST API endpoints
│   │   │   ├── grpc/                    # gRPC services
│   │   │   ├── consensus/               # HyperRAFT++ consensus
│   │   │   ├── crypto/                  # Quantum cryptography
│   │   │   ├── bridge/                  # Cross-chain bridge
│   │   │   └── rwa/                     # Real-world assets
│   │   ├── src/main/proto/              # Protocol Buffer definitions
│   │   └── pom.xml                      # Maven configuration
│   └── docs/                            # V11 documentation
│
├── enterprise-portal/                    # React frontend
│   └── frontend/                        # Portal application
│
├── deployment/                          # Production deployment
│   ├── docker-compose.*.yml             # Docker configurations
│   ├── nginx-*.conf                     # NGINX configs
│   └── prometheus.yml                   # Monitoring config
│
├── worktrees/                           # Multi-agent development
│   ├── agent-1.1 through agent-2.6      # Agent-specific worktrees
│   └── agent-db, agent-frontend, etc.   # Infrastructure agents
│
├── .github/workflows/                   # CI/CD pipelines
├── doc/                                 # Documentation
└── scripts/                             # Automation scripts
```

---

## Multi-Agent Development

### Agent Assignments

| Agent ID | Role | Primary Focus | Branch |
|----------|------|---------------|--------|
| **agent-1.1** | REST/gRPC Bridge | API layer | `feature/1.1-rest-grpc-bridge` |
| **agent-1.2** | Consensus gRPC | HyperRAFT++ | `feature/1.2-consensus-grpc` |
| **agent-1.3** | Contracts gRPC | Smart contracts | `feature/1.3-contract-grpc` |
| **agent-1.4** | Crypto gRPC | Quantum crypto | `feature/1.4-crypto-grpc` |
| **agent-1.5** | Storage gRPC | LevelDB/State | `feature/1.5-storage-grpc` |
| **agent-2.1** | Traceability | Supply chain | `feature/2.1-traceability-grpc` |
| **agent-2.2** | Secondary Token | Token services | `feature/2.2-secondary-token` |
| **agent-2.3** | Composite Creation | Asset composition | `feature/2.3-composite-creation` |
| **agent-2.4** | Contract Binding | Contract management | `feature/2.4-contract-binding` |
| **agent-2.5** | Merkle Registry | State proofs | `feature/2.5-merkle-registry` |
| **agent-2.6** | Portal Integration | Frontend integration | `feature/2.6-portal-integration` |
| **agent-db** | Database | PostgreSQL/migrations | `feature/database-optimization` |
| **agent-frontend** | Portal UI | React components | `feature/portal-enhancements` |
| **agent-tests** | QA | Test coverage | `feature/test-coverage-expansion` |
| **agent-ws** | WebSocket | Real-time services | `feature/websocket-services` |

### Working with Git Worktrees

```bash
# List all worktrees
git worktree list

# Switch to your agent worktree
cd worktrees/agent-1.1

# Create new feature branch in worktree
git checkout -b feature/my-new-feature

# Pull latest from main
git fetch origin
git rebase origin/V12

# Push your changes
git push origin feature/my-new-feature
```

### Agent Communication

- **Daily Standups**: 09:00 UTC via Slack #aurigraph-agents
- **JIRA Board**: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11
- **Escalation Path**: Agent → Team Lead → Chief Architect
- **Emergency Contact**: See `doc/TEAM_MEMBERS.md`

---

## Git Workflow

### Branch Naming Convention

```
feature/<agent-id>-<description>   # New features
bugfix/<ticket-id>-<description>   # Bug fixes
hotfix/<description>               # Production hotfixes
release/v<version>                 # Release branches
```

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>

# Example:
feat(grpc): Add streaming support for transaction service

Implements server-side streaming for real-time transaction updates.
- Added StreamTransactionEvents RPC
- Implemented 100+ concurrent stream support
- Added backpressure handling

Closes AV11-456
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

### Pull Request Process

1. Create PR from feature branch to `V12`
2. Fill out PR template completely
3. Request review from 2 team members
4. Wait for CI to pass (all checks green)
5. Address review feedback
6. Squash and merge

```bash
# Create PR via CLI
gh pr create --title "feat: Add new feature" --body "Description here"
```

---

## Building & Running

### Backend (Java/Quarkus)

```bash
cd aurigraph-av10-7/aurigraph-v11-standalone

# Development mode (hot reload)
./mvnw quarkus:dev

# Build JAR
./mvnw clean package -DskipTests

# Build native executable (requires GraalVM)
./mvnw package -Pnative

# Run JAR
java -jar target/aurigraph-v12-standalone-12.0.0-runner.jar
```

### Frontend (React)

```bash
cd enterprise-portal/enterprise-portal/frontend

# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build
```

### Docker

```bash
# Start all services
docker-compose -f deployment/docker-compose.yml up -d

# Start specific services
docker-compose -f deployment/docker-compose.yml up -d postgres redis

# View logs
docker-compose -f deployment/docker-compose.yml logs -f

# Stop all services
docker-compose -f deployment/docker-compose.yml down
```

---

## Testing

### Running Tests

```bash
# All tests
./mvnw test

# Specific test class
./mvnw test -Dtest=TransactionServiceTest

# Specific test method
./mvnw test -Dtest=TransactionServiceTest#testHighThroughput

# With coverage report
./mvnw verify
# Report at: target/site/jacoco/index.html
```

### Test Coverage Requirements

| Category | Target | Current |
|----------|--------|---------|
| Unit Tests | ≥95% | Check JaCoCo |
| Integration Tests | ≥70% | Check JaCoCo |
| E2E Tests | 100% user flows | Manual verification |
| Performance | ≥776K TPS | CI validates |

### Writing Tests

```java
// Unit test example
@QuarkusTest
class TransactionServiceTest {
    @Inject
    TransactionService service;

    @Test
    void testSubmitTransaction() {
        Transaction tx = new Transaction();
        tx.setFromAddress("0x123");
        tx.setToAddress("0x456");
        tx.setAmount(BigDecimal.valueOf(100));

        TransactionResult result = service.submit(tx);

        assertNotNull(result.getHash());
        assertEquals(TransactionStatus.PENDING, result.getStatus());
    }
}
```

---

## Deployment

### Local Development

```bash
# Start backend
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw quarkus:dev

# Start frontend (separate terminal)
cd enterprise-portal/enterprise-portal/frontend
npm run dev

# Access:
# - Backend: http://localhost:9003
# - Frontend: http://localhost:3000
```

### Staging Deployment

```bash
# Deploy to staging via GitHub Actions
gh workflow run deploy.yml -f environment=staging

# Or manual deployment
ssh staging.aurigraph.io
cd /opt/aurigraph
./deploy-staging.sh
```

### Production Deployment

```bash
# Production deployments require approval
# Use the GitHub Actions workflow
gh workflow run deploy-production.yml -f version=12.0.0

# Or via release tag
git tag -a v12.0.0 -m "Release 12.0.0"
git push origin v12.0.0
```

---

## Common Tasks

### Adding a New REST Endpoint

```java
// 1. Create resource class in api/ package
@Path("/api/v11/myfeature")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MyFeatureResource {

    @GET
    @Path("/status")
    public Response getStatus() {
        return Response.ok(Map.of("status", "healthy")).build();
    }
}
```

### Adding a New gRPC Service

```protobuf
// 1. Define in src/main/proto/myservice.proto
service MyService {
    rpc GetData (GetDataRequest) returns (GetDataResponse);
}

// 2. Implement in grpc/ package
@GrpcService
public class MyServiceImpl implements MyService {
    @Override
    public Uni<GetDataResponse> getData(GetDataRequest request) {
        return Uni.createFrom().item(GetDataResponse.newBuilder().build());
    }
}
```

### Database Migrations

```sql
-- Create file: src/main/resources/db/migration/V13__Add_New_Table.sql
CREATE TABLE my_new_table (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Adding Configuration

```properties
# Add to application.properties
myfeature.enabled=true
myfeature.timeout=30s

# Access in code
@ConfigProperty(name = "myfeature.enabled")
boolean featureEnabled;
```

---

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 9003
lsof -i :9003
# Kill process
kill -9 <PID>
```

#### Maven Build Fails
```bash
# Clean and rebuild
./mvnw clean
rm -rf ~/.m2/repository/io/aurigraph
./mvnw clean package -DskipTests
```

#### Docker Container Won't Start
```bash
# Check logs
docker logs <container-id>

# Restart Docker daemon
# macOS: Restart Docker Desktop
# Linux: sudo systemctl restart docker
```

#### Database Connection Failed
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Start PostgreSQL
docker-compose -f deployment/docker-compose.yml up -d postgres

# Verify connection
psql -h localhost -U aurigraph -d aurigraph_db
```

#### Out of Memory (Native Build)
```bash
# Increase Docker memory to 8GB+
# Docker Desktop → Settings → Resources → Memory

# For Maven
export MAVEN_OPTS="-Xmx4g"
```

### Getting Help

1. **Check Documentation**: `doc/` folder
2. **Search Issues**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues
3. **Ask in Slack**: #aurigraph-help
4. **Escalate**: Contact team lead (see `doc/TEAM_MEMBERS.md`)

---

## Emergency Procedures

### Production is Down

```bash
# 1. Check service status
ssh subbu@dlt.aurigraph.io
curl http://localhost:9003/api/v11/health

# 2. Check logs
tail -f /home/subbu/logs/v12.log

# 3. Restart service
pkill -f aurigraph-v12.jar
nohup java -jar aurigraph-v12.jar > logs/v12.log 2>&1 &

# 4. If still failing, rollback
cp aurigraph-v12.jar.backup aurigraph-v12.jar
# Restart service
```

### Database Corruption

```bash
# 1. Stop all services
docker-compose down

# 2. Restore from backup
./scripts/restore-database.sh latest

# 3. Restart services
docker-compose up -d
```

### Security Incident

1. **Immediately**: Notify security team via #security-alerts
2. **Document**: Record all observations
3. **Isolate**: If necessary, take affected services offline
4. **Follow**: Security Incident Playbook (`doc/runbooks/security-incident.md`)

### Contact Information

| Role | Contact | Response Time |
|------|---------|---------------|
| **On-Call** | See PagerDuty | 15 min |
| **Team Lead** | Slack @lead | 30 min |
| **DevOps** | Slack #devops | 1 hour |
| **Security** | security@aurigraph.io | Immediate |

---

## Appendix

### Useful Commands Cheat Sheet

```bash
# Build
./mvnw clean package -DskipTests          # Fast build
./mvnw quarkus:dev                         # Dev mode
./mvnw package -Pnative                    # Native build

# Test
./mvnw test                                # All tests
./mvnw verify                              # Tests + coverage

# Git
git worktree list                          # List worktrees
git fetch origin && git rebase origin/V12  # Update branch

# Docker
docker-compose up -d                       # Start services
docker-compose logs -f                     # View logs
docker-compose down                        # Stop services

# Remote Server
ssh subbu@dlt.aurigraph.io                # SSH to production
curl http://localhost:9003/api/v11/health # Health check

# Debugging
lsof -i :9003                             # Check port usage
docker logs <container>                    # Container logs
./mvnw quarkus:dev -Ddebug=5005          # Debug mode
```

### Key URLs

| Service | URL |
|---------|-----|
| Production API | https://dlt.aurigraph.io/api/v11 |
| Portal | https://dlt.aurigraph.io |
| IAM | https://iam2.aurigraph.io |
| JIRA | https://aurigraphdlt.atlassian.net |
| GitHub | https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT |
| Grafana | http://localhost:3001 (local) |
| Prometheus | http://localhost:9090 (local) |

---

*Last Updated: November 28, 2025 by Claude Code*
