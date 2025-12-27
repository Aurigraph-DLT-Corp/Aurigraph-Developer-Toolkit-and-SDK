# 🔗 3rd Party API Integration Guide

**Version**: 1.0.0
**Updated**: December 27, 2025
**Audience**: SDK users, platform builders, integration engineers

---

## 📋 Overview

The Aurigraph SDK provides a unified framework for integrating with external services including payment processors, KYC/AML providers, oracle services, data providers, and notification services. This enables seamless integration of external business logic into blockchain transactions and smart contracts.

---

## 🎯 Key Features

### 1. **Payment Integration**
- Stripe, PayPal, Square, Adyen
- Multi-currency support
- Webhook handling for transaction callbacks
- PCI compliance hooks

### 2. **KYC/AML Integration**
- Veriff, Jumio, Onfido, Sumsub
- Liveness checks and document verification
- Real-time verification status
- Compliance audit trails

### 3. **Oracle Integration**
- Chainlink, Band Protocol, Uniswap, CoinGecko
- Real-time price feeds via WebSocket
- Asset valuation and appraisal
- Multiple data sources with fallbacks

### 4. **Data Provider Integration**
- Zillow, CoreLogic, Quandl, IEXCloud
- Caching strategies for cost optimization
- Multiple data categories support

### 5. **Notification Services**
- Twilio (SMS), SendGrid (Email), Mailgun, Vonage
- Multi-channel delivery
- Template-based messaging
- Webhook callbacks

---

## 🚀 Getting Started

### Step 1: Initialize Client

**TypeScript**:
```typescript
import { AurigraphClient } from '@aurigraph/sdk'

const client = new AurigraphClient({
  baseUrl: 'https://dlt.aurigraph.io/api/v11',
  apiKey: 'your-api-key'
})

await client.connect()
```

**Python**:
```python
import asyncio
from aurigraph import AurigraphClient

async def main():
    client = AurigraphClient(
        base_url='https://dlt.aurigraph.io/api/v11',
        api_key='your-api-key'
    )

    async with client:
        await client.connect()
        # Use client here
```

### Step 2: Register Integration

```typescript
// TypeScript
const stripe = await client.registerPaymentIntegration({
  id: 'stripe_prod_1',
  name: 'Production Stripe',
  type: 'payment',
  provider: 'stripe',
  api_key: 'sk_live_...',
  api_secret: 'sk_live_...',
  account_id: 'acct_...',
  currencies: ['USD', 'EUR', 'GBP'],
  webhook_secret: 'whsec_...',
  enabled: true
})
```

```python
# Python
stripe = await client.register_payment_integration({
    'id': 'stripe_prod_1',
    'name': 'Production Stripe',
    'type': 'payment',
    'provider': 'stripe',
    'api_key': 'sk_live_...',
    'api_secret': 'sk_live_...',
    'account_id': 'acct_...',
    'currencies': ['USD', 'EUR', 'GBP'],
    'webhook_secret': 'whsec_...',
    'enabled': True
})
```

### Step 3: Test Integration

```typescript
const isConnected = await client.testIntegration('stripe_prod_1')
if (isConnected) {
  console.log('✅ Stripe integration is live!')
} else {
  console.log('❌ Connection test failed')
}
```

---

## 💳 Payment Processor Integration

### Stripe Integration

