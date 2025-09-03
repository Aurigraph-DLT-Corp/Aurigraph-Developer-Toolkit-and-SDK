#!/usr/bin/env node

/**
 * 🛠️ Aurigraph-DLT Development Utilities
 * Comprehensive development tools and helpers for quantum blockchain development
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Logging utilities
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.magenta}=== ${msg} ===${colors.reset}\n`)
};

// Development utilities class
class DevUtils {
  constructor() {
    this.projectRoot = process.cwd();
    this.av10Path = path.join(this.projectRoot, 'aurigraph-av10-7');
    this.uiPath = path.join(this.av10Path, 'ui');
    this.v9Path = path.join(this.projectRoot, 'aurigraph-v9');
  }

  // Check if a directory exists
  dirExists(dirPath) {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  }

  // Execute command with error handling
  exec(command, options = {}) {
    try {
      const result = execSync(command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        ...options 
      });
      return result.trim();
    } catch (error) {
      log.error(`Command failed: ${command}`);
      log.error(error.message);
      return null;
    }
  }

  // Start development servers
  async startDev() {
    log.header('Starting Development Environment');
    
    const processes = [];
    
    // Start AV10-7 backend
    if (this.dirExists(this.av10Path)) {
      log.info('Starting AV10-7 Quantum Nexus backend...');
      const av10Process = spawn('npm', ['run', 'dev'], {
        cwd: this.av10Path,
        stdio: 'inherit',
        shell: true
      });
      processes.push({ name: 'AV10-7 Backend', process: av10Process });
    }
    
    // Start UI development server
    if (this.dirExists(this.uiPath)) {
      log.info('Starting UI development server...');
      const uiProcess = spawn('npm', ['run', 'dev'], {
        cwd: this.uiPath,
        stdio: 'inherit',
        shell: true
      });
      processes.push({ name: 'UI Frontend', process: uiProcess });
    }
    
    // Handle process cleanup
    process.on('SIGINT', () => {
      log.info('Shutting down development servers...');
      processes.forEach(({ name, process }) => {
        log.info(`Stopping ${name}...`);
        process.kill('SIGTERM');
      });
      process.exit(0);
    });
    
    log.success('Development environment started!');
    log.info('Press Ctrl+C to stop all servers');
    
    // Keep the process alive
    await new Promise(() => {});
  }

  // Run comprehensive tests
  runTests() {
    log.header('Running Comprehensive Test Suite');
    
    if (!this.dirExists(this.av10Path)) {
      log.error('AV10-7 directory not found');
      return;
    }
    
    const testCommands = [
      { name: 'Unit Tests', cmd: 'npm run test:unit' },
      { name: 'Integration Tests', cmd: 'npm run test:integration' },
      { name: 'Smoke Tests', cmd: 'npm run test:smoke' },
      { name: 'Security Tests', cmd: 'npm run test:security' }
    ];
    
    let allPassed = true;
    
    testCommands.forEach(({ name, cmd }) => {
      log.info(`Running ${name}...`);
      const result = this.exec(cmd, { cwd: this.av10Path });
      
      if (result === null) {
        log.error(`${name} failed`);
        allPassed = false;
      } else {
        log.success(`${name} passed`);
      }
    });
    
    if (allPassed) {
      log.success('All tests passed! 🎉');
    } else {
      log.error('Some tests failed. Please check the output above.');
    }
  }

  // Build all projects
  buildAll() {
    log.header('Building All Projects');
    
    const buildTargets = [
      { name: 'AV10-7 Backend', path: this.av10Path, cmd: 'npm run build' },
      { name: 'UI Frontend', path: this.uiPath, cmd: 'npm run build' }
    ];
    
    buildTargets.forEach(({ name, path, cmd }) => {
      if (this.dirExists(path)) {
        log.info(`Building ${name}...`);
        const result = this.exec(cmd, { cwd: path });
        
        if (result === null) {
          log.error(`${name} build failed`);
        } else {
          log.success(`${name} built successfully`);
        }
      } else {
        log.warning(`${name} directory not found, skipping...`);
      }
    });
  }

  // Lint all code
  lintAll() {
    log.header('Linting All Code');
    
    const lintTargets = [
      { name: 'AV10-7 Backend', path: this.av10Path },
      { name: 'UI Frontend', path: this.uiPath },
      { name: 'V9 Backend', path: this.v9Path }
    ];
    
    lintTargets.forEach(({ name, path }) => {
      if (this.dirExists(path)) {
        log.info(`Linting ${name}...`);
        const result = this.exec('npm run lint', { cwd: path });
        
        if (result === null) {
          log.error(`${name} linting failed`);
        } else {
          log.success(`${name} linting passed`);
        }
      }
    });
  }

  // Format all code
  formatAll() {
    log.header('Formatting All Code');
    
    const formatTargets = [
      { name: 'AV10-7 Backend', path: this.av10Path },
      { name: 'UI Frontend', path: this.uiPath },
      { name: 'V9 Backend', path: this.v9Path }
    ];
    
    formatTargets.forEach(({ name, path }) => {
      if (this.dirExists(path)) {
        log.info(`Formatting ${name}...`);
        const result = this.exec('npm run format', { cwd: path });
        
        if (result === null) {
          log.warning(`${name} formatting command not found or failed`);
        } else {
          log.success(`${name} formatted successfully`);
        }
      }
    });
  }

  // Clean all build artifacts
  cleanAll() {
    log.header('Cleaning Build Artifacts');
    
    const cleanTargets = [
      { name: 'Node Modules', paths: ['node_modules', 'aurigraph-av10-7/node_modules', 'aurigraph-av10-7/ui/node_modules', 'aurigraph-v9/node_modules'] },
      { name: 'Build Outputs', paths: ['aurigraph-av10-7/dist', 'aurigraph-av10-7/ui/.next', 'aurigraph-v9/dist'] },
      { name: 'Logs', paths: ['aurigraph-av10-7/logs', 'aurigraph-v9/logs'] },
      { name: 'Coverage Reports', paths: ['aurigraph-av10-7/coverage', 'aurigraph-v9/coverage'] }
    ];
    
    cleanTargets.forEach(({ name, paths }) => {
      log.info(`Cleaning ${name}...`);
      paths.forEach(relativePath => {
        const fullPath = path.join(this.projectRoot, relativePath);
        if (fs.existsSync(fullPath)) {
          try {
            if (process.platform === 'win32') {
              this.exec(`rmdir /s /q "${fullPath}"`);
            } else {
              this.exec(`rm -rf "${fullPath}"`);
            }
            log.success(`Removed ${relativePath}`);
          } catch (error) {
            log.warning(`Failed to remove ${relativePath}: ${error.message}`);
          }
        }
      });
    });
  }

  // Install all dependencies
  installAll() {
    log.header('Installing All Dependencies');
    
    const installTargets = [
      { name: 'Root', path: this.projectRoot },
      { name: 'AV10-7 Backend', path: this.av10Path },
      { name: 'UI Frontend', path: this.uiPath },
      { name: 'V9 Backend', path: this.v9Path }
    ];
    
    installTargets.forEach(({ name, path }) => {
      if (this.dirExists(path) && fs.existsSync(path + '/package.json')) {
        log.info(`Installing ${name} dependencies...`);
        const result = this.exec('npm install', { cwd: path });
        
        if (result === null) {
          log.error(`${name} dependency installation failed`);
        } else {
          log.success(`${name} dependencies installed`);
        }
      }
    });
  }

  // Show project status
  showStatus() {
    log.header('Project Status');
    
    // Check Node.js version
    const nodeVersion = this.exec('node --version');
    log.info(`Node.js: ${nodeVersion}`);
    
    // Check npm version
    const npmVersion = this.exec('npm --version');
    log.info(`npm: ${npmVersion}`);
    
    // Check Git status
    const gitBranch = this.exec('git branch --show-current');
    log.info(`Git branch: ${gitBranch}`);
    
    // Check project structure
    const projects = [
      { name: 'AV10-7 Backend', path: this.av10Path },
      { name: 'UI Frontend', path: this.uiPath },
      { name: 'V9 Backend', path: this.v9Path }
    ];
    
    log.info('\nProject Structure:');
    projects.forEach(({ name, path }) => {
      const exists = this.dirExists(path);
      const status = exists ? '✅' : '❌';
      console.log(`  ${status} ${name}: ${exists ? 'Found' : 'Not found'}`);
    });
    
    // Check running processes
    log.info('\nDevelopment servers can be started with: npm run dev-utils start');
  }

  // Show help
  showHelp() {
    console.log(`
${colors.cyan}🛠️  Aurigraph-DLT Development Utilities${colors.reset}

${colors.bright}Usage:${colors.reset}
  node dev-utils.js <command>

${colors.bright}Commands:${colors.reset}
  ${colors.green}start${colors.reset}     Start all development servers
  ${colors.green}test${colors.reset}      Run comprehensive test suite
  ${colors.green}build${colors.reset}     Build all projects
  ${colors.green}lint${colors.reset}      Lint all code
  ${colors.green}format${colors.reset}    Format all code
  ${colors.green}clean${colors.reset}     Clean all build artifacts
  ${colors.green}install${colors.reset}   Install all dependencies
  ${colors.green}status${colors.reset}    Show project status
  ${colors.green}help${colors.reset}      Show this help message

${colors.bright}Examples:${colors.reset}
  node dev-utils.js start    # Start development environment
  node dev-utils.js test     # Run all tests
  node dev-utils.js clean    # Clean and reinstall everything

${colors.bright}Development URLs:${colors.reset}
  🚀 AV10-7 Quantum Nexus: http://localhost:8081
  🎨 UI Dashboard: http://localhost:3000
  📊 Monitoring: http://localhost:9090
    `);
  }
}

// Main execution
async function main() {
  const devUtils = new DevUtils();
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      await devUtils.startDev();
      break;
    case 'test':
      devUtils.runTests();
      break;
    case 'build':
      devUtils.buildAll();
      break;
    case 'lint':
      devUtils.lintAll();
      break;
    case 'format':
      devUtils.formatAll();
      break;
    case 'clean':
      devUtils.cleanAll();
      break;
    case 'install':
      devUtils.installAll();
      break;
    case 'status':
      devUtils.showStatus();
      break;
    case 'help':
    case '--help':
    case '-h':
      devUtils.showHelp();
      break;
    default:
      if (command) {
        log.error(`Unknown command: ${command}`);
      }
      devUtils.showHelp();
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = DevUtils;
