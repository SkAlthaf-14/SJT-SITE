import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('Starting headless Chrome...');
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    'about:blank',
  ]);

  await sleep(1500);

  try {
    const listRes = await fetch('http://127.0.0.1:9222/json');
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg);
        callbacks.delete(msg.id);
      }
    };

    await new Promise((res) => (ws.onopen = res));

    function sendCommand(method, params = {}) {
      return new Promise((resolve, reject) => {
        const cmdId = id++;
        callbacks.set(cmdId, (result) => {
          if (result.error) reject(result.error);
          else resolve(result.result);
        });
        ws.send(JSON.stringify({ id: cmdId, method, params }));
      });
    }

    async function evaluate(expression) {
      const res = await sendCommand('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      return res?.result?.value;
    }

    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');

    const products = [
      { slug: 'araku-instant-coffee-powder', name: 'Instant Coffee', p50: '₹99', p100: '₹199', p250: '₹479', imgKey: 'araku-instant' },
      { slug: 'araku-special-blend-filter-coffee', name: 'Special Blend', p50: '₹69', p100: '₹149', p250: '₹329', imgKey: 'araku-special-blend' },
      { slug: 'araku-signature-coffee', name: 'Signature Coffee', p50: '₹49', p100: '₹119', p250: '₹219', imgKey: 'araku-signature' },
      { slug: 'araku-premium-coffee', name: 'Premium Coffee', p50: '₹49', p100: '₹109', p250: '₹199', imgKey: 'araku-premium' },
    ];

    console.log('\n======================================================');
    console.log('PART 1: TESTING PRODUCT DETAIL PAGES (50g, 100g, 250g)');
    console.log('======================================================');

    for (const prod of products) {
      console.log(`\nTesting ${prod.name} (#product/${prod.slug})...`);
      await sendCommand('Page.navigate', {
        url: `http://localhost:5173/#product/${prod.slug}`,
      });
      await sleep(1500);

      // Verify default 100g
      const s100 = await evaluate(`(() => {
        const img = document.querySelector('img[alt*="${prod.name}"]') || document.querySelector('.lg\\:col-span-6 img');
        const price = document.querySelector('.font-serif.text-3xl')?.innerText;
        return { src: img?.src, price };
      })()`);
      console.log(`  [Default 100g] src: ${s100.src}`);
      console.log(`                 price: ${s100.price}`);

      // Click 50g
      await evaluate(`(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn50 = btns.find(b => b.innerText.includes('50g') && b.innerText.includes('${prod.p50}'));
        if (btn50) btn50.click();
      })()`);
      await sleep(600);

      const s50 = await evaluate(`(() => {
        const img = document.querySelector('img[alt*="${prod.name}"]') || document.querySelector('.lg\\:col-span-6 img');
        const price = document.querySelector('.font-serif.text-3xl')?.innerText;
        return { src: img?.src, price };
      })()`);
      console.log(`  [Select 50g]   src: ${s50.src}`);
      console.log(`                 price: ${s50.price}`);

      // Click 250g
      await evaluate(`(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn250 = btns.find(b => b.innerText.includes('250g') && b.innerText.includes('${prod.p250}'));
        if (btn250) btn250.click();
      })()`);
      await sleep(600);

      const s250 = await evaluate(`(() => {
        const img = document.querySelector('img[alt*="${prod.name}"]') || document.querySelector('.lg\\:col-span-6 img');
        const price = document.querySelector('.font-serif.text-3xl')?.innerText;
        return { src: img?.src, price };
      })()`);
      console.log(`  [Select 250g]  src: ${s250.src}`);
      console.log(`                 price: ${s250.price}`);
    }

    console.log('\n======================================================');
    console.log('PART 2: TESTING PRODUCT CARD VARIANT SELECTOR ON SHOP PAGE');
    console.log('======================================================');

    await sendCommand('Page.navigate', {
      url: `http://localhost:5173/#shop`,
    });
    await sleep(2000);

    const cardTest = await evaluate(`(() => {
      const cards = Array.from(document.querySelectorAll('.group.relative.bg-white.rounded-3xl'));
      const results = [];
      for (const card of cards.slice(0, 4)) {
        const title = card.querySelector('h3')?.innerText;
        const img = card.querySelector('img[loading="lazy"]');
        const btn50 = Array.from(card.querySelectorAll('button')).find(b => b.innerText.includes('50g'));
        const btn100 = Array.from(card.querySelectorAll('button')).find(b => b.innerText.includes('100g'));
        
        const initialSrc = img?.src;
        if (btn50) btn50.click();
        const src50 = img?.src;
        
        results.push({ title, initialSrc, src50 });
      }
      return results;
    })()`);
    console.log('Shop page cards after clicking 50g:', cardTest);

    ws.close();
  } finally {
    chrome.kill();
  }
}

runTest().catch(console.error);
