# 🏢 RWAT White Labeling & Multi-Tier Pricing Guide

**Version**: 1.0.0
**Updated**: December 27, 2025
**Audience**: Enterprise partners, resellers, and 3rd party providers

---

## 📋 Overview

The Aurigraph RWAT (Real-World Asset Tokenization) SDK enables 3rd parties to offer white-labeled RWAT services with custom branding, pricing tiers, and workflow automation through ActiveContracts.

---

## 🎯 Key Features

### 1. **White Label Customization**
- Custom branding (logo, colors, API endpoints)
- Provider-specific pricing tiers
- Branded portal and documentation

### 2. **Multi-Tier Pricing**
- **Starter**: Entry-level, per-transaction pricing
- **Professional**: Mid-market with monthly commitments
- **Enterprise**: Custom pricing with dedicated support

### 3. **ActiveContracts Integration**
- Visual workflow authoring
- Condition-based execution
- Multi-step approval processes

### 4. **Token Navigation & Tracking**
- Real-time token ownership tracking
- Trading history and analytics
- Dividend distribution and claims

---

## 🚀 Getting Started

### Step 1: Initialize White Label Provider

```typescript
import { AurigraphClient, WhiteLabelConfig } from '@aurigraph/sdk'

const client = new AurigraphClient({
  baseUrl: 'https://dlt.aurigraph.io/api/v11',
  apiKey: 'your-api-key'
})

const whiteLabel: WhiteLabelConfig = {
  providerId: 'provider_xyz_123',
  providerName: 'Your Real Estate Platform',
  branding: {
    logo: 'https://your-domain.com/logo.png',
    primaryColor: '#2563eb',
    apiEndpoint: 'https://rwat-api.your-domain.com'
  },
  pricingTier: 'professional'
}

await client.initializeWhiteLabel(whiteLabel)
```

### Step 2: Configure Pricing Tiers

```typescript
// Get current pricing tiers
const tiers = await client.getPricingTiers('provider_xyz_123')

// Update Professional tier
const profTier = {
  tier: 'professional',
  monthlyFee: 2500, // $2,500/month
  transactionFee: 0.001, // 0.1% per transaction
  assetRegistrationFee: 100, // $100 per asset
  tokenizationFee: 500, // $500 per tokenization
  monthlyTransactionLimit: 10000,
  customOracleSupport: true
}

await client.updatePricingTier('provider_xyz_123', profTier)
```

### Step 3: Register Real-World Assets

```typescript
const realEstateAsset = await client.registerRWAT({
  type: 'real_estate',
  name: 'Prime Downtown Office Complex',
  value: '50000000', // $50M
  location: 'San Francisco, CA',
  metadata: {
    address: '123 Market St',
    squareFeet: 250000,
    yearBuilt: 2020,
    occupancyRate: 0.95,
    annualRent: '5000000'
  }
})

console.log(`✅ Asset registered: ${realEstateAsset.id}`)
```

### Step 4: Tokenize the Asset

```typescript
const tokenConfig = {
  assetId: realEstateAsset.id,
  totalSupply: '1000000000', // 1B tokens (1 token = $0.05)
  tokenSymbol: 'SFOB',
  tokenName: 'SF Office Building Token',
  decimals: 8,
  fractionalOwnership: true,
  complianceHooks: {
    requireKYC: true,
    requireAML: true,
    transferRestrictions: ['accredited_investors_only']
  },
  oracleFeeds: [
    'real-estate-valuation-oracle',
    'market-price-index-oracle'
  ]
}

const tokens = await client.createRWATTokens(tokenConfig)
console.log(`✅ Created ${tokenConfig.tokenName} (${tokenConfig.tokenSymbol})`)
```

---

## 📊 Pricing Tier Structure

### **Starter Tier**
Perfect for testing and low-volume operations

```typescript
{
  tier: 'starter',
  monthlyFee: 0,
  transactionFee: 0.002, // 0.2% per transaction
  assetRegistrationFee: 1000,
  tokenizationFee: 5000,
  monthlyTransactionLimit: 100,
  customOracleSupport: false
}
```

**Use Cases**:
- Proof of concept projects
- Small pilot programs
- Development and testing

---

### **Professional Tier**
Ideal for established operations with steady growth

