#!/usr/bin/env node

/**
 * Get AV10-37 ticket details
 */

const https = require('https');
const fs = require('fs');

const JIRA_BASE_URL = 'https://aurigraphdlt.atlassian.net';
const JIRA_API_KEY = 'ATATT3xFfGF0lM8vRlqVHtgMi3GIxEBJYTuEA5xv0R_wMrc2wMquvtNmMmzjPuF0Jr0GDMGeBcOBfea9gbxG41jJEeV9QaFaLwKHYXZOqeSVttRjisilfp-8Dy0DcGQZreM7BwSkw5flTBwBI5DwSLaCJNRgKsjRPQuFS2HseulYEcEYF2qsO6w=2E35545C';
const JIRA_USER_EMAIL = 'subbu@aurigraph.io';

async function getAV1037Details() {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_KEY}`).toString('base64');
    
    const options = {
      hostname: JIRA_BASE_URL.replace('https://', ''),
      port: 443,
      path: '/rest/api/3/issue/AV10-37?expand=description,subtasks,issuelinks',
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
          
          console.log('🔍 Getting comprehensive details for ticket: AV10-37\n');
          console.log('═══════════════════════════════════════════════════════');
          console.log(`📋 TICKET: ${ticket.key}`);
          console.log('═══════════════════════════════════════════════════════');
          console.log(`📌 Summary: ${ticket.fields.summary}`);
          console.log(`📊 Status: ${ticket.fields.status.name}`);
          console.log(`🏷️ Type: ${ticket.fields.issuetype.name}`);
          console.log(`👤 Assignee: ${ticket.fields.assignee ? ticket.fields.assignee.displayName : 'Unassigned'}`);
          console.log(`📅 Created: ${ticket.fields.created}`);
          console.log(`📅 Updated: ${ticket.fields.updated}`);
          console.log(`🎯 Priority: ${ticket.fields.priority.name}`);
          
          if (ticket.fields.description && ticket.fields.description.content) {
            console.log(`\n📝 Description:`);
            
            let extractedText = '';
            for (const block of ticket.fields.description.content) {
              if (block.type === 'paragraph' && block.content) {
                for (const inline of block.content) {
                  if (inline.type === 'text') {
                    extractedText += inline.text;
                  }
                }
                extractedText += '\n\n';
              } else if (block.type === 'bulletList' && block.content) {
                for (const listItem of block.content) {
                  if (listItem.content && listItem.content[0] && listItem.content[0].content) {
                    extractedText += '• ';
                    for (const inline of listItem.content[0].content) {
                      if (inline.type === 'text') {
                        extractedText += inline.text;
                      }
                    }
                    extractedText += '\n';
                  }
                }
                extractedText += '\n';
              } else if (block.type === 'orderedList' && block.content) {
                let listNumber = 1;
                for (const listItem of block.content) {
                  if (listItem.content && listItem.content[0] && listItem.content[0].content) {
                    extractedText += `${listNumber}. `;
                    for (const inline of listItem.content[0].content) {
                      if (inline.type === 'text') {
                        extractedText += inline.text;
                      }
                    }
                    extractedText += '\n';
                    listNumber++;
                  }
                }
                extractedText += '\n';
              } else if (block.type === 'codeBlock' && block.content) {
                extractedText += '```';
                if (block.attrs && block.attrs.language) {
                  extractedText += block.attrs.language;
                }
                extractedText += '\n';
                for (const inline of block.content) {
                  if (inline.type === 'text') {
                    extractedText += inline.text;
                  }
                }
                extractedText += '\n```\n\n';
              } else if (block.type === 'heading' && block.content) {
                const level = block.attrs ? block.attrs.level : 1;
                extractedText += '#'.repeat(level) + ' ';
                for (const inline of block.content) {
                  if (inline.type === 'text') {
                    extractedText += inline.text;
                  }
                }
                extractedText += '\n\n';
              }
            }
            
            console.log(extractedText);
          }
          
          // Save full ticket details
          fs.writeFileSync('AV10-37-DETAILS.json', JSON.stringify(ticket, null, 2));
          console.log('\n💾 Full ticket details saved to AV10-37-DETAILS.json');
          
          resolve(ticket);
        } else {
          console.log(`❌ Failed to get ticket details: ${res.statusCode}`);
          console.log(data);
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Request failed:', e);
      reject(e);
    });

    req.end();
  });
}

async function main() {
  try {
    const ticket = await getAV1037Details();
    
    if (ticket) {
      console.log('\n═══════════════════════════════════════════════════════');
    }
    
  } catch (error) {
    console.error('Failed to get AV10-37 details:', error);
    process.exit(1);
  }
}

main();