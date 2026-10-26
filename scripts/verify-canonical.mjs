import fs from 'fs';
import path from 'path';

const expected = [
  { file: 'dist/index.html', canonical: 'https://sjtfarms.com/' },
  { file: 'dist/shop/index.html', canonical: 'https://sjtfarms.com/shop' },
  { file: 'dist/brew-guide/index.html', canonical: 'https://sjtfarms.com/brew-guide' },
  { file: 'dist/our-farm/index.html', canonical: 'https://sjtfarms.com/our-farm' },
  { file: 'dist/about/index.html', canonical: 'https://sjtfarms.com/about' },
  { file: 'dist/reviews/index.html', canonical: 'https://sjtfarms.com/reviews' },
  { file: 'dist/subscription/index.html', canonical: 'https://sjtfarms.com/subscription' },
  { file: 'dist/accessories/index.html', canonical: 'https://sjtfarms.com/accessories' },
  { file: 'dist/contact/index.html', canonical: 'https://sjtfarms.com/contact' },
  { file: 'dist/faq/index.html', canonical: 'https://sjtfarms.com/faq' },
  { file: 'dist/product/araku-instant-coffee-powder/index.html', canonical: 'https://sjtfarms.com/product/araku-instant-coffee-powder' },
  { file: 'dist/product/araku-special-blend-filter-coffee/index.html', canonical: 'https://sjtfarms.com/product/araku-special-blend-filter-coffee' },
  { file: 'dist/product/araku-signature-coffee/index.html', canonical: 'https://sjtfarms.com/product/araku-signature-coffee' },
  { file: 'dist/product/araku-premium-coffee/index.html', canonical: 'https://sjtfarms.com/product/araku-premium-coffee' },
  { file: 'dist/product/traditional-brass-coffee-filter/index.html', canonical: 'https://sjtfarms.com/product/traditional-brass-coffee-filter' },
  { file: 'dist/product/brass-davara-tumbler-set/index.html', canonical: 'https://sjtfarms.com/product/brass-davara-tumbler-set' },
  { file: 'dist/product/artisan-moka-pot-express/index.html', canonical: 'https://sjtfarms.com/product/artisan-moka-pot-express' },
  { file: 'dist/product/dual-mesh-glass-french-press/index.html', canonical: 'https://sjtfarms.com/product/dual-mesh-glass-french-press' },
  { file: 'dist/product/airtight-ceramic-freshness-canister/index.html', canonical: 'https://sjtfarms.com/product/airtight-ceramic-freshness-canister' }
];

console.log(`Auditing ${expected.length} canonical entry points in dist/...`);
let pass = 0;
for (const item of expected) {
  if (!fs.existsSync(item.file)) {
    console.error(`FAIL - Missing file: ${item.file}`);
    process.exit(1);
  }
  const content = fs.readFileSync(item.file, 'utf8');
  const match = content.match(/<link rel="canonical" href="([^"]+)"/);
  if (!match) {
    console.error(`FAIL - Missing canonical link in ${item.file}`);
    process.exit(1);
  }
  const actualCanonical = match[1];
  if (actualCanonical !== item.canonical) {
    console.error(`FAIL - Mismatch in ${item.file}: expected ${item.canonical}, got ${actualCanonical}`);
    process.exit(1);
  }
  if (
    actualCanonical.includes('sjtfarms.in') ||
    actualCanonical.includes('.web.app') ||
    actualCanonical.includes('.firebaseapp.com') ||
    actualCanonical.includes('netlify')
  ) {
    console.error(`FAIL - Prohibited domain in ${item.file}: ${actualCanonical}`);
    process.exit(1);
  }
  if (actualCanonical.includes('#') || actualCanonical.includes('?')) {
    console.error(`FAIL - Fragment or query in ${item.file}: ${actualCanonical}`);
    process.exit(1);
  }
  pass++;
}

console.log(`SUCCESS: All ${pass} canonical URLs verified identically in dist/!`);

// Check that private routes do NOT have pre-rendered static files
const privateRoutes = ['admin', 'admin/login', 'cart', 'checkout', 'order-success'];
for (const r of privateRoutes) {
  const p = path.join('dist', r, 'index.html');
  if (fs.existsSync(p)) {
    console.error(`FAIL - Private route unexpectedly has static HTML file: ${p}`);
    process.exit(1);
  }
}
console.log('SUCCESS: Verified that private routes have NO static canonical files.');
