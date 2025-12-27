# 🌐 Website & 🏗️ Infrastructure Architecture

**Document Version**: 1.0
**Status**: ✅ Active
**Epics**: AV11-908 (Website), AV11-909 (Infrastructure)
**Teams**: @WebsiteDevTeam, @DevOpsInfraTeam

---

## Part 1: Website Architecture

### Overview

The Aurigraph V11 public website combines marketing, documentation, API reference, and interactive dashboard into a high-performance, SEO-optimized portal built with Next.js.

### Goals
- ✅ Marketing landing page for product awareness
- ✅ Comprehensive API documentation with interactive playground
- ✅ Public blockchain dashboard with real-time metrics
- ✅ Blog platform for announcements and tutorials
- ✅ Lighthouse score 90+, SEO optimization

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         Next.js Application (React 18)          │
│  (SSR + SSG + ISR for optimal performance)      │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│      Presentation Layer                         │
│  ┌──────────────────────────────────────┐       │
│  │  Pages & Layouts                     │       │
│  │  (Landing, Docs, Dashboard, Blog)    │       │
│  └──────────────────────────────────────┘       │
│  ┌──────────────────────────────────────┐       │
│  │  Components (Reusable)               │       │
│  │  (Navigation, Hero, Cards, etc.)     │       │
│  └──────────────────────────────────────┘       │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│      Feature & Business Logic Layer             │
│  ┌──────────────────────────────────────┐       │
│  │  API Documentation (Swagger/OpenAPI) │       │
│  │  Dashboard State Management          │       │
│  │  Blog CMS Integration                │       │
│  │  Search & Indexing                   │       │
│  └──────────────────────────────────────┘       │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│      Data & Service Layer                       │
│  ┌──────────────────────────────────────┐       │
│  │  Content (Contentlayer/MDX)          │       │
│  │  Blockchain API Client (SDK)         │       │
│  │  Real-time Data Fetching             │       │
│  │  Analytics Integration               │       │
│  └──────────────────────────────────────┘       │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│      Backend Services (Optional)                │
│  (Runs on Next.js API routes)                   │
│  ├─ CMS endpoints                              │
│  ├─ Analytics aggregation                      │
│  └─ Email/newsletter management                │
└─────────────────────────────────────────────────┘
```

### Project Structure

```
website/
├── public/
│   ├── images/
│   ├── videos/
│   ├── sitemap.xml
│   └── robots.txt
│
├── src/
│   ├── pages/
│   │   ├── index.tsx                   # Home/landing
│   │   ├── docs/
│   │   │   ├── index.tsx               # Docs landing
│   │   │   ├── [slug].tsx              # Doc page (MDX)
│   │   │   └── api/
│   │   │       ├── index.tsx           # API overview
│   │   │       └── [endpoint].tsx      # API endpoint docs
│   │   ├── dashboard/
│   │   │   └── index.tsx               # Public dashboard
│   │   ├── blog/
│   │   │   ├── index.tsx               # Blog listing
│   │   │   └── [slug].tsx              # Blog post
│   │   ├── about.tsx
│   │   ├── contact.tsx
│   │   ├── pricing.tsx
│   │   ├── api/                        # API routes
│   │   │   ├── dashboard/
│   │   │   │   └── metrics.ts          # Blockchain metrics
│   │   │   ├── blog/
│   │   │   │   ├── posts.ts            # Blog posts API
│   │   │   │   └── [slug].ts
│   │   │   └── search.ts               # Search API
│   │   └── 404.tsx
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx              # Navigation header
│   │   │   ├── Footer.tsx              # Footer
│   │   │   ├── Sidebar.tsx             # Doc sidebar
│   │   │   ├── Table of Contents.tsx   # Doc ToC
│   │   │   └── Search.tsx              # Search bar
│   │   ├── landing/
│   │   │   ├── Hero.tsx                # Hero section
│   │   │   ├── Features.tsx            # Features overview
│   │   │   ├── Testimonials.tsx
│   │   │   ├── Pricing.tsx
│   │   │   └── CTA.tsx                 # Call-to-action
│   │   ├── dashboard/
│   │   │   ├── MetricsCard.tsx         # Stat card
│   │   │   ├── Chart.tsx               # Chart component
│   │   │   ├── TransactionList.tsx     # Recent transactions
│   │   │   └── NetworkHealth.tsx       # Network status
│   │   ├── docs/
│   │   │   ├── ApiEndpoint.tsx         # API endpoint docs
│   │   │   ├── CodeBlock.tsx           # Syntax highlighted code
│   │   │   └── Playground.tsx          # Interactive playground
│   │   └── blog/
│   │       ├── PostCard.tsx
│   │       ├── PostMeta.tsx
│   │       └── AuthorBio.tsx
│   │
│   ├── lib/
│   │   ├── api.ts                      # API client (SDK)
│   │   ├── content.ts                  # Content fetching
│   │   ├── seo.ts                      # SEO utilities
│   │   ├── analytics.ts                # Analytics setup
│   │   └── utils.ts                    # General utilities
│   │
│   ├── styles/
│   │   ├── globals.css                 # Global styles (Tailwind)
│   │   ├── variables.css               # CSS variables
│   │   └── theme.ts                    # Theme configuration
│   │
│   ├── hooks/
│   │   ├── useDarkMode.ts
│   │   ├── useIntersection.ts
│   │   └── useMetrics.ts
│   │
│   └── types/
│       ├── index.ts
│       ├── api.ts
│       ├── content.ts
│       └── blog.ts
│
├── content/
│   ├── docs/
│   │   ├── getting-started.mdx
│   │   ├── architecture.mdx
│   │   ├── guides/
│   │   │   ├── sdk-setup.mdx
│   │   │   ├── wallet-integration.mdx
│   │   │   └── smart-contracts.mdx
│   │   └── api/
│   │       ├── overview.mdx
│   │       ├── authentication.mdx
│   │       ├── transactions.mdx
│   │       └── endpoints/
│   ├── blog/
│   │   ├── 2025-01-01-launch-announcement.mdx
│   │   ├── 2025-01-05-performance-update.mdx
│   │   └── 2025-01-10-roadmap.mdx
│   └── authors.ts                      # Author metadata
│
├── tests/
│   ├── pages/
│   ├── components/
│   └── lib/
│
├── next.config.js                      # Next.js config
├── tsconfig.json
├── tailwind.config.js                  # Tailwind config
├── contentlayer.config.ts              # Contentlayer config
├── package.json
└── .env.example
```

### Key Features

#### 1. Landing Page
- Hero section with product benefits
- Feature highlights
- Customer testimonials
- Pricing tiers
- CTA buttons

#### 2. API Documentation
- Swagger/OpenAPI integration
- Interactive endpoint explorer
- Code examples (multi-language)
- Request/response samples
- Live playground

#### 3. Public Dashboard
- Real-time TPS metrics
- Node count & validator info
- Transaction volume charts
- Network health status
- Market data

#### 4. Blog Platform
- SEO-optimized posts
- Category/tag filtering
- Author profiles
- Comments (optional)
- Newsletter signup

### Technology Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 14 (App Router) |
| React | v18.x with TypeScript |
| Styling | Tailwind CSS v3 |
| UI Components | Shadcn/ui + Headless UI |
| CMS | Contentlayer + MDX |
| API Docs | SwaggerUI + Redoc |
| Charts | Recharts |
| SEO | next-seo |
| Analytics | Google Analytics 4, PostHog |
| Forms | react-hook-form |
| Validation | Zod |
| Testing | Jest + React Testing Library |
| Build | Vercel / Self-hosted |

### Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Score | 90+ |
| First Contentful Paint (FCP) | <1.5s |
| Largest Contentful Paint (LCP) | <2.5s |
| Cumulative Layout Shift (CLS) | <0.1 |
| Time to Interactive | <3.5s |
| SEO Score | 95+ |

---

## Part 2: Infrastructure & DevOps Architecture

### Overview

The infrastructure layer provides CI/CD automation, containerization, monitoring, and orchestration for SDK, Mobile, and Website deployments.

### Goals
- ✅ Automated testing and deployment (GitHub Actions)
- ✅ Container orchestration (Docker + Kubernetes)
- ✅ Comprehensive monitoring (Prometheus + Grafana)
- ✅ Centralized logging (ELK Stack)
- ✅ 99.9% uptime SLA

### Infrastructure Architecture

```
┌──────────────────────────────────────────────────────┐
│              GitHub Repository                       │
│  (Source code + CI/CD workflows)                     │
└────────────┬─────────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────────┐
│         GitHub Actions CI/CD Pipeline                │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │ Test & Lint │  │  Build Img  │  │ Security Scan│ │
│  └─────────────┘  └─────────────┘  └──────────────┘ │
└────────────┬─────────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────────┐
│       Docker Registry (DockerHub / GHCR)             │
│  (Store & version container images)                  │
└────────────┬─────────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────────┐
│      Kubernetes Cluster / Docker Compose             │
│  ┌──────────────────────────────────────────────┐    │
│  │  Deployments (SDK, Mobile Backend, Website) │    │
│  │  Services (Load Balancing)                   │    │
│  │  Persistent Volumes (Storage)                │    │
│  │  ConfigMaps & Secrets (Configuration)        │    │
│  └──────────────────────────────────────────────┘    │
└────────────┬─────────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────────┐
│         Monitoring & Observability Stack             │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Prometheus   │  │   Grafana    │  │ ELK Stack  │ │
│  │ (Metrics)    │  │  (Dashboard) │  │  (Logs)    │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
└────────────┬─────────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────────┐
│        Alerting & Incident Management                │
│  (PagerDuty, Slack, Email)                           │
└──────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```
Code Commit
    ↓
GitHub Actions Triggered
    ├─ Run Tests (Jest/pytest/Go tests)
    ├─ Run Linters (ESLint/Pylint/Golangci)
    ├─ Security Scan (SAST - Sonarqube/Snyk)
    ├─ Build Docker Image
    ├─ Push to Registry
    └─ (On PR Approval) Deploy to Staging
        ├─ Run Integration Tests
        ├─ Run Smoke Tests (@QAQCAgent)
        └─ (Manual Approval) Deploy to Production
            ├─ Blue-green deployment
            ├─ Health checks
            └─ Monitor metrics
```

