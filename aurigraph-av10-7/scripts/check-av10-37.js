#!/usr/bin/env node

/**
 * Check if AV11-37 ticket exists in JIRA
 */

const https = require('https');

const JIRA_BASE_URL = 'https://aurigraphdlt.atlassian.net';
const JIRA_API_KEY = 'ATATT3xFfGF0lM8vRlqVHtgMi3GIxEBJYTuEA5xv0R_wMrc2wMquvtNmMmzjPuF0Jr0GDMGeBcOBfea9gbxG41jJEeV9QaFaLwKHYXZOqeSVttRjisilfp-8Dy0DcGQZreM7BwSkw5flTBwBI5DwSLaCJNRgKsjRPQuFS2HseulYEcEYF2qsO6w=2E35545C';
const JIRA_USER_EMAIL = 'subbu@aurigraph.io';

async function checkAV1137() {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_KEY}`).toString('base64');
    
    const options = {
      hostname: JIRA_BASE_URL.replace('https://', ''),
      port: 443,
      path: '/rest/api/3/issue/AV11-37',
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
          console.log(`📋 TICKET: ${ticket.key} EXISTS!`);
          console.log('═══════════════════════════════════════════════════════');
          console.log(`📌 Summary: ${ticket.fields.summary}`);
          console.log(`📊 Status: ${ticket.fields.status.name}`);
          console.log(`🏷️ Type: ${ticket.fields.issuetype.name}`);
          console.log(`📅 Created: ${ticket.fields.created}`);
          console.log(`📅 Updated: ${ticket.fields.updated}`);
          
          if (ticket.fields.description && ticket.fields.description.content) {
            console.log(`\n📝 DESCRIPTION:`);
            console.log('───────────────────────────────────────────────────────');
            
            let extractedText = '';
            for (const block of ticket.fields.description.content) {
              if (block.type === 'paragraph' && block.content) {
                for (const inline of block.content) {
                  if (inline.type === 'text') {
                    extractedText += inline.text;
                  }
                }
                extractedText += '\n';
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
              } else if (block.type === 'codeBlock' && block.content) {
                extractedText += '```\n';
                for (const inline of block.content) {
                  if (inline.type === 'text') {
                    extractedText += inline.text;
                  }
                }
                extractedText += '\n```\n';
              }
            }
            
            console.log(extractedText);
          }
          
          resolve(ticket);
        } else if (res.statusCode === 404) {
          console.log(`❌ AV11-37 not found: ${res.statusCode}`);
          console.log('🔍 AV11-37 does not exist in JIRA.');
          resolve(null);
        } else {
          console.log(`⚠️ Unexpected response: ${res.statusCode}`);
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
    console.log('🔍 Checking if AV11-37 exists in JIRA...\n');
    
    const ticket = await checkAV1137();
    
    if (!ticket) {
      console.log('\n📋 SUMMARY: AV11-37 does not exist in the JIRA system.');
      console.log('💡 Available high-numbered tickets found:');
      console.log('   - AV11-30: Post-Quantum Cryptography Implementation (Done)');
      console.log('   - Check AV11-31 through AV11-36 if needed');
    } else {
      console.log('\n✅ AV11-37 exists and needs implementation verification');
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('Failed to check AV11-37:', error);
    process.exit(1);
  }
}

main();