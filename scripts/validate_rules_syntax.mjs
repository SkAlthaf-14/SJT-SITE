import fs from 'fs';
import https from 'https';
import os from 'os';
import path from 'path';

const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const accessToken = config.tokens?.access_token;
const PROJECT_ID = 'sjtfarms-5eaeb';

const rulesContent = fs.readFileSync('firestore.rules', 'utf8');

async function testRulesSyntax() {
  console.log('Testing local firestore.rules syntax with Firebase Rules API...');
  
  const postData = JSON.stringify({
    source: {
      files: [
        {
          name: 'firestore.rules',
          content: rulesContent
        }
      ]
    }
  });

  const options = {
    hostname: 'firebaserules.googleapis.com',
    port: 443,
    path: `/v1/projects/${PROJECT_ID}/rulesets`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('Rules Validation HTTP Status:', res.statusCode);
      const parsed = JSON.parse(body);
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('[SUCCESS] firestore.rules syntax is 100% VALID! Ruleset created:', parsed.name);
      } else {
        console.log('[ERROR] Validation response:', JSON.stringify(parsed, null, 2));
      }
    });
  });

  req.on('error', (e) => {
    console.error('Request error:', e);
  });

  req.write(postData);
  req.end();
}

testRulesSyntax();
