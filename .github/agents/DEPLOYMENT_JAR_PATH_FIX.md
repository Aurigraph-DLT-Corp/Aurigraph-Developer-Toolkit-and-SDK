# Universal JAR Path Synchronization Fix - #MEMORIZED

**Applicable to**: All Java/Quarkus projects with Docker container deployments

---

## Problem Statement

When deploying Java applications:
- **CI/CD** deploys JAR to: `/<project-dir>/<app>.jar`
- **Docker containers** mount from: `/<project-dir>/<app-folder>/` directory
- **Result**: Containers run old code while new JAR sits unused

## Universal Solution: Symlink Architecture

```
CI/CD deploys here ─────────┐
                            ▼
        /<project-dir>/<app>.jar (MAIN JAR)
                            ▲
                            │ (symlink)
Docker containers ─────────┘
read from here:  /<project-dir>/<app-folder>/<app>.jar
```

---

## Implementation Checklist

### 1. Server Setup (Run Once)

```bash
# Template - Replace variables:
# - PROJECT_DIR: /home/<user>
# - APP_NAME: <application-name>
# - APP_FOLDER: <container-mount-folder>

mkdir -p ${PROJECT_DIR}/${APP_FOLDER}
ln -sf ${PROJECT_DIR}/${APP_NAME}.jar ${PROJECT_DIR}/${APP_FOLDER}/${APP_NAME}.jar
```

**Aurigraph Example:**
```bash
mkdir -p /home/subbu/aurigraph-v12
ln -sf /home/subbu/aurigraph-v12.jar /home/subbu/aurigraph-v12/aurigraph-v12.jar
```

### 2. CI/CD Workflow Update

Add this step after JAR deployment in your workflow:

```yaml
- name: Sync JAR to Docker containers (symlink + restart)
  run: |
    echo "Ensuring Docker containers use the new JAR..."
    cd ${PROJECT_DIR}

    # Ensure directory exists
    mkdir -p ${PROJECT_DIR}/${APP_FOLDER}

    # Create/update symlink
    ln -sf ${PROJECT_DIR}/${APP_NAME}.jar ${PROJECT_DIR}/${APP_FOLDER}/${APP_NAME}.jar
    echo "Symlink ensures both paths point to same JAR"

    # Verify symlink
    ls -la ${PROJECT_DIR}/${APP_FOLDER}/${APP_NAME}.jar

    # Restart Docker containers to reload the JAR
    echo "Restarting Docker containers..."
    docker restart ${CONTAINER_LIST} 2>/dev/null || echo "Some containers may not exist"

    sleep 20
    echo "Container status:"
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep ${APP_PREFIX} || true
    echo "Docker containers restarted"
```

### 3. Documentation Update

Add to project's deployment agent docs:

```markdown
## CRITICAL: JAR Path Synchronization - #MEMORIZED

**PROBLEM**: Docker containers mount from `/${PROJECT_DIR}/${APP_FOLDER}/` but CI/CD deploys to `/${PROJECT_DIR}/${APP_NAME}.jar`

**SOLUTION**: Use symlink to ensure both paths point to the same JAR file.

### Post-Deployment Container Restart - #MEMORIZED
After every deployment, restart Docker containers to reload the JAR:
\`\`\`bash
docker restart ${CONTAINER_LIST}
\`\`\`

### Why Container Restart is Required
- Java caches loaded classes in memory
- File change on disk is NOT automatically detected
- Containers MUST be restarted to load new JAR
```

---

## Project-Specific Configurations

### Aurigraph V12 (dlt.aurigraph.io)

| Setting | Value |
|---------|-------|
| PROJECT_DIR | `/home/subbu` |
| APP_NAME | `aurigraph-v12` |
| APP_FOLDER | `aurigraph-v12` |
| CONTAINER_LIST | `aurigraph-validator-{1..5} aurigraph-business-{1..3} aurigraph-ei-{1..3}` |
| Total Containers | 11 |

**Server Symlink:**
```bash
ln -sf /home/subbu/aurigraph-v12.jar /home/subbu/aurigraph-v12/aurigraph-v12.jar
```

---

## Verification Commands

```bash
# 1. Check symlink exists and points correctly
ls -la ${PROJECT_DIR}/${APP_FOLDER}/${APP_NAME}.jar
# Expected: <app>.jar -> /<path>/<app>.jar

# 2. Verify file sizes match (both should be identical)
stat ${PROJECT_DIR}/${APP_NAME}.jar
stat ${PROJECT_DIR}/${APP_FOLDER}/${APP_NAME}.jar

# 3. Check containers are running
docker ps --format "table {{.Names}}\t{{.Status}}" | grep ${APP_PREFIX}

# 4. Test API health
curl -sf https://<server>/api/health
```

---

## Troubleshooting

### Issue: 500 errors after deployment
**Cause**: Containers running old JAR
**Fix**:
1. Verify symlink exists: `ls -la ${APP_FOLDER}/${APP_NAME}.jar`
2. Restart containers: `docker restart ${CONTAINER_LIST}`

### Issue: Symlink broken
**Cause**: Source JAR doesn't exist
**Fix**:
1. Check main JAR exists: `ls -la ${PROJECT_DIR}/${APP_NAME}.jar`
2. Recreate symlink: `ln -sf ${PROJECT_DIR}/${APP_NAME}.jar ${PROJECT_DIR}/${APP_FOLDER}/${APP_NAME}.jar`

### Issue: Containers fail to start
**Cause**: JAR file permissions
**Fix**: `chmod +x ${PROJECT_DIR}/${APP_NAME}.jar`

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-15 | Initial creation for Aurigraph V12 |
| 2025-12-15 | Generalized for all projects |

---

**Author**: J4C Deployment Agent
**Version**: 1.0.0
**Status**: #MEMORIZED
