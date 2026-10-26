import fs from 'fs';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import https from 'https';

import os from 'os';
import path from 'path';

const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const accessToken = config.tokens?.access_token;
const PROJECT_ID = 'sjtfarms-5eaeb';
const TARGET_EMAIL = 'alterit2026@gmail.com';

const app = initializeApp({
  projectId: PROJECT_ID,
  credential: {
    getAccessToken: async () => ({
      access_token: accessToken,
      expires_in: 3600,
    }),
  },
});

const auth = getAuth(app);

async function main() {
  console.log('Auditing Firebase Auth User for:', TARGET_EMAIL);
  const user = await auth.getUserByEmail(TARGET_EMAIL);
  console.log('User Record:');
  console.log('  UID:', user.uid);
  console.log('  Email:', user.email);
  console.log('  Email Verified:', user.emailVerified);
  console.log('  Disabled:', user.disabled);
  console.log('  Custom Claims:', JSON.stringify(user.customClaims));
  console.log('  Tokens Valid After Time:', user.tokensValidAfterTime);
  console.log('  Providers:', user.providerData.map(p => ({ providerId: p.providerId, email: p.email })));

  // Check Firestore via REST API with OAuth token
  console.log('\nChecking Firestore document users/' + user.uid + ' via REST API...');
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${user.uid}`;
  
  const req = https.get(firestoreUrl, {
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  }, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      console.log('Firestore Status:', res.statusCode);
      if (res.statusCode === 200) {
        console.log('Firestore Doc Data:', body);
      } else {
        console.log('Firestore Doc Response:', body);
      }
    });
  });
}

main();