```typescript
const stripeConfig = {
  id: 'stripe_main',
  name: 'Stripe Main Account',
  type: 'payment',
  provider: 'stripe',
  api_key: 'pk_live_...',
  api_secret: 'sk_live_...',
  account_id: 'acct_1234567890',
  currencies: ['USD', 'EUR', 'GBP', 'JPY'],
  webhook_secret: 'whsec_1234567890...',
  endpoints: {
    charges: 'https://api.stripe.com/v1/charges',
    customers: 'https://api.stripe.com/v1/customers',
    payment_intents: 'https://api.stripe.com/v1/payment_intents'
  },
  rate_limit: {
    requests_per_second: 100,
    requests_per_day: 1000000
  },
  enabled: true,
  metadata: {
    environment: 'production',
    region: 'US'
  }
}

const stripe = await client.registerPaymentIntegration(stripeConfig)

// Process payment
const payment = await client.processPayment(
  'stripe_main',
  '10000', // $100.00 in cents
  'USD',
  {
    customer_id: 'cus_...',
    description: 'RWAT Token Purchase',
    metadata: {
      asset_id: 'real_estate_sf_001',
      token_symbol: 'SFOB'
    }
  }
)

console.log(`✅ Payment processed: ${payment.data.transaction_id}`)
```

### PayPal Integration

```typescript
const paypalConfig = {
  id: 'paypal_prod',
  name: 'PayPal Production',
  type: 'payment',
  provider: 'paypal',
  api_key: 'AQq...',
  api_secret: 'EJx...',
  account_id: 'merchant_account_id',
  currencies: ['USD', 'EUR', 'GBP'],
  endpoints: {
    payments: 'https://api.paypal.com/v2/payments',
    transactions: 'https://api.paypal.com/v2/transactions'
  },
  enabled: true
}

const paypal = await client.registerPaymentIntegration(paypalConfig)
```

---

## 🔐 KYC/AML Integration

### Veriff Integration

```typescript
const veriffConfig = {
  id: 'veriff_kyc',
  name: 'Veriff KYC',
  type: 'kyc',
  provider: 'veriff',
  api_key: 'veriffsdk_live_...',
  session_timeout: 7200, // 2 hours
  required_documents: ['id_card', 'selfie'],
  liveness_check: true,
  endpoints: {
    sessions: 'https://api.veriff.com/v1/sessions',
    verification: 'https://api.veriff.com/v1/sessions/{sessionId}/verification'
  },
  enabled: true
}

const veriff = await client.registerKYCIntegration(veriffConfig)

// Start KYC session
const session = await client.startKYCSession(
  'veriff_kyc',
  'user_123',
  'https://yourapp.com/kyc/callback'
)

console.log(`✅ KYC session started: ${session.session_url}`)

// Check KYC status
const status = await client.getKYCStatus('veriff_kyc', 'user_123')
if (status.status === 'approved') {
  console.log('✅ User KYC verification passed!')
}
```

### Onfido Integration

```typescript
const onfidoConfig = {
  id: 'onfido_kyc',
  name: 'Onfido KYC',
  type: 'kyc',
  provider: 'onfido',
  api_key: 'token=...',
  session_timeout: 3600,
  required_documents: ['passport', 'driving_license'],
  liveness_check: true,
  endpoints: {
    applicants: 'https://api.onfido.com/v3/applicants',
    checks: 'https://api.onfido.com/v3/checks'
  },
  enabled: true
}

const onfido = await client.registerKYCIntegration(onfidoConfig)
```

---

## 📊 Oracle Integration

### Chainlink Integration

```typescript
const chainlinkConfig = {
  id: 'chainlink_main',
  name: 'Chainlink Oracle',
  type: 'oracle',
  provider: 'chainlink',
  api_key: 'chainlink_key',
  data_feeds: [
    {
      symbol: 'BTC/USD',
      pairs: ['BTC', 'USD'],
      update_frequency: 300 // 5 minutes
    },
    {
      symbol: 'ETH/USD',
      pairs: ['ETH', 'USD'],
      update_frequency: 300
    },
    {
      symbol: 'REAL_ESTATE/USD',
      pairs: ['PROPERTY', 'USD'],
      update_frequency: 86400 // Daily
    }
  ],
  update_frequency: 300,
  required_confirmations: 3,
  endpoints: {
    price_feed: 'https://data.chain.link/feeds',
    vrf: 'https://vrf.chain.link'
  },
  enabled: true
}

const chainlink = await client.registerOracleIntegration(chainlinkConfig)

// Get real-time price
const btcPrice = await client.getOraclePrice('chainlink_main', 'BTC/USD')
console.log(`BTC Price: $${btcPrice.data.price}`)

// Get real estate valuation
const valuation = await client.getOracleValuation(
  'chainlink_main',
  'property_sf_123'
)
console.log(`Property Valuation: $${valuation.data.value}`)

// Subscribe to real-time updates
await client.subscribeOracleUpdates(
  'chainlink_main',
  'BTC/USD',
  async (data) => {
    console.log(`📈 BTC Price Updated: $${data.price}`)
    // Trigger any business logic based on price change
  }
)
```

