# Aurigraph V11 Enterprise Portal

## Overview

A comprehensive, single-file HTML enterprise portal that integrates with **ALL** Aurigraph V11 API endpoints. This production-ready application provides a modern, responsive interface for monitoring, testing, and managing the Aurigraph V11 blockchain platform.

## Features

### Complete API Integration

**Platform & Status:**
- Platform status monitoring
- System information display
- Health checks

**Transactions:**
- Single transaction processing
- Batch transaction processing (up to 100K transactions)
- Real-time transaction statistics

**Performance:**
- Performance testing (up to 10M iterations)
- Real-time performance metrics
- TPS monitoring and visualization

**Consensus:**
- HyperRAFT++ consensus status
- Consensus proposal submission

**Quantum Cryptography:**
- Quantum crypto system status
- Post-quantum digital signatures (CRYSTALS-Dilithium, SPHINCS+, Falcon)

**Cross-Chain Bridge:**
- Bridge statistics
- Cross-chain transfer initiation
- Multi-chain support (Ethereum, Polygon, BSC)

**HMS Integration:**
- Healthcare Management System statistics
- Real-world asset tokenization metrics

**AI Optimization:**
- ML-based optimization statistics
- AI optimization triggers
- Anomaly detection monitoring

### User Interface Features

- **Modern Dark Theme**: Professional, eye-friendly dark interface
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Auto-refresh dashboard every 5 seconds
- **Interactive Charts**: Chart.js-powered visualizations
- **Demo Mode**: Works offline with sample data
- **Form Validation**: Client-side validation for all inputs
- **Loading States**: Spinners and loading indicators
- **Error Handling**: Graceful error messages and notifications
- **Success Notifications**: Toast notifications for user feedback
- **JSON Response Display**: Formatted, copyable JSON responses

## Quick Start

### Option 1: Direct File Open
```bash
# Simply open the file in your browser
open aurigraph-v11-enterprise-portal.html
```

### Option 2: Local HTTP Server
```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx http-server -p 8000

# Then navigate to:
# http://localhost:8000/aurigraph-v11-enterprise-portal.html
```

### Option 3: Nginx Deployment
```nginx
server {
    listen 80;
    server_name portal.aurigraph.io;

    root /path/to/aurigraph-v11-standalone;
    index aurigraph-v11-enterprise-portal.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Proxy API requests to backend
    location /api/v11/ {
        proxy_pass http://localhost:9003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Configuration

### API Endpoint Selection

The portal supports three API endpoint modes:

1. **Production**: `http://dlt.aurigraph.io:9003`
2. **Local Development**: `http://localhost:9003` (default)
3. **Demo Mode**: Uses sample data (works offline)

Select the API endpoint using the dropdown in the header.

### Auto-Detection

The portal automatically:
- Detects API connectivity
- Switches to demo mode if API is unavailable
- Saves your API preference to localStorage
- Shows connection status in real-time

## Usage Guide

### Dashboard

The dashboard provides an at-a-glance view of the entire system:

- **Platform Status**: Overall health and uptime
- **Current TPS**: Real-time transactions per second
- **Total Transactions**: Cumulative transaction count
- **Active Threads**: Java virtual thread count
- **Performance Chart**: Live TPS visualization
- **Health Chart**: Memory usage visualization

**Quick Actions:**
- Run Performance Test
- Refresh All Metrics
- Export Data

### Platform Status Tab

Monitor core platform health:
- Platform status with uptime
- System information (Java version, OS, CPU, memory)
- Health check endpoint

### Transactions Tab

Process and monitor transactions:

**Single Transaction:**
1. Enter transaction ID
2. Enter amount
3. Click "Process Transaction"

**Batch Processing:**
1. Set batch size (1-100,000)
2. Set amount range (min/max)
3. Click "Process Batch"

**Statistics:**
- View real-time transaction stats
- Monitor throughput and success rate

### Performance Tab

Test and monitor performance:

**Performance Test:**
- Set iterations (1K - 10M)
- Set thread count (1 - 1024)
- Run test and view results

**Metrics:**
- Current TPS
- Total transactions
- Throughput efficiency
- Memory usage
- Active threads

### Consensus Tab

Monitor HyperRAFT++ consensus:

**Status:**
- Algorithm type
- Node ID and role
- Current term
- Commit index

**Propose Entry:**
- Submit consensus proposals
- View proposal status

### Quantum Crypto Tab

Post-quantum cryptography operations:

**Status:**
- Algorithm information
- Security level
- Keys generated
- Signatures created

**Sign Data:**
- Choose algorithm (Dilithium, SPHINCS+, Falcon)
- Enter data to sign
- Get quantum-resistant signature

### Cross-Chain Bridge Tab

Cross-chain interoperability:

**Statistics:**
- Total transfers
- Total volume
- Active chains
- Success rate