### GitHub Actions Workflows

#### 1. SDK Workflow (`.github/workflows/sdk.yml`)
```yaml
name: SDK Build & Deploy

on:
  push:
    paths:
      - 'sdks/**'
      - '.github/workflows/sdk.yml'

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        sdk: [typescript, python, go]
    steps:
      - uses: actions/checkout@v3
      - name: Setup SDK environment
      - name: Run tests
      - name: Lint & format
      - name: Security scan

  build-and-publish:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build SDK packages
      - name: Publish to npm/PyPI/Go Registry
      - name: Create release notes

  deploy:
    needs: build-and-publish
    environment: production
    steps:
      - name: Deploy SDKs
      - name: Publish documentation
```

#### 2. Mobile Workflow (`.github/workflows/mobile.yml`)
```yaml
name: Mobile Build & Deploy

on:
  push:
    paths:
      - 'mobile-apps/**'
      - '.github/workflows/mobile.yml'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Run unit tests
      - name: Run integration tests
      - name: Lint TypeScript

  build-ios:
    runs-on: macos-latest
    needs: test
    steps:
      - name: Build iOS app (EAS)
      - name: Run E2E tests
      - name: Upload to TestFlight

  build-android:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - name: Build Android app (EAS)
      - name: Run E2E tests
      - name: Upload to Google Play Beta
```

