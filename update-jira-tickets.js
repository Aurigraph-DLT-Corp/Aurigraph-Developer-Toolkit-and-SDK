#!/usr/bin/env node

/**
 * 🎫 JIRA Ticket Update Script
 * Script to help update RWAT-COMPOUND ticket descriptions with detailed specifications
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

// JIRA ticket information
const tickets = [
  {
    key: 'AV10-38',
    title: 'RWAT-COMPOUND-001: Core Compound Token Engine',
    priority: 'Critical',
    storyPoints: 8,
    component: 'Compound-Tokens'
  },
  {
    key: 'AV10-39',
    title: 'RWAT-COMPOUND-002: AI-Powered Portfolio Optimization Engine',
    priority: 'Critical',
    storyPoints: 13,
    component: 'Compound-Tokens'
  },
  {
    key: 'AV10-40',
    title: 'RWAT-COMPOUND-003: Consciousness-Aware Asset Selection System',
    priority: 'High',
    storyPoints: 8,
    component: 'Compound-Tokens'
  },
  {
    key: 'AV10-41',
    title: 'RWAT-COMPOUND-004: Automated Rebalancing with Quantum Analytics',
    priority: 'High',
    storyPoints: 8,
    component: 'Compound-Tokens'
  },
  {
    key: 'AV10-42',
    title: 'RWAT-COMPOUND-005: Cross-Chain Portfolio Integration',
    priority: 'Medium',
    storyPoints: 5,
    component: 'Compound-Tokens'
  },
  {
    key: 'AV10-43',
    title: 'RWAT-COMPOUND-006: Portfolio Performance Analytics Dashboard',
    priority: 'Medium',
    storyPoints: 5,
    component: 'Compound-Tokens'
  },
  {
    key: 'AV10-44',
    title: 'RWAT-COMPOUND-007: Quantum-Secured Portfolio Management',
    priority: 'High',
    storyPoints: 3,
    component: 'Compound-Tokens'
  }
];

// JIRA configuration from environment
const jiraConfig = {
  baseUrl: process.env.JIRA_BASE_URL || 'https://aurigraphdlt.atlassian.net',
  projectKey: process.env.JIRA_PROJECT_KEY || 'AV10',
  email: process.env.JIRA_EMAIL || 'subbu@aurigraph.io',
  apiKey: process.env.JIRA_API_KEY,
  boardUrl: process.env.JIRA_BOARD_URL || 'https://aurigraphdlt.atlassian.net/jira/software/projects/AV10/boards/657'
};

class JiraTicketUpdater {
  constructor() {
    this.descriptionsFile = path.join(__dirname, 'RWAT-COMPOUND-Detailed-Descriptions.md');
  }

  // Display ticket information
  displayTicketInfo() {
    log.header('RWAT-COMPOUND Tickets Overview');
    
    console.log(`${colors.cyan}Epic:${colors.reset} AV10-37 - RWAT-COMPOUND: Quantum-Enhanced Compound Token Portfolio System`);
    console.log(`${colors.cyan}Board:${colors.reset} ${jiraConfig.boardUrl}\n`);
    
    console.log(`${colors.bright}Implementation Tickets:${colors.reset}`);
    tickets.forEach((ticket, index) => {
      const priorityColor = ticket.priority === 'Critical' ? colors.red : 
                           ticket.priority === 'High' ? colors.yellow : colors.green;
      console.log(`${index + 1}. ${colors.cyan}${ticket.key}${colors.reset}: ${ticket.title}`);
      console.log(`   Priority: ${priorityColor}${ticket.priority}${colors.reset} | Story Points: ${colors.blue}${ticket.storyPoints}${colors.reset} | Component: ${ticket.component}`);
    });
  }

  // Display manual update instructions
  displayManualInstructions() {
    log.header('Manual Update Instructions');
    
    log.info('Follow these steps to update all JIRA tickets:');
    console.log(`
${colors.bright}Step 1: Access JIRA Board${colors.reset}
   Open: ${colors.cyan}${jiraConfig.boardUrl}${colors.reset}

${colors.bright}Step 2: Update Each Ticket${colors.reset}
   For each ticket (AV10-38 through AV10-44):
   1. Click on the ticket in JIRA
   2. Click "Edit" or the description field
   3. Copy the detailed description from: ${colors.yellow}RWAT-COMPOUND-Detailed-Descriptions.md${colors.reset}
   4. Paste into the JIRA description field
   5. Save the changes

${colors.bright}Step 3: Set Additional Properties${colors.reset}
   For each ticket, also update:
   • Priority: Set as specified in the description
   • Story Points: Add the estimated story points
   • Labels: Add "rwa", "av10-7", "quantum-blockchain", "compound-tokens", "consciousness-aware"
   • Epic Link: Link to AV10-37 if not already linked

${colors.bright}Step 4: Verify Updates${colors.reset}
   • Ensure all tickets have comprehensive descriptions
   • Verify dependencies are documented
   • Check that acceptance criteria are clear and testable
   • Confirm integration points are specified
    `);
  }

  // Display ticket summary
  displaySummary() {
    log.header('RWAT-COMPOUND Epic Summary');
    
    const totalStoryPoints = tickets.reduce((sum, ticket) => sum + ticket.storyPoints, 0);
    const criticalTickets = tickets.filter(t => t.priority === 'Critical').length;
    const highTickets = tickets.filter(t => t.priority === 'High').length;
    const mediumTickets = tickets.filter(t => t.priority === 'Medium').length;
    
    console.log(`${colors.bright}Epic Statistics:${colors.reset}`);
    console.log(`• Total Tickets: ${colors.cyan}${tickets.length}${colors.reset}`);
    console.log(`• Total Story Points: ${colors.cyan}${totalStoryPoints}${colors.reset}`);
    console.log(`• Estimated Duration: ${colors.cyan}8-10 weeks${colors.reset}`);
    console.log(`• Team Size: ${colors.cyan}4-6 developers${colors.reset}`);
    
    console.log(`\n${colors.bright}Priority Breakdown:${colors.reset}`);
    console.log(`• Critical: ${colors.red}${criticalTickets} tickets${colors.reset}`);
    console.log(`• High: ${colors.yellow}${highTickets} tickets${colors.reset}`);
    console.log(`• Medium: ${colors.green}${mediumTickets} tickets${colors.reset}`);
    
    console.log(`\n${colors.bright}Revolutionary Features:${colors.reset}`);
    console.log(`• ${colors.green}✅${colors.reset} Consciousness-aware asset selection with welfare monitoring`);
    console.log(`• ${colors.green}✅${colors.reset} Parallel universe processing for portfolio optimization`);
    console.log(`• ${colors.green}✅${colors.reset} Autonomous rebalancing with quantum analytics`);
    console.log(`• ${colors.green}✅${colors.reset} Cross-chain integration supporting 100+ networks`);
    console.log(`• ${colors.green}✅${colors.reset} Quantum Security Level 6 for all operations`);
  }

  // Check if descriptions file exists
  checkDescriptionsFile() {
    if (!fs.existsSync(this.descriptionsFile)) {
      log.error(`Descriptions file not found: ${this.descriptionsFile}`);
      log.info('Please ensure RWAT-COMPOUND-Detailed-Descriptions.md exists in the current directory');
      return false;
    }
    log.success(`Descriptions file found: ${this.descriptionsFile}`);
    return true;
  }

  // Display help information
  showHelp() {
    console.log(`
${colors.cyan}🎫 JIRA Ticket Update Script${colors.reset}

${colors.bright}Usage:${colors.reset}
  node update-jira-tickets.js <command>

${colors.bright}Commands:${colors.reset}
  ${colors.green}info${colors.reset}         Show ticket information and overview
  ${colors.green}instructions${colors.reset} Display manual update instructions
  ${colors.green}summary${colors.reset}      Show epic summary and statistics
  ${colors.green}check${colors.reset}        Check if descriptions file exists
  ${colors.green}help${colors.reset}         Show this help message

${colors.bright}Examples:${colors.reset}
  node update-jira-tickets.js info          # Show ticket overview
  node update-jira-tickets.js instructions  # Show update instructions
  node update-jira-tickets.js summary       # Show epic summary

${colors.bright}Files:${colors.reset}
  📋 RWAT-COMPOUND-Detailed-Descriptions.md - Contains all detailed ticket descriptions
  🔧 update-jira-tickets.js - This script
  🌐 JIRA Board: ${jiraConfig.boardUrl}

${colors.bright}Environment Variables:${colors.reset}
  JIRA_BASE_URL    - JIRA instance URL
  JIRA_PROJECT_KEY - Project key (AV10)
  JIRA_EMAIL       - Your JIRA email
  JIRA_API_KEY     - Your JIRA API key
    `);
  }

  // Main execution
  run(command) {
    switch (command) {
      case 'info':
        this.displayTicketInfo();
        break;
      case 'instructions':
        this.displayManualInstructions();
        break;
      case 'summary':
        this.displaySummary();
        break;
      case 'check':
        this.checkDescriptionsFile();
        break;
      case 'help':
      case '--help':
      case '-h':
        this.showHelp();
        break;
      default:
        if (command) {
          log.error(`Unknown command: ${command}`);
        }
        this.showHelp();
        process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const updater = new JiraTicketUpdater();
  const command = process.argv[2];
  
  try {
    updater.run(command);
  } catch (error) {
    log.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = JiraTicketUpdater;
