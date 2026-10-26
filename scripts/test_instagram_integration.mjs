import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('SJT FARMS — INSTAGRAM PROFILE INTEGRATION VALIDATION SUITE');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] Test ${totalTests}: ${testName}`);
  } else {
    console.error(`[FAIL] Test ${totalTests}: ${testName}`);
    if (details) console.error(`       Details: ${details}`);
    process.exitCode = 1;
  }
}

// 1. Verify siteConfig.ts
const siteConfigPath = path.join(projectRoot, 'src', 'data', 'siteConfig.ts');
const siteConfigContent = fs.readFileSync(siteConfigPath, 'utf8');

assert(
  siteConfigContent.includes("instagram: 'https://www.instagram.com/sjt.farms/'"),
  "SITE_CONFIG has official Instagram URL 'https://www.instagram.com/sjt.farms/'"
);

// 2. Verify Footer.tsx
const footerPath = path.join(projectRoot, 'src', 'components', 'common', 'Footer.tsx');
const footerContent = fs.readFileSync(footerPath, 'utf8');

assert(
  footerContent.includes('SITE_CONFIG.social.instagram'),
  'Footer binds Instagram link to SITE_CONFIG.social.instagram'
);

assert(
  footerContent.includes('target="_blank"'),
  'Footer Instagram link opens in a new tab (target="_blank")'
);

assert(
  footerContent.includes('rel="noopener noreferrer"'),
  'Footer Instagram link specifies safe rel attributes (noopener noreferrer)'
);

assert(
  footerContent.includes('aria-label="Follow SJT Farms on Instagram (@sjt.farms)"'),
  'Footer Instagram link has accessible aria-label'
);

assert(
  footerContent.includes('InstagramIcon'),
  'Footer renders official InstagramIcon component'
);

assert(
  footerContent.includes('Connect With Us'),
  'Footer includes clean, styled social section heading (Connect With Us)'
);

// 3. Verify InstagramIcon component
const iconPath = path.join(projectRoot, 'src', 'components', 'common', 'InstagramIcon.tsx');
const iconExists = fs.existsSync(iconPath);
assert(iconExists, 'Official InstagramIcon component exists in src/components/common/');

if (iconExists) {
  const iconContent = fs.readFileSync(iconPath, 'utf8');
  assert(
    iconContent.includes('viewBox="0 0 24 24"') && iconContent.includes('aria-hidden="true"'),
    'InstagramIcon is accessible with aria-hidden="true" and valid SVG viewBox'
  );
  assert(
    iconContent.includes('fill-current'),
    'InstagramIcon uses fill-current to match theme color palettes'
  );
}

// 4. Verify ContactPage.tsx
const contactPath = path.join(projectRoot, 'src', 'pages', 'ContactPage.tsx');
const contactContent = fs.readFileSync(contactPath, 'utf8');

assert(
  contactContent.includes('InstagramIcon'),
  'ContactPage imports and renders InstagramIcon'
);

assert(
  contactContent.includes('href={SITE_CONFIG.social.instagram}'),
  'ContactPage links to SITE_CONFIG.social.instagram'
);

assert(
  contactContent.includes('target="_blank"') && contactContent.includes('rel="noopener noreferrer"'),
  'ContactPage Instagram link opens in new tab with rel="noopener noreferrer"'
);

assert(
  contactContent.includes('@sjt.farms'),
  'ContactPage displays recognizable @sjt.farms handle'
);

// 5. Verify index.html Schema.org
const indexPath = path.join(projectRoot, 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');

assert(
  indexContent.includes('https://www.instagram.com/sjt.farms/'),
  'index.html JSON-LD structured data includes official Instagram URL in sameAs'
);

// 6. Verify production build output
const distIndexPath = path.join(projectRoot, 'dist', 'index.html');
assert(fs.existsSync(distIndexPath), 'dist/index.html exists after production build');

if (fs.existsSync(distIndexPath)) {
  const distContent = fs.readFileSync(distIndexPath, 'utf8');
  assert(
    distContent.includes('https://www.instagram.com/sjt.farms/'),
    'Production bundle HTML includes official Instagram URL'
  );
}

console.log('\n================================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
if (passedTests === totalTests) {
  console.log('🎉 ALL INSTAGRAM INTEGRATION TESTS PASSED SUCCESSFULLY!');
} else {
  console.log('⚠️ SOME TESTS FAILED');
}
console.log('================================================================\n');
