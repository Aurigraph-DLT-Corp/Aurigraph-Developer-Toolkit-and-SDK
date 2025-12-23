#!/usr/bin/env node

/**
 * GitHub MCP Test Script for Aurigraph-DLT
 * Tests the GitHub MCP server configuration and connectivity
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function checkFileExists(filePath) {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadEnvFile(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && !key.startsWith('#')) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    });
    return env;
  } catch (error) {
    return null;
  }
}

async function testMCPServer() {
  return new Promise((resolve) => {
    const serverPath = path.join(__dirname, '..', 'node_modules', '@modelcontextprotocol', 'server-github', 'dist', 'index.js');
    
    const child = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, GITHUB_PERSONAL_ACCESS_TOKEN: 'test-token' }
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Send a test message to the server
    setTimeout(() => {
      child.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0'
          }
        }
      }) + '\n');
    }, 1000);

    setTimeout(() => {
      child.kill();
      resolve({
        success: !child.killed,
        output,
        errorOutput
      });
    }, 3000);
  });
}

async function main() {
  log('🚀 Testing GitHub MCP Configuration for Aurigraph-DLT', 'cyan');
  log('=' .repeat(60), 'cyan');

  // Test 1: Check if configuration files exist
  logInfo('Test 1: Checking configuration files...');
  
  const configExists = await checkFileExists('.mcp/config.json');
  const envExists = await checkFileExists('.env.mcp');
  const readmeExists = await checkFileExists('.mcp/README.md');
  
  if (configExists) {
    logSuccess('MCP config.json found');
  } else {
    logError('MCP config.json not found');
  }
  
  if (envExists) {
    logSuccess('.env.mcp template found');
  } else {
    logError('.env.mcp template not found');
  }
  
  if (readmeExists) {
    logSuccess('MCP README.md found');
  } else {
    logWarning('MCP README.md not found');
  }

  // Test 2: Check environment configuration
  logInfo('Test 2: Checking environment configuration...');
  
  const env = await loadEnvFile('.env.mcp');
  if (env) {
    if (env.GITHUB_PERSONAL_ACCESS_TOKEN && env.GITHUB_PERSONAL_ACCESS_TOKEN !== 'your_github_token_here') {
      logSuccess('GitHub token configured');
    } else {
      logWarning('GitHub token not configured (using placeholder)');
    }
  } else {
    logError('Could not load .env.mcp file');
  }

  // Test 3: Check if GitHub MCP server is installed
  logInfo('Test 3: Checking GitHub MCP server installation...');
  
  const serverPath = path.join(__dirname, '..', 'node_modules', '@modelcontextprotocol', 'server-github', 'dist', 'index.js');
  const serverExists = await checkFileExists(serverPath);
  
  if (serverExists) {
    logSuccess('GitHub MCP server installed');
  } else {
    logError('GitHub MCP server not found');
    logInfo('Run: npm install @modelcontextprotocol/server-github');
  }

  // Test 4: Test MCP server startup
  if (serverExists) {
    logInfo('Test 4: Testing MCP server startup...');
    
    const serverTest = await testMCPServer();
    if (serverTest.success) {
      logSuccess('MCP server starts successfully');
    } else {
      logError('MCP server failed to start');
      if (serverTest.errorOutput) {
        log(`Error output: ${serverTest.errorOutput}`, 'red');
      }
    }
  }

  // Test 5: Check package.json scripts
  logInfo('Test 5: Checking package.json scripts...');
  
  try {
    const packageJson = JSON.parse(await fs.promises.readFile('package.json', 'utf8'));
    if (packageJson.scripts && packageJson.scripts['mcp:github']) {
      logSuccess('MCP scripts configured in package.json');
    } else {
      logWarning('MCP scripts not found in package.json');
    }
  } catch (error) {
    logError('Could not read package.json');
  }

  log('=' .repeat(60), 'cyan');
  log('🏁 GitHub MCP Test Complete', 'cyan');
  
  logInfo('Next steps:');
  log('1. Set your GitHub Personal Access Token in .env.mcp', 'yellow');
  log('2. Test with: npm run mcp:github', 'yellow');
  log('3. Configure your AI assistant to use the MCP server', 'yellow');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