### Uniswap Integration

```typescript
const uniswapConfig = {
  id: 'uniswap_prices',
  name: 'Uniswap Price Oracle',
  type: 'oracle',
  provider: 'uniswap',
  api_key: 'uniswap_key',
  data_feeds: [
    {
      symbol: 'USDC/USD',
      pairs: ['USDC', 'USD'],
      update_frequency: 60 // 1 minute
    }
  ],
  enabled: true
}

const uniswap = await client.registerOracleIntegration(uniswapConfig)
```

---

## 📈 Data Provider Integration

### Zillow Integration (Real Estate)

```typescript
const zillowConfig = {
  id: 'zillow_data',
  name: 'Zillow Real Estate Data',
  type: 'data',
  provider: 'zillow',
  api_key: 'zws_...',
  data_categories: [
    'property_details',
    'valuations',
    'price_history',
    'comparables'
  ],
  cache_expiry: 86400, // 24 hours
  endpoints: {
    property: 'https://www.zillow.com/webservice/GetSearchResults.htm',
    comps: 'https://www.zillow.com/webservice/GetComps.htm'
  },
  enabled: true
}

const zillow = await client.registerDataIntegration(zillowConfig)

// Query property data
const property = await client.queryDataProvider('zillow_data', {
  address: '123 Market St',
  city: 'San Francisco',
  state: 'CA',
  zip: '94102',
  category: 'valuations'
})

console.log(`Property Details:`, property.data)
```

### Quandl Integration (Financial Data)

```typescript
const quandlConfig = {
  id: 'quandl_fin',
  name: 'Quandl Financial Data',
  type: 'data',
  provider: 'quandl',
  api_key: 'quandl_key',
  data_categories: [
    'commodities',
    'currencies',
    'treasury_rates',
    'economic_indicators'
  ],
  cache_expiry: 3600, // 1 hour
  enabled: true
}

const quandl = await client.registerDataIntegration(quandlConfig)

// Query commodity prices
const goldPrice = await client.queryDataProvider('quandl_fin', {
  dataset: 'LBMA/GOLD',
  category: 'commodities'
})
```

---

## 📬 Notification Integration

### Twilio Integration (SMS)

```typescript
const twilioConfig = {
  id: 'twilio_sms',
  name: 'Twilio SMS',
  type: 'notification',
  provider: 'twilio',
  api_key: 'AC...',
  api_secret: 'auth_token',
  channels: ['sms', 'webhook'],
  default_sender: '+1234567890',
  endpoints: {
    messages: 'https://api.twilio.com/2010-04-01/Accounts/{ACCOUNT_SID}/Messages.json'
  },
  enabled: true
}

const twilio = await client.registerNotificationIntegration(twilioConfig)

// Send SMS
const sms = await client.sendNotification(
  'twilio_sms',
  'sms',
  '+1555123456',
  'Your RWAT token purchase has been confirmed!'
)

console.log(`✅ SMS sent: ${sms.data.message_sid}`)
```

### SendGrid Integration (Email)

