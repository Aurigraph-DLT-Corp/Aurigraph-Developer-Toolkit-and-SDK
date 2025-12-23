#!/usr/bin/env node

/**
 * JIRA Utilities for GitHub Actions
 * Provides helper functions for JIRA API operations
 */

const https = require('https');
const { URL } = require('url');

class JiraUtils {
  constructor(baseUrl, email, apiToken) {
    this.baseUrl = baseUrl;
    this.email = email;
    this.apiToken = apiToken;
    this.auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
  }

  /**
   * Make HTTP request to JIRA API
   */
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
            reject(new Error(`Failed to parse JSON response: ${error.message}`));
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

  /**
   * Create a new JIRA issue
   */
  async createIssue(projectKey, issueType, summary, description, additionalFields = {}) {
    const issueData = {
      fields: {
        project: { key: projectKey },
        issuetype: { name: issueType },
        summary: summary,
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: description
                }
              ]
            }
          ]
        },
        ...additionalFields
      }
    };

    try {
      const response = await this.makeRequest('POST', '/issue', issueData);
      
      if (response.statusCode === 201) {
        console.log(`✅ Created JIRA issue: ${response.data.key}`);
        return response.data;
      } else {
        console.error(`❌ Failed to create issue: ${response.statusCode}`, response.data);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error creating issue: ${error.message}`);
      return null;
    }
  }

  /**
   * Add comment to JIRA issue
   */
  async addComment(issueKey, comment) {
    const commentData = {
      body: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: comment
              }
            ]
          }
        ]
      }
    };

    try {
      const response = await this.makeRequest('POST', `/issue/${issueKey}/comment`, commentData);
      
      if (response.statusCode === 201) {
        console.log(`✅ Added comment to ${issueKey}`);
        return response.data;
      } else {
        console.error(`❌ Failed to add comment to ${issueKey}: ${response.statusCode}`, response.data);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error adding comment to ${issueKey}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get available transitions for an issue
   */
  async getTransitions(issueKey) {
    try {
      const response = await this.makeRequest('GET', `/issue/${issueKey}/transitions`);
      
      if (response.statusCode === 200) {
        return response.data.transitions;
      } else {
        console.error(`❌ Failed to get transitions for ${issueKey}: ${response.statusCode}`);
        return [];
      }
    } catch (error) {
      console.error(`❌ Error getting transitions for ${issueKey}: ${error.message}`);
      return [];
    }
  }

  /**
   * Transition an issue to a new status
   */
  async transitionIssue(issueKey, transitionName, comment = null) {
    try {
      // Get available transitions
      const transitions = await this.getTransitions(issueKey);
      const transition = transitions.find(t => t.name === transitionName);
      
      if (!transition) {
        console.log(`⚠️ Transition '${transitionName}' not available for ${issueKey}`);
        console.log(`Available transitions: ${transitions.map(t => t.name).join(', ')}`);
        return false;
      }

      const transitionData = {
        transition: { id: transition.id }
      };

      if (comment) {
        transitionData.update = {
          comment: [
            {
              add: {
                body: {
                  type: "doc",
                  version: 1,
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: comment
                        }
                      ]
                    }
                  ]
                }
              }
            }
          ]
        };
      }

      const response = await this.makeRequest('POST', `/issue/${issueKey}/transitions`, transitionData);
      
      if (response.statusCode === 204) {
        console.log(`✅ Transitioned ${issueKey} to '${transitionName}'`);
        return true;
      } else {
        console.error(`❌ Failed to transition ${issueKey}: ${response.statusCode}`, response.data);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error transitioning ${issueKey}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get issue details
   */
  async getIssue(issueKey) {
    try {
      const response = await this.makeRequest('GET', `/issue/${issueKey}`);
      
      if (response.statusCode === 200) {
        return response.data;
      } else {
        console.error(`❌ Failed to get issue ${issueKey}: ${response.statusCode}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error getting issue ${issueKey}: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract JIRA issue keys from text
   */
  static extractIssueKeys(text, projectKey = 'AV11') {
    const regex = new RegExp(`${projectKey}-\\d+`, 'gi');
    const matches = text.match(regex);
    return matches ? [...new Set(matches.map(m => m.toUpperCase()))] : [];
  }

  /**
   * Format GitHub commit information for JIRA comment
   */
  static formatCommitComment(commitInfo) {
    const { hash, message, author, email, url, filesChanged, insertions, deletions, branch } = commitInfo;
    
    return `🔄 **GitHub Commit Update**

**Repository**: ${process.env.GITHUB_REPOSITORY || 'Unknown'}
**Branch**: \`${branch || 'Unknown'}\`
**Commit**: [${hash?.substring(0, 8) || 'Unknown'}](${url || '#'})
**Author**: ${author || 'Unknown'} (${email || 'Unknown'})

**Message**:
\`\`\`
${message || 'No message'}
\`\`\`

**Statistics**:
- 📁 Files changed: ${filesChanged || 0}
- ➕ Insertions: ${insertions || 0}
- ➖ Deletions: ${deletions || 0}

---
*Auto-synchronized from GitHub Actions*`;
  }

  /**
   * Format GitHub PR information for JIRA comment
   */
  static formatPRComment(prInfo) {
    const { title, url, author, action, branch, targetBranch, filesChanged, additions, deletions } = prInfo;
    
    const actionEmojis = {
      opened: '🔍',
      closed: '❌',
      merged: '✅',
      reopened: '🔄',
      synchronize: '🔄'
    };

    const emoji = actionEmojis[action] || '📝';
    
    return `${emoji} **Pull Request ${action?.charAt(0).toUpperCase() + action?.slice(1) || 'Updated'}**

**PR**: [${title || 'Unknown'}](${url || '#'})
**Author**: ${author || 'Unknown'}
**Branch**: \`${branch || 'Unknown'}\` → \`${targetBranch || 'Unknown'}\`

**Statistics**:
- 📁 Files changed: ${filesChanged || 0}
- ➕ Additions: ${additions || 0}
- ➖ Deletions: ${deletions || 0}

---
*Auto-updated from GitHub Actions*`;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const jira = new JiraUtils(
    process.env.JIRA_BASE_URL,
    process.env.JIRA_EMAIL,
    process.env.JIRA_API_TOKEN
  );

  switch (command) {
    case 'create-issue':
      const [projectKey, issueType, summary, description] = args.slice(1);
      jira.createIssue(projectKey, issueType, summary, description)
        .then(result => {
          if (result) {
            console.log(`Issue created: ${result.key}`);
            process.exit(0);
          } else {
            process.exit(1);
          }
        });
      break;
      
    case 'add-comment':
      const [issueKey, comment] = args.slice(1);
      jira.addComment(issueKey, comment)
        .then(result => {
          process.exit(result ? 0 : 1);
        });
      break;
      
    case 'transition':
      const [transitionIssueKey, transitionName, transitionComment] = args.slice(1);
      jira.transitionIssue(transitionIssueKey, transitionName, transitionComment)
        .then(result => {
          process.exit(result ? 0 : 1);
        });
      break;
      
    case 'extract-issues':
      const text = args.slice(1).join(' ');
      const issues = JiraUtils.extractIssueKeys(text);
      console.log(issues.join(','));
      break;
      
    default:
      console.log('Usage: node jira-utils.js <command> [args...]');
      console.log('Commands:');
      console.log('  create-issue <projectKey> <issueType> <summary> <description>');
      console.log('  add-comment <issueKey> <comment>');
      console.log('  transition <issueKey> <transitionName> [comment]');
      console.log('  extract-issues <text>');
      process.exit(1);
  }
}

module.exports = JiraUtils;
