# 🌐 Aurigraph Website - ASAP Sprint

**Epic**: AV11-908 (Website Development)
**Team**: @WebsiteDevTeam
**Status**: ✅ READY TO START
**Timeline**: 4 Weeks (ASAP)
**Target**: dlt.aurigraph.io

---

## 🌐 Project Overview

Build a high-performance, SEO-optimized public website featuring marketing landing page, comprehensive API documentation, interactive blockchain dashboard, and blog platform.

## 📁 Project Structure

```
website/
├── aurigraph.io/            # Main marketing website
│   ├── public/
│   ├── src/
│   │   ├── pages/           # Next.js pages (landing, about, pricing)
│   │   ├── components/      # Reusable React components
│   │   ├── lib/             # Utilities & API client
│   │   └── styles/          # Tailwind CSS
│   ├── package.json
│   ├── next.config.js
│   └── README.md
├── docs/                    # Developer documentation
│   ├── content/             # MDX content files
│   │   ├── getting-started.mdx
│   │   ├── api/             # API reference docs
│   │   └── guides/          # Developer guides
│   ├── pages/               # Doc pages
│   └── README.md
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Basic knowledge of React & Next.js

### Setup

```bash
cd website/aurigraph.io

# Install dependencies
npm install

# Development server
npm run dev
# Open http://localhost:3000

# Run tests
npm test

# Build for production
npm run build
npm run start

# SEO check (Lighthouse)
npm run lighthouse
```

## 📋 Tickets

| Ticket | Task | Status | Priority |
|--------|------|--------|----------|
| AV11-919 | Landing Page & Marketing | 🔵 Todo | High |
| AV11-920 | API Documentation Portal | 🔵 Todo | High |
| AV11-921 | Public Blockchain Dashboard | 🔵 Todo | High |
| AV11-922 | Blog & CMS Platform | 🔵 Todo | Medium |

## 📚 Architecture

See [`docs/architecture/WEBSITE_AND_INFRASTRUCTURE_ARCHITECTURE.md`](../docs/architecture/WEBSITE_AND_INFRASTRUCTURE_ARCHITECTURE.md) for:
- Complete Next.js architecture
- API documentation setup
- Dashboard design
- Blog platform
- Performance optimization
- SEO strategy

## 🎯 Key Features

### Phase 1: Landing & API Docs (Week 2)
- Hero section & product features
- Pricing table
- API reference (Swagger/OpenAPI)
- Code examples
- Getting started guide

### Phase 2: Dashboard & Blog (Week 3)
- Real-time blockchain metrics
- Transaction volume charts
- Network health status
- Blog platform setup
- Author profiles

### Phase 3: Optimization & Launch (Week 4)
- SEO optimization (Lighthouse 90+)
- Performance tuning
- Mobile responsiveness
- Accessibility (WCAG 2.1 AA)
- Analytics setup

## 📊 Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Score | 90+ |
| FCP (First Contentful Paint) | <1.5s |
| LCP (Largest Contentful Paint) | <2.5s |
| CLS (Cumulative Layout Shift) | <0.1 |
| SEO Score | 95+ |

## 📝 Content Management

### Blog Posts
- Location: `docs/blog/` (MDX files)
- Automatic metadata extraction
- Categories & tags
- Author profiles
- Comments (optional)

### Documentation
- Location: `docs/content/` (MDX files)
- Automatic sidebar generation
- Table of Contents
- Code syntax highlighting
- Live code playground

### API Reference
- Swagger/OpenAPI integration
- Interactive endpoint explorer
- Multiple language examples
- Request/response samples

## 🔧 Technology Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 14 |
| React | v18 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui + Headless UI |
| CMS | Contentlayer + MDX |
| API Docs | SwaggerUI + Redoc |
| Charts | Recharts |
| Testing | Jest + React Testing Library |
| Deployment | Vercel or Docker |

## 🔐 Security

- ✅ HTTPS/TLS enforcement
- ✅ Security headers (CSP, X-Frame-Options, etc.)
- ✅ No API keys exposed
- ✅ DDoS protection (Cloudflare)
- ✅ Regular security audits

## 🧪 Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests (Playwright)
npm run test:e2e

# Lighthouse audit
npm run lighthouse
```

## 📦 Deployment

### Development
```bash
npm run dev
```

### Staging (Vercel)
```bash
npm run build
vercel deploy --prod
```

### Production (dlt.aurigraph.io)
```bash
npm run build
# Deploy to production via CI/CD
```

## 🔗 Quick Links

- **JIRA Epic**: [AV11-908](https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/issues/AV11-908)
- **Architecture**: [`docs/architecture/WEBSITE_AND_INFRASTRUCTURE_ARCHITECTURE.md`](../docs/architecture/WEBSITE_AND_INFRASTRUCTURE_ARCHITECTURE.md)
- **Sprint Coordination**: [`SPRINT_COORDINATION.md`](../SPRINT_COORDINATION.md)
- **Team**: @WebsiteDevTeam

## 🎯 Success Criteria

- ✅ Landing page live & converting
- ✅ API docs complete & interactive
- ✅ Dashboard showing real metrics
- ✅ Blog platform functional
- ✅ Lighthouse score 90+
- ✅ SEO optimized
- ✅ Mobile responsive
- ✅ WCAG 2.1 AA compliant

---

**Status**: ✅ Ready to start
**Timeline**: 4 weeks
**Target**: January 24, 2025
**Live at**: https://dlt.aurigraph.io
