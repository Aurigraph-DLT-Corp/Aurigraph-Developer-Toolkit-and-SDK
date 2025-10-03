#!/usr/bin/env node

const https = require('https');

const JIRA_CONFIG = {
  email: 'sjoish12@gmail.com',
  apiToken: 'ATATT3xFfGF0lM8vRlqVHtgMi3GIxEBJYTuEA5xv0R_wMrc2wMquvtNmMmzjPuF0Jr0GDMGeBcOBfea9gbxG41jJEeV9QaFaLwKHYXZOqeSVttRjisilfp-8Dy0DcGQZreM7BwSkw5flTBwBI5DwSLaCJNRgKsjRPQuFS2HseulYEcEYF2qsO6w=2E35545C'
};

const auth = Buffer.from(`${JIRA_CONFIG.email}:${JIRA_CONFIG.apiToken}`).toString('base64');

const options = {
  hostname: 'aurigraphdlt.atlassian.net',
  path: '/rest/api/3/project',
  method: 'GET',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const projects = JSON.parse(data);
      console.log('\n📋 Available JIRA Projects:\n');
      projects.forEach(project => {
        console.log(`  • ${project.key} - ${project.name} (ID: ${project.id})`);
      });
      console.log('');
    } catch (error) {
      console.error('Error:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request failed:', error);
});

req.end();
