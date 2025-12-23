# RWA Tokenization Components

This directory contains React components for Real-World Asset (RWA) tokenization functionality in the Aurigraph V11 Enterprise Portal.

## Implemented Components

### 1. AssetTokenizationForm.tsx (450 lines)
**Purpose**: Form to tokenize real-world assets into wAUR tokens

**Features**:
- Multi-step asset information input
- Support for 8 asset types (Real Estate, Carbon Credits, Financial, Artwork, Commodities, Vehicles, Equipment, Other)
- Document upload (PDF, JPG, PNG, DOC)
- Oracle source selection (Chainlink, Band Protocol, API3, Tellor, Internal)
- Fractional ownership configuration
- Real-time validation
- Loading states and error handling
- Success notifications

**API Endpoints Used**:
- POST `/api/v11/rwa/tokenize` - Tokenize new asset

**Props**: None (standalone component)

**State Management**: Redux (rwaSlice)

---

### 2. RWAPortfolio.tsx (315 lines)
**Purpose**: Display user's RWA token portfolio with analytics and visualizations

**Features**:
- Portfolio metrics (Total Value, Total Assets, Total Dividends)
- Asset distribution pie chart
- Asset values bar chart
- Detailed token holdings table
- Real-time portfolio refresh
- Export functionality
- Asset categorization by type
- Status indicators
- Quick actions (View Details)

**API Endpoints Used**:
- GET `/api/v11/rwa/portfolio/{address}` - Fetch portfolio

**Props**: None (uses address from Redux auth state)

**State Management**: Redux (rwaSlice)

**Charts**: Recharts (Pie Chart, Bar Chart)

---

## Components to be Implemented

### 3. DigitalTwinVisualization.tsx
**Purpose**: 3D/interactive visualization of asset digital twins

**Planned Features**:
- Digital twin metadata display
- Ownership history timeline
- Valuation history chart
- IoT sensor data visualization
- Verification records
- Asset analytics
- Quantum hash verification
- Document viewer

**Backend Services**:
- AssetDigitalTwin.java
- DigitalTwinService.java

---

### 4. FractionalOwnershipManager.tsx
**Purpose**: Manage fractional shares and ownership transfers

**Planned Features**:
- Split token into fractional shares
- Transfer shares between addresses
- Shareholder list and distribution
- Share transaction history
- Ownership percentage calculator
- Voting power display
- Share merging functionality
- Real-time share price

**Backend Services**:
- FractionalOwnershipService.java
- AssetShareRegistry.java
- ShareHolder.java

---

### 5. DividendDistributionDashboard.tsx
**Purpose**: Track and distribute dividends to token holders

**Planned Features**:
- Dividend distribution form
- Automated schedule configuration
- Historical dividend payments
- Dividend projections (ML-based)
- Tax withholding configuration
- Reinvestment options
- Per-shareholder breakdown
- Performance analytics

**Backend Services**:
- DividendDistributionService.java
- DividendEvent.java
- EnhancedDividendPayment.java

---

### 6. ComplianceDashboard.tsx
**Purpose**: KYC/AML verification and regulatory compliance

**Planned Features**:
- Compliance status overview
- KYC document upload
- AML verification workflow
- Jurisdiction support matrix
- Verification level indicators
- Compliance audit trail
- Transfer validation
- Accredited investor checks

**Backend Services**:
- RegulatoryComplianceService.java
- MandatoryVerificationService.java
- ComplianceProfile (models)

---

### 7. AssetValuation.tsx
**Purpose**: Real-time asset pricing and oracle feeds

**Planned Features**:
- Current asset valuation display
- Multiple oracle price feeds
- Consensus pricing mechanism
- Historical price charts
- Oracle health monitoring
- Manual valuation updates
- AI-driven pricing insights
- Price alert configuration

**Backend Services**:
- AssetValuationService.java
- OracleService.java
- PriceDataPoint (models)

---

## File Structure

