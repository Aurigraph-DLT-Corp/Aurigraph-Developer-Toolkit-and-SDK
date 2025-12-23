#!/usr/bin/env node

/**
 * 🚀 Aurigraph AV10 to AV11 Migration Script
 * Migrates all JIRA references from AV10 project to AV11 project
 * Updates configuration files, scripts, and documentation
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
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

// Logging utilities
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.magenta}=== ${msg} ===${colors.reset}\n`)
};

// Migration mappings
const MIGRATION_MAPPINGS = {
  'AV10': 'AV11',
  'projects/AV10/boards/657': 'projects/AV11/boards/789',
  'projectKey: \'AV10\'': 'projectKey: \'AV11\'',
  'projectKey: "AV10"': 'projectKey: "AV11"',
  'PROJECT_KEY = \'AV10\'': 'PROJECT_KEY = \'AV11\'',
  'PROJECT_KEY = "AV10"': 'PROJECT_KEY = "AV11"',
  'projectKeyV10: \'AV10\'': 'projectKeyV10: \'AV10\' // Legacy reference',
  'Aurigraph V10': 'Aurigraph V11',
  'AV10 board': 'AV11 board',
  'AV10 project': 'AV11 project',
  'AV10-': 'AV11-', // This will update ticket references
  'board/657': 'board/789',
  'boards/657': 'boards/789'
};

// Files to exclude from migration
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.log',
  '.lock',
  'migrate-to-av11.js' // Don't modify this script itself
];

// File extensions to process
const INCLUDE_EXTENSIONS = [
  '.js', '.ts', '.json', '.md', '.env', '.sh', '.yml', '.yaml'
];

/**
 * Check if file should be processed
 */
function shouldProcessFile(filePath) {
  // Check exclude patterns
  for (const pattern of EXCLUDE_PATTERNS) {
    if (filePath.includes(pattern)) {
      return false;
    }
  }
  
  // Check file extension
  const ext = path.extname(filePath);
  return INCLUDE_EXTENSIONS.includes(ext);
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let changeCount = 0;
    
    // Apply all migration mappings
    for (const [oldValue, newValue] of Object.entries(MIGRATION_MAPPINGS)) {
      const regex = new RegExp(oldValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, newValue);
        modified = true;
        changeCount += matches.length;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      log.success(`Updated ${filePath} (${changeCount} changes)`);
      return changeCount;
    }
    
    return 0;
  } catch (error) {
    log.error(`Failed to process ${filePath}: ${error.message}`);
    return 0;
  }
}

/**
 * Recursively process directory
 */
function processDirectory(dirPath) {
  let totalChanges = 0;
  let filesProcessed = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        // Recursively process subdirectory
        const result = processDirectory(itemPath);
        totalChanges += result.changes;
        filesProcessed += result.files;
      } else if (stats.isFile() && shouldProcessFile(itemPath)) {
        const changes = processFile(itemPath);
        totalChanges += changes;
        filesProcessed++;
      }
    }
  } catch (error) {
    log.error(`Failed to process directory ${dirPath}: ${error.message}`);
  }
  
  return { changes: totalChanges, files: filesProcessed };
}

/**
 * Main migration function
 */
async function migrateToAV11() {
  log.header('🚀 Aurigraph AV10 to AV11 Migration');
  log.info('Starting migration of JIRA references from AV10 to AV11...');
  
  const startTime = Date.now();
  const rootDir = process.cwd();
  
  log.info(`Processing directory: ${rootDir}`);
  log.info(`File types: ${INCLUDE_EXTENSIONS.join(', ')}`);
  log.info(`Excluding: ${EXCLUDE_PATTERNS.join(', ')}`);
  
  const result = processDirectory(rootDir);
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  log.header('📊 Migration Summary');
  log.success(`Files processed: ${result.files}`);
  log.success(`Total changes made: ${result.changes}`);
  log.success(`Duration: ${duration} seconds`);
  
  if (result.changes > 0) {
    log.header('✅ Migration Completed Successfully!');
    log.info('All JIRA references have been updated from AV10 to AV11');
    log.info('New JIRA Board: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789');
    log.warning('Please review the changes and test the updated configuration');
  } else {
    log.warning('No changes were made - all references may already be updated');
  }
}

// Run migration if script is executed directly
if (require.main === module) {
  migrateToAV11().catch(error => {
    log.error(`Migration failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { migrateToAV11 };
