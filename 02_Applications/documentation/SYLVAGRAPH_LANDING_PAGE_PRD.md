# PRD: Sylvagraph Landing Page Development

**Document Version:** 1.0  
**Date:** August 11, 2025  
**Status:** 🚀 **READY FOR DEVELOPMENT**  
**Owner:** Frontend Engineering Team  

---

## 📋 Executive Summary

### Project Overview
Develop a production-quality landing page for **Sylvagraph** - the Agroforestry Sustainability & Tokenized Carbon Credits platform. This landing page will serve as the primary marketing and onboarding entry point for the Sylvagraph application within the Aurex Platform ecosystem.

### Strategic Alignment
- **Platform Integration**: Seamless integration with Aurex Platform path-based routing (`localhost/Sylvagraph`)
- **Brand Consistency**: Maintain Aurex Platform design language while establishing unique Sylvagraph identity
- **Business Goals**: Drive user acquisition, partner onboarding, and project initiation
- **Technical Excellence**: Production-ready React application with modern tech stack

---

## 🎯 Product Requirements

### Core Objectives
1. **Marketing Conversion**: Convert visitors to leads and project partners
2. **Education**: Clearly communicate Sylvagraph's value proposition and process
3. **Trust Building**: Establish credibility through compliance badges and social proof
4. **Accessibility**: WCAG 2.1 AA compliance for global reach
5. **Performance**: Fast loading, SEO-optimized, mobile-first design

### Success Metrics
- **Performance**: Lighthouse scores ≥90 (Performance), ≥95 (Accessibility, Best Practices, SEO)
- **Conversion**: Clear CTA tracking for "Start a Project" and "Contact Us"
- **Engagement**: Interactive modules exploration with filtering/search
- **Technical**: Zero type errors, passes ESLint validation

---

## 🏗️ Technical Architecture

### Technology Stack
```typescript
Frontend Framework: React 18 + TypeScript + Vite
Styling: Tailwind CSS + shadcn/ui components
Animations: Framer Motion (reduced motion support)
Routing: React Router v6+ (integrated with Aurex Platform)
Icons: Lucide React
SEO: react-helmet-async
Testing: Vitest + React Testing Library
Linting: ESLint + Prettier
```

### Integration Points
```typescript
// Aurex Platform Integration
Base URL: http://localhost/Sylvagraph (development)
Base URL: https://dev.aurigraph.io/Sylvagraph (production)

// API Integration Points (Future)
API Base: /api/sylvagraph
Auth: Shared Aurex Platform JWT authentication
Database: PostgreSQL (aurex_sylvagraph schema)
```

### File Structure
```
02_Applications/04_aurex-sylvagraph/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # shadcn components
│   │   │   ├── sections/     # Page sections
│   │   │   └── layout/       # Header, Footer
│   │   ├── pages/           # Route components
│   │   ├── data/            # Static data
│   │   ├── lib/             # Utilities, SEO
│   │   └── styles/          # Tailwind CSS
│   ├── public/              # Static assets
│   └── package.json
├── backend/                 # FastAPI backend (future)
└── SYLVAGRAPH_LANDING_PAGE_PRD.md
```

---

## 🎨 Design Requirements

### Visual Identity
```css
/* Brand Colors */
--forest-primary: #1a5f3f    /* Deep forest green */
--forest-secondary: #2d7a5f  /* Medium forest green */
--mint-accent: #7dd3fc       /* Fresh mint accent */
--sand-neutral: #faf9f7      /* Warm sand background */
--ink-text: #1e293b          /* Dark text */

/* Typography */
Font Family: System fonts (Tailwind defaults)
Headings: font-bold, improved leading
Body: font-normal, improved tracking
```

### Layout Principles
- **Responsive Grid**: Mobile-first, 1/2/3/4 columns
- **White Space**: Generous spacing, airy feel
- **Cards**: Rounded-2xl, soft shadows, hover effects
- **Accessibility**: High contrast, keyboard navigation
- **Motion**: Subtle animations, reduced motion support

---

## 📄 Page Structure & Content

