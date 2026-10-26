import https from 'https';

https.get('https://sjtfarms.com/', (res) => {
  let html = '';
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    console.log('Production HTTP Status:', res.statusCode);
    const iconRegex = /<link[^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*>/gi;
    const matches = html.match(iconRegex);
    console.log('\n--- Favicon Links in Live Production HTML ---');
    if (matches) {
      matches.forEach(m => console.log('✓', m));
    } else {
      console.log('No icon matches found.');
    }

    console.log('\n--- Organization JSON-LD in Live Production HTML ---');
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (jsonLdMatch) {
      try {
        const parsed = JSON.parse(jsonLdMatch[1]);
        const org = parsed['@graph']?.find(item => Array.isArray(item['@type']) ? item['@type'].includes('Organization') : item['@type'] === 'Organization');
        if (org) {
          console.log('✓ Organization Name:', org.name);
          console.log('✓ Organization Logo:', org.logo);
          console.log('✓ Organization URL:', org.url);
        }
      } catch (e) {
        console.error('Error parsing JSON-LD:', e.message);
      }
    }

    console.log('\n--- Canonical Link in Live Production HTML ---');
    const canon = html.match(/<link rel="canonical" href="[^"]+"/);
    if (canon) {
      console.log('✓', canon[0] + ' />');
    }
  });
});
