# Aurigraph DLT Deployment Configuration

## Current Deployment Status
- **Environment**: dev4
- **Local Access**: http://localhost:4004
- **Target Domain**: dlt.aurigraph.io

## Required DNS Configuration

### Option 1: Direct Server Deployment
If you have a server with public IP (e.g., AWS EC2, DigitalOcean):

1. **DNS A Record**:
   ```
   Type: A
   Name: dlt
   Value: [YOUR_SERVER_IP]
   TTL: 300
   ```

2. **Deploy to Server**:
   ```bash
   # On your server
   git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git
   cd Aurigraph-DLT/aurigraph-av10-7
   npm install
   npm run deploy:dev4
   ```

### Option 2: Using Cloudflare Tunnel (Recommended for Testing)
No public IP required - tunnels local service to internet:

1. **Install Cloudflare Tunnel**:
   ```bash
   brew install cloudflare/cloudflare/cloudflared
   ```

2. **Create Tunnel**:
   ```bash
   cloudflared tunnel create aurigraph-dlt
   ```

3. **Configure DNS in Cloudflare**:
   ```bash
   cloudflared tunnel route dns aurigraph-dlt dlt.aurigraph.io
   ```

4. **Run Tunnel**:
   ```bash
   cloudflared tunnel run --url http://localhost:4004 aurigraph-dlt
   ```

### Option 3: Using ngrok (Quick Testing)
For immediate public access without domain:

```bash
# Install ngrok
brew install ngrok

# Expose local service
ngrok http 4004

# You'll get a URL like: https://abc123.ngrok.io
```

### Option 4: Docker Deployment with Traefik

1. **docker-compose.production.yml**:
   ```yaml
   version: '3.8'
   services:
     traefik:
       image: traefik:v2.10
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - /var/run/docker.sock:/var/run/docker.sock
         - ./traefik.yml:/traefik.yml
         - ./acme.json:/acme.json
       labels:
         - "traefik.enable=true"

     aurigraph:
       build: .
       labels:
         - "traefik.enable=true"
         - "traefik.http.routers.aurigraph.rule=Host(`dlt.aurigraph.io`)"
         - "traefik.http.routers.aurigraph.tls=true"
         - "traefik.http.routers.aurigraph.tls.certresolver=letsencrypt"
         - "traefik.http.services.aurigraph.loadbalancer.server.port=4004"
   ```

## Current Local Endpoints

While domain is being configured, access locally:

- **Health Check**: http://localhost:4004/health
- **Platform Status**: http://localhost:4004/api/v10/status
- **Real-time Data**: http://localhost:4004/api/v10/realtime
- **Bridge Status**: http://localhost:4004/api/bridge/status
- **AI Optimizer**: http://localhost:4004/api/v10/ai/status
- **Crypto Metrics**: http://localhost:4004/api/crypto/metrics

## Performance Metrics (Dev4)
- **TPS Target**: 1,000,000
- **Max Latency**: 500ms
- **Parallel Threads**: 256
- **Memory Allocated**: 16GB
- **CPU Cores**: 8

## Security Features
- ✅ Post-Quantum Cryptography (NIST Level 5)
- ✅ Zero-Knowledge Proofs (SNARK/STARK/PLONK)
- ✅ Homomorphic Encryption
- ✅ Multi-Party Computation

## Next Steps

1. **For Local Testing**: Use http://localhost:4004
2. **For Public Access**: Choose one of the deployment options above
3. **For Production**: Set up proper DNS, SSL certificates, and load balancing

## Support

For DNS configuration help:
- Check with your domain registrar (GoDaddy, Namecheap, etc.)
- Use Cloudflare for easy DNS management and CDN
- Contact your DevOps team for server deployment