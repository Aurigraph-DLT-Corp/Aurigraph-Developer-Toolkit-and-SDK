# Aurex Platform - Domain Deployment Quick Start

## 🚀 Quick Deployment Commands

### 1. Deploy to Production Domain
```bash
./scripts/deploy-production-domain.sh
```

### 2. Setup SSL Certificates
```bash
./scripts/setup-ssl-certificates.sh
```

### 3. Verify Deployment
```bash
./scripts/verify-domain-deployment.sh
```

## 🔧 Essential Commands

### Service Management
```bash
# View all services
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Restart service
docker-compose -f docker-compose.production.yml restart nginx

# Stop all
docker-compose -f docker-compose.production.yml down

# Start all
docker-compose -f docker-compose.production.yml up -d
```

### Health Checks
```bash
# Quick system status
docker ps --format "table {{.Names}}\t{{.Status}}"

# Test domains
curl -I https://dev.aurigraph.io
curl -I https://api.aurigraph.io/platform/health
curl -I https://launchpad.aurigraph.io
```

### SSL Certificate Management
```bash
# Check certificate expiry
./scripts/renew-certificates.sh

# View certificate details
openssl x509 -text -noout -in ./ssl/certbot/conf/live/dev.aurigraph.io/fullchain.pem
```

## 🌐 Deployed Domains

| Domain | Service | Purpose |
|--------|---------|---------|
| https://dev.aurigraph.io | Main Platform | Landing page and core platform |
| https://api.aurigraph.io | API Gateway | Centralized API access |
| https://launchpad.aurigraph.io | Launchpad | ESG assessment and reporting |
| https://monitoring.aurigraph.io | Monitoring | Grafana and Prometheus dashboards |

## 🔍 Quick Troubleshooting

### Container Issues
```bash
# Check failed containers
docker ps -a --filter "status=exited"

# Restart failed service
docker-compose -f docker-compose.production.yml restart [service-name]

# View detailed logs
docker logs [container-name] --tail 50
```

### SSL Issues
```bash
# Test SSL certificate
echo | openssl s_client -connect dev.aurigraph.io:443 -servername dev.aurigraph.io

# Force certificate renewal
docker run --rm -v "$(pwd)/ssl/certbot/conf:/etc/letsencrypt" -v "$(pwd)/ssl/certbot/www:/var/www/certbot" certbot/certbot renew --force-renewal
```

### DNS Issues
```bash
# Check DNS resolution
nslookup dev.aurigraph.io
dig dev.aurigraph.io

# Test from external source
curl -I http://dev.aurigraph.io
```

## ⚡ Emergency Recovery

### Complete Reset
```bash
# Stop everything
docker-compose -f docker-compose.production.yml down --volumes

# Clean up
docker system prune -af

# Redeploy
./scripts/deploy-production-domain.sh
```

### Service Recovery
```bash
# Recreate specific service
docker-compose -f docker-compose.production.yml up -d --force-recreate [service-name]
```

## 📊 Monitoring URLs

- **Grafana**: https://monitoring.aurigraph.io
- **Prometheus**: https://monitoring.aurigraph.io/prometheus/
- **API Health**: https://api.aurigraph.io/platform/health

## 🔒 Security Checklist

- [ ] SSL certificates valid and auto-renewing
- [ ] HTTPS redirects working
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] Firewall configured (ports 80, 443 open)
- [ ] Strong passwords in `.env.production`

## 📞 Quick Support

1. Check deployment guide: `PRODUCTION-DEPLOYMENT-GUIDE.md`
2. Run verification script: `./scripts/verify-domain-deployment.sh`
3. Check container logs: `docker-compose logs -f [service]`
4. Review nginx config: `docker exec aurex-nginx-production nginx -t`

---

**Last Updated**: $(date)  
**Environment**: Production (dev.aurigraph.io)