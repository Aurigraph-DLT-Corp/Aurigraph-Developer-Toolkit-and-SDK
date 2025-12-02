# J4C Deployment Agent - Memorized Deployment Process

## Remote Server Configuration
- **Server**: dlt.aurigraph.io
- **SSH Port**: 22 (Standard SSH, NOT 2235)
- **User**: subbu
- **App Port**: 9003
- **JAR Location**: /home/subbu/aurigraph-v12.jar
- **Log Location**: /home/subbu/aurigraph/logs/main-api.log

## Database Configuration
- **Type**: PostgreSQL
- **Host**: localhost:5432
- **Database**: j4c_db
- **User**: j4c_user
- **Password**: j4c_password

## CI/CD Workflow Configuration

### Workflow: ssh-deploy.yml
```yaml
runs-on: [self-hosted, linux, aurigraph]  # Uses self-hosted runners
```

### Triggers
1. **Auto-trigger on push** to V12 or main branches when:
   - `aurigraph-av10-7/aurigraph-v11-standalone/src/**` changes
   - `aurigraph-av10-7/aurigraph-v11-standalone/pom.xml` changes
   - `.github/workflows/ssh-deploy.yml` changes

2. **Manual trigger** via `workflow_dispatch`:
   - Option: `skip_build` - Deploy existing JAR without rebuilding

### Build Process
1. Checkout code
2. Set up JDK 21 (Temurin distribution)
3. Build with Maven: `./mvnw clean package -DskipTests -B`
4. Output: `target/*-runner.jar`

### Deployment Steps
1. **Setup SSH**: Uses `PROD_SSH_PRIVATE_KEY` secret
2. **Upload JAR**: `scp -P 22 <JAR> subbu@dlt.aurigraph.io:/home/subbu/aurigraph-v12.jar`
3. **Deploy Script**:
   - Stop existing process: `pkill -f 'aurigraph-v12.jar'`
   - Verify port 9003 is free
   - Start new service with JVM flags
4. **Health Check**: Verify `/api/v11/health` responds

### JVM Configuration for Production
```bash
java -Xmx8g -Xms4g \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -Dquarkus.http.port=9003 \
  -Dquarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/j4c_db \
  -Dquarkus.datasource.username=j4c_user \
  -Dquarkus.datasource.password=j4c_password \
  -Dquarkus.flyway.migrate-at-start=false \
  -jar aurigraph-v12.jar
```

## Required GitHub Secrets
- `PROD_SSH_PRIVATE_KEY` - SSH private key for subbu@dlt.aurigraph.io

## Deployment Commands (Manual)

### Check Server Status
```bash
curl -sf https://dlt.aurigraph.io/api/v11/health
```

### Trigger Deployment
```bash
# Via Git push
git add -A && git commit -m "feat: description" && git push origin V12

# Via GitHub CLI
gh workflow run ssh-deploy.yml --ref V12
```

### Check Workflow Status
```bash
gh run list --repo Aurigraph-DLT-Corp/Aurigraph-DLT --limit 5
```

## Important Notes
1. **NEVER use local deployment** - Always use CI/CD via GitHub Actions
2. **Self-hosted runners** - Workflows use `[self-hosted, linux, aurigraph]` labels
3. **No Flyway migrations at startup** - `migrate-at-start=false`
4. **Health endpoint**: `/api/v11/health`
5. **Log monitoring**: Check `/home/subbu/aurigraph/logs/main-api.log`

## Troubleshooting

### If deployment fails:
1. Check workflow logs: `gh run view <run-id>`
2. SSH to server: `ssh -p 22 subbu@dlt.aurigraph.io`
3. Check logs: `tail -f /home/subbu/aurigraph/logs/main-api.log`
4. Check process: `ps aux | grep aurigraph`
5. Check port: `ss -tlnp | grep 9003`

### If health check fails:
1. Wait 30-60 seconds for startup
2. Check Java process is running
3. Verify database connectivity
4. Check application logs for errors
