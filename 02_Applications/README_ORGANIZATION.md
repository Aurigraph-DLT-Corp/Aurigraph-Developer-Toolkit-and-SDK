# Aurex Platform - File Organization

## 📁 Directory Structure

### Essential Deployment Files
- `docker-compose.yml` - Local development deployment
- `docker-compose.production.yml` - Production deployment

### Application Structure
```
02_Applications/
├── documentation/          # All documentation files (.md)
├── scripts/               # All automation scripts (.sh, .yml)
├── 00_aurex-platform/     # Main platform application
├── 01_aurex-main/         # Main site application
├── 02_aurex-launchpad/    # ESG management platform
├── 03_aurex-hydropulse/   # Water management application
├── 04_aurex-sylvagraph/   # Forest management application
├── 05_aurex-carbontrace/  # Carbon tracking application
└── 06_aurex-admin/        # Administrative dashboard
```

### Infrastructure
```
03_Infrastructure/
└── nginx/
    ├── launchpad-complete.conf  # Local nginx configuration
    └── conf.d/
        └── default.conf         # Production nginx configuration
```

## 🚀 Quick Start

### Local Development
```bash
docker-compose up -d
```

### Production Deployment
```bash
docker-compose -f docker-compose.production.yml up -d
```

## 📖 Documentation
All documentation files are organized in `02_Applications/documentation/`

## 🔧 Scripts
All automation scripts are organized in `02_Applications/scripts/`