### 1. Landing Page (`/`)

#### Hero Section
```typescript
interface HeroContent {
  headline: "Sylvagraph — Bringing Agroforestry to the Digital Age"
  subheadline: "Monitor landscapes with drones & satellites, verify with DMRV, and tokenize high-quality credits."
  primaryCTA: {
    text: "Start a Project"
    action: "Navigate to /contact"
  }
  secondaryCTA: {
    text: "Learn How It Works"
    action: "Scroll to Process section"
  }
  visual: "Right-side illustration panel (responsive)"
}
```

#### Content Sections
1. **What is Sylvagraph?** - Overview with 4 key capability chips
2. **Who Benefits** - 4 persona cards (Farmers, NGOs, Corporates, Regulators)
3. **Key Benefits** - 5 benefit items with icons
4. **Our Process** - 7-step timeline (horizontal/vertical responsive)
5. **Featured Modules** - 8 interactive tiles from 30 total modules
6. **Modules Preview** - Compact grid + "View all" CTA
7. **Trust & Compliance** - Certification badges and standards
8. **Social Proof** - Testimonials and final CTAs

### 2. Modules Page (`/modules`)
- **Grid Layout**: All 30 modules with responsive columns
- **Filtering**: Category chips (Core, MRV, Credits, Compliance, Ops)
- **Search**: Title/description search with debouncing
- **Sorting**: Alphabetical sorting option
- **Empty State**: Friendly message for no results

### 3. Demo Project Page (`/demo-project`)
- **KPI Dashboard**: Hectares, tCO₂e sequestered, credits issued, payouts
- **Simple Chart**: Static data visualization (recharts or custom)
- **Navigation**: Link back to landing page

### 4. Contact Page (`/contact`)
- **Form Fields**: Name, organization, email, country, message
- **Validation**: Required fields, email format validation
- **Submission**: Console.log + success toast (no backend)
- **Privacy**: GDPR compliance note

---

## 📊 Modules Dataset

### Module Categories & Count
```typescript
const moduleCategories = {
  core: 6,        // IAM, Onboarding, Project Management, etc.
  mrv: 8,         // Data Collection, Drone, Satellite, AI, etc.
  credits: 6,     // Registry, Tokenization, Exchange, etc.
  compliance: 10  // GDPR, AML, Security, Analytics, etc.
} // Total: 30 modules
```

### Sample Module Structure
```typescript
interface Module {
  id: string
  slug: string
  title: string
  description: string
  category: 'core' | 'mrv' | 'credits' | 'compliance'
  icon: LucideIcon
  path: string
  featured: boolean
}
```

---

## 🔗 Routing & Navigation

### Route Structure
```typescript
const routes = [
  { path: '/', component: HomePage },
  { path: '/modules', component: ModulesPage },
  { path: '/demo-project', component: DemoProjectPage },
  { path: '/contact', component: ContactPage }
]
```

### Integration with Aurex Platform
```typescript
// Environment-based URL configuration
const baseURL = {
  development: 'http://localhost/Sylvagraph',
  production: 'https://dev.aurigraph.io/Sylvagraph'
}

// Navigation integration with Aurex Platform header
const platformNavigation = {
  'Back to Platform': 'http://localhost/', // or production URL
  'Other Apps': ['Launchpad', 'Hydropulse', 'Carbontrace', 'AurexAdmin']
}
```

---

## 🎯 User Experience Requirements

### Accessibility (WCAG 2.1 AA)
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Focus Management**: Visible focus rings, logical tab order
- **Screen Readers**: ARIA labels, semantic HTML, alt text
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Motion**: Respect `prefers-reduced-motion` setting

### Performance Targets
```typescript
const performanceTargets = {
  lighthouseScores: {
    performance: ">= 90",
    accessibility: ">= 95", 
    bestPractices: ">= 95",
    seo: ">= 95"
  },
  coreWebVitals: {
    lcp: "< 2.5s",     // Largest Contentful Paint
    fid: "< 100ms",    // First Input Delay  
    cls: "< 0.1"       // Cumulative Layout Shift
  }
}
```

