#!/usr/bin/env node

/**
 * Parse AV11-19 ticket details with proper ADF parsing
 */

const https = require('https');

const JIRA_BASE_URL = 'https://aurigraphdlt.atlassian.net';
const JIRA_API_KEY = 'ATATT3xFfGF0lM8vRlqVHtgMi3GIxEBJYTuEA5xv0R_wMrc2wMquvtNmMmzjPuF0Jr0GDMGeBcOBfea9gbxG41jJEeV9QaFaLwKHYXZOqeSVttRjisilfp-8Dy0DcGQZreM7BwSkw5flTBwBI5DwSLaCJNRgKsjRPQuFS2HseulYEcEYF2qsO6w=2E35545C';
const JIRA_USER_EMAIL = 'subbu@aurigraph.io';

// Simple ADF parser
function parseADF(content) {
  if (!content || !content.content) return '';
  
  let result = '';
  
  for (const block of content.content) {
    switch (block.type) {
      case 'paragraph':
        if (block.content) {
          for (const inline of block.content) {
            if (inline.type === 'text') {
              result += inline.text;
            }
          }
        }
        result += '\n\n';
        break;
        
      case 'heading':
        const level = block.attrs?.level || 1;
        const headingText = block.content?.[0]?.text || '';
        result += '#'.repeat(level) + ' ' + headingText + '\n\n';
        break;
        
      case 'bulletList':
        if (block.content) {
          for (const listItem of block.content) {
            if (listItem.type === 'listItem' && listItem.content) {
              for (const para of listItem.content) {
                if (para.type === 'paragraph' && para.content) {
                  result += '• ';
                  for (const text of para.content) {
                    if (text.type === 'text') {
                      result += text.text;
                    }
                  }
                  result += '\n';
                }
              }
            }
          }
        }
        result += '\n';
        break;
        
      case 'codeBlock':
        const codeText = block.content?.[0]?.text || '';
        const language = block.attrs?.language || '';
        result += '```' + language + '\n' + codeText + '\n```\n\n';
        break;
        
      case 'rule':
        result += '---\n\n';
        break;
    }
  }
  
  return result.trim();
}

async function getTicketDetails(ticketKey) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_KEY}`).toString('base64');
    
    const options = {
      hostname: JIRA_BASE_URL.replace('https://', ''),
      port: 443,
      path: `/rest/api/3/issue/${ticketKey}`,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const ticket = JSON.parse(data);
          
          console.log('═══════════════════════════════════════════════════════');
          console.log(`📋 TICKET: ${ticket.key}`);
          console.log('═══════════════════════════════════════════════════════');
          console.log(`📌 Summary: ${ticket.fields.summary}`);
          console.log(`📊 Status: ${ticket.fields.status.name}`);
          console.log(`🏷️ Type: ${ticket.fields.issuetype.name}`);
          console.log(`👤 Assignee: ${ticket.fields.assignee ? ticket.fields.assignee.displayName : 'Unassigned'}`);
          console.log(`📅 Created: ${ticket.fields.created}`);
          console.log(`📅 Updated: ${ticket.fields.updated}`);
          
          if (ticket.fields.description) {
            console.log(`\n📝 DESCRIPTION:`);
            console.log('───────────────────────────────────────────────────────');
            const parsedDescription = parseADF(ticket.fields.description);
            console.log(parsedDescription);
          }
          
          if (ticket.fields.labels && ticket.fields.labels.length > 0) {
            console.log(`\n🏷️ Labels: ${ticket.fields.labels.join(', ')}`);
          }
          
          if (ticket.fields.priority) {
            console.log(`⚡ Priority: ${ticket.fields.priority.name}`);
          }
          
          console.log('\n═══════════════════════════════════════════════════════');
          
          resolve(ticket);
        } else {
          console.log(`❌ Failed to get ticket details: ${res.statusCode}`);
          console.log('Response:', data);
          reject(new Error(`Failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      reject(error);
    });

    req.end();
  });
}

async function main() {
  console.log('🔍 Getting AV11-19 ticket details...\n');
  
  try {
    const ticket = await getTicketDetails('AV11-19');
    
    // Save details for implementation
    const fs = require('fs');
    const path = require('path');
    
    const ticketData = {
      key: ticket.key,
      summary: ticket.fields.summary,
      description: ticket.fields.description,
      status: ticket.fields.status.name,
      type: ticket.fields.issuetype.name,
      created: ticket.fields.created,
      updated: ticket.fields.updated
    };
    
    const outputFile = path.join(__dirname, '..', 'AV11-19-DETAILS.json');
    fs.writeFileSync(outputFile, JSON.stringify(ticketData, null, 2));
    console.log(`\n💾 Ticket details saved to: ${outputFile}`);
    
  } catch (error) {
    console.error('Failed to get ticket details:', error);
  }
}

main().catch(console.error);