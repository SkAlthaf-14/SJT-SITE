import fs from 'fs';
import https from 'https';
import os from 'os';
import path from 'path';

const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
let accessToken = null;
try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  accessToken = config.tokens?.access_token;
} catch (e) {
  console.log('No configstore found at home path:', e.message);
}

const PROJECT_ID = 'sjtfarms-5eaeb';

function makeFirestoreGet(path) {
  return new Promise((resolve) => {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`;
    const req = https.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
      });
    });
    req.on('error', (err) => resolve({ status: 500, error: err.message }));
  });
}

function getSecurityRules() {
  return new Promise((resolve) => {
    // Get release or rulesets
    const url = `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases`;
    const req = https.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
      });
    });
    req.on('error', (err) => resolve({ status: 500, error: err.message }));
  });
}

async function main() {
  console.log('=== SJT FARMS FIRESTORE DIAGNOSTIC ===');
  console.log('Project:', PROJECT_ID);

  if (!accessToken) {
    console.log('No access token available.');
    return;
  }

  // 1. Check if counters/order_counter exists
  console.log('\n1. Checking counters/order_counter...');
  const counterRes = await makeFirestoreGet('counters/order_counter');
  console.log('Status:', counterRes.status);
  console.log('Data:', JSON.stringify(counterRes.data, null, 2));

  // 1b. Check existing orders collection
  console.log('\n1b. Checking existing documents in orders collection...');
  const ordersListRes = await new Promise((resolve) => {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/orders?pageSize=10`;
    https.get(url, { headers: { 'Authorization': `Bearer ${accessToken}` } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, data: d ? JSON.parse(d) : null }));
    });
  });
  console.log('Orders List Status:', ordersListRes.status);
  if (ordersListRes.data?.documents) {
    console.log(`Found ${ordersListRes.data.documents.length} orders:`);
    for (const doc of ordersListRes.data.documents) {
      console.log(' - Name:', doc.name.split('/').pop());
      console.log('   Fields:', Object.keys(doc.fields));
      console.log('   orderId:', doc.fields?.orderId);
      console.log('   orderNumber:', doc.fields?.orderNumber);
      console.log('   userId:', doc.fields?.userId);
    }
  } else {
    console.log('No orders or empty:', ordersListRes.data);
  }

  // 2. Check if orderCounters exists (from old schema)
  console.log('\n2. Checking orderCounters (old schema check)...');
  const oldCounterRes = await makeFirestoreGet('orderCounters/order_counter');
  console.log('Status:', oldCounterRes.status);
  console.log('Data:', JSON.stringify(oldCounterRes.data, null, 2));

  // 3. Check active security rules release
  console.log('\n3. Checking deployed security rules...');
  const rulesRes = await getSecurityRules();
  console.log('Rules Status:', rulesRes.status);
  if (rulesRes.data?.releases) {
    const firestoreRelease = rulesRes.data.releases.find(r => r.name.includes('cloud.firestore'));
    console.log('Active Firestore Release:', firestoreRelease);
    if (firestoreRelease) {
      // Fetch ruleset
      const rulesetUrl = `https://firebaserules.googleapis.com/v1/${firestoreRelease.rulesetName}`;
      const rulesetRes = await new Promise((resolve) => {
        https.get(rulesetUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } }, (res) => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => resolve({ status: res.statusCode, data: d ? JSON.parse(d) : null }));
        });
      });
      if (rulesetRes.data?.source?.files) {
        console.log('\n--- CURRENTLY DEPLOYED FIRESTORE RULES ---');
        console.log(rulesetRes.data.source.files[0]?.content);
        console.log('--- END DEPLOYED RULES ---');
      }
    }
  } else {
    console.log('Releases response:', rulesRes.data);
  }
}

main().catch(console.error);
