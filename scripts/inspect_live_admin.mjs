import https from 'https';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  try {
    const html = await fetchUrl('https://sjtfarms.com/admin');
    console.log('HTML length:', html.length);
    const jsMatches = [...html.matchAll(/src=["']([^"']+\.js)["']/g)].map(m => m[1]);
    console.log('JS files:', jsMatches);
    for (const js of jsMatches) {
      const url = js.startsWith('http') ? js : `https://sjtfarms.com${js.startsWith('/') ? '' : '/'}${js}`;
      console.log('Fetching', url);
      const data = await fetchUrl(url);
      console.log('Downloaded', js, 'length:', data.length);
      const idx = data.indexOf('adminVerifyPayment');
      if (idx !== -1) {
        console.log('FOUND adminVerifyPayment in', js);
        console.log(data.slice(Math.max(0, idx - 150), Math.min(data.length, idx + 400)));
      }
      const idxUtr = data.indexOf('utr_reservations');
      if (idxUtr !== -1) {
        console.log('FOUND utr_reservations in', js);
        console.log(data.slice(Math.max(0, idxUtr - 150), Math.min(data.length, idxUtr + 400)));
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}
run();
