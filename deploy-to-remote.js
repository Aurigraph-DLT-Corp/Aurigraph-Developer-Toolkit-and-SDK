#!/usr/bin/env node

/**
 * Aurigraph-DLT Deployment Agent
 * Autonomous CI/CD for Remote Server Deployment
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Configuration
const CONFIG = {
    remoteHost: process.env.REMOTE_HOST || 'dlt.aurigraph.io',
    remotePort: process.env.REMOTE_PORT || '22',
    remoteUser: process.env.REMOTE_USER || 'subbu',
    remoteDir: process.env.REMOTE_DIR || '~/Aurigraph-DLT'
};

console.log('\n' + '='.repeat(70));
console.log('🚀 AURIGRAPH-DLT DEPLOYMENT AGENT');
console.log('   Autonomous CI/CD Deployment System');
console.log('='.repeat(70) + '\n');

async function deploy() {
    try {
        console.log('📊 Deployment Configuration:');
        console.log(`   Host: ${CONFIG.remoteHost}`);
        console.log(`   Port: ${CONFIG.remotePort}`);
        console.log(`   User: ${CONFIG.remoteUser}`);
        console.log(`   Directory: ${CONFIG.remoteDir}\n`);

        // Step 1: Check git status
        console.log('🔍 Step 1: Checking local repository...');
        const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD');
        console.log(`   ✅ Current branch: ${branch.trim()}`);

        const { stdout: status } = await execAsync('git status --porcelain');
        if (status.trim()) {
            console.log('   ⚠️  Warning: Uncommitted changes detected');
        } else {
            console.log('   ✅ Repository clean');
        }

        // Step 2: Test SSH connection
        console.log('\n🔍 Step 2: Testing SSH connection...');
        try {
            const sshTest = await execAsync(
                `ssh -p ${CONFIG.remotePort} -o ConnectTimeout=10 -o BatchMode=yes ${CONFIG.remoteUser}@${CONFIG.remoteHost} "echo 'Connection successful'"`
            );
            console.log(`   ✅ SSH connection verified`);
        } catch (error) {
            console.log(`   ❌ SSH connection failed: ${error.message}`);
            console.log('\n⚠️  DEPLOYMENT BLOCKED: Cannot connect to remote server');
            console.log('\nPlease verify:');
            console.log(`   1. Server is accessible: ${CONFIG.remoteHost}`);
            console.log(`   2. SSH port is correct: ${CONFIG.remotePort}`);
            console.log(`   3. You have SSH access with current credentials`);
            console.log('\nTo test manually:');
            console.log(`   ssh -p ${CONFIG.remotePort} ${CONFIG.remoteUser}@${CONFIG.remoteHost}`);
            process.exit(1);
        }

        // Step 3: Deploy to remote
        console.log('\n🚀 Step 3: Deploying to remote server...');

        const deployCommand = `
            cd ${CONFIG.remoteDir} && \\
            echo "Pulling latest code..." && \\
            git pull origin main && \\
            echo "Updating Docker images..." && \\
            docker-compose pull && \\
            echo "Restarting services..." && \\
            docker-compose up -d && \\
            echo "Deployment complete!"
        `;

        console.log('   📦 Executing deployment commands...');

        const { stdout: deployOutput } = await execAsync(
            `ssh -p ${CONFIG.remotePort} ${CONFIG.remoteUser}@${CONFIG.remoteHost} "${deployCommand}"`
        );

        console.log('\n   Deployment Output:');
        console.log('   ' + deployOutput.replace(/\n/g, '\n   '));

        // Step 4: Health check
        console.log('\n🏥 Step 4: Performing health checks...');

        await sleep(10000); // Wait 10 seconds for services to start

        try {
            const healthCheck = await execAsync(
                `ssh -p ${CONFIG.remotePort} ${CONFIG.remoteUser}@${CONFIG.remoteHost} "docker ps --format '{{.Names}}\\t{{.Status}}'"`
            );
            console.log('\n   Container Status:');
            console.log('   ' + healthCheck.stdout.replace(/\n/g, '\n   '));
        } catch (error) {
            console.log('   ⚠️  Could not verify container status');
        }

        // Success!
        console.log('\n' + '='.repeat(70));
        console.log('✅ DEPLOYMENT SUCCESSFUL!');
        console.log('='.repeat(70) + '\n');

        console.log('📊 Next Steps:');
        console.log('   1. Verify deployment:');
        console.log(`      https://${CONFIG.remoteHost}/api/v11/health`);
        console.log('   2. Check logs:');
        console.log(`      ssh -p ${CONFIG.remotePort} ${CONFIG.remoteUser}@${CONFIG.remoteHost} "docker logs aurigraph-v11"`);
        console.log('   3. Monitor services:');
        console.log(`      ssh -p ${CONFIG.remotePort} ${CONFIG.remoteUser}@${CONFIG.remoteHost} "docker ps"`);

    } catch (error) {
        console.error('\n' + '='.repeat(70));
        console.error('❌ DEPLOYMENT FAILED');
        console.error('='.repeat(70));
        console.error(`\nError: ${error.message}\n`);
        process.exit(1);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Run deployment
deploy();
