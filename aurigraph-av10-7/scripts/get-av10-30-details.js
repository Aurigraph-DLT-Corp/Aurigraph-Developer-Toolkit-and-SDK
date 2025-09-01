const https = require('https');

const config = {
    jiraUrl: 'aurigraphdlt.atlassian.net',
    email: 'subbu@aurigraph.io',
    apiToken: 'ATATT3xFfGF0lM8vRlqVHtgMi3GIxEBJYTuEA5xv0R_wMrc2wMquvtNmMmzjPuF0Jr0GDMGeBcOBfea9gbxG41jJEeV9QaFaLwKHYXZOqeSVttRjisilfp-8Dy0DcGQZreM7BwSkw5flTBwBI5DwSLaCJNRgKsjRPQuFS2HseulYEcEYF2qsO6w=2E35545C'
};

async function getTicketDetails(ticketKey) {
    console.log(`🔍 Getting comprehensive details for ticket: ${ticketKey}\n`);

    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    
    const options = {
        hostname: config.jiraUrl,
        path: `/rest/api/3/issue/${ticketKey}`,
        method: 'GET',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const issue = JSON.parse(data);
                    
                    if (res.statusCode !== 200) {
                        console.error(`❌ Error: ${issue.errorMessages || issue.errors || 'Unknown error'}`);
                        reject(new Error(`HTTP ${res.statusCode}`));
                        return;
                    }

                    console.log('═══════════════════════════════════════════════════════');
                    console.log(`📋 TICKET: ${issue.key}`);
                    console.log('═══════════════════════════════════════════════════════');
                    console.log(`📌 Summary: ${issue.fields.summary}`);
                    console.log(`📊 Status: ${issue.fields.status.name}`);
                    console.log(`🏷️ Type: ${issue.fields.issuetype.name}`);
                    console.log(`👤 Assignee: ${issue.fields.assignee ? issue.fields.assignee.displayName : 'Unassigned'}`);
                    console.log(`📅 Created: ${issue.fields.created}`);
                    console.log(`📅 Updated: ${issue.fields.updated}`);
                    
                    if (issue.fields.priority) {
                        console.log(`🎯 Priority: ${issue.fields.priority.name}`);
                    }

                    console.log('\n📝 Description:');
                    if (issue.fields.description && issue.fields.description.content) {
                        // Parse ADF content
                        parseADFContent(issue.fields.description.content, 0);
                    } else {
                        console.log('No description available');
                    }

                    console.log('\n═══════════════════════════════════════════════════════\n');
                    
                    // Save to file for reference
                    const fs = require('fs');
                    fs.writeFileSync(`AV10-30-DETAILS.json`, JSON.stringify(issue, null, 2));
                    console.log('💾 Full ticket details saved to AV10-30-DETAILS.json');
                    
                    resolve(issue);
                } catch (error) {
                    console.error('❌ Error parsing response:', error);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request error:', error);
            reject(error);
        });

        req.end();
    });
}

function parseADFContent(content, indent = 0) {
    const indentStr = '  '.repeat(indent);
    
    for (const node of content) {
        switch (node.type) {
            case 'paragraph':
                if (node.content) {
                    let text = '';
                    for (const textNode of node.content) {
                        if (textNode.type === 'text') {
                            text += textNode.text;
                        }
                    }
                    if (text.trim()) {
                        console.log(`${indentStr}${text}`);
                    }
                }
                break;
                
            case 'heading':
                if (node.content) {
                    let headingText = '';
                    for (const textNode of node.content) {
                        if (textNode.type === 'text') {
                            headingText += textNode.text;
                        }
                    }
                    const level = node.attrs?.level || 1;
                    const prefix = '#'.repeat(level);
                    console.log(`\n${indentStr}${prefix} ${headingText}`);
                }
                break;
                
            case 'bulletList':
                if (node.content) {
                    for (const listItem of node.content) {
                        if (listItem.type === 'listItem' && listItem.content) {
                            console.log(`${indentStr}•`);
                            parseADFContent(listItem.content, indent + 1);
                        }
                    }
                }
                break;
                
            case 'orderedList':
                if (node.content) {
                    for (let i = 0; i < node.content.length; i++) {
                        const listItem = node.content[i];
                        if (listItem.type === 'listItem' && listItem.content) {
                            console.log(`${indentStr}${i + 1}.`);
                            parseADFContent(listItem.content, indent + 1);
                        }
                    }
                }
                break;
                
            case 'codeBlock':
                if (node.content) {
                    console.log(`\n${indentStr}\`\`\`${node.attrs?.language || ''}`);
                    for (const textNode of node.content) {
                        if (textNode.type === 'text') {
                            console.log(`${indentStr}${textNode.text}`);
                        }
                    }
                    console.log(`${indentStr}\`\`\`\n`);
                }
                break;
                
            case 'rule':
                console.log(`${indentStr}---`);
                break;
                
            default:
                if (node.content) {
                    parseADFContent(node.content, indent);
                }
        }
    }
}

// Run if called directly
if (require.main === module) {
    const ticketKey = process.argv[2] || 'AV10-30';
    getTicketDetails(ticketKey).catch(error => {
        console.error('Failed to get ticket details:', error);
        process.exit(1);
    });
}