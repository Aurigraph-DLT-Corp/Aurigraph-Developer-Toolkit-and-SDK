#!/usr/bin/env node

/**
 * JIRA Bulk Operations Manager
 * Advanced bulk operations for JIRA project management
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

class JiraBulkManager {
  constructor() {
    this.baseUrl = process.env.JIRA_BASE_URL;
    this.email = process.env.JIRA_EMAIL;
    this.apiToken = process.env.JIRA_API_TOKEN;
    this.projectKey = process.env.JIRA_PROJECT_KEY;
    this.auth = Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');
    this.dryRun = false;
    this.results = {
      created: [],
      updated: [],
      errors: [],
      skipped: []
    };
  }

  async makeRequest(method, endpoint, data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.baseUrl}/rest/api/3${endpoint}`);
      
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = responseData ? JSON.parse(responseData) : {};
            resolve({
              statusCode: res.statusCode,
              data: parsedData,
              headers: res.headers
            });
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              data: responseData,
              headers: res.headers
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  async createFromData(dataFile, projectKey) {
    console.log(`📊 Creating tickets from data file: ${dataFile}`);
    
    if (!fs.existsSync(dataFile)) {
      throw new Error(`Data file not found: ${dataFile}`);
    }

    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const tickets = Array.isArray(data) ? data : data.tickets || [];

    console.log(`Found ${tickets.length} tickets to create`);

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      console.log(`\nProcessing ticket ${i + 1}/${tickets.length}: ${ticket.summary}`);

      try {
        const issueData = {
          fields: {
            project: { key: projectKey },
            issuetype: { name: ticket.issueType || 'Task' },
            summary: ticket.summary,
            description: this.formatDescription(ticket.description),
            priority: ticket.priority ? { name: ticket.priority } : { name: 'Medium' },
            labels: ticket.labels || ['bulk-created'],
            ...ticket.customFields || {}
          }
        };

        // Add assignee if specified
        if (ticket.assignee) {
          issueData.fields.assignee = { emailAddress: ticket.assignee };
        }

        // Add components if specified
        if (ticket.components) {
          issueData.fields.components = ticket.components.map(c => ({ name: c }));
        }

        if (this.dryRun) {
          console.log(`[DRY RUN] Would create: ${ticket.summary}`);
          this.results.created.push({ summary: ticket.summary, key: 'DRY-RUN' });
        } else {
          const response = await this.makeRequest('POST', '/issue', issueData);
          
          if (response.statusCode === 201) {
            console.log(`✅ Created: ${response.data.key} - ${ticket.summary}`);
            this.results.created.push({
              key: response.data.key,
              summary: ticket.summary,
              url: `${this.baseUrl}/browse/${response.data.key}`
            });
          } else {
            console.error(`❌ Failed to create: ${ticket.summary} (${response.statusCode})`);
            this.results.errors.push({
              ticket: ticket.summary,
              error: response.data,
              statusCode: response.statusCode
            });
          }
        }

        // Rate limiting
        await this.sleep(500);
      } catch (error) {
        console.error(`❌ Error creating ticket: ${error.message}`);
        this.results.errors.push({
          ticket: ticket.summary,
          error: error.message
        });
      }
    }
  }

  async updateAllTickets(ticketsFile, projectKey) {
    console.log(`🔄 Updating all tickets from: ${ticketsFile}`);
    
    const ticketsData = JSON.parse(fs.readFileSync(ticketsFile, 'utf8'));
    const tickets = ticketsData.issues || [];

    console.log(`Found ${tickets.length} tickets to update`);

    for (const ticket of tickets) {
      try {
        console.log(`\nUpdating ticket: ${ticket.key}`);

        const updateData = {
          update: {
            labels: [{ add: 'github-managed' }],
            description: [{
              set: {
                type: "doc",
                version: 1,
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: `${ticket.fields.description || ''}\n\n---\n🤖 Updated by GitHub Actions on ${new Date().toISOString()}`
                      }
                    ]
                  }
                ]
              }
            }]
          }
        };

        if (this.dryRun) {
          console.log(`[DRY RUN] Would update: ${ticket.key}`);
          this.results.updated.push({ key: ticket.key, summary: ticket.fields.summary });
        } else {
          const response = await this.makeRequest('PUT', `/issue/${ticket.key}`, updateData);
          
          if (response.statusCode === 204) {
            console.log(`✅ Updated: ${ticket.key}`);
            this.results.updated.push({
              key: ticket.key,
              summary: ticket.fields.summary,
              url: `${this.baseUrl}/browse/${ticket.key}`
            });
          } else {
            console.error(`❌ Failed to update: ${ticket.key} (${response.statusCode})`);
            this.results.errors.push({
              ticket: ticket.key,
              error: response.data,
              statusCode: response.statusCode
            });
          }
        }

        await this.sleep(300);
      } catch (error) {
        console.error(`❌ Error updating ticket ${ticket.key}: ${error.message}`);
        this.results.errors.push({
          ticket: ticket.key,
          error: error.message
        });
      }
    }
  }

  async syncGitHubIssues(githubIssuesFile, projectKey) {
    console.log(`🔄 Syncing GitHub issues from: ${githubIssuesFile}`);
    
    const githubIssues = JSON.parse(fs.readFileSync(githubIssuesFile, 'utf8'));
    
    console.log(`Found ${githubIssues.length} GitHub issues to sync`);

    for (const issue of githubIssues) {
      try {
        console.log(`\nSyncing GitHub issue #${issue.number}: ${issue.title}`);

        // Check if JIRA issue already exists
        const searchResponse = await this.makeRequest('GET', 
          `/search?jql=project=${projectKey} AND summary~"${issue.title.replace(/"/g, '\\"')}"`);
        
        if (searchResponse.data.issues && searchResponse.data.issues.length > 0) {
          console.log(`⚠️ Issue already exists in JIRA: ${searchResponse.data.issues[0].key}`);
          this.results.skipped.push({
            github: issue.number,
            jira: searchResponse.data.issues[0].key,
            reason: 'Already exists'
          });
          continue;
        }

        const issueData = {
          fields: {
            project: { key: projectKey },
            issuetype: { name: 'Task' },
            summary: `[GitHub #${issue.number}] ${issue.title}`,
            description: this.formatDescription(`
**GitHub Issue**: ${issue.html_url}
**Created by**: ${issue.user.login}
**State**: ${issue.state}
**Labels**: ${issue.labels.map(l => l.name).join(', ')}

**Description**:
${issue.body || 'No description provided'}

---
*Synced from GitHub Issue #${issue.number}*
            `),
            labels: ['github-sync', `github-${issue.number}`],
            priority: { name: issue.labels.some(l => l.name.includes('urgent')) ? 'High' : 'Medium' }
          }
        };

        if (this.dryRun) {
          console.log(`[DRY RUN] Would create JIRA issue for GitHub #${issue.number}`);
          this.results.created.push({ 
            github: issue.number, 
            summary: issue.title,
            key: 'DRY-RUN'
          });
        } else {
          const response = await this.makeRequest('POST', '/issue', issueData);
          
          if (response.statusCode === 201) {
            console.log(`✅ Created JIRA issue: ${response.data.key} for GitHub #${issue.number}`);
            this.results.created.push({
              github: issue.number,
              jira: response.data.key,
              summary: issue.title,
              url: `${this.baseUrl}/browse/${response.data.key}`
            });
          } else {
            console.error(`❌ Failed to create JIRA issue for GitHub #${issue.number}`);
            this.results.errors.push({
              github: issue.number,
              error: response.data,
              statusCode: response.statusCode
            });
          }
        }

        await this.sleep(500);
      } catch (error) {
        console.error(`❌ Error syncing GitHub issue #${issue.number}: ${error.message}`);
        this.results.errors.push({
          github: issue.number,
          error: error.message
        });
      }
    }
  }

  async bulkTransition(ticketsFile, targetStatus) {
    console.log(`🔄 Bulk transitioning tickets to: ${targetStatus}`);
    
    const ticketsData = JSON.parse(fs.readFileSync(ticketsFile, 'utf8'));
    const tickets = ticketsData.issues || [];

    console.log(`Found ${tickets.length} tickets to transition`);

    for (const ticket of tickets) {
      try {
        console.log(`\nTransitioning ticket: ${ticket.key} to ${targetStatus}`);

        // Get available transitions
        const transitionsResponse = await this.makeRequest('GET', `/issue/${ticket.key}/transitions`);
        const transitions = transitionsResponse.data.transitions || [];
        
        const targetTransition = transitions.find(t => t.to.name === targetStatus);
        
        if (!targetTransition) {
          console.log(`⚠️ Transition to '${targetStatus}' not available for ${ticket.key}`);
          this.results.skipped.push({
            key: ticket.key,
            reason: `Transition to '${targetStatus}' not available`,
            availableTransitions: transitions.map(t => t.to.name)
          });
          continue;
        }

        const transitionData = {
          transition: { id: targetTransition.id },
          update: {
            comment: [{
              add: {
                body: `🤖 Bulk transitioned to '${targetStatus}' by GitHub Actions`
              }
            }]
          }
        };

        if (this.dryRun) {
          console.log(`[DRY RUN] Would transition ${ticket.key} to ${targetStatus}`);
          this.results.updated.push({ 
            key: ticket.key, 
            transition: targetStatus 
          });
        } else {
          const response = await this.makeRequest('POST', `/issue/${ticket.key}/transitions`, transitionData);
          
          if (response.statusCode === 204) {
            console.log(`✅ Transitioned: ${ticket.key} to ${targetStatus}`);
            this.results.updated.push({
              key: ticket.key,
              transition: targetStatus,
              url: `${this.baseUrl}/browse/${ticket.key}`
            });
          } else {
            console.error(`❌ Failed to transition: ${ticket.key} (${response.statusCode})`);
            this.results.errors.push({
              ticket: ticket.key,
              error: response.data,
              statusCode: response.statusCode
            });
          }
        }

        await this.sleep(300);
      } catch (error) {
        console.error(`❌ Error transitioning ticket ${ticket.key}: ${error.message}`);
        this.results.errors.push({
          ticket: ticket.key,
          error: error.message
        });
      }
    }
  }

  formatDescription(text) {
    return {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: text || ''
            }
          ]
        }
      ]
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateReport() {
    const report = `# JIRA Bulk Operation Report

## Summary
- **Created**: ${this.results.created.length} tickets
- **Updated**: ${this.results.updated.length} tickets
- **Skipped**: ${this.results.skipped.length} tickets
- **Errors**: ${this.results.errors.length} tickets

## Created Tickets
${this.results.created.map(item => `- [${item.key || 'DRY-RUN'}](${item.url || '#'}) - ${item.summary}`).join('\n')}

## Updated Tickets
${this.results.updated.map(item => `- [${item.key}](${item.url || '#'}) - ${item.summary || item.transition}`).join('\n')}

## Skipped Tickets
${this.results.skipped.map(item => `- ${item.key || item.github} - ${item.reason}`).join('\n')}

## Errors
${this.results.errors.map(item => `- ${item.ticket || item.github} - ${item.error}`).join('\n')}

---
*Generated on ${new Date().toISOString()}*
`;

    fs.writeFileSync('operation-report.md', report);
    fs.writeFileSync('operation-results.json', JSON.stringify(this.results, null, 2));
    
    console.log('\n📊 Operation completed!');
    console.log(`Created: ${this.results.created.length}`);
    console.log(`Updated: ${this.results.updated.length}`);
    console.log(`Skipped: ${this.results.skipped.length}`);
    console.log(`Errors: ${this.results.errors.length}`);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const manager = new JiraBulkManager();
  
  // Parse command line arguments
  const getArg = (name) => {
    const index = args.indexOf(`--${name}`);
    return index !== -1 ? args[index + 1] : null;
  };
  
  manager.dryRun = getArg('dry-run') === 'true';
  const projectKey = getArg('project') || manager.projectKey;

  (async () => {
    try {
      switch (command) {
        case 'create-from-data':
          await manager.createFromData(getArg('source'), projectKey);
          break;
          
        case 'update-all':
          await manager.updateAllTickets(getArg('tickets-file'), projectKey);
          break;
          
        case 'sync-github-issues':
          await manager.syncGitHubIssues(getArg('github-issues'), projectKey);
          break;
          
        case 'bulk-transition':
          await manager.bulkTransition(getArg('tickets-file'), getArg('target-status'));
          break;
          
        default:
          console.log('Usage: node jira-bulk-manager.js <command> [options]');
          console.log('Commands: create-from-data, update-all, sync-github-issues, bulk-transition');
          process.exit(1);
      }
      
      manager.generateReport();
      process.exit(0);
    } catch (error) {
      console.error(`❌ Operation failed: ${error.message}`);
      process.exit(1);
    }
  })();
}

module.exports = JiraBulkManager;