**Initiate Transfer:**
1. Select source chain
2. Select target chain
3. Enter asset and amount
4. Enter recipient address
5. Initiate transfer

### HMS Integration Tab

Healthcare Management System integration:

**Statistics:**
- Records tokenized
- Active integrations
- Current TPS
- Target TPS

### AI Optimization Tab

Machine learning optimization:

**Statistics:**
- Optimizations run
- Consensus efficiency
- Anomalies detected
- Predictive accuracy

**Trigger Optimization:**
1. Choose optimization type
2. Configure parameters (JSON)
3. Trigger optimization

## API Endpoints Reference

All endpoints are documented with:
- Request/response formats
- Example payloads
- Error handling
- Status codes

### Platform Status
```
GET  /api/v11/status        - Platform status
GET  /api/v11/info          - System information
GET  /api/v11/health        - Health check
```

### Transactions
```
POST /api/v11/transactions        - Process single transaction
POST /api/v11/transactions/batch  - Process batch transactions
GET  /api/v11/transactions/stats  - Transaction statistics
```

### Performance
```
POST /api/v11/performance/test     - Run performance test
GET  /api/v11/performance/metrics  - Performance metrics
```

### Consensus
```
GET  /api/v11/consensus/status   - Consensus status
POST /api/v11/consensus/propose  - Propose consensus entry
```

### Quantum Crypto
```
GET  /api/v11/crypto/status  - Crypto status
POST /api/v11/crypto/sign    - Sign data
```

### Cross-Chain Bridge
```
GET  /api/v11/bridge/stats     - Bridge statistics
POST /api/v11/bridge/transfer  - Initiate transfer
```

### HMS Integration
```
GET  /api/v11/hms/stats  - HMS statistics
```

### AI Optimization
```
GET  /api/v11/ai/stats     - AI statistics
POST /api/v11/ai/optimize  - Trigger optimization
```

## Demo Mode

When the API is unavailable or demo mode is selected:

- Sample data is used for all endpoints
- All features remain functional
- Orange banner indicates demo mode
- Perfect for offline demonstrations

## Browser Compatibility

Tested and supported on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- **File Size**: ~66KB (single file, no dependencies except Chart.js CDN)
- **Load Time**: <1s on modern browsers
- **Memory Usage**: <50MB
- **Chart Updates**: 60 FPS smooth animations

## Security Considerations

**For Production Deployment:**

1. **CORS Configuration**: Ensure backend allows portal origin
2. **HTTPS**: Always use HTTPS in production
3. **API Authentication**: Add authentication headers if required
4. **Rate Limiting**: Implement API rate limiting
5. **CSP Headers**: Configure Content Security Policy

## Customization

### Changing Theme Colors

Edit CSS variables in the `:root` selector:

```css
:root {
    --primary-color: #00d4ff;      /* Primary accent */
    --secondary-color: #0099cc;    /* Secondary accent */
    --accent-color: #ff6b6b;       /* Accent highlights */
    --success-color: #00ff88;      /* Success states */
    --warning-color: #ffaa00;      /* Warning states */
    --error-color: #ff3366;        /* Error states */
}
```

### Adding New Endpoints

1. Create UI in appropriate tab
2. Add API call function
3. Add response display logic
4. Update demo data if needed

## Troubleshooting

### API Connection Issues

**Problem**: "Disconnected" status
**Solutions**:
- Verify V11 backend is running on port 9003
- Check CORS configuration
- Try demo mode
- Check browser console for errors

### Chart Not Displaying

**Problem**: Charts not rendering
**Solutions**:
- Ensure Chart.js CDN is accessible
- Check browser console for errors
- Verify canvas elements exist

### Performance Test Timeout

**Problem**: Test takes too long
**Solutions**:
- Reduce iteration count
- Reduce thread count
- Check backend performance

## Development

### File Structure
```
aurigraph-v11-enterprise-portal.html
├── HTML Structure
├── CSS Styles (embedded)
│   ├── Global Styles
│   ├── Component Styles
│   ├── Responsive Styles
│   └── Utility Classes
└── JavaScript (embedded)
    ├── Initialization
    ├── API Functions
    ├── UI Functions
    ├── Chart Functions
    └── Utility Functions
```

### Code Organization

- **Global State**: API URL, demo mode, charts
- **Event Listeners**: Tabs, forms, buttons
- **API Layer**: Fetch wrapper with error handling
- **UI Layer**: Response display, notifications
- **Charts**: Chart.js integration
- **Demo Mode**: Sample data generation

## Support

For issues or questions:
- Check browser console for errors
- Verify V11 backend is running
- Try demo mode to isolate issues
- Contact: support@aurigraph.io

## Version

- **Portal Version**: 1.0.0
- **API Version**: 11.0.0
- **Last Updated**: October 2025

## License

Copyright © 2025 Aurigraph DLT Corp. All rights reserved.
