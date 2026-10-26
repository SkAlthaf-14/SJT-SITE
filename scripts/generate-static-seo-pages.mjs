import fs from 'fs';
import path from 'path';

const PRODUCTION_DOMAIN = 'https://sjtfarms.com';
const DIST_DIR = path.resolve('dist');

if (!fs.existsSync(DIST_DIR)) {
  console.error('Error: dist directory does not exist. Run vite build first.');
  process.exit(1);
}

const templatePath = path.join(DIST_DIR, 'index.html');
if (!fs.existsSync(templatePath)) {
  console.error('Error: dist/index.html does not exist.');
  process.exit(1);
}

const SEO_IMAGE_URL = `${PRODUCTION_DOMAIN}/images/seo/sjt-farms-coffee-search-thumbnail.jpg`;
const SEO_IMAGE_ALT = 'SJT Farms Authentic Araku Valley Coffee Glass Jar Packaging';
const SEO_IMAGE_WIDTH = '1200';
const SEO_IMAGE_HEIGHT = '630';

function ensureCorrectImageMetadata(htmlContent) {
  let updated = htmlContent;

  // Replace obsolete or incorrect og:image
  if (updated.includes('property="og:image"')) {
    updated = updated.replace(
      /<meta property="og:image" content="[^"]*"\s*\/?>/,
      `<meta property="og:image" content="${SEO_IMAGE_URL}" />`
    );
  } else {
    updated = updated.replace(
      '</head>',
      `    <meta property="og:image" content="${SEO_IMAGE_URL}" />\n  </head>`
    );
  }

  // Ensure og:image:secure_url
  if (updated.includes('property="og:image:secure_url"')) {
    updated = updated.replace(
      /<meta property="og:image:secure_url" content="[^"]*"\s*\/?>/,
      `<meta property="og:image:secure_url" content="${SEO_IMAGE_URL}" />`
    );
  } else {
    updated = updated.replace(
      `<meta property="og:image" content="${SEO_IMAGE_URL}" />`,
      `<meta property="og:image" content="${SEO_IMAGE_URL}" />\n    <meta property="og:image:secure_url" content="${SEO_IMAGE_URL}" />`
    );
  }

  // Ensure og:image:type
  if (updated.includes('property="og:image:type"')) {
    updated = updated.replace(
      /<meta property="og:image:type" content="[^"]*"\s*\/?>/,
      `<meta property="og:image:type" content="image/jpeg" />`
    );
  } else {
    updated = updated.replace(
      `<meta property="og:image:secure_url" content="${SEO_IMAGE_URL}" />`,
      `<meta property="og:image:secure_url" content="${SEO_IMAGE_URL}" />\n    <meta property="og:image:type" content="image/jpeg" />`
    );
  }

  // Ensure og:image:width
  if (updated.includes('property="og:image:width"')) {
    updated = updated.replace(
      /<meta property="og:image:width" content="[^"]*"\s*\/?>/,
      `<meta property="og:image:width" content="${SEO_IMAGE_WIDTH}" />`
    );
  } else {
    updated = updated.replace(
      `<meta property="og:image:type" content="image/jpeg" />`,
      `<meta property="og:image:type" content="image/jpeg" />\n    <meta property="og:image:width" content="${SEO_IMAGE_WIDTH}" />`
    );
  }

  // Ensure og:image:height
  if (updated.includes('property="og:image:height"')) {
    updated = updated.replace(
      /<meta property="og:image:height" content="[^"]*"\s*\/?>/,
      `<meta property="og:image:height" content="${SEO_IMAGE_HEIGHT}" />`
    );
  } else {
    updated = updated.replace(
      `<meta property="og:image:width" content="${SEO_IMAGE_WIDTH}" />`,
      `<meta property="og:image:width" content="${SEO_IMAGE_WIDTH}" />\n    <meta property="og:image:height" content="${SEO_IMAGE_HEIGHT}" />`
    );
  }

  // Ensure og:image:alt
  if (updated.includes('property="og:image:alt"')) {
    updated = updated.replace(
      /<meta property="og:image:alt" content="[^"]*"\s*\/?>/,
      `<meta property="og:image:alt" content="${SEO_IMAGE_ALT}" />`
    );
  } else {
    updated = updated.replace(
      `<meta property="og:image:height" content="${SEO_IMAGE_HEIGHT}" />`,
      `<meta property="og:image:height" content="${SEO_IMAGE_HEIGHT}" />\n    <meta property="og:image:alt" content="${SEO_IMAGE_ALT}" />`
    );
  }

  // Ensure twitter:card is summary_large_image
  if (updated.includes('name="twitter:card"')) {
    updated = updated.replace(
      /<meta name="twitter:card" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:card" content="summary_large_image" />`
    );
  } else {
    updated = updated.replace(
      '</head>',
      `    <meta name="twitter:card" content="summary_large_image" />\n  </head>`
    );
  }

  // Ensure twitter:image
  if (updated.includes('name="twitter:image"')) {
    updated = updated.replace(
      /<meta name="twitter:image" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:image" content="${SEO_IMAGE_URL}" />`
    );
  } else {
    updated = updated.replace(
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:card" content="summary_large_image" />\n    <meta name="twitter:image" content="${SEO_IMAGE_URL}" />`
    );
  }

  // Ensure twitter:image:alt
  if (updated.includes('name="twitter:image:alt"')) {
    updated = updated.replace(
      /<meta name="twitter:image:alt" content="[^"]*"\s*\/?>/,
      `<meta name="twitter:image:alt" content="${SEO_IMAGE_ALT}" />`
    );
  } else {
    updated = updated.replace(
      `<meta name="twitter:image" content="${SEO_IMAGE_URL}" />`,
      `<meta name="twitter:image" content="${SEO_IMAGE_URL}" />\n    <meta name="twitter:image:alt" content="${SEO_IMAGE_ALT}" />`
    );
  }

  // Ensure Google robots max-image-preview:large
  if (updated.includes('name="robots"')) {
    updated = updated.replace(
      /<meta name="robots" content="[^"]*"\s*\/?>/,
      `<meta name="robots" content="index, follow, max-image-preview:large" />`
    );
  } else {
    updated = updated.replace(
      '<link rel="canonical"',
      `<meta name="robots" content="index, follow, max-image-preview:large" />\n    <link rel="canonical"`
    );
  }

  // Replace any stale pouch image references in structured data
  updated = updated.replace(
    /https:\/\/sjtfarms\.com\/images\/sjt_signature_pouch\.jpg/g,
    SEO_IMAGE_URL
  );

  return updated;
}

