# Aurigraph RWAT SDK - Reference Implementations
## 4 Production-Ready Sample Applications (Q2 2026)

**Document Type**: Reference Implementation Catalog
**Timeline**: Apr 22 - May 12, 2026 (Sprint 6)
**Status**: Architecture & Design Phase
**Total Implementations**: 4 complete applications
**Target Deployment**: Public testnet (May 12, 2026)
**Owner**: Solutions Architect Team

---

## Overview

This document provides detailed specifications for 4 reference implementations demonstrating enterprise RWA use cases. Each is a production-grade application deployable to public testnet, with complete source code, documentation, and video tutorials.

**Design Principle**: "Copy and Customize" - Developers should be able to fork each repo and customize for their specific use case in <2 weeks.

---

## 1. REAL ESTATE TOKENIZATION PLATFORM

### 1.1 Purpose & Use Case

**Problem Being Solved**:
Real estate investors struggle with:
- Illiquidity (can't trade property shares easily)
- High transaction costs (3-8% in traditional markets)
- Slow settlement (T+2 to T+7)
- Limited access to investment opportunities

**Solution**:
Blockchain-based real estate investment platform enabling:
- Property tokenization into fractional shares
- Secondary market trading (near-instant)
- Lower fees (0.5-2%)
- 24/7 global access
- Automated dividend/rental income distribution

### 1.2 Application Features

#### Core Features (MVP)
```
Property Registry
├── Property listing (with photos, legal docs, metadata)
├── Valuation management (automated from oracle)
├── Ownership tracking (who owns which shares)
├── Rental income tracking (automated distribution)
└── Legal compliance (document storage, evidence trails)

Asset Issuance
├── Create security token for property
├── Define share distribution (e.g., 10,000 shares)
├── Set dividend frequency (monthly, quarterly)
├── Investor limits (max holders per property)
└── Compliance checks (accredited investors, KYC/AML)

Trading Marketplace
├── Secondary market for property shares
├── Order book (buy/sell orders)
├── Automated matching engine
├── Settlement in 24 hours
└── Fee collection (0.5-2% per trade)

Investor Dashboard
├── Portfolio view (properties owned, valuation)
├── Trading history (buys, sells, income)
├── Income tracking (rental income, dividends)
├── Performance metrics (ROI, yield)
└── Notifications (income deposits, trading opportunities)

Issuer Admin Portal
├── Property management
├── Shareholder management
├── Income distribution
├── Compliance reporting
└── Analytics (trading volume, holder statistics)
```

### 1.3 Technical Architecture

**Frontend Stack**:
- React 18 + TypeScript
- Material-UI for components
- Redux for state management
- Recharts for financial charts
- Web3 wallet integration (MetaMask, WalletConnect)

**Backend Stack**:
- Node.js + Express.js
- @aurigraph/rwat-sdk (TypeScript SDK)
- PostgreSQL (property/investor data)
- Redis (caching, real-time updates)
- WebSocket (real-time trading updates)

**Deployment**:
- Docker Compose for local dev
- Kubernetes (EKS) for production
- AWS S3 for document storage
- CloudFront CDN for assets

**Smart Contracts**:
- Property token contract (ERC-20 compatible on Aurigraph)
- Dividend distribution contract
- Trading contract
- Governance contract (DAO voting for major changes)

### 1.4 Data Model

```
Properties Table:
├── id (uuid)
├── address (text)
├── property_type (enum: single-family, multi-family, commercial, land)
├── purchase_price (decimal)
├── current_valuation (decimal, from oracle)
├── total_shares (integer)
├── property_owner (user_id)
├── annual_rental_income (decimal)
├── metadata (JSON: photos, documents, legal info)
├── created_at (timestamp)
└── updated_at (timestamp)

Ownership Table:
├── property_id (uuid)
├── investor_id (user_id)
├── shares_owned (integer)
├── purchase_price_per_share (decimal)
├── acquisition_date (timestamp)
└── tax_lot_id (string, for compliance)

Transactions Table:
├── id (uuid)
├── buyer_id (user_id)
├── seller_id (user_id)
├── property_id (uuid)
├── shares_count (integer)
├── price_per_share (decimal)
├── total_price (decimal)
├── transaction_date (timestamp)
├── settlement_date (timestamp)
├── status (enum: pending, settled, failed)
└── blockchain_tx_hash (text, Aurigraph)

Income Distribution Table:
├── property_id (uuid)
├── distribution_date (timestamp)
├── total_income (decimal)
├── per_share_amount (decimal)
├── distributed_amount (decimal)
├── status (enum: pending, distributed, failed)
└── transaction_details (JSON)
```

### 1.5 Key Workflows

**Workflow 1: Property Tokenization**
```
1. Real estate company uploads property docs
2. Platform validates property ownership
3. Appraiser provides valuation (from oracle)
4. Platform creates property token (ERC-20 equivalent)
5. Shares distributed to initial investor
6. Property listed on platform (trading enabled)
7. Investors can start purchasing shares
```

**Workflow 2: Secondary Market Trading**
```
1. Investor sees buy opportunity (property share listing)
2. Investor submits buy order (price, quantity)
3. Matching engine finds seller with matching price
4. Transaction initiated (buyer and seller confirmed)
5. Stablecoins transferred to seller (via Aurigraph)
6. Shares transferred to buyer
7. Settlement completes (24 hours)
8. Both parties notified
```

**Workflow 3: Income Distribution**
```
1. Real estate company collects monthly rental income
2. Files income report with platform
3. Platform verifies income (from oracle if possible)
4. Calculates per-share amount (total income / total shares)
5. Distributes to all investors proportional to holdings
6. Blockchain transaction recorded (immutable trail)
7. Investors notified (app notification + email)
8. Tax reporting documents generated
```

### 1.6 Deployment Steps

**Local Development** (15 minutes):
```bash
# Clone repo
git clone https://github.com/aurigraph-community/real-estate-rwa.git
cd real-estate-rwa

# Install dependencies
npm install

# Start local testnet + database
docker-compose up

# Run backend
npm run backend:dev

# Run frontend (different terminal)
npm run frontend:dev

# Access at http://localhost:3000
```

**Testnet Deployment** (30 minutes):
```bash
# Configure testnet credentials
export AURIGRAPH_RPC_URL=https://testnet.aurigraph.io
export AURIGRAPH_PRIVATE_KEY=0x...

# Deploy contracts
npm run deploy:testnet

# Migrate database
npm run migrate:testnet

# Deploy backend
docker build -t re-platform:latest .
docker push [ECR repo]

# Deploy to EKS
kubectl apply -f k8s/deployment.yaml
```

### 1.7 API Reference (Key Endpoints)

**Properties API**:
```
GET    /api/properties          # List all properties
GET    /api/properties/:id      # Get property details
POST   /api/properties          # Create new property (admin)
PUT    /api/properties/:id      # Update property (admin)
GET    /api/properties/:id/trades  # Trading history
GET    /api/properties/:id/valuation # Current valuation
```

**Marketplace API**:
```
GET    /api/marketplace/orders  # List active orders
POST   /api/marketplace/orders  # Create buy/sell order
GET    /api/marketplace/fills   # Filled trades
POST   /api/marketplace/cancel  # Cancel order
```

**Portfolio API**:
```
GET    /api/portfolio           # User's holdings
GET    /api/portfolio/summary   # Portfolio summary
GET    /api/portfolio/income    # Income history
POST   /api/portfolio/export    # Export data (CSV/PDF)
```

### 1.8 Success Metrics (Beta)

- ✓ 5+ properties tokenized
- ✓ 50+ investors onboarded
- ✓ $500K+ in trading volume
- ✓ 99.9% uptime (testnet)
- ✓ <2s page load time
- ✓ Zero critical bugs

### 1.9 Learning Outcomes

Developers using this reference will learn:
- How to tokenize real-world assets
- How to manage fractional ownership
- How to build a secondary marketplace
- How to automate distributions
- How to comply with securities regulations
- How to integrate @aurigraph/rwat-sdk

---

## 2. COMMODITY TRADING DESK

### 2.1 Purpose & Use Case

**Problem Being Solved**:
Commodity traders struggle with:
- Counterparty risk (intermediaries like CME)
- High trading fees (2-5%)
- Limited trading hours (T-1 to T+2 settlement)
- Expensive infrastructure

**Solution**:
On-chain commodity marketplace enabling:
- Direct peer-to-peer trading (no intermediary)
- 24/7 trading
- <30 second settlement
- Lower fees (0.1-0.5%)
- Composable with DeFi protocols

### 2.2 Application Features

#### Core Features
```
Commodity Registry
├── Gold (physical, stored in vault)
├── Oil (WTI, Brent crude)
├── Agricultural (wheat, corn, soybeans)
├── Precious metals (silver, platinum, palladium)
├── Rare earth elements
└── Real-time prices (from Chainlink, Pyth)

Order Book
├── Limit orders (buy/sell at specific price)
├── Market orders (execute at best available price)
├── Stop-loss orders (automated risk management)
├── Multiple timeframes (spot, 1-month, 3-month forwards)
└── Order matching engine (best price first)

Trading Dashboard
├── Real-time price charts (last 24h, 1w, 1m, 1y)
├── Order book visualization
├── Portfolio view (current holdings)
├── Trading history
├── Performance metrics (P&L, Sharpe ratio)
└── Price alerts (email/SMS)

Risk Management
├── Margin requirements (initial and maintenance)
├── Liquidation mechanics (automated at 80% margin)
├── Position limits (per commodity, per trader)
├── Volatility monitoring (automated halts if extreme)
└── Trader ratings (trust/reputation system)

Settlement
├── T+0 settlement (blockchain)
├── Physical delivery options (for major commodities)
├── Cash settlement (stablecoin transfers)
├── Insurance coverage (custody partners)
└── Reconciliation reporting
```

### 2.3 Technical Architecture

**Frontend Stack**:
- React 18 + TypeScript
- TradingView lightweight-charts (professional trading UI)
- WebSocket for real-time price updates
- Redux for trade state management
- Stripe integration (for funding accounts)

**Backend Stack**:
- Python + FastAPI (performance for trading)
- aurigraph-rwat-sdk (Python SDK)
- PostgreSQL (trading data, ledger)
- Redis (real-time price feeds, order matching)
- Kafka (event streaming)

**Smart Contracts**:
- Commodity token contracts (ERC-20 for each commodity)
- Order matching contract (on-chain order book)
- Margin management contract (liquidation mechanics)
- Settlement contract (P2P settlement)

**Infrastructure**:
- Kubernetes cluster (high availability)
- Redis cluster (11GB+ for order book)
- PostgreSQL primary/replica setup
- Prometheus + Grafana (monitoring)
- Datadog (tracing, logging)

### 2.4 Key Workflows

**Workflow 1: Place and Execute Trade**
```
1. Trader submits limit order (buy 100 oz gold @ $2,000)
2. Order stored in order book (Redis)
3. Matching engine checks for counterparty
4. If counterparty exists:
   - Orders matched (buy-sell pair)
   - Trade initiated (both parties notified)
   - Payment held in escrow (smart contract)
   - Commodity transferred (blockchain)
   - Settlement completes (T+0)
5. If no counterparty:
   - Order remains open (can be cancelled)
   - Trader notified when partially/fully filled
```

**Workflow 2: Margin Trading**
```
1. Trader deposits $10K collateral (stablecoin)
2. Platform gives 5x leverage ($50K buying power)
3. Trader opens 10x leveraged long position ($100K)
4. Position tracked real-time
5. If collateral drops below 80% of required:
   - Liquidation warning issued
   - If still below, position forcibly closed
   - Remaining collateral returned to trader
```

**Workflow 3: Price Feed Integration**
```
1. Chainlink oracle provides price (every 10 minutes)
2. Platform checks for price variance
3. If variance >1%, trading halt triggered
4. Traders notified of halt
5. After variance investigation:
   - Trading resumes (if false alarm)
   - Or price adjusted (if oracle update valid)
```

### 2.5 Deployment Steps

**Local Development** (15 minutes):
```bash
git clone https://github.com/aurigraph-community/commodity-desk.git
cd commodity-desk

# Install dependencies
pip install -r requirements.txt
npm install  # frontend deps

# Start services
docker-compose up

# Run backend
python -m uvicorn app:app --reload

# Run frontend (different terminal)
npm run dev

# Access at http://localhost:3000
```

**Testnet Deployment**:
```bash
# Deploy contracts
python scripts/deploy_contracts.py --network testnet

# Configure price feeds
python scripts/setup_oracle_feeds.py --oracle chainlink --network testnet

# Deploy backend
docker build -t commodity-desk:latest .
kubectl apply -f k8s/

# Verify
curl https://commodity-desk-testnet.aurigraph.io/health
```

### 2.6 API Reference (Key Endpoints)

**Price API**:
```
GET    /api/prices             # Latest prices (all commodities)
GET    /api/prices/:commodity  # Price history for commodity
GET    /api/prices/:commodity/chart  # OHLCV data (candlestick)
```

**Order API**:
```
GET    /api/orders             # User's active orders
POST   /api/orders             # Create new order
DELETE /api/orders/:id         # Cancel order
GET    /api/orders/:id         # Order details
```

**Trade API**:
```
GET    /api/trades             # User's trade history
GET    /api/trades/:id         # Trade details
GET    /api/trades/summary     # P&L summary
```

**Portfolio API**:
```
GET    /api/portfolio          # Holdings (all commodities)
GET    /api/portfolio/margin   # Margin info (used, available)
GET    /api/portfolio/pnl      # P&L calculation
```

### 2.7 Success Metrics (Beta)

- ✓ 5+ commodities trading actively
- ✓ 100+ traders onboarded
- ✓ $5M+ daily trading volume
- ✓ <100ms order latency (P95)
- ✓ 99.95% uptime
- ✓ Zero settlement failures

### 2.8 Learning Outcomes

Developers will learn:
- How to build a real-time trading platform
- How to integrate Chainlink oracle
- How to implement margin trading
- How to manage order books
- How to build financial dashboards
- How to use aurigraph-rwat-sdk with Python

---

## 3. SECURITIES ISSUANCE SYSTEM

### 3.1 Purpose & Use Case

**Problem Being Solved**:
SMEs struggle with:
- Expensive securities offerings (investment banker fees 5-10%)
- Long issuance timelines (6-12 months)
- Limited investor pool (mostly institutional)
- Regulatory complexity
- Expensive compliance infrastructure

**Solution**:
Automated securities issuance platform enabling:
- SMEs to issue bonds directly to investors
- Regulatory compliance built-in
- 4-week issuance timeline
- 50% lower costs (2-3% vs. 5-10%)
- Global investor access

### 3.2 Application Features

#### Core Features
```
Issuer Onboarding
├── KYC/AML verification (ComplyAdvantage)
├── Company registration info
├── Financial statements (audited)
├── Credit rating (optional)
├── Legal documentation
└── Fund admin setup

Bond Configuration
├── Bond terms (coupon rate, maturity, face value)
├── Distribution (total shares to issue)
├── Investor limits (min/max purchase)
├── Call/put options (optional)
├── Currency selection (USD stablecoin, EUR, etc.)
└── Covenants (financial restrictions)

Investor Onboarding
├── KYC/AML (ComplyAdvantage)
├── Accredited investor verification
├── Bank account linking (for payments)
├── Portfolio preferences
└── Notification settings

Primary Offering
├── Pre-launch period (marketing, investors invited)
├── Launch date (offering opens)
├── Allocation period (investors can purchase)
├── Closing date (offering closes)
├── Allocation final (shares distributed)
└── First coupon payment

Interest/Dividend Distribution
├── Automated coupon payments (monthly, quarterly, annual)
├── Stablecoin transfers to investors (blockchain)
├── Reinvestment option (purchase more bonds)
├── Tax reporting (automated 1099 generation)
└── Early redemption handling

Compliance & Reporting
├── Transaction audit trail (immutable)
├── Regulatory reporting (SEC Form D if applicable)
├── Investor reports (statement of holdings, interest)
├── Issuer reporting (financing status, covenants)
└── Tax documentation (1099s, interest reports)
```

### 3.3 Technical Architecture

**Frontend Stack**:
- React 18 + TypeScript
- Next.js for SSR (compliance docs must be available to regulators)
- Material-UI for professional UI
- Stripe for payment integration

**Backend Stack**:
- Node.js + Express
- @aurigraph/rwat-sdk (TypeScript SDK)
- PostgreSQL (offering, investor, coupon data)
- Stripe API (payment processing)
- ComplyAdvantage API (compliance)

**Smart Contracts**:
- Bond token contract (ERC-20 compatible)
- Coupon payment contract (automated interest)
- Investor registry (compliance)
- Transfer restrictions (regulatory compliance)

**Infrastructure**:
- AWS ECS (Fargate)
- RDS PostgreSQL
- CloudFront (compliance docs CDN)
- Datadog (monitoring)

### 3.4 Data Model

```
Bonds Table:
├── id (uuid)
├── issuer_id (user_id)
├── bond_name (string)
├── face_value (decimal)
├── coupon_rate (decimal: 5.5%)
├── maturity_date (date)
├── total_shares (integer)
├── currency (enum: USD, EUR, GBP)
├── min_purchase (integer: shares)
├── max_purchase (integer: shares)
├── status (enum: draft, approved, active, matured, defaulted)
├── metadata (JSON: legal docs, prospectus, etc.)
├── created_at (timestamp)
└── updated_at (timestamp)

Investors Table:
├── id (uuid)
├── email (text)
├── first_name (text)
├── last_name (text)
├── accredited (boolean)
├── kyc_status (enum: pending, verified, rejected, expired)
├── aml_status (enum: passed, flagged, failed)
├── bank_account (encrypted, text)
├── metadata (JSON: personal info, preferences)
└── created_at (timestamp)

Holdings Table:
├── bond_id (uuid)
├── investor_id (uuid)
├── shares_held (integer)
├── purchase_price (decimal)
├── purchase_date (date)
├── interest_earned (decimal)
├── last_coupon_date (date)
└── updated_at (timestamp)

Coupon Payments Table:
├── bond_id (uuid)
├── payment_date (date)
├── total_amount (decimal)
├── status (enum: pending, paid, failed)
├── blockchain_tx (text)
└── created_at (timestamp)
```

### 3.5 Key Workflows

**Workflow 1: Issue Bond**
```
1. SME company onboards (KYC verified)
2. Bond structure defined (5% coupon, 5-year maturity)
3. Legal docs prepared (prospectus, indenture)
4. SEC Form D filed (if applicable)
5. Marketing period (investors invited, roadshow)
6. Offering opens (investors can purchase)
7. Offerings closes (target met or deadline reached)
8. Shares distributed to investors
9. First coupon payment scheduled (monthly/quarterly)
```

**Workflow 2: Invest in Bond**
```
1. Investor searches for bonds (filter by yield, maturity)
2. Investor reads prospectus and terms
3. Investor submits purchase order (e.g., $10K)
4. KYC/AML verification triggered
5. If passed:
   - Payment collected (via Stripe)
   - Shares allocated to investor
   - Confirmation email sent
6. If failed:
   - Payment refunded
   - Investor notified of rejection
```

**Workflow 3: Coupon Payment Distribution**
```
1. Monthly coupon date arrives (e.g., 1st of month)
2. System calculates payment (shares × coupon rate / 12)
3. Payment prepared for all investors holding shares
4. Stablecoin transfers initiated (blockchain)
5. Investor receives notification
6. Tax reporting document generated
7. Payment confirmed on blockchain (immutable)
```

### 3.6 Deployment Steps

**Local Development** (20 minutes):
```bash
git clone https://github.com/aurigraph-community/securities-issuer.git
cd securities-issuer

npm install

# Setup environment
export STRIPE_SECRET_KEY=...
export COMPLYADVANTAGE_API_KEY=...
export AURIGRAPH_RPC_URL=http://localhost:9003

docker-compose up

npm run dev  # Next.js server
```

**Testnet Deployment**:
```bash
npm run build
docker build -t securities-issuer:latest .
docker push [ECR]
kubectl apply -f k8s/deployment.yaml
```

### 3.7 API Reference

**Bond Management API**:
```
GET    /api/bonds              # List all active bonds
GET    /api/bonds/:id          # Bond details
POST   /api/bonds              # Create bond (issuer)
GET    /api/bonds/:id/doc/:name  # Get bond document
```

**Investor API**:
```
GET    /api/holdings           # User's holdings
GET    /api/holdings/:bond_id  # Specific holding details
POST   /api/invest/:bond_id    # Purchase bond
GET    /api/coupons            # Coupon payment history
```

**Issuer API**:
```
POST   /api/coupon/schedule    # Schedule coupon payment
GET    /api/issuer/bonds       # Issuer's bonds
GET    /api/issuer/report      # Financial report
```

### 3.8 Success Metrics (Beta)

- ✓ 5+ bonds issued
- ✓ 200+ investors
- ✓ $10M+ raised
- ✓ 99.95% uptime
- ✓ Zero missed coupon payments
- ✓ Full regulatory compliance

### 3.9 Learning Outcomes

Developers will learn:
- How to build compliant fintech applications
- How to integrate KYC/AML (ComplyAdvantage)
- How to automate coupon distribution
- How to manage investor records
- How to integrate Stripe payments
- How to use @aurigraph/rwat-sdk with TypeScript

---

## 4. IP LICENSING MARKETPLACE

### 4.1 Purpose & Use Case

**Problem Being Solved**:
IP owners struggle with:
- Limited licensing options (all-or-nothing)
- Difficulty tracking royalty payments
- Complex licensing agreements
- Limited buyer pool

**Solution**:
Blockchain-based IP licensing marketplace enabling:
- Fractionalized patent/software IP ownership
- Automated royalty distribution
- Easy licensing transactions
- Global marketplace access
- Transparent licensing history

### 4.2 Application Features

#### Core Features
```
IP Registration
├── Patent registration (link to USPTO/WIPO)
├── Software/code licensing (GitHub integration)
├── Trademark licensing
├── Copyright management
├── Trade secret escrow
└── Ownership verification

IP Fractionalization
├── Divide IP into tradeable tokens
├── License tier creation (exclusive, non-exclusive, etc.)
├── Usage restrictions (e.g., "non-commercial" licensing)
├── Perpetual vs. time-limited licenses
└── Geographic restrictions (US only, EU excluded, etc.)

Licensing Marketplace
├── Browse available IP (search, filter, sort)
├── License pricing and terms
├── Automated license purchase
├── Smart contract enforcement (usage limits)
├── License transfer (secondary market)
└── License renewal at maturity

Royalty Distribution
├── Automatic royalty payment on use (if metered)
├── Manual royalty claims (if usage-tracked)
├── Stablecoin distribution to all shareholders
├── Transparent payment ledger
├── Tax reporting (royalty income)
└── Royalty rate adjustments

Portfolio Management
├── IP creator: view owned IP, licensing history, royalties earned
├── IP licensee: view active licenses, usage, royalties owed
├── Investor: view IP investments, dividend income
└── Royalty analytics (trends, forecasting)

Usage Tracking (Optional)
├── Software downloads counted (from GitHub API)
├── Patent citations tracked (USPTO)
├── Usage reporting (manual or automated)
└── Verifiable usage data (blockchain-backed)
```

### 4.3 Technical Architecture

**Frontend Stack**:
- Next.js 14 (React 18 + TypeScript)
- Tailwind CSS for styling
- GitHub OAuth integration
- Stripe Checkout (licensing purchases)

**Backend Stack**:
- Go + aurigraph/rwat-sdk (performance-critical)
- PostgreSQL (IP registry, licensing contracts)
- Redis (marketplace search, real-time royalty tracking)
- GitHub API (code licensing integration)

**Smart Contracts**:
- IP token contract (ERC-20 for IP fractions)
- License contract (terms, restrictions enforcement)
- Royalty splitter (automated distribution)
- Usage validator (on-chain usage proof)

**Infrastructure**:
- Google Cloud Run (serverless for cost efficiency)
- Cloud SQL (PostgreSQL)
- Cloud CDN (for IP metadata)
- BigQuery (usage analytics)

### 4.4 Data Model

```
IP_Assets Table:
├── id (uuid)
├── creator_id (user_id)
├── type (enum: patent, software, trademark, copyright)
├── name (text)
├── description (text)
├── filing_number (text: patent or trademark ID)
├── country (text: US, EU, etc.)
├── filing_date (date)
├── expiration_date (date, if applicable)
├── metadata (JSON: external URLs, documents)
├── total_shares (integer)
├── status (enum: draft, registered, licensed, expired)
├── created_at (timestamp)
└── updated_at (timestamp)

Licenses Table:
├── id (uuid)
├── ip_asset_id (uuid)
├── licensee_id (user_id)
├── license_type (enum: exclusive, non-exclusive, field-exclusive)
├── territory (text: "worldwide", "US only", "EU except Germany")
├── duration (interval: "perpetual", "5 years", "until expiration")
├── royalty_rate (decimal: 5%, 10%, etc.)
├── usage_restrictions (JSON: non-commercial, max 1M uses, etc.)
├── status (enum: active, expired, terminated)
├── start_date (date)
├── end_date (date)
├── created_at (timestamp)
└── updated_at (timestamp)

Royalty_Payments Table:
├── id (uuid)
├── license_id (uuid)
├── payment_date (date)
├── usage_count (integer)
├── royalty_amount (decimal)
├── blockchain_tx (text)
├── status (enum: pending, paid, failed)
├── created_at (timestamp)
└── updated_at (timestamp)

Ownership_Shares Table:
├── ip_asset_id (uuid)
├── holder_id (user_id)
├── shares_held (integer)
├── percentage (decimal: 25% = 25.0)
├── earned_royalties (decimal)
└── last_payment_date (date)
```

### 4.5 Key Workflows

**Workflow 1: Register and Fractionalize IP**
```
1. Developer registers software IP (GitHub repo link)
2. Platform verifies ownership (GitHub admin check)
3. Developer sets license terms (royalty rate: 5%)
4. Developer decides fractionalization (1000 shares)
5. 500 shares kept by creator
6. 500 shares offered for investment
7. Investors can purchase shares (own IP & get royalties)
8. License marketplace opens (others can license IP)
```

**Workflow 2: License IP**
```
1. Company wants to license IP (e.g., use a patented algorithm)
2. Company browses marketplace (filters: software patents, US only)
3. Company finds IP, reads license terms (5% royalty)
4. Company purchases license (via Stripe, $10K upfront)
5. License activated immediately (smart contract enforces terms)
6. Company can now use IP (stablecoin tracking royalties)
7. Monthly royalties calculated and distributed to shareholders
```

**Workflow 3: Royalty Distribution**
```
1. Software is used (e.g., 100K downloads)
2. Usage data tracked (from GitHub API)
3. Royalty amount calculated (100K × $0.05 = $5K)
4. Payment distributed to shareholders (proportional to ownership)
5. Stablecoin transfers executed (blockchain)
6. Shareholders notified of payment
7. Tax forms generated (1099-MISC for US)
8. Transparent ledger updated
```

### 4.6 Deployment Steps

**Local Development** (20 minutes):
```bash
git clone https://github.com/aurigraph-community/ip-marketplace.git
cd ip-marketplace

npm install
go mod download

docker-compose up

npm run dev  # Frontend on :3000
go run main.go  # Backend on :8080
```

**Testnet Deployment**:
```bash
export AURIGRAPH_RPC_URL=https://testnet.aurigraph.io

# Deploy contracts
go run scripts/deploy.go --network testnet

# Migrate DB
sqlc exec < schema.sql

# Deploy backend
docker build -t ip-marketplace:latest .
gcloud run deploy ip-marketplace --image ip-marketplace:latest

# Deploy frontend
npm run build
npm run deploy  # Next.js deploy
```

### 4.7 API Reference

**IP Asset API**:
```
GET    /api/ip                 # Browse IP marketplace
GET    /api/ip/:id             # IP details
POST   /api/ip                 # Register new IP (creator)
GET    /api/ip/:id/licenses    # Active licenses
```

**License API**:
```
GET    /api/licenses           # User's licenses
POST   /api/licenses/:id       # Purchase license
GET    /api/licenses/:id       # License terms and usage
DELETE /api/licenses/:id       # Terminate license
```

**Royalty API**:
```
GET    /api/royalties          # Royalty history
GET    /api/royalties/summary  # Royalty earnings summary
GET    /api/royalties/forecast # Predicted earnings
POST   /api/royalties/claim    # Manual royalty claim
```

**Portfolio API**:
```
GET    /api/portfolio          # IP investments held
GET    /api/portfolio/earnings # Royalty earnings
GET    /api/portfolio/performance  # ROI, yield metrics
```

### 4.8 Success Metrics (Beta)

- ✓ 50+ IP assets registered
- ✓ 100+ active licenses
- ✓ 10+ creators earning royalties
- ✓ $500K+ in royalties distributed
- ✓ 99.9% uptime
- ✓ Zero licensing disputes

### 4.9 Learning Outcomes

Developers will learn:
- How to build marketplace platforms
- How to integrate GitHub (OAuth, API)
- How to implement usage tracking
- How to automate royalty distribution
- How to handle fractional ownership
- How to use aurigraph/rwat-sdk with Go

---

## Shared Deployment Components

### Docker Compose (All 4 Apps)
```yaml
version: '3.8'
services:
  aurigraph-testnet:
    image: aurigraph/v11-testnet:latest
    ports:
      - "9003:9003"
    environment:
      CHAIN_ID: testnet-1
      VALIDATOR_COUNT: 4

  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: testpass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  # Application-specific services (frontend, backend)
  # defined in app's docker-compose.yml
```

### GitHub Repository Template
```
repo/
├── .github/
│   ├── workflows/
│   │   ├── test.yml
│   │   ├── deploy.yml
│   │   └── security.yml
│   └── ISSUE_TEMPLATE/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── next.config.js
├── backend/
│   ├── src/
│   ├── tests/
│   ├── package.json (or go.mod for Go)
│   └── Dockerfile
├── contracts/
│   ├── smart-contracts/
│   ├── tests/
│   └── scripts/
├── docs/
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── SETUP.md
│   └── API.md
├── docker-compose.yml
└── k8s/
    └── deployment.yaml
```

### Pre-Launch Checklist (All 4 Apps)

- [ ] Code reviewed and merged to main
- [ ] All tests passing (100% coverage for critical paths)
- [ ] Documentation complete (API, architecture, setup)
- [ ] Security audit passed
- [ ] Performance tested (<2s page load, <500ms API)
- [ ] Deployed to testnet
- [ ] Demo video recorded
- [ ] Tutorial guide written
- [ ] GitHub repo published (public)
- [ ] README complete
- [ ] Environment setup tested (can clone and run)
- [ ] Team trained on app
- [ ] User acceptance testing passed

---

## Support & Community

### Getting Help
- **GitHub Issues**: Report bugs, request features
- **Discord**: #reference-implementations channel
- **Forum**: https://forum.aurigraph.io/c/reference-apps
- **Email**: support@aurigraph.io

### Customization Guide
"Copy and Customize" approach - developers can fork and modify:
1. Clone repository
2. Understand architecture (read ARCHITECTURE.md)
3. Identify what to customize (features, UI, branding)
4. Create new branch (`feature/custom-xyz`)
5. Modify code
6. Test thoroughly
7. Deploy to your own testnet
8. Integrate with your business (payment processor, auth, etc.)

Expected customization time: 2-4 weeks for mid-level developers

---

**Document Status**: Architecture Phase
**Revision**: 1.0
**Last Updated**: January 10, 2026

Generated with Claude Code
