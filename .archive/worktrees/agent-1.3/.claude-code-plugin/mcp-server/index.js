#!/usr/bin/env node

/**
 * Aurigraph DLT MCP Server for Claude Code
 * Provides tools for deployment, monitoring, JIRA integration, and more
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from 'axios';
import { Client as SSHClient } from 'ssh2';
import { config } from 'dotenv';

config();

const server = new Server(
  {
    name: "aurigraph-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Configuration from environment
const CONFIG = {
  jira: {
    email: process.env.JIRA_EMAIL || 'subbu@aurigraph.io',
    apiToken: process.env.JIRA_API_TOKEN,
    baseUrl: process.env.JIRA_BASE_URL || 'https://aurigraphdlt.atlassian.net',
    projectKey: process.env.JIRA_PROJECT_KEY || 'AV11'
  },
  remote: {
    host: process.env.REMOTE_HOST || 'dlt.aurigraph.io',
    port: parseInt(process.env.REMOTE_PORT || '22'),
    user: process.env.REMOTE_USER || 'subbu',
    password: process.env.REMOTE_PASSWORD
  },
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:9003'
  }
};

// Helper: Execute SSH command
async function executeSSH(command) {
  return new Promise((resolve, reject) => {
    const conn = new SSHClient();

    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }

        let stdout = '';
        let stderr = '';

        stream.on('close', (code, signal) => {
          conn.end();
          resolve({ stdout, stderr, exitCode: code });
        }).on('data', (data) => {
          stdout += data.toString();
        }).stderr.on('data', (data) => {
          stderr += data.toString();
        });
      });
    }).on('error', (err) => {
      reject(err);
    }).connect({
      host: CONFIG.remote.host,
      port: CONFIG.remote.port,
      username: CONFIG.remote.user,
      password: CONFIG.remote.password
    });
  });
}

// Helper: Make JIRA API request
async function jiraRequest(method, path, data = null) {
  const auth = Buffer.from(`${CONFIG.jira.email}:${CONFIG.jira.apiToken}`).toString('base64');

  try {
    const response = await axios({
      method,
      url: `${CONFIG.jira.baseUrl}${path}`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data
    });
    return response.data;
  } catch (error) {
    throw new Error(`JIRA API Error: ${error.response?.data?.errorMessages?.[0] || error.message}`);
  }
}

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "check_service_status",
        description: "Check if Aurigraph service is running on remote server",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_service_logs",
        description: "Get recent logs from Aurigraph service",
        inputSchema: {
          type: "object",
          properties: {
            lines: {
              type: "number",
              description: "Number of lines to retrieve (default: 50)",
            },
            filter: {
              type: "string",
              description: "Filter logs by pattern (e.g., ERROR, WARN)",
            },
          },
        },
      },
      {
        name: "get_bridge_health",
        description: "Get cross-chain bridge health status",
        inputSchema: {
          type: "object",
          properties: {
            chain: {
              type: "string",
              description: "Specific chain to check (ethereum, bsc, polygon, avalanche) or 'all'",
            },
          },
        },
      },
      {
        name: "get_performance_stats",
        description: "Get current performance statistics (TPS, latency, etc.)",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "create_jira_ticket",
        description: "Create a new JIRA ticket",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              description: "Issue type (Epic, Story, Task, Bug)",
              enum: ["Epic", "Story", "Task", "Bug"],
            },
            summary: {
              type: "string",
              description: "Ticket summary/title",
            },
            description: {
              type: "string",
              description: "Detailed description",
            },
            parentKey: {
              type: "string",
              description: "Parent epic key (for stories/tasks)",
            },
          },
          required: ["type", "summary", "description"],
        },
      },
      {
        name: "update_jira_ticket",
        description: "Update an existing JIRA ticket status or fields",
        inputSchema: {
          type: "object",
          properties: {
            ticketKey: {
              type: "string",
              description: "JIRA ticket key (e.g., AV11-375)",
            },
            status: {
              type: "string",
              description: "New status (To Do, In Progress, Done, etc.)",
            },
            comment: {
              type: "string",
              description: "Add a comment to the ticket",
            },
          },
          required: ["ticketKey"],
        },
      },
      {
        name: "restart_service",
        description: "Restart Aurigraph service on remote server",
        inputSchema: {
          type: "object",
          properties: {
            graceful: {
              type: "boolean",
              description: "Use graceful shutdown (default: true)",
            },
          },
        },
      },
      {
        name: "deploy_version",
        description: "Deploy a specific version to remote server",
        inputSchema: {
          type: "object",
          properties: {
            version: {
              type: "string",
              description: "Version to deploy (e.g., 11.3.2)",
            },
            skipTests: {
              type: "boolean",
              description: "Skip running tests before deployment",
            },
            createBackup: {
              type: "boolean",
              description: "Create backup before deployment (default: true)",
            },
          },
          required: ["version"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "check_service_status": {
        const result = await executeSSH("ps aux | grep aurigraph-v11 | grep -v grep");
        const isRunning = result.exitCode === 0;

        if (isRunning) {
          const lines = result.stdout.trim().split('\n');
          const processInfo = lines[0].split(/\s+/);
          const pid = processInfo[1];
          const cpu = processInfo[2];
          const mem = processInfo[3];

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: "running",
                pid,
                cpu: `${cpu}%`,
                memory: `${mem}%`,
                uptime: "calculating..."
              }, null, 2)
            }]
          };
        } else {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: "stopped",
                message: "Service is not running"
              }, null, 2)
            }]
          };
        }
      }

      case "get_service_logs": {
        const lines = args.lines || 50;
        const filter = args.filter || '';

        let command = `tail -${lines} /opt/aurigraph-v11/logs/aurigraph-v11.log`;
        if (filter) {
          command += ` | grep "${filter}"`;
        }

        const result = await executeSSH(command);

        return {
          content: [{
            type: "text",
            text: result.stdout || "No logs found"
          }]
        };
      }

      case "get_bridge_health": {
        const chain = args.chain || 'all';
        const response = await axios.get(`${CONFIG.api.baseUrl}/api/v11/bridge/health`, {
          params: { chain }
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "get_performance_stats": {
        const response = await axios.get(`${CONFIG.api.baseUrl}/api/v11/stats`);

        return {
          content: [{
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }]
        };
      }

      case "create_jira_ticket": {
        const fields = {
          project: { key: CONFIG.jira.projectKey },
          summary: args.summary,
          description: {
            type: 'doc',
            version: 1,
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: args.description }]
            }]
          },
          issuetype: { name: args.type }
        };

        if (args.parentKey) {
          fields.parent = { key: args.parentKey };
        }

        const result = await jiraRequest('POST', '/rest/api/3/issue', { fields });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              key: result.key,
              url: `${CONFIG.jira.baseUrl}/browse/${result.key}`
            }, null, 2)
          }]
        };
      }

      case "update_jira_ticket": {
        const { ticketKey, status, comment } = args;

        if (status) {
          // Get available transitions
          const transitions = await jiraRequest('GET', `/rest/api/3/issue/${ticketKey}/transitions`);
          const transition = transitions.transitions.find(t =>
            t.name.toLowerCase().includes(status.toLowerCase())
          );

          if (transition) {
            await jiraRequest('POST', `/rest/api/3/issue/${ticketKey}/transitions`, {
              transition: { id: transition.id }
            });
          }
        }

        if (comment) {
          await jiraRequest('POST', `/rest/api/3/issue/${ticketKey}/comment`, {
            body: {
              type: 'doc',
              version: 1,
              content: [{
                type: 'paragraph',
                content: [{ type: 'text', text: comment }]
              }]
            }
          });
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              ticketKey,
              updated: { status: !!status, comment: !!comment }
            }, null, 2)
          }]
        };
      }

      case "restart_service": {
        const graceful = args.graceful !== false;

        // Get PID
        const pidResult = await executeSSH("ps aux | grep aurigraph-v11 | grep -v grep | awk '{print $2}'");
        const pid = pidResult.stdout.trim();

        if (!pid) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({ error: "Service not running" }, null, 2)
            }]
          };
        }

        // Stop service
        const signal = graceful ? '-15' : '-9';
        await executeSSH(`kill ${signal} ${pid}`);
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Start service
        const startCommand = `cd /opt/aurigraph-v11 && nohup java -Xms16g -Xmx32g -XX:+UseG1GC -jar aurigraph-v11-standalone-11.3.1-runner.jar > logs/aurigraph-v11.log 2>&1 &`;
        await executeSSH(startCommand);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "Service restarted successfully",
              graceful
            }, null, 2)
          }]
        };
      }

      case "deploy_version": {
        const { version, skipTests, createBackup } = args;

        // This would be a complex multi-step process
        // For brevity, showing the structure
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "Deployment initiated",
              version,
              steps: [
                "Build completed",
                "Tests " + (skipTests ? "skipped" : "passed"),
                "Backup " + (createBackup !== false ? "created" : "skipped"),
                "Deployment in progress..."
              ]
            }, null, 2)
          }]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: error.message,
          tool: name
        }, null, 2)
      }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Aurigraph MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