```typescript
const sendgridConfig = {
  id: 'sendgrid_email',
  name: 'SendGrid Email',
  type: 'notification',
  provider: 'sendgrid',
  api_key: 'SG.xxx...',
  channels: ['email', 'webhook'],
  default_sender: 'noreply@aurigraph.io',
  templates: {
    token_purchase: 'd-1234567890',
    kyc_approved: 'd-0987654321',
    payment_received: 'd-5555555555'
  },
  enabled: true
}

const sendgrid = await client.registerNotificationIntegration(sendgridConfig)

// Send templated email
const email = await client.sendNotification(
  'sendgrid_email',
  'email',
  'user@example.com',
  '',
  {
    template_id: 'd-1234567890',
    amount: '$10,000',
    asset_name: 'SF Office Building Token',
    transaction_id: 'tx_...'
  }
)

console.log(`✅ Email sent to: ${email.data.to}`)
```

---

## 🔄 Advanced Integration Management

### Testing Integrations

```typescript
// Test all integrations
const integrations = await client.listIntegrations()

for (const integration of integrations) {
  const isActive = await client.testIntegration(integration.id)
  console.log(`${integration.name}: ${isActive ? '✅ Active' : '❌ Inactive'}`)
}
```

### Configuring Rate Limits

```typescript
// Set rate limits for payment integration
await client.configureRateLimit(
  'stripe_main',
  100, // 100 requests per second
  1000000 // 1M requests per day
)

// Set rate limits for oracle
await client.configureRateLimit(
  'chainlink_main',
  10, // 10 requests per second
  100000 // 100k requests per day
)
```

### Monitoring Integration Health

```typescript
// Get integration metrics
const metrics = await client.getIntegrationMetrics(
  'stripe_main',
  {
    start: Date.now() - 86400000, // Last 24 hours
    end: Date.now()
  }
)

console.log(`Integration Metrics:`, {
  total_requests: metrics.total_requests,
  successful: metrics.successful,
  failed: metrics.failed,
  average_latency: metrics.average_latency_ms,
  uptime: metrics.uptime_percentage
})

// Get integration logs
const logs = await client.getIntegrationLogs('stripe_main', 50)
logs.forEach(log => {
  console.log(`${log.timestamp}: ${log.message}`)
})
```

### Disabling Integration

```typescript
// Disable integration (without deleting)
await client.setIntegrationStatus('stripe_main', false)
console.log('✅ Integration disabled')

// Re-enable integration
await client.setIntegrationStatus('stripe_main', true)
console.log('✅ Integration re-enabled')

// Delete integration
await client.deleteIntegration('stripe_test')
console.log('✅ Test integration deleted')
```

---

## 🪝 Webhook Handling

### Handling Stripe Webhooks

```typescript
// Express.js example
import express from 'express'

const app = express()

app.post('/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const event = JSON.parse(req.body)

  // Handle webhook
  await client.handleWebhook({
    event_id: event.id,
    integration_id: 'stripe_main',
    event_type: event.type,
    data: event.data,
    signature: req.headers['stripe-signature'],
    timestamp: Math.floor(Date.now() / 1000)
  })

  res.json({received: true})
})
```

### Handling Payment Webhooks

```typescript
app.post('/webhooks/payment', async (req, res) => {
  const event = req.body

  if (event.type === 'payment.success') {
    // Update blockchain transaction
    await updateTokenOwnership(event.data)
  } else if (event.type === 'payment.failed') {
    // Handle payment failure
    await notifyUser(event.data.user_id, 'Payment failed')
  }

  await client.handleWebhook({
    event_id: event.id,
    integration_id: event.integration_id,
    event_type: event.type,
    data: event.data,
    timestamp: Math.floor(Date.now() / 1000)
  })

  res.json({received: true})
})
```

---

## 🔐 Security & Compliance

### API Key Management

**NEVER hardcode API keys!** Use environment variables:

```bash
# .env
STRIPE_API_KEY=sk_live_...
VERIFF_API_KEY=veriffsdk_live_...
CHAINLINK_API_KEY=...
```

```typescript
const stripe = await client.registerPaymentIntegration({
  api_key: process.env.STRIPE_API_KEY,
  api_secret: process.env.STRIPE_SECRET,
  // ...
})
```

### Webhook Signature Verification

