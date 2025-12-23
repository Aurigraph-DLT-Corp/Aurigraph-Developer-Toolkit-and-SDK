# NGINX Proxy - Quick Start Guide

## 🚀 5-Minute Deployment

### Prerequisites
- SSH access to `dlt.aurigraph.io`
- Frontend built: `npm run build` in `enterprise-portal/`
- Backend running on port 9003

### Deploy in 3 Steps

```bash
# 1. Navigate to nginx directory
cd aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal/nginx/

# 2. Test configuration
./deploy-nginx.sh --test

# 3. Deploy to production
./deploy-nginx.sh --deploy
```

**Done!** Access at: https://dlt.aurigraph.io

---

## 🔒 Firewall Setup (First Time Only)

```bash
# On remote server
ssh subbu@dlt.aurigraph.io
cd /tmp
# Upload setup-firewall.sh to server

# Run firewall setup
sudo ./setup-firewall.sh --setup
```

---

## 📊 Common Commands

### Check Status
```bash
./deploy-nginx.sh --status
```

### View Logs
```bash
ssh subbu@dlt.aurigraph.io
sudo tail -f /var/log/nginx/aurigraph-portal-access.log
sudo tail -f /var/log/nginx/aurigraph-portal-error.log
```

### Rollback
```bash
./deploy-nginx.sh --rollback
# Enter backup path when prompted
```

### SSL Setup (Let's Encrypt)
```bash
./deploy-nginx.sh --setup-ssl
```

---

## 🛠️ Troubleshooting

### NGINX Won't Start
```bash
ssh subbu@dlt.aurigraph.io
sudo nginx -t                    # Test config
sudo systemctl status nginx      # Check status
sudo systemctl restart nginx     # Restart
```

### Backend Connection Error
```bash
# Check if backend is running
curl http://localhost:9003/api/v11/health
```

### SSL Certificate Error
```bash
sudo certbot renew              # Renew certificate
sudo systemctl reload nginx     # Reload config
```

---

## 📝 Configuration Files

| File | Purpose | Location |
|------|---------|----------|
| `aurigraph-portal.conf` | Main NGINX config | `/etc/nginx/sites-available/` |
| `deploy-nginx.sh` | Deployment script | Local |
| `setup-firewall.sh` | Firewall setup | Server |
| Frontend files | React build | `/var/www/aurigraph-portal/dist/` |

---

## 🔧 Customization

### Update IP Whitelist (Admin Access)

Edit `aurigraph-portal.conf`:

```nginx
location /api/v11/admin/ {
    allow 192.168.1.0/24;    # Your office IP
    allow 203.0.113.50;      # Your VPN IP
    deny all;
}
```

Redeploy: `./deploy-nginx.sh --deploy`

### Change Rate Limits

Edit `aurigraph-portal.conf`:

```nginx
# Increase API rate from 100 to 200 req/s
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=200r/s;
```

Redeploy: `./deploy-nginx.sh --deploy`

---

## 📚 More Information

- Full documentation: [README.md](./README.md)
- NGINX config: [aurigraph-portal.conf](./aurigraph-portal.conf)
- Deployment script: [deploy-nginx.sh](./deploy-nginx.sh)
- Firewall setup: [setup-firewall.sh](./setup-firewall.sh)

---

## 🆘 Need Help?

- JIRA: [AV11-421](https://aurigraphdlt.atlassian.net/browse/AV11-421)
- Docs: `/docs/infrastructure/nginx-proxy.md`
- GitHub: [Aurigraph-DLT](https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT)

---

**Version**: 4.3.2
**Last Updated**: 2025-10-19
