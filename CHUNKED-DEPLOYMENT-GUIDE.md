# Chunked Deployment Guide
## Aurigraph V11 Enterprise Portal - Large File Upload Strategy

**Version**: 11.0.0
**Target Server**: dlt.aurigraph.io
**Created**: October 7, 2025

---

## 📋 Overview

This guide explains the chunked deployment strategy for uploading and deploying large JAR files (1.6 GB) to the production server. The chunked approach splits large files into manageable pieces, uploads them separately, and reassembles them on the server.

---

## 🎯 Why Chunked Deployment?

### Challenges with Large File Uploads

1. **Network Timeouts**: Large files (1.6 GB JAR) can timeout during SCP transfer
2. **Connection Instability**: Network interruptions cause complete transfer failure
3. **Memory Constraints**: Some systems struggle with large file transfers
4. **Resume Capability**: Standard SCP doesn't support resume on failure

### Benefits of Chunked Approach

✅ **Reliability**: Small chunks (100 MB) are less likely to fail
✅ **Resumability**: Failed chunks can be re-uploaded individually
✅ **Progress Tracking**: Monitor upload progress chunk by chunk
✅ **Integrity Verification**: MD5 checksums for each chunk and final file
✅ **Network Friendly**: Smaller packets reduce network strain

---

## 🔧 How It Works

### Step-by-Step Process

```
1. Build Application
   ├── Clean previous builds
   ├── Compile Java sources (572 files)
   ├── Package dependencies
   └── Create uber JAR (1.6 GB)

2. Split into Chunks
   ├── Copy JAR to temp directory
   ├── Split using 'split' command (100 MB chunks)
   ├── Generate individual checksums
   └── Create manifest file

3. Upload Chunks
   ├── Test SSH connection
   ├── Prepare server directories
   ├── Upload chunk-00, chunk-01, ..., chunk-n
   ├── Upload checksum files
   └── Verify each upload

4. Reassemble on Server
   ├── Concatenate all chunks
   ├── Verify MD5 checksum
   ├── Set file permissions
   └── Clean up chunks

5. Deploy Application
   ├── Stop existing service
   ├── Move JAR to deployment location
   ├── Update systemd service
   ├── Start service
   └── Validate health checks
```

---

## 📊 File Structure

### Local (Build Machine)

```
/Users/subbujois/Documents/GitHub/Aurigraph-DLT/
├── aurigraph-av10-7/aurigraph-v11-standalone/
│   └── target/
│       └── aurigraph-v11-standalone-11.0.0-runner.jar (1.6 GB)
│
└── /tmp/aurigraph-deploy-YYYYMMDD-HHMMSS/
    ├── aurigraph-v11.jar (copy of uber JAR)
    ├── aurigraph-v11.jar.md5 (checksum)
    ├── chunks.md5 (chunk checksums)
    └── chunks/
        ├── chunk-00 (100 MB)
        ├── chunk-01 (100 MB)
        ├── chunk-02 (100 MB)
        ├── ...
        └── chunk-16 (remaining ~60 MB)
```

### Remote Server (dlt.aurigraph.io)

```
/opt/aurigraph/v11/
├── aurigraph-v11.jar (reassembled, 1.6 GB)
├── aurigraph-v11.jar.backup-YYYYMMDD-HHMMSS (previous version)
├── logs/
│   ├── aurigraph-v11.log
│   └── aurigraph-v11-error.log
└── upload/ (temporary)
    ├── chunk-00
    ├── chunk-01
    ├── ...
    ├── chunk-16
    ├── chunks.md5
    └── aurigraph-v11.jar.md5
```

---

## 🚀 Usage

### Running the Chunked Deployment

```bash
# Navigate to project root
cd /Users/subbujois/Documents/GitHub/Aurigraph-DLT

# Run the chunked deployment script
./deploy-chunked.sh
```

### Script Output

The script provides detailed progress at each step:

```
================================================================
Aurigraph V11 Chunked Deployment Script
Target: dlt.aurigraph.io
Chunk Size: 100M
================================================================

[1/7] Building Aurigraph V11 application...
  ✓ Using uber JAR: target/aurigraph-v11-standalone-11.0.0-runner.jar
  JAR Size: 1.6G

[2/7] Splitting JAR into 100M chunks...
  ✓ Created 17 chunks
  ✓ Checksums generated

[3/7] Testing connection to dlt.aurigraph.io...
  ✓ SSH connection successful

[4/7] Preparing remote server...
  ✓ Remote server prepared

[5/7] Uploading 17 chunks to server...
  Uploading chunk-00 (1/17)... ✓
  Uploading chunk-01 (2/17)... ✓
  ...
  Uploading chunk-16 (17/17)... ✓
  Uploading checksums... ✓
  ✓ Upload complete: 17/17 chunks

[6/7] Reassembling JAR on server...
  Found 17 chunks to reassemble
  ✓ Reassembly complete
  ✓ Checksum verification passed
  Reassembled JAR size: 1.6G
  ✓ Reassembly complete and verified

[7/7] Deploying application...
  Stopping service...
  Starting service...
  Waiting for service to start...
  ✓ Service started

[8/8] Validating deployment...
  ✓ Health endpoint responding

================================================================
✓✓✓ DEPLOYMENT COMPLETE ✓✓✓
================================================================
```

---

## 📝 Configuration Options

### Chunk Size

Default: **100M** (100 megabytes per chunk)

Adjust in the script:
```bash
CHUNK_SIZE="100M"  # Can be changed to 50M, 200M, etc.
```

**Recommendations:**
- Fast Network: 200M chunks
- Moderate Network: 100M chunks (default)
- Slow Network: 50M chunks
- Very Slow Network: 20M chunks

### Server Configuration

```bash
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PASSWORD="subbuFuture@2025"
DEPLOY_DIR="/opt/aurigraph/v11"
```

---

## 🔒 Security Considerations

### Password Handling

The script uses `sshpass` for automated SSH connections. For production:

1. **Preferred**: Use SSH key-based authentication
   ```bash
   ssh-keygen -t ed25519 -C "deployment@aurigraph.io"
   ssh-copy-id subbu@dlt.aurigraph.io
   ```

2. **Alternative**: Use environment variables
   ```bash
   export DEPLOY_PASSWORD="your-password"
   # Script reads from environment
   ```

3. **Best Practice**: Use deployment keys or CI/CD secrets

### File Integrity

- **MD5 Checksums**: Generated for original JAR and each chunk
- **Verification**: Checksums validated after reassembly
- **Backup**: Previous deployment automatically backed up

---

## 🔍 Troubleshooting

### Upload Failures

**Problem**: Chunk upload fails

**Solution**:
1. Check network connectivity
2. Verify SSH credentials
3. Re-run script (already uploaded chunks are skipped)
4. Reduce chunk size for slow networks

### Checksum Mismatch

**Problem**: Checksum verification fails after reassembly

**Solution**:
1. Check disk space on server
2. Re-upload failed chunks
3. Verify no corruption during build
4. Check server /tmp has enough space

### Service Won't Start

**Problem**: Application service fails to start

**Solution**:
```bash
# Check logs
ssh subbu@dlt.aurigraph.io 'tail -100 /opt/aurigraph/v11/logs/aurigraph-v11.log'

# Check service status
ssh subbu@dlt.aurigraph.io 'sudo systemctl status aurigraph-v11'

# Check Java version
ssh subbu@dlt.aurigraph.io 'java -version'

# Check database connection
ssh subbu@dlt.aurigraph.io 'psql -U aurigraph_compliance -d aurigraph_compliance_db -c "SELECT 1;"'
```

### Disk Space Issues

**Problem**: Not enough space for chunks or reassembly

**Solution**:
```bash
# Check disk usage
ssh subbu@dlt.aurigraph.io 'df -h'

# Clean old backups
ssh subbu@dlt.aurigraph.io 'rm -f /opt/aurigraph/v11/*.backup-*'

# Clean upload directory
ssh subbu@dlt.aurigraph.io 'rm -rf /opt/aurigraph/v11/upload/*'
```

---

## 📊 Performance Metrics

### Typical Deployment Times

| Network Speed | Chunk Size | Upload Time | Reassembly | Total |
|--------------|-----------|-------------|------------|-------|
| 100 Mbps | 100M | ~3 minutes | ~30 seconds | ~4 min |
| 50 Mbps | 100M | ~6 minutes | ~30 seconds | ~7 min |
| 20 Mbps | 50M | ~12 minutes | ~45 seconds | ~13 min |
| 10 Mbps | 50M | ~24 minutes | ~45 seconds | ~25 min |

**Build Time**: ~3-5 minutes (independent of network speed)

### Resource Usage

**Local Machine:**
- Disk: 3-5 GB temporary (chunks + JAR)
- CPU: Moderate during build, light during upload
- Memory: 4-8 GB during build