```typescript
// Stripe example
import crypto from 'crypto'

function verifyStripeSignature(body: string, signature: string): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  return hash === signature.replace('t=', '').split(',')[0]
}
```

### Rate Limiting

```typescript
// Implement rate limiting on your endpoints
const rateLimit = require('express-rate-limit')

const integrationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Requests per minute
  message: 'Too many requests, please try again later'
})

app.use('/integrations/', integrationLimiter)
```

---

## 📱 Python Integration Example

```python
import asyncio
from aurigraph import AurigraphClient

async def main():
    client = AurigraphClient(
        base_url='https://dlt.aurigraph.io/api/v11',
        api_key='your-api-key'
    )

    async with client:
        await client.connect()

        # Register Stripe
        stripe = await client.register_payment_integration({
            'id': 'stripe_main',
            'name': 'Stripe',
            'type': 'payment',
            'provider': 'stripe',
            'api_key': os.getenv('STRIPE_API_KEY'),
            'api_secret': os.getenv('STRIPE_SECRET'),
            'account_id': 'acct_...',
            'currencies': ['USD', 'EUR']
        })

        # Process payment
        payment = await client.process_payment(
            'stripe_main',
            '10000',
            'USD',
            {'customer_id': 'cus_...'}
        )
        print(f'✅ Payment: {payment["data"]["transaction_id"]}')

        # Register KYC
        kyc = await client.register_kyc_integration({
            'id': 'veriff_kyc',
            'name': 'Veriff',
            'type': 'kyc',
            'provider': 'veriff',
            'api_key': os.getenv('VERIFF_API_KEY'),
            'session_timeout': 7200,
            'liveness_check': True
        })

        # Start KYC
        session = await client.start_kyc_session(
            'veriff_kyc',
            'user_123',
            'https://yourapp.com/kyc'
        )
        print(f'✅ KYC session: {session["session_url"]}')

asyncio.run(main())
```

---

## 📊 Integration Matrix

| Provider | Type | Supported | Status |
|----------|------|-----------|--------|
| Stripe | Payment | ✅ | Production |
| PayPal | Payment | ✅ | Production |
| Square | Payment | ✅ | Production |
| Adyen | Payment | ✅ | Production |
| Veriff | KYC | ✅ | Production |
| Jumio | KYC | ✅ | Production |
| Onfido | KYC | ✅ | Production |
| Sumsub | KYC | ✅ | Production |
| Chainlink | Oracle | ✅ | Production |
| Band Protocol | Oracle | ✅ | Production |
| Uniswap | Oracle | ✅ | Production |
| CoinGecko | Oracle | ✅ | Production |
| Zillow | Data | ✅ | Production |
| CoreLogic | Data | ✅ | Production |
| Quandl | Data | ✅ | Production |
| IEXCloud | Data | ✅ | Production |
| Twilio | Notification | ✅ | Production |
| SendGrid | Notification | ✅ | Production |
| Mailgun | Notification | ✅ | Production |
| Vonage | Notification | ✅ | Production |

---

## 📞 Support & Resources

- **Documentation**: https://docs.aurigraph.io/integrations
- **API Reference**: https://api-docs.aurigraph.io
- **Community**: https://community.aurigraph.io
- **Enterprise Support**: integrations@aurigraph.io
- **GitHub**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-Developer-Toolkit-and-SDK

---

## ✅ Integration Checklist

- [ ] Register payment processor integration
- [ ] Configure webhook endpoints
- [ ] Set up KYC provider
- [ ] Configure rate limiting
- [ ] Register oracle service
- [ ] Set up real-time price subscriptions
- [ ] Register data provider
- [ ] Configure notification service
- [ ] Test all integrations
- [ ] Monitor integration health
- [ ] Set up error handling
- [ ] Configure backups/failovers
- [ ] Implement audit logging
- [ ] Document API usage
- [ ] Deploy to production

---

**Version 1.0.0** - Ready for production use