```typescript
{
  tier: 'professional',
  monthlyFee: 2500,
  transactionFee: 0.001, // 0.1% per transaction
  assetRegistrationFee: 100,
  tokenizationFee: 500,
  monthlyTransactionLimit: 10000,
  customOracleSupport: true
}
```

**Use Cases**:
- Real estate platforms
- Commodity trading networks
- Art and collectibles marketplaces
- Carbon credit exchanges

---

### **Enterprise Tier**
Custom pricing for large-scale, mission-critical operations

```typescript
{
  tier: 'enterprise',
  monthlyFee: 25000,
  transactionFee: 0.0005, // 0.05% per transaction
  assetRegistrationFee: 0, // Free
  tokenizationFee: 0, // Free
  monthlyTransactionLimit: undefined, // Unlimited
  customOracleSupport: true
}
```

**Use Cases**:
- Large institutional investors
- Global financial platforms
- Multi-asset class platforms
- Government and regulatory authorities

---

## 🔄 ActiveContracts for Workflow Automation

### Create a Real Estate Tokenization Workflow

```typescript
const tokenizationWorkflow: Partial<ActiveContract> = {
  name: 'Real Estate Tokenization Workflow',
  description: 'Automated workflow for property tokenization',
  workflowSteps: [
    {
      id: 'step_1',
      name: 'KYC Verification',
      type: 'validation',
      config: {
        provider: 'veriff',
        timeout: 7200 // 2 hours
      },
      nextSteps: ['step_2']
    },
    {
      id: 'step_2',
      name: 'Property Appraisal',
      type: 'approval',
      config: {
        requiredApprovals: 2,
        approvers: ['appraiser_1', 'appraiser_2'],
        timeout: 86400 // 24 hours
      },
      nextSteps: ['step_3'],
      onError: 'notify_user'
    },
    {
      id: 'step_3',
      name: 'Register Asset',
      type: 'execution',
      config: {
        assetType: 'real_estate'
      },
      nextSteps: ['step_4']
    },
    {
      id: 'step_4',
      name: 'Create Tokens',
      type: 'execution',
      config: {
        fractionalOwnership: true,
        oracleFeeds: ['property-valuation']
      },
      nextSteps: ['step_5']
    },
    {
      id: 'step_5',
      name: 'Notify Investor',
      type: 'notification',
      config: {
        channels: ['email', 'webhook'],
        emailTemplate: 'investment_ready'
      }
    }
  ],
  triggerConditions: [
    {
      id: 'trigger_1',
      type: 'manual',
      config: {
        source: 'user_request'
      }
    }
  ],
  actions: [
    {
      id: 'action_1',
      type: 'mint',
      config: {
        amount: 'total_supply'
      }
    },
    {
      id: 'action_2',
      type: 'transfer',
      config: {
        recipient: 'asset_owner',
        amount: 'total_supply'
      }
    }
  ],
  status: 'draft',
  createdBy: 'provider_xyz_123'
}

const workflow = await client.createActiveContract(tokenizationWorkflow)
console.log(`✅ Created workflow: ${workflow.id}`)
```

### Execute the Workflow

```typescript
const executionResult = await client.executeActiveContract(
  workflow.id,
  {
    userId: 'user_123',
    propertyId: 'property_456',
    tokenizationAmount: '1000000000'
  }
)

console.log('Workflow execution result:', executionResult)
```

---

## 🎫 Token Navigation & Ownership Tracking

### Get Complete Token Information

```typescript
const tokenNav = await client.getTokenNavigation('SFOB_token_id')

console.log({
  tokenId: tokenNav.tokenId,
  assetId: tokenNav.assetId,
  holder: tokenNav.holder,
  quantity: tokenNav.quantity,
  fractionalOwnership: tokenNav.fractionalOwnershipPercentage, // 0.5% = 0.5
  dividends: tokenNav.dividends, // Total dividends earned
  lastTransfer: new Date(tokenNav.lastTransfer * 1000).toISOString(),
  tradingHistory: tokenNav.tradingHistory.slice(0, 5) // Last 5 trades
})
```

### Get Holder's All Tokens

```typescript
const holderTokens = await client.getAddressTokens('auri1xyz...')

holderTokens.forEach(token => {
  console.log(`
    Token: ${token.tokenId}
    Asset: ${token.assetId}
    Quantity: ${token.quantity}
    Ownership: ${token.fractionalOwnershipPercentage}%
    Dividends Earned: $${token.dividends}
  `)
})
```

### Get Token Trading History