let templateHtml = fs.readFileSync(templatePath, 'utf8');

// Ensure dist/index.html (the homepage) has guaranteed accurate image metadata
templateHtml = ensureCorrectImageMetadata(templateHtml);
fs.writeFileSync(templatePath, templateHtml, 'utf8');
console.log(`[SUCCESS] Verified and preserved homepage image metadata in ${templatePath}`);

// 1. Static Public Pages
const staticPages = [
  {
    path: 'shop',
    canonical: `${PRODUCTION_DOMAIN}/shop`,
    title: 'SJT Farms — Shop Coffee Powder & Brewing Accessories',
    description: 'Explore SJT Farms artisanal shade-grown coffee powders, traditional South Indian filter kaapi blends, and handcrafted brassware.',
  },
  {
    path: 'brew-guide',
    canonical: `${PRODUCTION_DOMAIN}/brew-guide`,
    title: 'SJT Farms — Coffee Brew Guide & Extraction Masterclass',
    description: 'Step-by-step extraction guides from SJT Farms for traditional South Indian filter kaapi, French Press, Pour Over, Moka Pot, and Cold Brew.',
  },
  {
    path: 'our-farm',
    canonical: `${PRODUCTION_DOMAIN}/our-farm`,
    title: 'SJT Farms — Our Farm & Plantation Heritage',
    description: 'Tour SJT Farms high-elevation shade-grown coffee estate nestled in the Western Ghats of Chikmagalur. Discover our rich soil and sustainable harvest.',
  },
  {
    path: 'about',
    canonical: `${PRODUCTION_DOMAIN}/about`,
    title: 'SJT Farms — About Our Coffee Tradition',
    description: 'Learn about SJT Farms history, our generational dedication to pure shade-grown coffee, and our artisanal roasting philosophy.',
  },
  {
    path: 'reviews',
    canonical: `${PRODUCTION_DOMAIN}/reviews`,
    title: 'SJT Farms — Customer Reviews & Testimonials',
    description: 'Read genuine reviews from coffee patrons across India who start their mornings with SJT Farms signature and strong coffee powders.',
  },
  {
    path: 'subscription',
    canonical: `${PRODUCTION_DOMAIN}/subscription`,
    title: 'SJT Farms — Coffee Subscriptions & Roastery Reserve',
    description: 'Never run out of fresh roast from SJT Farms. Custom weekly, bi-weekly, or monthly delivery schedules with exclusive savings for subscribers.',
  },
  {
    path: 'accessories',
    canonical: `${PRODUCTION_DOMAIN}/accessories`,
    title: 'SJT Farms — Brassware & Coffee Accessories',
    description: 'Handcrafted traditional brass coffee filters, davara tumbler sets, and brewing accessories from SJT Farms built for generational use.',
  },
  {
    path: 'contact',
    canonical: `${PRODUCTION_DOMAIN}/contact`,
    title: 'SJT Farms — Contact & Concierge Support',
    description: 'Get in touch with the SJT Farms estate team for inquiries, bulk orders, or customer support.',
  },
  {
    path: 'faq',
    canonical: `${PRODUCTION_DOMAIN}/faq`,
    title: 'SJT Farms — Frequently Asked Questions',
    description: 'Everything you need to know about SJT Farms roast profiles, brewing techniques, pan-India shipping, and orders.',
  },
];