### SEO Optimization
```typescript
const seoRequirements = {
  metaTags: {
    title: "Sylvagraph - Agroforestry Carbon Credits Platform",
    description: "Monitor landscapes with drones & satellites, verify with DMRV, tokenize carbon credits. Join the digital agroforestry revolution.",
    keywords: "agroforestry, carbon credits, DMRV, satellite monitoring, blockchain tokenization"
  },
  openGraph: {
    title: "Sylvagraph - Digital Agroforestry Platform",
    description: "Transparent carbon credit verification and tokenization",
    image: "/og-sylvagraph.jpg",
    url: "https://dev.aurigraph.io/Sylvagraph"
  },
  structuredData: "Organization, Product, FAQPage schemas"
}
```

---

## 🔧 Component Architecture

### Core Components
```typescript
// Layout Components
<SiteHeader />     // Logo, nav, dark mode toggle, sticky behavior
<SiteFooter />     // Links, newsletter, social icons

// Landing Page Sections  
<Hero />           // Main hero with CTAs and animation
<PersonaCards />   // 4 user personas with equal height cards
<BenefitsGrid />   // 5 key benefits with icons
<ProcessTimeline />// 7-step process (responsive layout)
<FeaturedModules />// 8 curated modules from dataset
<ModulesPreview /> // Compact 12 modules + "View all" button
<TrustStrip />     // Compliance badges and standards

// Reusable Components
<ModuleTile />     // Accepts icon, title, description, path
<FilterBar />      // Category select, search input, sort
<ContactForm />    // Validation, submission handling
```

### State Management
```typescript
// Local State Only (No Global Store)
const [darkMode, setDarkMode] = useState<boolean>()
const [modules, setModules] = useState<Module[]>()
const [filteredModules, setFilteredModules] = useState<Module[]>()
const [searchQuery, setSearchQuery] = useState<string>()
const [selectedCategory, setSelectedCategory] = useState<string>()
```

---

## 📱 Responsive Design

