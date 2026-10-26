import fs from 'fs';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

import os from 'os';
import path from 'path';

// 1. Read Google OAuth access token from firebase-tools session
const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
if (!fs.existsSync(configPath)) {
  console.error('Error: firebase-tools credentials not found at', configPath);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const accessToken = config.tokens?.access_token;
if (!accessToken) {
  console.error('Error: access_token not found in firebase-tools configuration.');
  process.exit(1);
}

const PROJECT_ID = 'sjtfarms-5eaeb';
const TARGET_EMAIL = 'alterit2026@gmail.com';

// 2. Initialize Firebase Admin SDK with custom credential using the valid Google OAuth token
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
  console.log(`\n======================================================`);
  console.log(`Setting Firebase Authentication Admin Custom Claim`);
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Target Email: ${TARGET_EMAIL}`);
  console.log(`======================================================\n`);

  try {
    // 3. Find user by email using Firebase Admin SDK
    const user = await auth.getUserByEmail(TARGET_EMAIL);
    console.log(`✓ User found successfully in Firebase Authentication via Admin SDK!`);
    console.log(`  - UID: ${user.uid}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Email Verified: ${user.emailVerified}`);
    console.log(`  - Current Custom Claims before update:`, user.customClaims || '(none)');

    // 4. Assign the Firebase custom claim: admin: true
    console.log(`\nAssigning custom claim { admin: true } via Firebase Admin SDK...`);
    await auth.setCustomUserClaims(user.uid, { admin: true });
    console.log(`✓ Custom claim { admin: true } assigned via Firebase Admin SDK!`);

    // 5. Verify the custom claim by re-fetching the user record
    const updatedUser = await auth.getUser(user.uid);
    console.log(`\n✓ Verification: Updated user claims from Firebase Auth:`);
    console.log(`  - UID: ${updatedUser.uid}`);
    console.log(`  - Custom Claims:`, JSON.stringify(updatedUser.customClaims));

    if (updatedUser.customClaims && updatedUser.customClaims.admin === true) {
      console.log(`\n[SUCCESS] Confirmed: admin claim is TRUE on Firebase Auth user!`);
    } else {
      console.error(`[ERROR] admin claim verification failed!`);
      process.exit(1);
    }

    console.log(`\nAll Admin setup tasks completed cleanly!\n`);
  } catch (err) {
    console.error(`Failed to assign admin claim:`, err);
    process.exit(1);
  }
}

main();