// 2. Extract Product Pages from products.ts
const productsContent = fs.readFileSync(path.resolve('src/data/products.ts'), 'utf8');
const productBlocks = productsContent.split(/\{\s*id:\s*'/).slice(1);
const productPages = [];

for (const b of productBlocks) {
  const slugMatch = b.match(/slug:\s*'([^']+)'/);
  const nameMatch = b.match(/name:\s*'([^']+)'/);
  const descMatch = b.match(/description:\s*'([^']+)'/);
  if (slugMatch && nameMatch) {
    const slug = slugMatch[1];
    const name = nameMatch[1];
    const description = descMatch ? descMatch[1] : 'Authentic shade-grown coffee batch roasted at SJT Farms in Chikmagalur.';
    productPages.push({
      path: `product/${slug}`,
      canonical: `${PRODUCTION_DOMAIN}/product/${slug}`,
      title: `SJT Farms — ${name}`,
      description: `Authentic shade-grown ${name} batch roasted at SJT Farms from pristine Araku Valley coffee beans. ${description}`,
    });
  }
}

const allPages = [...staticPages, ...productPages];

console.log(`Generating ${allPages.length} static SEO HTML entry points with self-referencing canonical URLs...`);

for (const page of allPages) {
  let html = templateHtml;

  // Replace Canonical Link
  html = html.replace(
    /<link rel="canonical" href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${page.canonical}" />`
  );

  // Replace Open Graph URL
  if (html.includes('property="og:url"')) {
    html = html.replace(
      /<meta property="og:url" content="[^"]*"\s*\/?>/,
      `<meta property="og:url" content="${page.canonical}" />`
    );
  } else {
    html = html.replace(
      '<link rel="canonical"',
      `<meta property="og:url" content="${page.canonical}" />\n    <link rel="canonical"`
    );
  }

  // Replace Title
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${page.title}</title>`
  );
  html = html.replace(
    /<meta name="title" content="[^"]*"\s*\/?>/,
    `<meta name="title" content="${page.title}" />`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${page.title}" />`
  );

  // Replace Description
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${page.description}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${page.description}" />`
  );

  // Replace Twitter Meta Tags
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${page.title}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${page.description}" />`
  );
  html = html.replace(
    /<meta name="twitter:url" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:url" content="${page.canonical}" />`
  );

  const targetDir = path.join(DIST_DIR, page.path);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
}

console.log(`[SUCCESS] Generated ${allPages.length} static SEO pages in dist/ with verified canonical URLs on ${PRODUCTION_DOMAIN}`);
