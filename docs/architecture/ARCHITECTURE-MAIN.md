# Aurigraph DLT Platform Architecture

**Version**: 1.1.0  
**Status**: Living Document  
**Updated**: 2025-11-03

## Table of Contents

1.  **[V10 Legacy Architecture](docs/architecture/ARCHITECTURE-V10-LEGACY.md)**
    - Technology Stack (Spring Boot)
    - Layered Architecture
    - Performance Characteristics
2.  **[V11 Target Architecture](docs/architecture/ARCHITECTURE-V11-TARGET.md)**
    - Technology Stack (Quarkus & Java 21)
    - Reactive & Virtual Threads
    - Native Compilation (GraalVM)
3.  **[Migration Strategy](docs/architecture/ARCHITECTURE-MIGRATION-STRATEGY.md)**
    - Phase-based Approach
    - Side-by-side Operation
    - Deployment Plan
4.  **[Component Architecture](docs/architecture/ARCHITECTURE-V11-COMPONENTS.md)**
    - Enterprise Portal (Frontend)
    - IAM Service (Keycloak)
5.  **[API Architecture](docs/architecture/ARCHITECTURE-API-ENDPOINTS.md)**
    - REST & gRPC Endpoints
    - Endpoint Coverage
6.  **[Data & Transaction Flow](docs/architecture/ARCHITECTURE-DATA-FLOW.md)**
    - HyperRAFT++ Consensus Flow
    - Priority Processing
7.  **[Security Architecture](docs/architecture/ARCHITECTURE-SECURITY.md)**
    - Multi-layer Security
    - Quantum-Resistant Cryptography
8.  **[Performance Architecture](docs/architecture/ARCHITECTURE-PERFORMANCE.md)**
    - Scaling Strategy
    - TPS Targets (2M+)
9.  **[Deployment & Operations](docs/architecture/ARCHITECTURE-DEPLOYMENT.md)**
    - Container Architecture
    - Multi-Cloud Strategy
10. **[Digital Twin Assets (Composite Tokens)](docs/architecture/ARCHITECTURE-COMPOSITE-TOKENS.md)**
    - Framework & Lifecycle
    - Merkle Proof Chain
11. **[Roadmap](docs/architecture/ARCHITECTURE-ROADMAP.md)**
    - Short-term (Sprints 13-15)
    - Long-term Vision
12. **[Guardrails & Operational Constraints](docs/architecture/ARCHITECTURE-GUARDRAILS-AND-APPENDIX.md)**
    - Performance & Security Limits
    - Availability & Reliability SLAs
    - Technology Decisions Appendix

---

## Document Navigation

Use the links above to explore specific sections of the architecture. For overall project progress, refer to the [V12 PROJECT_PLAN.md](PROJECT_PLAN.md).
