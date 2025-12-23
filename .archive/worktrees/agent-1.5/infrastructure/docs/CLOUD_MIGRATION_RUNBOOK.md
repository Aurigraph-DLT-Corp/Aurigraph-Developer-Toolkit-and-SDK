# Cloud Migration Runbook for Aurigraph V11

**Version**: 1.0.0
**Status**: Operational
**Last Updated**: 2025-11-12
**Owner**: DevOps Team / Agent 4

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [Migration Phases](#migration-phases)
4. [Data Transfer Procedures](#data-transfer-procedures)
5. [DNS Cutover](#dns-cutover)
6. [Testing & Validation](#testing--validation)
7. [Rollback Plan](#rollback-plan)
8. [Troubleshooting](#troubleshooting)
9. [Post-Migration Tasks](#post-migration-tasks)
10. [Communication Templates](#communication-templates)

---

## Overview

### Purpose

This runbook provides step-by-step procedures for migrating Aurigraph V11 from current single-cloud or on-premises deployment to multi-cloud architecture across AWS, Azure, and GCP.

### Objectives

- **Zero Downtime**: Achieve migration with <1 minute total downtime
- **Data Integrity**: Ensure 100% data consistency post-migration
- **Performance**: Maintain or exceed current TPS (776K baseline)
- **Rollback Safety**: Ability to rollback within 15 minutes if issues arise

### Migration Scope

**From**: Current deployment (single region/cloud)
**To**: Multi-cloud deployment
- AWS: us-east-1, us-west-2
- Azure: eastus, westus
- GCP: us-central1, us-west1

**Timeline**: 16 weeks (4-month phased approach)

### Roles & Responsibilities

| Role | Name/Team | Responsibilities |
|------|-----------|------------------|
| Migration Lead | TBD | Overall coordination, go/no-go decisions |
| DevOps Lead | TBD | Infrastructure provisioning, automation |
| Database Lead | TBD | Data migration, replication setup |
| Network Lead | TBD | VPN, DNS, load balancer configuration |
| Security Lead | TBD | Security validation, compliance |
| QA Lead | TBD | Testing coordination, validation |
| On-Call Engineer | Rotating | 24/7 support during migration |

---

## Pre-Migration Checklist

### Infrastructure Readiness (T-4 weeks)

**AWS Environment**:
- [ ] AWS account created and configured
- [ ] IAM roles and policies defined
- [ ] VPCs created in us-east-1 and us-west-2
- [ ] Security groups and NACLs configured
- [ ] S3 buckets created for backups
- [ ] KMS keys generated for encryption
- [ ] Route 53 hosted zone configured
- [ ] Cost budgets and alerts set up

**Azure Environment**:
- [ ] Azure subscription activated
- [ ] Resource groups created
- [ ] VNets created in eastus and westus
- [ ] NSGs and firewall rules configured
- [ ] Blob storage containers created
- [ ] Key Vault configured
- [ ] Azure DNS zone configured
- [ ] Cost management configured

**GCP Environment**:
- [ ] GCP project created
- [ ] VPC networks created
- [ ] Firewall rules configured
- [ ] Cloud Storage buckets created
- [ ] Cloud KMS keys generated
- [ ] Cloud DNS zone configured
- [ ] Billing alerts configured

**Cross-Cloud Networking**:
- [ ] VPN gateways provisioned in all clouds
- [ ] WireGuard tunnels configured and tested
- [ ] IPSec backup tunnels configured
- [ ] Cross-cloud connectivity validated (<50ms latency)
- [ ] Firewall rules allow cross-cloud traffic
- [ ] Network monitoring configured

**Monitoring & Logging**:
- [ ] Prometheus deployed in all clouds
- [ ] Grafana dashboards created
- [ ] Alert rules configured
- [ ] PagerDuty integration tested
- [ ] Log aggregation (ELK/Loki) deployed
- [ ] Distributed tracing (Jaeger) configured

### Data Preparation (T-2 weeks)

**Database**:
- [ ] Full database backup completed
- [ ] Backup integrity verified (test restore)
- [ ] Database size documented: ____ GB
- [ ] Estimated migration time calculated: ____ hours
- [ ] Replication lag monitoring configured
- [ ] Database connection strings prepared

**Blockchain State**:
- [ ] Current block height: ____
- [ ] State snapshot created
- [ ] Snapshot uploaded to S3/Blob/GCS
- [ ] Snapshot integrity verified (checksum)
- [ ] Estimated sync time calculated: ____ hours

**Object Storage**:
- [ ] Inventory of objects: ____ files, ____ TB
- [ ] Cross-region replication configured
- [ ] Transfer acceleration enabled
- [ ] Bandwidth throttling configured (if needed)
- [ ] Transfer monitoring dashboards created

### Application Preparation (T-1 week)

**Code Deployment**:
- [ ] Terraform code reviewed and tested
- [ ] Docker images built and pushed to registries
- [ ] CI/CD pipelines configured for all clouds
- [ ] Feature flags enabled for gradual rollout
- [ ] Version tags prepared: v11.x.x-multicloud

**Configuration**:
- [ ] Environment variables documented
- [ ] Secrets stored in Secrets Manager/Key Vault/Secret Manager
- [ ] Configuration files parameterized
- [ ] Cloud-specific configurations prepared
- [ ] TLS certificates generated and stored

**Testing**:
- [ ] Staging environment deployed in all clouds
- [ ] Integration tests passing (100%)
- [ ] Load tests completed (2M TPS validated)
- [ ] Failover tests executed
- [ ] DR drills completed

### Team Readiness (T-1 week)

**Documentation**:
- [ ] Migration runbook reviewed by all teams
- [ ] Rollback procedures documented and tested
- [ ] On-call rotation finalized
- [ ] Communication plan approved
- [ ] Post-migration checklist prepared

**Training**:
- [ ] Team trained on new architecture
- [ ] Terraform training completed
- [ ] Cloud-specific tools training done
- [ ] Incident response drills executed
- [ ] Knowledge base updated

**Communication**:
- [ ] Stakeholders notified of migration dates
- [ ] User communication drafted
- [ ] Status page prepared (status.aurigraph.io)
- [ ] Email templates ready
- [ ] Social media posts drafted (if applicable)

### Go/No-Go Decision (T-24 hours)

**Criteria for GO**:
- [ ] All pre-migration checklist items complete
- [ ] Staging migration successful
- [ ] All teams available for migration window
- [ ] No critical bugs in production
- [ ] External dependencies (DNS, CDN) confirmed available
- [ ] Rollback plan tested and validated
- [ ] Executive approval obtained

**Decision Makers**:
- CTO: ______ (Signature)
- VP Engineering: ______ (Signature)
- Migration Lead: ______ (Signature)

**Decision**: [ ] GO  [ ] NO-GO

**If NO-GO**: Reschedule to: ______ and address blockers: ______

---

## Migration Phases

### Phase 0: Preparation Window (T-4 hours to T-0)

**Duration**: 4 hours
**Downtime**: None
**Reversible**: Yes (No changes to production)

**Tasks**:

1. **Final Backups** (T-4h)
   ```bash
   # Create final production backup
   pg_dump -h prod-db.example.com -U postgres -F c -f /backup/prod-final-$(date +%Y%m%d-%H%M%S).dump aurigraph_db

   # Verify backup
   pg_restore --list /backup/prod-final-*.dump | wc -l

   # Upload to all clouds
   aws s3 cp /backup/prod-final-*.dump s3://aurigraph-backups-aws/
   az storage blob upload --file /backup/prod-final-*.dump --container aurigraph-backups
   gsutil cp /backup/prod-final-*.dump gs://aurigraph-backups-gcp/
   ```

2. **Baseline Metrics** (T-3h)
   ```bash
   # Capture current performance metrics
   curl -s http://prod.example.com/api/v11/stats > /metrics/pre-migration-$(date +%Y%m%d-%H%M%S).json

   # Document current TPS
   echo "Baseline TPS: $(jq '.tps' /metrics/pre-migration-*.json)" | tee /metrics/baseline.txt

   # Capture error rate
   echo "Baseline Error Rate: $(jq '.error_rate' /metrics/pre-migration-*.json)" | tee -a /metrics/baseline.txt
   ```

3. **Staging Final Test** (T-2h)
   ```bash
   # Run full integration test suite on staging
   cd /deployment/tests
   ./run-integration-tests.sh staging

   # Verify results
   if [ $? -eq 0 ]; then
     echo "Staging tests PASSED"
   else
     echo "Staging tests FAILED - ABORT MIGRATION"
     exit 1
   fi
   ```

4. **Team Assembly** (T-1h)
   - [ ] All team members on Zoom/Slack war room
   - [ ] PagerDuty suppression for non-critical alerts
   - [ ] Status page set to "Scheduled Maintenance"
   - [ ] Communication sent to users (if applicable)

5. **Final Go/No-Go** (T-30m)
   - [ ] All backups verified
   - [ ] All teams ready
   - [ ] No production incidents in last 24h
   - [ ] External dependencies confirmed operational

**Decision**: [ ] PROCEED TO PHASE 1  [ ] ABORT

---

### Phase 1: Infrastructure Deployment (T+0 to T+30m)

**Duration**: 30 minutes
**Downtime**: None (parallel deployment)
**Reversible**: Yes (new infrastructure, not yet serving traffic)

**Tasks**:

1. **Deploy AWS Infrastructure** (T+0 to T+10m)
   ```bash
   cd /infrastructure/terraform/aws

   # Plan
   terraform plan -out=migration.tfplan

   # Review plan (sanity check)
   terraform show migration.tfplan | less

   # Apply
   terraform apply migration.tfplan

   # Verify resources
   terraform output | tee /logs/aws-outputs.txt
   ```

   **Expected Resources**:
   - 22 EC2 instances (4V + 6B + 12S per region)
   - 2 RDS PostgreSQL instances (Multi-AZ)
   - 2 ElastiCache Redis clusters
   - 4 Load balancers (ALB + NLB per region)
   - 2 NAT Gateways per region

   **Validation**:
   ```bash
   # Check all instances running
   aws ec2 describe-instances --filters "Name=tag:Environment,Values=production" \
     --query 'Reservations[*].Instances[*].[InstanceId,State.Name]' --output table

   # Should see 22 instances in "running" state
   ```

2. **Deploy Azure Infrastructure** (T+10 to T+20m)
   ```bash
   cd /infrastructure/terraform/azure

   # Plan and apply
   terraform plan -out=migration.tfplan
   terraform apply migration.tfplan

   # Verify resources
   az resource list --resource-group aurigraph-prod-eastus --output table
   az resource list --resource-group aurigraph-prod-westus --output table
   ```

   **Expected Resources**:
   - 22 VMs
   - 2 Azure Database for PostgreSQL
   - 2 Azure Cache for Redis
   - 2 Application Gateways
   - 3 NAT Gateways

3. **Deploy GCP Infrastructure** (T+20 to T+30m)
   ```bash
   cd /infrastructure/terraform/gcp

   # Plan and apply
   terraform plan -out=migration.tfplan
   terraform apply migration.tfplan

   # Verify resources
   gcloud compute instances list --filter="labels.environment=production"
   ```

   **Expected Resources**:
   - 22 Compute Engine instances
   - 2 Cloud SQL for PostgreSQL
   - 2 Memorystore for Redis
   - 1 Cloud Load Balancer (global)

4. **Verify Cross-Cloud Networking** (T+30m)
   ```bash
   # Test VPN connectivity from AWS to Azure
   ssh -i ~/.ssh/aurigraph-aws.pem ec2-user@<aws-validator-1> \
     "ping -c 5 10.10.1.10"  # Azure private IP

   # Test VPN connectivity from Azure to GCP
   ssh azureuser@<azure-validator-1> \
     "ping -c 5 10.20.1.10"  # GCP private IP

   # Test latency matrix (should be <50ms)
   ./scripts/test-cross-cloud-latency.sh
   ```

**Phase 1 Success Criteria**:
- [ ] All infrastructure deployed without errors
- [ ] All VMs/instances in running state
- [ ] Cross-cloud connectivity validated (<50ms)
- [ ] Monitoring dashboards showing green status

**If Failure**: Terraform destroy all resources and abort migration

---

### Phase 2: Application Deployment (T+30m to T+1h)

**Duration**: 30 minutes
**Downtime**: None (not yet receiving traffic)
**Reversible**: Yes (applications not yet active)

**Tasks**:

1. **Deploy Aurigraph V11 Application** (T+30 to T+45m)

   **AWS Deployment**:
   ```bash
   # Deploy to AWS validators
   ansible-playbook -i inventory/aws-prod.yml playbooks/deploy-v11.yml \
     --tags validators \
     --extra-vars "version=v11.5.0-multicloud"

   # Deploy to AWS business nodes
   ansible-playbook -i inventory/aws-prod.yml playbooks/deploy-v11.yml \
     --tags business \
     --extra-vars "version=v11.5.0-multicloud"

   # Deploy to AWS slim nodes
   ansible-playbook -i inventory/aws-prod.yml playbooks/deploy-v11.yml \
     --tags slim \
     --extra-vars "version=v11.5.0-multicloud"
   ```

   **Azure Deployment**:
   ```bash
   ansible-playbook -i inventory/azure-prod.yml playbooks/deploy-v11.yml \
     --extra-vars "version=v11.5.0-multicloud"
   ```

   **GCP Deployment**:
   ```bash
   ansible-playbook -i inventory/gcp-prod.yml playbooks/deploy-v11.yml \
     --extra-vars "version=v11.5.0-multicloud"
   ```

2. **Configure HyperRAFT++ Consensus** (T+45 to T+55m)
   ```bash
   # Initialize 12-validator cluster
   ./scripts/init-consensus-cluster.sh \
     --validators aws-val-1,aws-val-2,azure-val-1,azure-val-2,gcp-val-1,gcp-val-2 \
     --seed-node aws-val-1.aurigraph.internal

   # Elect initial leader
   ./scripts/elect-leader.sh --prefer-cloud aws --prefer-region us-east-1

   # Verify consensus status
   curl -s http://aws-val-1.aurigraph.internal:9003/consensus/status | jq
   ```

   **Expected Output**:
   ```json
   {
     "status": "healthy",
     "leader": "aws-val-1",
     "followers": ["aws-val-2", "azure-val-1", "azure-val-2", "gcp-val-1", "gcp-val-2"],
     "quorum": 7,
     "term": 1,
     "log_index": 0
   }
   ```

3. **Validate Health Checks** (T+55 to T+60m)
   ```bash
   # Check health endpoints on all nodes
   for node in $(cat inventory/all-nodes.txt); do
     echo "Checking $node..."
     curl -sf http://$node:9003/q/health || echo "FAILED: $node"
   done

   # Should see 66 successful health checks
   ```

4. **Deploy Load Balancers** (T+60m)
   ```bash
   # Configure AWS ALB target groups
   aws elbv2 register-targets --target-group-arn <tg-arn> \
     --targets Id=<aws-val-1>,Id=<aws-val-2>,...

   # Configure Azure Application Gateway backend pool
   az network application-gateway address-pool update \
     --gateway-name aurigraph-prod-gateway \
     --name backend-pool \
     --servers <azure-val-1-ip> <azure-val-2-ip> ...

   # Configure GCP Load Balancer backend service
   gcloud compute backend-services add-backend aurigraph-backend \
     --instance-group=validators-us-central1 \
     --instance-group-zone=us-central1-a
   ```

**Phase 2 Success Criteria**:
- [ ] All 66 nodes have V11 application running
- [ ] All health checks passing
- [ ] HyperRAFT++ consensus operational
- [ ] Load balancers configured (not yet receiving traffic)

**If Failure**: Stop applications, troubleshoot, rollback if necessary

---

### Phase 3: Data Migration (T+1h to T+3h)

**Duration**: 2 hours (depends on data size)
**Downtime**: None (replication, not cutover)
**Reversible**: Yes (replication only)

**Tasks**:

1. **Set Up Database Replication** (T+1h to T+1h15m)

   **PostgreSQL Logical Replication**:
   ```sql
   -- On current production database
   ALTER SYSTEM SET wal_level = 'logical';
   SELECT pg_reload_conf();

   -- Create publication
   CREATE PUBLICATION aurigraph_pub FOR ALL TABLES;

   -- On new CockroachDB cluster
   CREATE SUBSCRIPTION aurigraph_sub
     CONNECTION 'host=prod-db.example.com port=5432 dbname=aurigraph_db user=replication_user password=<password>'
     PUBLICATION aurigraph_pub;

   -- Verify replication
   SELECT * FROM pg_stat_subscription;
   ```

   **Expected Output**:
   ```
   subname        | aurigraph_sub
   state          | streaming
   received_lsn   | 0/3000000
   last_msg_time  | 2025-11-12 18:30:00
   ```

2. **Replicate Blockchain State** (T+1h15m to T+2h)
   ```bash
   # Stream RocksDB snapshots to new validators
   for validator in $(cat inventory/validators.txt); do
     echo "Syncing state to $validator..."
     rsync -avz --progress /var/lib/aurigraph/rocksdb/ \
       root@$validator:/var/lib/aurigraph/rocksdb/
   done

   # Verify state hash
   ./scripts/verify-state-hash.sh --compare-against prod-val-1.example.com
   ```

3. **Replicate Object Storage** (T+2h to T+2h30m)
   ```bash
   # Enable S3 cross-region replication (if not already enabled)
   aws s3api put-bucket-replication --bucket aurigraph-prod-data \
     --replication-configuration file://replication-config.json

   # Sync historical data
   aws s3 sync s3://aurigraph-old-bucket/ s3://aurigraph-aws-bucket/ --storage-class STANDARD_IA

   # Replicate to Azure Blob Storage
   azcopy sync "https://aurigraph-old.blob.core.windows.net/data" \
     "https://aurigraph-azure.blob.core.windows.net/data" --recursive

   # Replicate to GCP Cloud Storage
   gsutil -m rsync -r gs://aurigraph-old-bucket/ gs://aurigraph-gcp-bucket/
   ```

4. **Monitor Replication Lag** (T+2h30m to T+3h)
   ```bash
   # Check database replication lag
   while true; do
     lag=$(psql -h new-db.example.com -U postgres -c \
       "SELECT EXTRACT(EPOCH FROM (now() - last_msg_send_time)) FROM pg_stat_subscription;" -t)
     echo "Replication lag: ${lag}s"
     if (( $(echo "$lag < 5" | bc -l) )); then
       echo "Replication lag acceptable (<5s). Proceeding to cutover."
       break
     fi
     sleep 10
   done
   ```

**Phase 3 Success Criteria**:
- [ ] Database replication lag <5 seconds
- [ ] Blockchain state synchronized (matching hashes)
- [ ] Object storage replicated (100% of data)
- [ ] No replication errors in logs

**If Failure**:
- Investigate replication errors
- Increase replication timeout
- Consider manual data dump/restore if replication fails

---

### Phase 4: DNS Cutover (T+3h to T+3h15m)

**Duration**: 15 minutes
**Downtime**: 1-2 minutes (DNS propagation)
**Reversible**: Yes (revert DNS, 5-minute rollback)

**CRITICAL PHASE - Proceed with extreme caution**

**Tasks**:

1. **Pre-Cutover Validation** (T+3h to T+3h5m)
   ```bash
   # Final smoke test on new infrastructure
   ./scripts/smoke-test.sh --target new-multi-cloud

   # Verify all health checks green
   ./scripts/check-all-health.sh

   # Check replication lag one final time
   ./scripts/check-replication-lag.sh

   # Should be <2 seconds for cutover
   ```

2. **Enable Read-Only Mode on Old System** (T+3h5m)
   ```bash
   # Set old production to read-only (prevents data divergence)
   psql -h prod-db.example.com -U postgres -c \
     "ALTER SYSTEM SET default_transaction_read_only = on;"
   psql -h prod-db.example.com -U postgres -c "SELECT pg_reload_conf();"

   # Verify read-only
   psql -h prod-db.example.com -U postgres -c "SHOW default_transaction_read_only;"
   # Expected: on
   ```

3. **Final Data Sync** (T+3h6m to T+3h8m)
   ```bash
   # Wait for last transactions to replicate
   sleep 30

   # Verify no replication lag
   ./scripts/check-replication-lag.sh
   # Expected: <1 second

   # Stop old application (graceful)
   ansible-playbook -i inventory/old-prod.yml playbooks/stop-graceful.yml
   ```

4. **Update DNS Records** (T+3h8m to T+3h10m)

   **Route 53 (Primary DNS)**:
   ```bash
   # Update A records to point to new load balancers
   aws route53 change-resource-record-sets --hosted-zone-id <zone-id> \
     --change-batch file://dns-cutover.json

   # Verify change submitted
   aws route53 get-change --id <change-id>
   ```

   **dns-cutover.json**:
   ```json
   {
     "Changes": [
       {
         "Action": "UPSERT",
         "ResourceRecordSet": {
           "Name": "api.dlt.aurigraph.io",
           "Type": "A",
           "TTL": 60,
           "ResourceRecords": [
             {"Value": "<aws-lb-ip>"},
             {"Value": "<azure-lb-ip>"},
             {"Value": "<gcp-lb-ip>"}
           ]
         }
       }
     ]
   }
   ```

5. **Monitor DNS Propagation** (T+3h10m to T+3h15m)
   ```bash
   # Check DNS propagation
   while true; do
     resolved_ip=$(dig +short api.dlt.aurigraph.io @8.8.8.8 | head -1)
     if [[ "$resolved_ip" == "<aws-lb-ip>" ]] || \
        [[ "$resolved_ip" == "<azure-lb-ip>" ]] || \
        [[ "$resolved_ip" == "<gcp-lb-ip>" ]]; then
       echo "DNS propagated to new infrastructure!"
       break
     fi
     echo "Waiting for DNS propagation... (current: $resolved_ip)"
     sleep 5
   done
   ```

6. **Enable Writes on New System** (T+3h15m)
   ```bash
   # Remove read-only mode on new databases
   psql -h new-db-aws.example.com -U postgres -c \
     "ALTER SYSTEM SET default_transaction_read_only = off;"
   psql -h new-db-aws.example.com -U postgres -c "SELECT pg_reload_conf();"

   # Verify writes enabled
   psql -h new-db-aws.example.com -U postgres -c \
     "CREATE TABLE migration_test (id INT); DROP TABLE migration_test;"
   # Should succeed
   ```

**Phase 4 Success Criteria**:
- [ ] DNS updated to point to new infrastructure
- [ ] DNS propagation complete (<2 minutes)
- [ ] Old system in read-only mode
- [ ] New system accepting writes
- [ ] Traffic flowing to new infrastructure

**If Failure**: EXECUTE ROLLBACK IMMEDIATELY (see Rollback Plan)

---

### Phase 5: Post-Cutover Validation (T+3h15m to T+4h)

**Duration**: 45 minutes
**Downtime**: None (traffic on new infrastructure)
**Reversible**: Yes (if detected within 30 minutes)

**Tasks**:

1. **Immediate Health Check** (T+3h15m to T+3h20m)
   ```bash
   # Check all endpoints responding
   for endpoint in /health /info /stats /analytics/dashboard; do
     echo "Testing $endpoint..."
     http_code=$(curl -o /dev/null -s -w "%{http_code}" https://api.dlt.aurigraph.io/api/v11$endpoint)
     if [ "$http_code" == "200" ]; then
       echo "✓ $endpoint OK"
     else
       echo "✗ $endpoint FAILED (HTTP $http_code)"
       # ALERT: Consider rollback
     fi
   done
   ```

2. **Transaction Test** (T+3h20m to T+3h25m)
   ```bash
   # Submit test transaction
   response=$(curl -X POST https://api.dlt.aurigraph.io/api/v11/transactions/submit \
     -H "Content-Type: application/json" \
     -d '{
       "from": "test-wallet-1",
       "to": "test-wallet-2",
       "amount": 1,
       "currency": "AUR"
     }')

   # Verify transaction accepted
   tx_id=$(echo $response | jq -r '.transaction_id')
   echo "Transaction ID: $tx_id"

   # Check transaction status
   sleep 5
   curl -s https://api.dlt.aurigraph.io/api/v11/transactions/$tx_id | jq '.status'
   # Expected: "confirmed"
   ```

3. **Performance Baseline** (T+3h25m to T+3h35m)
   ```bash
   # Run load test (20% of normal traffic)
   ./scripts/load-test.sh --duration 5m --target 150000  # 150K TPS

   # Check metrics
   tps=$(curl -s https://api.dlt.aurigraph.io/api/v11/stats | jq '.tps')
   latency=$(curl -s https://api.dlt.aurigraph.io/api/v11/stats | jq '.latency_p95')
   error_rate=$(curl -s https://api.dlt.aurigraph.io/api/v11/stats | jq '.error_rate')

   echo "Current TPS: $tps (target: >776000)"
   echo "Latency p95: $latency ms (target: <100ms)"
   echo "Error rate: $error_rate% (target: <0.1%)"

   # Alert if metrics degraded
   if (( $(echo "$tps < 700000" | bc -l) )); then
     echo "WARNING: TPS below baseline! Consider rollback."
   fi
   ```

4. **Monitor Error Rates** (T+3h35m to T+3h45m)
   ```bash
   # Check application logs for errors
   kubectl logs -f deployment/aurigraph-api --all-containers --tail=100 | grep -i error

   # Check database errors
   psql -h new-db-aws.example.com -U postgres -c \
     "SELECT count(*) FROM pg_stat_database WHERE datname='aurigraph_db' AND xact_rollback > 0;"

   # Check consensus errors
   curl -s http://aws-val-1.aurigraph.internal:9003/consensus/status | jq '.errors'
   # Expected: []
   ```

5. **Validate Data Consistency** (T+3h45m to T+4h)
   ```bash
   # Compare record counts between old and new databases
   old_count=$(psql -h prod-db.example.com -U postgres -t -c \
     "SELECT count(*) FROM transactions;")
   new_count=$(psql -h new-db-aws.example.com -U postgres -t -c \
     "SELECT count(*) FROM transactions;")

   echo "Old DB: $old_count transactions"
   echo "New DB: $new_count transactions"

   if [ "$old_count" -eq "$new_count" ]; then
     echo "✓ Data consistency verified"
   else
     echo "✗ Data mismatch! Investigate immediately."
   fi

   # Verify blockchain state hash
   ./scripts/verify-state-hash.sh --compare prod-val-1 aws-val-1
   ```

**Phase 5 Success Criteria**:
- [ ] All health checks passing
- [ ] Test transactions confirming successfully
- [ ] TPS at or above baseline (776K+)
- [ ] Latency p95 <100ms
- [ ] Error rate <0.1%
- [ ] Data consistency verified

**If Degraded Performance**:
- Monitor for 15 minutes
- If not improving: Execute rollback
- If improving: Continue monitoring

---

### Phase 6: Gradual Traffic Ramp (T+4h to T+8h)

**Duration**: 4 hours
**Downtime**: None
**Reversible**: Yes (reduce traffic percentage)

**Traffic Ramp Schedule**:

| Time      | Traffic % | Action | Success Criteria |
|-----------|-----------|--------|------------------|
| T+4h      | 10%       | Route 10% to new infra | Error rate <0.1%, Latency <100ms |
| T+4h30m   | 25%       | Increase to 25% | TPS stable, no consensus issues |
| T+5h      | 50%       | Increase to 50% | Database replication healthy |
| T+6h      | 75%       | Increase to 75% | All metrics green |
| T+7h      | 100%      | Full cutover | Sustained performance >2h |

**Tasks per Ramp Stage**:

1. **Update Load Balancer Weights**
   ```bash
   # Example for 25% traffic
   aws elbv2 modify-target-group --target-group-arn <new-tg-arn> --weight 25
   aws elbv2 modify-target-group --target-group-arn <old-tg-arn> --weight 75
   ```

2. **Monitor for 30 Minutes**
   ```bash
   # Watch Grafana dashboards
   # Alert thresholds:
   # - Error rate >0.5%: Pause ramp
   # - Latency p95 >200ms: Pause ramp
   # - TPS drop >20%: Rollback stage
   ```

3. **Validate Success Criteria**
   ```bash
   ./scripts/validate-migration.sh --stage <stage-number>
   ```

4. **Document Observations**
   ```
   Stage: 25%
   TPS: 195K (expected: 194K) ✓
   Latency: 85ms ✓
   Error Rate: 0.03% ✓
   Consensus: Healthy ✓
   Decision: PROCEED to 50%
   ```

**Phase 6 Success Criteria**:
- [ ] All traffic ramp stages completed
- [ ] 100% traffic on new infrastructure
- [ ] Sustained performance for 2 hours
- [ ] No rollbacks required during ramp

---

## Data Transfer Procedures

### Large File Transfers

**AWS DataSync**:
```bash
# Create DataSync task
aws datasync create-task \
  --source-location-arn arn:aws:datasync:us-east-1:123456:location/loc-abc \
  --destination-location-arn arn:aws:datasync:us-west-2:123456:location/loc-xyz \
  --name "Blockchain-Data-Migration" \
  --options VerifyMode=POINT_IN_TIME_CONSISTENT,OverwriteMode=ALWAYS
```

**Azure Data Box** (for TB-scale data):
```bash
# Order Data Box via Azure Portal
# Copy data to device
# Ship back to Azure datacenter
# Data automatically uploaded to Blob Storage
```

**GCP Transfer Service**:
```bash
# Create transfer job
gcloud transfer jobs create gs://source-bucket gs://dest-bucket \
  --schedule-start-date=$(date -u +%Y-%m-%d) \
  --schedule-end-date=$(date -u -d "+1 day" +%Y-%m-%d)
```

### Database Migration Tools

**PostgreSQL Native Tools**:
```bash
# Dump from source
pg_dump -h source.example.com -U postgres -F c -f /backup/db.dump aurigraph_db

# Restore to destination (parallel jobs for speed)
pg_restore -h dest.example.com -U postgres -j 8 -d aurigraph_db /backup/db.dump
```

**AWS Database Migration Service (DMS)**:
```bash
# Create replication instance
aws dms create-replication-instance \
  --replication-instance-identifier aurigraph-migration \
  --replication-instance-class dms.c5.xlarge \
  --allocated-storage 100

# Create source and target endpoints
# Create migration task with CDC (Change Data Capture)
```

### Verification Scripts

**Data Integrity Check**:
```bash
#!/bin/bash
# verify-data-integrity.sh

SOURCE_DB="prod-db.example.com"
TARGET_DB="new-db.example.com"

echo "Comparing table row counts..."

for table in $(psql -h $SOURCE_DB -U postgres -t -c \
  "SELECT tablename FROM pg_tables WHERE schemaname='public';"); do

  source_count=$(psql -h $SOURCE_DB -U postgres -t -c "SELECT count(*) FROM $table;")
  target_count=$(psql -h $TARGET_DB -U postgres -t -c "SELECT count(*) FROM $table;")

  if [ "$source_count" -eq "$target_count" ]; then
    echo "✓ $table: $source_count rows (match)"
  else
    echo "✗ $table: source=$source_count, target=$target_count (MISMATCH)"
  fi
done
```

---

## DNS Cutover

### DNS Configuration

**Pre-Cutover DNS State**:
```dns
api.dlt.aurigraph.io.  60  IN  A  <old-prod-ip>
```

**Post-Cutover DNS State**:
```dns
api.dlt.aurigraph.io.  60  IN  A  <aws-lb-ip>     (weight 40)
api.dlt.aurigraph.io.  60  IN  A  <azure-lb-ip>   (weight 30)
api.dlt.aurigraph.io.  60  IN  A  <gcp-lb-ip>     (weight 30)
```

### DNS Propagation Monitoring

```bash
#!/bin/bash
# monitor-dns-propagation.sh

TARGET_IPS=("52.1.2.3" "20.1.2.3" "34.1.2.3")  # AWS, Azure, GCP

echo "Monitoring DNS propagation..."

for nameserver in 8.8.8.8 1.1.1.1 208.67.222.222; do
  resolved=$(dig +short api.dlt.aurigraph.io @$nameserver | head -1)

  if [[ " ${TARGET_IPS[@]} " =~ " ${resolved} " ]]; then
    echo "✓ $nameserver: $resolved (CORRECT)"
  else
    echo "✗ $nameserver: $resolved (OLD)"
  fi
done
```

### DNS Rollback Procedure

```bash
# Revert DNS to old infrastructure
aws route53 change-resource-record-sets --hosted-zone-id <zone-id> \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.dlt.aurigraph.io",
        "Type": "A",
        "TTL": 60,
        "ResourceRecords": [{"Value": "<old-prod-ip>"}]
      }
    }]
  }'

# Wait for propagation (60s TTL)
sleep 60

# Verify rollback
dig +short api.dlt.aurigraph.io @8.8.8.8
# Expected: <old-prod-ip>
```

---

## Testing & Validation

### Pre-Migration Tests

**Infrastructure Tests**:
```bash
# Test: All nodes reachable
./tests/test-node-connectivity.sh

# Test: Cross-cloud latency <50ms
./tests/test-cross-cloud-latency.sh

# Test: Load balancers healthy
./tests/test-load-balancers.sh

# Test: Database connections
./tests/test-database-connections.sh
```

**Application Tests**:
```bash
# Test: Health endpoints
./tests/test-health-endpoints.sh

# Test: API endpoints
./tests/test-api-endpoints.sh

# Test: Consensus operations
./tests/test-consensus.sh

# Test: Transaction processing
./tests/test-transactions.sh
```

**Load Tests**:
```bash
# Test: 776K TPS baseline
./tests/load-test.sh --target 776000 --duration 10m

# Test: 2M TPS target
./tests/load-test.sh --target 2000000 --duration 5m

# Test: Burst capacity (3M TPS)
./tests/load-test.sh --target 3000000 --duration 1m
```

### Post-Migration Tests

**Smoke Tests** (immediately after cutover):
```bash
./tests/smoke-test.sh --environment production
```

**Integration Tests** (30 minutes after cutover):
```bash
./tests/integration-test-suite.sh --full
```

**Chaos Tests** (24 hours after cutover):
```bash
# Test node failure resilience
./tests/chaos/kill-random-node.sh

# Test AZ failure
./tests/chaos/disable-availability-zone.sh

# Test network partition
./tests/chaos/partition-network.sh
```

---

## Rollback Plan

### Rollback Decision Criteria

**IMMEDIATE ROLLBACK** (execute within 5 minutes) if:
- Error rate >5%
- Complete service outage (all health checks failing)
- Data corruption detected
- Security breach detected
- Consensus failure (no leader for >2 minutes)

**PLANNED ROLLBACK** (execute within 15 minutes) if:
- Error rate >1% sustained for 10 minutes
- TPS drops >50% from baseline
- Latency p95 >500ms sustained
- Database replication lag >60 seconds
- Critical bugs discovered

**MONITOR & DEFER ROLLBACK** if:
- Error rate 0.5-1% (investigate, may resolve)
- TPS drops 20-50% (may stabilize)
- Latency 100-200ms (acceptable range)
- Non-critical bugs (can be hotfixed)

### Rollback Procedure

**Step 1: Announce Rollback** (0-2 minutes)
```bash
# Notify all teams
slack-cli send --channel "#migration-war-room" \
  --message "🚨 ROLLBACK INITIATED - Migration failed validation"

# Update status page
curl -X POST https://api.statuspage.io/v1/pages/<page-id>/incidents \
  -d "name=Migration Rollback in Progress" \
  -d "status=investigating"
```

**Step 2: Revert DNS** (2-4 minutes)
```bash
# Point DNS back to old infrastructure
aws route53 change-resource-record-sets --hosted-zone-id <zone-id> \
  --change-batch file://dns-rollback.json

# Wait for propagation
sleep 60

# Verify DNS rollback
dig +short api.dlt.aurigraph.io @8.8.8.8
# Expected: <old-prod-ip>
```

**Step 3: Re-enable Old System** (4-6 minutes)
```bash
# Remove read-only mode
psql -h prod-db.example.com -U postgres -c \
  "ALTER SYSTEM SET default_transaction_read_only = off;"

# Restart old application
ansible-playbook -i inventory/old-prod.yml playbooks/start-application.yml

# Verify old system healthy
./scripts/check-health.sh --target old-prod
```

**Step 4: Stop New System** (6-8 minutes)
```bash
# Gracefully stop new applications
ansible-playbook -i inventory/multi-cloud.yml playbooks/stop-graceful.yml

# Stop database replication
psql -h new-db-aws.example.com -U postgres -c \
  "DROP SUBSCRIPTION aurigraph_sub;"
```

**Step 5: Validate Rollback** (8-10 minutes)
```bash
# Test old system functionality
./tests/smoke-test.sh --environment old-prod

# Check metrics
tps=$(curl -s https://old-prod.example.com/api/v11/stats | jq '.tps')
echo "TPS after rollback: $tps (expected: >700000)"

# Check error rate
error_rate=$(curl -s https://old-prod.example.com/api/v11/stats | jq '.error_rate')
echo "Error rate: $error_rate% (expected: <0.1%)"
```

**Step 6: Post-Rollback Actions** (10-30 minutes)
```bash
# Update status page
curl -X PATCH https://api.statuspage.io/v1/pages/<page-id>/incidents/<incident-id> \
  -d "status=resolved" \
  -d "message=Rollback complete. Service restored."

# Notify stakeholders
./scripts/send-rollback-notification.sh

# Schedule post-mortem
# Document rollback reason
# Plan remediation
```

### Rollback Validation

**Success Criteria**:
- [ ] DNS pointing to old infrastructure
- [ ] Old system accepting traffic
- [ ] TPS restored to baseline
- [ ] Error rate <0.1%
- [ ] All health checks passing
- [ ] Zero data loss confirmed

**Rollback Time**: Target <15 minutes from decision to full restoration

---

## Troubleshooting

### Common Issues & Resolutions

#### Issue 1: High Replication Lag

**Symptoms**:
- Database replication lag >30 seconds
- "Subscription lag too high" alerts

**Diagnosis**:
```bash
# Check replication status
psql -h new-db.example.com -U postgres -c \
  "SELECT subname, received_lsn, latest_end_lsn FROM pg_stat_subscription;"
```

**Resolution**:
```bash
# Increase max_replication_slots
psql -h prod-db.example.com -U postgres -c \
  "ALTER SYSTEM SET max_replication_slots = 20;"

# Restart PostgreSQL (requires downtime)
sudo systemctl restart postgresql

# OR: Increase network bandwidth between regions
```

#### Issue 2: Consensus Leader Election Failure

**Symptoms**:
- No leader elected after 2 minutes
- Validators in "candidate" state
- Quorum not achieved

**Diagnosis**:
```bash
# Check consensus status on all validators
for validator in $(cat inventory/validators.txt); do
  curl -s http://$validator:9003/consensus/status | jq '{node: .node_id, state: .state}'
done
```

**Resolution**:
```bash
# Force re-election with specific leader
./scripts/force-leader-election.sh --leader aws-val-1

# If still failing, check network connectivity
./scripts/test-validator-connectivity.sh

# Check for split-brain (network partition)
./scripts/detect-split-brain.sh
```

#### Issue 3: Cross-Cloud Latency Spike

**Symptoms**:
- Latency >100ms between clouds
- VPN tunnel packet loss
- Timeouts in logs

**Diagnosis**:
```bash
# Check VPN tunnel status
sudo wg show

# Test latency between regions
for region in aws-east azure-east gcp-central; do
  echo "Testing $region..."
  ping -c 10 $region.aurigraph.internal | tail -1
done
```

**Resolution**:
```bash
# Restart WireGuard tunnel
sudo systemctl restart wg-quick@wg0

# Failover to IPSec backup tunnel
sudo ipsec restart

# Check cloud provider status pages (possible outage)
```

#### Issue 4: Load Balancer Health Checks Failing

**Symptoms**:
- Nodes marked unhealthy
- "Target health check failed" alerts
- Traffic not routing to nodes

**Diagnosis**:
```bash
# Check health endpoint manually
curl -v http://<node-ip>:9003/q/health

# Check load balancer logs
aws elbv2 describe-target-health --target-group-arn <tg-arn>
```

**Resolution**:
```bash
# Verify firewall rules allow health checks
# AWS: Security group must allow ALB traffic
# Azure: NSG must allow Application Gateway
# GCP: Firewall rule for health check ranges (35.191.0.0/16)

# Restart application if stuck
ssh node-1 "sudo systemctl restart aurigraph-v11"

# Check application logs for errors
ssh node-1 "journalctl -u aurigraph-v11 -n 100"
```

#### Issue 5: DNS Not Propagating

**Symptoms**:
- Old IP still resolving after 5 minutes
- Mixed DNS responses
- Some users on old infrastructure

**Diagnosis**:
```bash
# Check DNS propagation
./scripts/check-dns-propagation.sh

# Check TTL
dig api.dlt.aurigraph.io | grep "IN\s\+A" | awk '{print $2}'
```

**Resolution**:
```bash
# If TTL too high, wait for expiration
# Consider using Cloudflare API to purge cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/<zone-id>/purge_cache" \
  -H "Authorization: Bearer <api-token>" \
  -d '{"purge_everything":true}'

# Notify users to flush DNS cache
# Windows: ipconfig /flushdns
# Mac: sudo dscacheutil -flushcache
# Linux: sudo systemd-resolve --flush-caches
```

---

## Post-Migration Tasks

### Immediate (Day 1)

- [ ] Monitor metrics for 24 hours continuously
- [ ] Keep war room active for immediate response
- [ ] Document any issues encountered
- [ ] Send success notification to stakeholders
- [ ] Update status page to "All Systems Operational"

### Short-term (Week 1)

- [ ] Conduct post-migration review meeting
- [ ] Finalize post-mortem document
- [ ] Decommission old infrastructure (after validation)
- [ ] Update documentation with actual timeline
- [ ] Review cost actuals vs. estimates
- [ ] Schedule follow-up capacity planning

### Long-term (Month 1)

- [ ] Optimize instance sizes based on actual usage
- [ ] Enable auto-scaling policies
- [ ] Implement cost optimization strategies
- [ ] Schedule first quarterly DR drill
- [ ] Review and update runbooks
- [ ] Knowledge transfer to operations team

---

## Communication Templates

### Pre-Migration Announcement

**Subject**: [Action Required] Aurigraph V11 Multi-Cloud Migration - November 12, 2025

**Body**:
```
Dear Aurigraph Users,

We are excited to announce a major infrastructure upgrade for Aurigraph DLT!

WHAT: Migration to multi-cloud architecture (AWS, Azure, GCP)
WHEN: November 12, 2025, 6:00 PM - 10:00 PM EST
EXPECTED DOWNTIME: <2 minutes during DNS cutover
BENEFITS: 99.99% uptime, improved performance, global redundancy

WHAT YOU NEED TO DO:
- No action required from most users
- API endpoints remain the same
- Mobile app will auto-reconnect
- Cache may need refresh (Ctrl+F5 on web)

DURING MIGRATION:
- Status updates: https://status.aurigraph.io
- Support: support@aurigraph.io
- Emergency: +1-800-AURIGRAPH

Thank you for your patience as we enhance our platform!

Best regards,
Aurigraph Engineering Team
```

### Migration Progress Update

**Subject**: [In Progress] Aurigraph Migration Update - Phase 3 of 6

**Body**:
```
Migration Progress: 50% Complete ✓

Completed:
✓ Infrastructure deployed
✓ Applications deployed
✓ Data replication in progress

In Progress:
⏳ Database synchronization (lag: 3 seconds)

Next Steps:
- DNS cutover (~30 minutes)
- Traffic ramp (gradual)

Status: ON TRACK
Estimated Completion: 10:00 PM EST

Live status: https://status.aurigraph.io
```

### Migration Complete

**Subject**: [Success] Aurigraph Multi-Cloud Migration Complete! 🎉

**Body**:
```
Great news! Our multi-cloud migration is complete.

RESULTS:
✓ Zero data loss
✓ 1 minute downtime (under 2-minute target)
✓ All systems operational
✓ Performance: 820K TPS (above 776K baseline)
✓ Latency: 75ms p95 (under 100ms target)

NEW CAPABILITIES:
- 99.99% uptime guarantee
- Global load balancing
- Faster response times
- Enhanced disaster recovery

WHAT'S NEXT:
- Continue monitoring for 24 hours
- Gradual traffic ramp to full capacity
- Decommission old infrastructure (7 days)

Thank you for your patience and support!

Best regards,
Aurigraph Engineering Team
```

---

## Appendix

### Contact List

| Role | Name | Email | Phone | On-Call |
|------|------|-------|-------|---------|
| Migration Lead | TBD | lead@aurigraph.io | +1-xxx-xxx-xxxx | Primary |
| DevOps Lead | TBD | devops@aurigraph.io | +1-xxx-xxx-xxxx | Secondary |
| Database Lead | TBD | dba@aurigraph.io | +1-xxx-xxx-xxxx | Tertiary |
| Network Lead | TBD | network@aurigraph.io | +1-xxx-xxx-xxxx | Backup |

### Key URLs

- Status Page: https://status.aurigraph.io
- Grafana Dashboards: https://metrics.aurigraph.io
- PagerDuty: https://aurigraph.pagerduty.com
- War Room: https://zoom.us/j/migration-war-room
- Documentation: https://docs.aurigraph.io/migration

### Escalation Path

1. On-Call Engineer (respond within 5 minutes)
2. Engineering Manager (respond within 15 minutes)
3. VP Engineering (respond within 30 minutes)
4. CTO (respond within 1 hour)

### Runbook Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-11-12 | Agent 4 | Initial runbook |

---

**END OF RUNBOOK**

**Remember**:
- Follow this runbook step-by-step
- Don't skip validation steps
- Document everything
- When in doubt, pause and assess
- Rollback is always an option
- User experience is priority #1