#### 3. Website Workflow (`.github/workflows/website.yml`)
```yaml
name: Website Build & Deploy

on:
  push:
    paths:
      - 'website/**'
      - '.github/workflows/website.yml'

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    steps:
      - name: Run tests
      - name: Run Lighthouse
      - name: Build Next.js app
      - name: Lint & format

  deploy:
    needs: test-and-build
    environment: production
    steps:
      - name: Deploy to Vercel (or K8s)
      - name: Run smoke tests
      - name: Verify redirects & links
      - name: Alert on deployment
```

### Docker Strategy

#### SDK Service Dockerfile
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### Mobile Backend Dockerfile
```dockerfile
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "start:server"]
```

#### Website Dockerfile
```dockerfile
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

### Kubernetes Deployment

```yaml
# Example: Website Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aurigraph-website
spec:
  replicas: 3
  selector:
    matchLabels:
      app: website
  template:
    metadata:
      labels:
        app: website
    spec:
      containers:
      - name: website
        image: ghcr.io/aurigraph-dlt-corp/website:latest
        ports:
        - containerPort: 3000
        env:
        - name: API_URL
          value: https://dlt.aurigraph.io/api/v11
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: website-service
spec:
  type: LoadBalancer
  ports:
  - port: 443
    targetPort: 3000
  selector:
    app: website
```

### Monitoring Stack

#### Prometheus Configuration
```yaml
# Monitor application metrics
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'sdk-service'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'mobile-backend'
    static_configs:
      - targets: ['localhost:8080']

  - job_name: 'website'
    static_configs:
      - targets: ['localhost:3000']
```

#### Grafana Dashboards
- Application health & uptime
- Request latency & throughput
- Error rates & exceptions
- Container resource usage (CPU, memory)
- Database performance
- Build & deployment frequency

### ELK Stack (Logging)

```
Application Logs
    ↓
Filebeat (Log Collection)
    ↓
Logstash (Processing & Filtering)
    ↓
Elasticsearch (Storage & Indexing)
    ↓
Kibana (Visualization & Analysis)
```

### Deployment Strategy (Incremental)

**Blue-Green Deployment**:
```
Current (Green) ← Load Balancer
New Build (Blue)
    ↓
Health Checks Pass?
├─ Yes → Switch traffic Green → Blue
└─ No → Rollback to Green
```

**Canary Release**:
```
Traffic: 5% → New Version
Monitor metrics for 1 hour
├─ All good? → 50% traffic
├─ Still good? → 100% traffic
└─ Issues? → Rollback
```

### Monitoring Checklist

**Pre-Deployment**:
- ✅ All tests passing
- ✅ Code review approved
- ✅ Security scan passed
- ✅ Performance benchmarks met

**During Deployment**:
- ✅ Monitor error rates
- ✅ Watch response times
- ✅ Check resource usage
- ✅ Verify health endpoints

**Post-Deployment**:
- ✅ Smoke tests passed
- ✅ Error rates normal
- ✅ Performance within SLA
- ✅ Alert team if issues

---

## Infrastructure as Code (IaC)

All infrastructure is defined in code using:
- **Terraform** for cloud resources
- **Helm** charts for Kubernetes
- **Docker Compose** for local development
- **GitHub Actions** for CI/CD orchestration

---

**Version**: 1.0
**Last Updated**: December 27, 2025
**Status**: ✅ Architecture Approved