```typescript
const history = await client.getTokenTradingHistory('SFOB_token_id', 50)

history.forEach(tx => {
  console.log(`
    ${new Date(tx.timestamp * 1000).toISOString()}
    ${tx.from.substring(0, 10)}... → ${tx.to.substring(0, 10)}...
    Quantity: ${tx.quantity}
    Price: $${tx.price}
    Type: ${tx.transactionType}
  `)
})
```

---

## 💰 Dividend Management

### Check Dividend Information

```typescript
const dividendInfo = await client.getTokenDividends('SFOB_token_id')

console.log({
  tokenId: dividendInfo.tokenId,
  totalDividendPool: dividendInfo.totalDividendPool,
  frequencyMonths: dividendInfo.frequencyMonths,
  nextPaymentDate: new Date(dividendInfo.nextPaymentDate * 1000).toISOString(),
  holders: dividendInfo.holders.length,
  lastDistribution: dividendInfo.lastDistribution
})
```

### Claim Dividends

```typescript
const claimResult = await client.claimDividends(
  'SFOB_token_id',
  'auri1xyz...'
)

console.log(`
  ✅ Dividends claimed!
  Amount: $${claimResult.amount}
  Transaction Hash: ${claimResult.transactionHash}
  Timestamp: ${new Date(claimResult.timestamp * 1000).toISOString()}
`)
```

---

## 📈 Advanced: Multi-Asset Class Example

```typescript
// Setup white label for multi-asset platform
await client.initializeWhiteLabel({
  providerId: 'global_assets_platform',
  providerName: 'Global Asset Tokenization Platform',
  branding: {
    logo: 'https://globalassets.com/logo.png',
    primaryColor: '#16a34a',
    apiEndpoint: 'https://api.globalassets.com'
  },
  pricingTier: 'enterprise'
})

// Tokenize multiple asset classes
const assets = [
  {
    type: 'real_estate',
    name: 'Luxury Residential Tower',
    value: '200000000'
  },
  {
    type: 'commodities',
    name: 'Gold Bullion Reserve',
    value: '50000000'
  },
  {
    type: 'fine_art',
    name: 'Modern Art Collection',
    value: '25000000'
  },
  {
    type: 'carbon_credits',
    name: 'Verified Carbon Offsets',
    value: '100000'
  }
]

for (const asset of assets) {
  const registered = await client.registerRWAT(asset)
  console.log(`✅ Registered ${asset.name} (ID: ${registered.id})`)
}
```

---

## 🔐 Security & Compliance

### Built-in Compliance Features

All RWAT operations support:
- **KYC (Know Your Customer)**: Mandatory identity verification
- **AML (Anti-Money Laundering)**: Transaction monitoring and reporting
- **Transfer Restrictions**: Accredited investor requirements
- **Regulatory Hooks**: Custom compliance logic
- **Oracle Integration**: Real-time asset valuation and verification

### Example: Restricted Transfer

```typescript
const transfer = await client.transferRWATToken(
  'SFOB_token_id',
  'new_holder_address',
  '1000000',
  {
    restrictionType: 'accredited_investors_only',
    kycVerification: 'verified',
    amlScreening: 'passed',
    approvalTimestamp: Date.now()
  }
)
```

---

## 📞 Support & Resources

- **Documentation**: https://docs.aurigraph.io/rwat
- **API Reference**: https://api-docs.aurigraph.io/rwat
- **Community Forum**: https://community.aurigraph.io
- **Enterprise Support**: enterprise@aurigraph.io
- **GitHub**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-Developer-Toolkit-and-SDK

---

## 📊 Pricing Calculator

**Quick Estimation for Professional Tier**:
- Monthly fee: $2,500
- 1000 transactions × 0.1% fee: $250
- 5 asset registrations × $100: $500
- 2 tokenizations × $500: $1,000
- **Monthly Total**: ~$4,250

**Enterprise negotiations available for large volumes**

---

## ✅ Checklist for Implementation

- [ ] Initialize white label provider
- [ ] Configure pricing tiers
- [ ] Register real-world assets
- [ ] Create RWAT tokens
- [ ] Build ActiveContracts workflows
- [ ] Implement token navigation UI
- [ ] Set up dividend distribution
- [ ] Test compliance hooks
- [ ] Deploy to production
- [ ] Monitor transaction metrics

---

**Version 1.0.0** - Ready for production use
