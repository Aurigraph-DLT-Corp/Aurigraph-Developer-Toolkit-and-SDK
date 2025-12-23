# Aurigraph V11 Enterprise Portal - Release 2

## Overview
Enterprise management portal for Aurigraph V11 DLT platform, built as part of Release 2 (AV11-137).

## Features
- **Real-time Dashboard**: Monitor TPS, block height, and network health
- **Transaction Management**: View and analyze transaction data
- **Performance Monitoring**: Track system performance metrics
- **Node Management**: Monitor and manage network nodes
- **Analytics**: Advanced analytics and reporting
- **Settings**: Configure system parameters

## Tech Stack
- React 18 with TypeScript
- Material-UI (MUI) for UI components
- Redux Toolkit for state management
- Recharts for data visualization
- Vite for build tooling
- Axios for API communication

## Quick Start

### Development
```bash
npm install
npm run dev
```
Access at: http://localhost:3000

### Production Build
```bash
npm run build
```

### Docker Deployment
```bash
chmod +x deploy.sh
./deploy.sh
```

## API Integration
The portal connects to Aurigraph V11 Release 2 API endpoints:
- Production: https://dlt.aurigraph.io/api/v11
- Development: http://localhost:9003/api/v11

## Release Information
- **Version**: 2.0.0
- **Release Date**: 2025-09-26
- **JIRA Ticket**: AV11-137
- **Status**: Production Ready

## Deployment URLs
- Local: http://localhost:3000
- Production: https://portal.dlt.aurigraph.io

## Security
- JWT-based authentication
- Role-based access control
- Secure API communication over HTTPS
- CORS configured for production domain

## Contributing
This is part of Aurigraph V11 Release 2. All changes must be approved through PR review.

## License
Proprietary - Aurigraph DLT Corp

---
**Release 2 Baseline** - Enterprise Portal Integration Complete