```
enterprise-portal/src/components/rwa/
├── AssetTokenizationForm.tsx      (✓ Implemented)
├── RWAPortfolio.tsx                (✓ Implemented)
├── DigitalTwinVisualization.tsx    (TODO)
├── FractionalOwnershipManager.tsx  (TODO)
├── DividendDistributionDashboard.tsx (TODO)
├── ComplianceDashboard.tsx         (TODO)
├── AssetValuation.tsx              (TODO)
├── index.tsx                       (✓ Export index)
└── README.md                       (✓ This file)
```

## Supporting Infrastructure

### Type Definitions
- `/types/rwa.ts` (504 lines) - Complete TypeScript type definitions

### API Service Layer
- `/services/RWAService.ts` (595 lines) - API client with all RWA endpoints

### State Management
- `/store/rwaSlice.ts` (517 lines) - Redux Toolkit slice with async thunks

### Backend Services (33 Java files)
Located in: `/src/main/java/io/aurigraph/v11/contracts/rwa/`

**Core Services**:
- RWATokenizer.java (389 lines) - Main tokenization engine
- RWAToken.java (436 lines) - Token implementation
- AssetDigitalTwin.java (583 lines) - Digital twin management
- FractionalOwnershipService.java (351 lines) - Fractional shares
- DividendDistributionService.java (305 lines) - Dividend payments
- RegulatoryComplianceService.java (117 lines) - Compliance verification
- OracleService.java (283 lines) - Price feeds
- AssetValuationService.java (234 lines) - Asset pricing

## Navigation

RWA section added to main navigation menu:
- Tokenize Asset (`/rwa/tokenize`)
- My Portfolio (`/rwa/portfolio`)
- Asset Valuation (`/rwa/valuation`)
- Dividends (`/rwa/dividends`)
- Compliance (`/rwa/compliance`)

## Mock Data

For development/testing, use mock data generators:
```typescript
import { generateMockToken, generateMockPortfolio } from '../services/RWAService'

// Generate single mock token
const mockToken = generateMockToken()

// Generate mock portfolio with 5 assets
const mockPortfolio = generateMockPortfolio('0x123...', 5)
```

## Design System

**Color Palette**:
- Primary: `#00BFA5` (Teal)
- Secondary: `#FF6B6B` (Coral)
- Tertiary: `#4ECDC4` (Turquoise)
- Background: `linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)`

**Asset Type Colors**:
- Carbon Credits: `#4CAF50` (Green)
- Real Estate: `#2196F3` (Blue)
- Financial: `#FF9800` (Orange)
- Artwork: `#9C27B0` (Purple)
- Commodity: `#FFEB3B` (Yellow)
- Vehicle: `#00BCD4` (Cyan)
- Equipment: `#795548` (Brown)
- Other: `#9E9E9E` (Grey)

## Usage Examples

### Tokenize Asset
```tsx
import { AssetTokenizationForm } from './components/rwa'

function App() {
  return <AssetTokenizationForm />
}
```

### View Portfolio
```tsx
import { RWAPortfolio } from './components/rwa'

function App() {
  return <RWAPortfolio />
}
```

## Dependencies

- **UI Framework**: Material-UI (@mui/material)
- **Charts**: Recharts
- **State Management**: Redux Toolkit
- **HTTP Client**: Fetch API
- **Icons**: Material Icons
- **Routing**: React Router v6

## API Integration

All components connect to the Aurigraph V11 backend:
- Base URL: `http://localhost:9003` (development)
- API Prefix: `/api/v11`
- Protocol: RESTful HTTP + JSON

## Testing

Mock data is available for all components:
1. Use `generateMockToken()` for single token testing
2. Use `generateMockPortfolio()` for portfolio testing
3. Backend endpoints return simulated data when services are not connected

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live price feeds
2. **Mobile Responsive**: Optimize for tablet and mobile devices
3. **Advanced Analytics**: Machine learning insights
4. **Batch Operations**: Multi-asset tokenization
5. **Social Features**: Asset sharing and collaboration
6. **Notifications**: Real-time alerts for dividends and valuations

## Support

For issues or questions, contact the Aurigraph development team.
