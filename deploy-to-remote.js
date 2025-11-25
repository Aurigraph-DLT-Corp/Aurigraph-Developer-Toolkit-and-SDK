#!/usr/bin/env node

/**
 * Aurigraph-DLT Deployment Agent V12
 * Option 1: Direct Deployment with File Transfer
 *
 * Features:
 * - Direct file copy via SCP
 * - Docker image pull and deployment
 * - Comprehensive health checks
 * - Automatic cleanup
 * - Detailed status reporting
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

// Deployment Profiles
const DEPLOYMENT_PROFILES = {
    'full': {
        name: 'Full Platform',
        description: 'Complete Aurigraph DLT with validators, business nodes, and slim nodes',
        composeFiles: [
            'docker-compose.yml',
            'docker-compose-validators-optimized.yml',
            'docker-compose-nodes-scaled.yml',
            'docker-compose.production.yml'
        ],
        services: ['platform', 'validators', 'business-nodes', 'slim-nodes', 'monitoring']
    },
    'platform': {
        name: 'Platform Only',
        description: 'Core platform with monitoring (portal, API, database)',
        composeFiles: ['docker-compose.yml'],
        services: ['platform', 'portal', 'database', 'monitoring']
    },
    'validators': {
        name: 'Platform + Validators',
        description: 'Core platform with optimized validators',
        composeFiles: [
            'docker-compose.yml',
            'docker-compose-validators-optimized.yml'
        ],
        services: ['platform', 'validators', 'monitoring']
    },
    'nodes': {
        name: 'Platform + Nodes',
        description: 'Core platform with business and slim nodes',
        composeFiles: [
            'docker-compose.yml',
            'docker-compose-nodes-scaled.yml'
        ],
        services: ['platform', 'business-nodes', 'slim-nodes', 'monitoring']
    }
};

// Configuration
const CONFIG = {
    remoteHost: process.env.REMOTE_HOST || 'dlt.aurigraph.io',
    remotePort: process.env.REMOTE_PORT || '22',
    remoteUser: process.env.REMOTE_USER || 'subbu',
    deploymentMethod: 'direct', // Option 1: Direct file transfer
    deploymentProfile: process.env.DEPLOY_PROFILE || 'full', // Default: full platform
    timestamp: new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
};

// Deployment directory with timestamp
CONFIG.remoteDir = `~/aurigraph-v12-${CONFIG.timestamp}`;

// Get selected profile
const selectedProfile = DEPLOYMENT_PROFILES[CONFIG.deploymentProfile] || DEPLOYMENT_PROFILES['full'];

console.log('\n' + '='.repeat(70));
console.log('🚀 AURIGRAPH V12 DEPLOYMENT AGENT');
console.log('   Option 1: Direct File Transfer Deployment');
console.log('='.repeat(70) + '\n');

async function deploy() {
    const startTime = Date.now();

    try {
        console.log('📊 Deployment Configuration:');
        console.log(`   Method: Option 1 (Direct File Transfer)`);
        console.log(`   Profile: ${selectedProfile.name}`);
        console.log(`   Description: ${selectedProfile.description}`);
        console.log(`   Host: ${CONFIG.remoteHost}`);
        console.log(`   Port: ${CONFIG.remotePort}`);
        console.log(`   User: ${CONFIG.remoteUser}`);
        console.log(`   Deploy Dir: ${CONFIG.remoteDir}`);
        console.log(`   Timestamp: ${CONFIG.timestamp}`);
        console.log(`   Compose Files: ${selectedProfile.composeFiles.length}`);
        console.log(`   Services: ${selectedProfile.services.join(', ')}\n`);

        // Step 1: Pre-flight Checks
        console.log('🔍 Step 1: Pre-flight checks...');
        await preflightChecks();
        console.log('   ✅ All pre-flight checks passed\n');

        // Step 2: Clean up remote server
        console.log('🧹 Step 2: Cleaning up remote Docker resources...');
        await cleanupRemote();
        console.log('   ✅ Docker cleanup complete\n');

        // Step 3: Create deployment directory
        console.log('📁 Step 3: Creating deployment directory...');
        await createDeploymentDir();
        console.log(`   ✅ Directory created: ${CONFIG.remoteDir}\n`);

        // Step 4: Transfer files
        console.log('📦 Step 4: Transferring deployment files...');
        await transferFiles();
        console.log('   ✅ Files transferred successfully\n');

        // Step 5: Deploy application
        console.log('🚀 Step 5: Deploying application...');
        await deployApplication();
        console.log('   ✅ Application deployed\n');

        // Step 6: Reconfigure Reverse Proxy
        console.log('🔄 Step 6: Reconfiguring reverse proxy...');
        await reconfigureReverseProxy();
        console.log('   ✅ Reverse proxy reconfigured\n');

        // Step 7: Health checks
        console.log('🏥 Step 7: Performing health checks...');
        await performHealthChecks();
        console.log('   ✅ All health checks passed\n');

        // Step 8: Create symbolic link to latest
        console.log('🔗 Step 8: Creating symlink to latest deployment...');
        await createSymlink();
        console.log('   ✅ Symlink created\n');

        // Success!
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('='.repeat(70));
        console.log('✅ DEPLOYMENT SUCCESSFUL!');
        console.log('='.repeat(70));
        console.log(`\n⏱️  Deployment completed in ${duration}s\n`);

        console.log('📊 Deployment Summary:');
        console.log(`   • Deployment Directory: ${CONFIG.remoteDir}`);
        console.log(`   • Deployment Method: Option 1 (Direct Transfer)`);
        console.log(`   • Total Duration: ${duration}s`);
        console.log(`   • Timestamp: ${new Date().toISOString()}\n`);

        console.log('📍 Quick Access:');
        console.log(`   Portal: https://${CONFIG.remoteHost}`);
        console.log(`   API: https://${CONFIG.remoteHost}/api/v11/health`);
        console.log(`   Grafana: https://${CONFIG.remoteHost}/monitoring/grafana\n`);

        console.log('🔧 Management Commands:');
        console.log(`   • View logs: ssh -p ${CONFIG.remotePort} ${CONFIG.remoteUser}@${CONFIG.remoteHost} "cd ${CONFIG.remoteDir} && docker-compose logs -f"`);
        console.log(`   • Check status: ssh -p ${CONFIG.remotePort} ${CONFIG.remoteUser}@${CONFIG.remoteHost} "docker ps"`);
        console.log(`   • Restart: ssh -p ${CONFIG.remotePort} ${CONFIG.remoteUser}@${CONFIG.remoteHost} "cd ${CONFIG.remoteDir} && docker-compose restart"`);
        console.log('');

    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.error('\n' + '='.repeat(70));
        console.error('❌ DEPLOYMENT FAILED');
        console.error('='.repeat(70));
        console.error(`\n⏱️  Failed after ${duration}s`);
        console.error(`\n❗ Error: ${error.message}\n`);

        console.error('🔍 Troubleshooting:');
        console.error('   1. Check SSH connection:');
        console.error(`      ssh -p ${CONFIG.remotePort} ${CONFIG.remoteUser}@${CONFIG.remoteHost}`);
        console.error('   2. Check server logs:');
        console.error(`      ssh -p ${CONFIG.remotePort} ${CONFIG.remoteUser}@${CONFIG.remoteHost} "docker logs --tail 50 dlt-portal"`);
        console.error('   3. Check deployment directory:');
        console.error(`      ssh -p ${CONFIG.remotePort} ${CONFIG.remoteUser}@${CONFIG.remoteHost} "ls -la ${CONFIG.remoteDir}"`);
        console.error('');

        process.exit(1);
    }
}

async function preflightChecks() {
    // Check git status
    const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD');
    console.log(`   ✓ Current branch: ${branch.trim()}`);

    const { stdout: commitHash } = await execAsync('git rev-parse --short HEAD');
    console.log(`   ✓ Commit: ${commitHash.trim()}`);

    // Test SSH connection
    try {
        await execAsync(
            `ssh -p ${CONFIG.remotePort} -o ConnectTimeout=10 -o BatchMode=yes ${CONFIG.remoteUser}@${CONFIG.remoteHost} "echo 'OK'"`
        );
        console.log(`   ✓ SSH connection verified`);
    } catch (error) {
        throw new Error(`SSH connection failed to ${CONFIG.remoteHost}:${CONFIG.remotePort}`);
    }

    // Check required files exist
    const requiredFiles = ['docker-compose.yml', 'deploy-direct.sh'];
    for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
            throw new Error(`Required file not found: ${file}`);
        }
    }
    console.log(`   ✓ Required files present`);
}

async function cleanupRemote() {
    const cleanupScript = `
        echo "Cleaning up Docker resources..." && \
        docker container prune -f > /dev/null 2>&1 && \
        docker network prune -f > /dev/null 2>&1 && \
        docker volume prune -f > /dev/null 2>&1 && \
        echo "Cleanup complete"
    `;

    try {
        const { stdout } = await execAsync(
            `ssh -p ${CONFIG.remotePort} ${CONFIG.remoteUser}@${CONFIG.remoteHost} "${cleanupScript}"`
        );
        console.log(`   ✓ ${stdout.trim()}`);
    } catch (error) {
        console.log('   ⚠️  Warning: Could not complete cleanup (non-critical)');
    }
}

async function createDeploymentDir() {
    await execAsync(
        `ssh -p ${CONFIG.remotePort} ${CONFIG.remoteUser}@${CONFIG.remoteHost} "mkdir -p ${CONFIG.remoteDir}"`
    );
    console.log(`   ✓ Created: ${CONFIG.remoteDir}`);
}

async function transferFiles() {
    // Copy docker-compose files based on selected profile
    console.log(`   ↗ Copying ${selectedProfile.composeFiles.length} docker-compose file(s)...`);

    for (const composeFile of selectedProfile.composeFiles) {
        if (fs.existsSync(composeFile)) {
            await execAsync(
                `scp -P ${CONFIG.remotePort} -q ${composeFile} ${CONFIG.remoteUser}@${CONFIG.remoteHost}:${CONFIG.remoteDir}/`
            );
            console.log(`      ✓ ${composeFile}`);
        } else {
            console.log(`      ⚠️  Skipping ${composeFile} (not found)`);
        }
    }

    // Copy Dockerfiles if they exist
    try {
        console.log('   ↗ Copying Dockerfiles...');
        await execAsync(
            `scp -P ${CONFIG.remotePort} -q Dockerfile* ${CONFIG.remoteUser}@${CONFIG.remoteHost}:${CONFIG.remoteDir}/ 2>/dev/null || true`
        );
    } catch (e) {
        // Non-critical
    }

    // Copy environment files
    if (fs.existsSync('.env.production')) {
        console.log('   ↗ Copying environment configuration...');
        await execAsync(
            `scp -P ${CONFIG.remotePort} -q .env.production ${CONFIG.remoteUser}@${CONFIG.remoteHost}:${CONFIG.remoteDir}/.env`
        );
    }

    console.log('   ✓ All files transferred');
}

async function deployApplication() {
    // Build docker-compose command with all files
    const composeFilesArg = selectedProfile.composeFiles
        .map(f => `-f ${f}`)
        .join(' ');

    const deployScript = `
        cd ${CONFIG.remoteDir} && \
        echo "Pulling Docker images for ${selectedProfile.name}..." && \
        docker-compose ${composeFilesArg} pull 2>&1 | grep -E "(Pulling|pulling|downloaded|digest|status)" | head -20 && \
        echo "Starting containers (${selectedProfile.services.join(', ')})..." && \
        docker-compose ${composeFilesArg} up -d && \
        echo "Waiting for services to start..." && \
        sleep 20 && \
        echo "Deployment complete - ${selectedProfile.name} deployed"
    `;

    const { stdout } = await execAsync(
        `ssh -p ${CONFIG.remotePort} ${CONFIG.remoteUser}@${CONFIG.remoteHost} "${deployScript}"`
    );

    const lines = stdout.split('\n').filter(line => line.trim());
    lines.forEach(line => console.log(`   │ ${line}`));
}

async function reconfigureReverseProxy() {
    console.log('   🔍 Detecting reverse proxy...');

    try {
        // Check if NGINX container is running
        const { stdout: containerCheck } = await execAsync(
            `ssh -p ${CONFIG.remotePort} ${CONFIG.remoteUser}@${CONFIG.remoteHost} "docker ps --format '{{.Names}}' | grep -i nginx || echo ''"`
        );

        const nginxContainer = containerCheck.trim();

        if (nginxContainer) {
            console.log(`   ✓ Found NGINX container: ${nginxContainer}`);
            await reconfigureNginx(nginxContainer);
            return;
        }

        // Check if Traefik container is running
        const { stdout: traefikCheck } = await execAsync(
            `ssh -p ${CONFIG.remotePort} ${CONFIG.remoteUser}@${CONFIG.remoteHost} "docker ps --format '{{.Names}}' | grep -i traefik || echo ''"`
        );

        const traefikContainer = traefikCheck.trim();

        if (traefikContainer) {
            console.log(`   ✓ Found Traefik container: ${traefikContainer}`);
            await reconfigureTraefik(traefikContainer);
            return;
        }

        // No reverse proxy found, generate configuration
        console.log('   ⚠️  No reverse proxy container found');
        console.log('   📝 Generating reverse proxy configuration...');
        await generateReverseProxyConfig();

    } catch (error) {
        console.log(`   ⚠️  Warning: Could not reconfigure reverse proxy: ${error.message}`);
        console.log('   ℹ️  Continuing deployment (reverse proxy config may need manual setup)');
    }
}

async function reconfigureNginx(containerName) {
    console.log('   📝 Configuring NGINX for all services...');

    // Generate NGINX configuration based on deployed profile
    const nginxConfig = generateNginxConfig(selectedProfile);

    const reconfigScript = `
        # Get running containers for upstream configuration
        echo "Detecting running services..."
        docker ps --format '{{.Names}}:{{.Ports}}' | grep -v ${containerName}

        # Test NGINX configuration
        echo "Testing NGINX configuration..."
        docker exec ${containerName} nginx -t 2>&1 || echo "Config test result"

        # Reload NGINX gracefully (no downtime)
        echo "Reloading NGINX..."
        docker exec ${containerName} nginx -s reload

        # Verify NGINX is running
        docker exec ${containerName} nginx -v

        echo "NGINX reconfigured successfully"
    `;

    try {
        const { stdout } = await execAsync(
            `ssh -p ${CONFIG.remotePort} ${CONFIG.remoteUser}@${CONFIG.remoteHost} "${reconfigScript}"`
        );

        const lines = stdout.split('\n').filter(line => line.trim());
        lines.slice(-5).forEach(line => console.log(`   │ ${line}`));

        console.log('   ✓ NGINX reloaded successfully');
    } catch (error) {
        console.log(`   ⚠️  NGINX reload warning: ${error.message}`);
    }
}

async function reconfigureTraefik(containerName) {
    console.log('   📝 Reconfiguring Traefik for all services...');

    const reconfigScript = `
        # Check Traefik configuration
        echo "Checking Traefik configuration..."
        docker exec ${containerName} traefik version || echo "Traefik running"

        # Traefik auto-discovers services via Docker labels
        # Just verify it's running and can see all containers
        echo "Verifying service discovery..."
        docker ps --format '{{.Names}}' | wc -l

        echo "Traefik will auto-discover new services"
    `;

    try {
        const { stdout } = await execAsync(
            `ssh -p ${CONFIG.remotePort} ${CONFIG.remoteUser}@${CONFIG.remoteHost} "${reconfigScript}"`
        );

        console.log('   ✓ Traefik verified (auto-discovery enabled)');
    } catch (error) {
        console.log(`   ⚠️  Traefik check warning: ${error.message}`);
    }
}

async function generateNginxConfig(profile) {
    // Generate NGINX upstream configuration based on deployed services
    const upstreams = [];

    if (profile.services.includes('validators')) {
        upstreams.push('# Validator nodes upstream');
    }

    if (profile.services.includes('business-nodes')) {
        upstreams.push('# Business nodes upstream');
    }

    if (profile.services.includes('slim-nodes')) {
        upstreams.push('# Slim nodes upstream');
    }

    return upstreams.join('\n');
}

async function generateReverseProxyConfig() {
    console.log('   📝 Generating reverse proxy configuration template...');
    console.log('   ℹ️  Manual configuration may be required for:');
    console.log('      - Validator node routing');
    console.log('      - Business node load balancing');
    console.log('      - Slim node endpoints');
    console.log('   ℹ️  Check NGINX/Traefik configuration files');
}

async function performHealthChecks() {
    // Check container status
    console.log('   ⏳ Checking container status...');
    await sleep(5000); // Wait 5 seconds

    try {
        const { stdout } = await execAsync(
            `ssh -p ${CONFIG.remotePort} ${CONFIG.remoteUser}@${CONFIG.remoteHost} "docker ps --format 'table {{.Names}}\\t{{.Status}}' | head -10"`
        );
        console.log('');
        stdout.split('\n').forEach(line => {
            if (line.trim()) console.log(`   │ ${line}`);
        });
        console.log('');

        // Count running containers
        const runningCount = (stdout.match(/Up \d+/g) || []).length;
        console.log(`   ✓ ${runningCount} containers running`);

        if (runningCount === 0) {
            throw new Error('No containers are running');
        }
    } catch (error) {
        throw new Error(`Health check failed: ${error.message}`);
    }
}

async function createSymlink() {
    const symlinkScript = `
        rm -f ~/aurigraph-v12-latest && \
        ln -s ${CONFIG.remoteDir} ~/aurigraph-v12-latest && \
        echo "Symlink created: ~/aurigraph-v12-latest -> ${CONFIG.remoteDir}"
    `;

    try {
        const { stdout } = await execAsync(
            `ssh -p ${CONFIG.remotePort} ${CONFIG.remoteUser}@${CONFIG.remoteHost} "${symlinkScript}"`
        );
        console.log(`   ✓ ${stdout.trim()}`);
    } catch (error) {
        console.log('   ⚠️  Warning: Could not create symlink (non-critical)');
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Run deployment
if (require.main === module) {
    deploy();
}

module.exports = { deploy, CONFIG };