### Breakpoints
```css
/* Tailwind Breakpoints */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Layout Behavior
```typescript
const responsiveLayouts = {
  hero: "Stack on mobile, side-by-side on md+",
  personaCards: "1 column sm, 2 columns md, 4 columns lg",
  processTimeline: "Vertical on mobile, horizontal on md+", 
  modulesGrid: "1 column sm, 2 columns md, 3 columns lg, 4 columns xl",
  benefits: "1 column sm, 2 columns md, 3 columns lg"
}
```

---

## 🚀 Development Phases

### Phase 1: Foundation (Days 1-2)
- [ ] Project setup with Vite + TypeScript
- [ ] Tailwind CSS configuration with custom colors
- [ ] shadcn/ui component installation
- [ ] Basic routing with React Router
- [ ] Site header and footer components

### Phase 2: Landing Page (Days 3-5)
- [ ] Hero section with animations
- [ ] Persona cards and benefits grid
- [ ] Process timeline component
- [ ] Modules dataset creation
- [ ] Featured modules and preview sections

### Phase 3: Additional Pages (Days 6-7)
- [ ] Modules page with filtering/search
- [ ] Demo project page with KPIs
- [ ] Contact form with validation
- [ ] Dark mode implementation

### Phase 4: Polish & Testing (Days 8-9)
- [ ] SEO optimization and meta tags
- [ ] Accessibility audit and fixes
- [ ] Performance optimization
- [ ] Cross-browser testing

### Phase 5: Integration (Day 10)
- [ ] Integration with Aurex Platform routing
- [ ] Production build optimization
- [ ] Documentation and handoff
- [ ] Deployment preparation

---

## 🔍 Quality Assurance

### Testing Strategy
```typescript
const testingPyramid = {
  unit: "Component testing with React Testing Library",
  integration: "Route navigation and form submission",
  e2e: "Critical user journeys with Playwright",
  accessibility: "axe-core integration testing",
  performance: "Lighthouse CI in GitHub Actions"
}
```

### Acceptance Criteria Checklist
- [ ] ✅ Project boots with `pnpm dev` without type errors
- [ ] ✅ All 4 pages render correctly with proper routing
- [ ] ✅ Landing page includes all 8 required sections
- [ ] ✅ Modules page shows all 30 modules with working filters
- [ ] ✅ Contact form validates inputs and handles submission
- [ ] ✅ Dark mode toggle persists in localStorage
- [ ] ✅ Lighthouse scores meet performance targets
- [ ] ✅ WCAG 2.1 AA accessibility compliance
- [ ] ✅ ESLint passes, code is Prettier formatted
- [ ] ✅ Integration with Aurex Platform path-based routing

### Browser Support
```typescript
const browserSupport = {
  chrome: ">= 88",
  firefox: ">= 85", 
  safari: ">= 14",
  edge: ">= 88",
  mobile: "iOS Safari >= 14, Chrome Android >= 88"
}
```

---

## 📈 Success Metrics & KPIs

### Technical Metrics
- **Performance**: Page load time < 2s, Lighthouse score ≥90
- **Accessibility**: WCAG 2.1 AA compliance, axe-core tests pass
- **SEO**: Meta tags complete, structured data implemented
- **Quality**: 0 TypeScript errors, ESLint violations, broken links

### Business Metrics (Future Analytics)
- **Engagement**: Time on page, scroll depth, section interactions
- **Conversion**: CTA click rates, contact form submissions
- **Traffic**: Unique visitors, bounce rate, referral sources
- **User Journey**: Navigation patterns, exit pages

---

## 🔮 Future Enhancements

### Phase 2 Features (Post-MVP)
- [ ] **Real API Integration**: Connect to Sylvagraph backend APIs
- [ ] **Authentication**: Integrate with Aurex Platform auth system
- [ ] **Dynamic Content**: CMS integration for testimonials/case studies
- [ ] **Advanced Filtering**: Module search by tags, complexity level
- [ ] **Interactive Demo**: Embedded project simulation
- [ ] **Localization**: Multi-language support (i18n)

### Technical Debt & Optimization
- [ ] **Bundle Optimization**: Tree shaking, code splitting
- [ ] **Image Optimization**: WebP format, lazy loading
- [ ] **Cache Strategy**: Service worker, CDN integration
- [ ] **Analytics**: Google Analytics 4, custom event tracking

---

## 📚 Documentation Deliverables

### Required Documentation
1. **README.md** - Setup instructions, development workflow
2. **COMPONENT_DOCS.md** - Component API documentation  
3. **DEPLOYMENT_GUIDE.md** - Production deployment instructions
4. **API_INTEGRATION_GUIDE.md** - Future backend integration points

### Code Documentation
```typescript
// Comprehensive TSDoc comments for all components
/**
 * ModuleTile component for displaying individual modules
 * @param {Module} module - Module data object
 * @param {boolean} featured - Whether to show featured styling
 * @returns {JSX.Element} Rendered module tile
 */
```

---

## ✅ Definition of Done

### Development Complete When:
- [ ] All pages implemented and functional
- [ ] Responsive design works across all breakpoints
- [ ] Accessibility requirements met (WCAG 2.1 AA)
- [ ] Performance targets achieved (Lighthouse ≥90/95/95/95)
- [ ] SEO optimization complete with meta tags
- [ ] Integration with Aurex Platform path-based routing
- [ ] Code quality standards met (ESLint, Prettier, TypeScript)
- [ ] Documentation complete and accurate

### Ready for Production When:
- [ ] Stakeholder approval on design and functionality
- [ ] QA testing complete across browsers/devices
- [ ] Performance monitoring configured
- [ ] Deployment pipeline configured
- [ ] Analytics tracking implemented
- [ ] Error monitoring configured (Sentry/similar)

---

**PRD Status:** ✅ **APPROVED FOR DEVELOPMENT**  
**Next Step:** Begin Phase 1 - Foundation Setup  
**Timeline:** 10 development days  
**Priority:** High - Strategic platform expansion  

---

*This PRD serves as the single source of truth for Sylvagraph landing page development. All implementation decisions should align with these requirements.*