**Remote Server:**
- Disk: 3-5 GB temporary (chunks + JAR + backup)
- CPU: Light during reassembly
- Memory: Minimal (<100 MB)

---

## 🔄 Rollback Procedure

If deployment fails and you need to rollback:

```bash
# SSH to server
ssh subbu@dlt.aurigraph.io

# Stop new service
sudo systemctl stop aurigraph-v11

# Find latest backup
ls -lt /opt/aurigraph/v11/*.backup-* | head -1

# Restore backup (replace with actual filename)
cp /opt/aurigraph/v11/aurigraph-v11.jar.backup-YYYYMMDD-HHMMSS \
   /opt/aurigraph/v11/aurigraph-v11.jar

# Start service
sudo systemctl start aurigraph-v11

# Verify
curl http://localhost:9003/q/health
```

---

## 🎯 Best Practices

### Before Deployment

✅ **Test Build Locally**: Ensure application builds successfully
✅ **Check Disk Space**: Verify server has enough space (5+ GB free)
✅ **Backup Database**: Backup PostgreSQL before deployment
✅ **Review Logs**: Check for any existing errors
✅ **Notify Users**: Alert users of planned downtime

### During Deployment

✅ **Monitor Progress**: Watch the script output
✅ **Check Logs**: Tail application logs in separate terminal
✅ **Network Stability**: Ensure stable network connection
✅ **Resource Monitoring**: Monitor server CPU/memory usage

### After Deployment

✅ **Health Checks**: Verify all health endpoints
✅ **API Testing**: Test critical API endpoints
✅ **Log Monitoring**: Watch for errors in logs
✅ **Performance Testing**: Verify acceptable response times
✅ **Database Integrity**: Check database connections
✅ **User Verification**: Confirm with users that system works

---

## 📞 Support Commands

### Quick Reference

```bash
# Check service status
ssh subbu@dlt.aurigraph.io 'sudo systemctl status aurigraph-v11'

# View live logs
ssh subbu@dlt.aurigraph.io 'tail -f /opt/aurigraph/v11/logs/aurigraph-v11.log'

# Restart service
ssh subbu@dlt.aurigraph.io 'sudo systemctl restart aurigraph-v11'

# Check health
ssh subbu@dlt.aurigraph.io 'curl http://localhost:9003/q/health'

# Check disk usage
ssh subbu@dlt.aurigraph.io 'df -h /opt/aurigraph'

# List backups
ssh subbu@dlt.aurigraph.io 'ls -lh /opt/aurigraph/v11/*.backup-*'

# Check database
ssh subbu@dlt.aurigraph.io 'sudo -u postgres psql -l'

# View systemd logs
ssh subbu@dlt.aurigraph.io 'sudo journalctl -u aurigraph-v11 -n 50'
```

---

## 📚 Related Documentation

- [deploy-chunked.sh](./deploy-chunked.sh) - Main deployment script
- [FINAL-PROJECT-COMPLETION-REPORT.md](./FINAL-PROJECT-COMPLETION-REPORT.md) - Project status
- [JIRA-GITHUB-SYNC-COMPLETE.md](./JIRA-GITHUB-SYNC-COMPLETE.md) - Issue tracking sync

---

## 📝 Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-07 | 1.0.0 | Initial chunked deployment strategy |

---

## ✅ Deployment Checklist

Before running deployment:

- [ ] Application builds successfully
- [ ] SSH access to dlt.aurigraph.io confirmed
- [ ] Server has 5+ GB free disk space
- [ ] Database is running and accessible
- [ ] Backup of existing deployment exists
- [ ] Users notified of maintenance window
- [ ] Monitoring systems ready
- [ ] Rollback plan prepared

During deployment:

- [ ] Monitor script output for errors
- [ ] Verify chunk upload progress
- [ ] Confirm checksum verification passed
- [ ] Watch service startup logs
- [ ] Validate health endpoints

After deployment:

- [ ] Service status is ACTIVE
- [ ] Health endpoint returns UP
- [ ] API endpoints responding
- [ ] No errors in logs
- [ ] Database connections working
- [ ] Users can access system
- [ ] Performance is acceptable

---

**Contact**: subbu@aurigraph.io
**Server**: dlt.aurigraph.io
**Deployment Directory**: /opt/aurigraph/v11
**Service Name**: aurigraph-v11.service

---

*Last Updated: October 7, 2025*
*Version: 1.0.0*
