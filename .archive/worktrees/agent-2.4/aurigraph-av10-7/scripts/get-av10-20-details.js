#!/usr/bin/env node

/**
 * Get AV11-20 Epic details with proper ADF parsing
 */

const https = require('https');

const JIRA_BASE_URL = 'https://aurigraphdlt.atlassian.net';
const JIRA_API_KEY = 'ATATT3xFfGF0lM8vRlqVHtgMi3GIxEBJYTuEA5xv0R_wMrc2wMquvtNmMmzjPuF0Jr0GDMGeBcOBfea9gbxG41jJEeV9QaFaLwKHYXZOqeSVttRjisilfp-8Dy0DcGQZreM7BwSkw5flTBwBI5DwSLaCJNRgKsjRPQuFS2HseulYEcEYF2qsO6w=2E35545C';
const JIRA_USER_EMAIL = 'subbu@aurigraph.io';

async function getTicketDetails() {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_KEY}`).toString('base64');
    
    const options = {
      hostname: JIRA_BASE_URL.replace('https://', ''),
      port: 443,
      path: '/rest/api/3/issue/AV11-20',
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
          console.log(`📋 EPIC: ${ticket.key}`);
          console.log('═══════════════════════════════════════════════════════');
          console.log(`📌 Summary: ${ticket.fields.summary}`);
          console.log(`📊 Status: ${ticket.fields.status.name}`);
          console.log(`🏷️ Type: ${ticket.fields.issuetype.name}`);
          console.log(`📅 Created: ${ticket.fields.created}`);
          console.log(`📅 Updated: ${ticket.fields.updated}`);
          
          // Extract description content
          if (ticket.fields.description && ticket.fields.description.content) {
            console.log(`\n📝 DESCRIPTION ANALYSIS:`);
            console.log('───────────────────────────────────────────────────────');
            
            let extractedText = '';
            for (const block of ticket.fields.description.content) {
              if (block.type === 'paragraph' && block.content) {
                for (const inline of block.content) {
                  if (inline.type === 'text') {
                    extractedText += inline.text + ' ';
                  }
                }
                extractedText += '\n';
              }
              
              if (block.type === 'heading' && block.content) {
                const headingText = block.content[0]?.text || '';
                extractedText += '\n## ' + headingText + '\n';
              }
              
              if (block.type === 'bulletList' && block.content) {
                for (const listItem of block.content) {
                  if (listItem.type === 'listItem' && listItem.content) {
                    for (const para of listItem.content) {
                      if (para.type === 'paragraph' && para.content) {
                        extractedText += '• ';
                        for (const text of para.content) {
                          if (text.type === 'text') {
                            extractedText += text.text;
                          }
                        }
                        extractedText += '\n';
                      }
                    }
                  }
                }
              }
            }
            
            console.log(extractedText);
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
  console.log('🔍 Getting AV11-20 Epic details...\n');
  
  try {
    await getTicketDetails();
  } catch (error) {
    console.error('Failed to get ticket details:', error);
  }
}

main().catch(console.error);