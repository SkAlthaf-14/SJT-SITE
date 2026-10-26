import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testLiveSite() {
  console.log('Testing LIVE website https://sjtfarms.com/...');
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

    const testProducts = [
      'araku-instant-coffee-powder',
      'araku-special-blend-filter-coffee',
      'araku-signature-coffee',
      'araku-premium-coffee',
    ];

    for (const slug of testProducts) {
      console.log(`\nNavigating to https://sjtfarms.com/#product/${slug}...`);
      await sendCommand('Page.navigate', {
        url: `https://sjtfarms.com/#product/${slug}`,
      });
      await sleep(3000);

      const before = await evaluate(`(() => {
        const img = document.querySelector('img[alt*="100g"], img[alt*="50g"], .lg\\:col-span-6 img');
        const price = document.querySelector('.font-serif.text-3xl')?.innerText;
        return { src: img?.src, alt: img?.alt, price };
      })()`);
      console.log('  Initial on live site:', before);

      // Click 50g
      const clicked = await evaluate(`(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn50 = btns.find(b => b.innerText.includes('50g'));
        if (btn50) {
          btn50.click();
          return true;
        }
        return false;
      })()`);
      console.log('  Clicked 50g:', clicked);

      await sleep(1000);

      const after = await evaluate(`(() => {
        const img = document.querySelector('img[alt*="100g"], img[alt*="50g"], .lg\\:col-span-6 img');
        const price = document.querySelector('.font-serif.text-3xl')?.innerText;
        const activeWeightLabel = document.querySelector('.text-xs.text-\\[\\#A66A3F\\].font-semibold')?.innerText;
        return { src: img?.src, alt: img?.alt, price, activeWeightLabel };
      })()`);
      console.log('  After clicking 50g on live site:', after);
    }

    ws.close();
  } finally {
    chrome.kill();
  }
}

testLiveSite().catch(console.error);
