import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9224',
    'about:blank',
  ]);

  await sleep(1500);

  try {
    const listRes = await fetch('http://127.0.0.1:9224/json');
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');
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
      { slug: 'araku-instant-coffee-powder', name: 'Araku Instant Coffee Powder' },
      { slug: 'araku-special-blend-filter-coffee', name: 'Araku Special Blend Filter Coffee' },
      { slug: 'araku-signature-coffee', name: 'Araku Signature Coffee Powder' },
      { slug: 'araku-premium-coffee', name: 'Araku Premium Coffee Powder' },
    ];

    console.log('--- TESTING PRODUCT DETAIL PAGES ---');
    for (const p of products) {
      console.log(`\nTesting: ${p.name}`);
      await sendCommand('Page.navigate', {
        url: `http://localhost:5173/#product/${p.slug}`,
      });
      await sleep(1500);

      for (const size of ['50g', '100g', '250g']) {
        const clickResult = await evaluate(`(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const btn = btns.find(b => b.innerText.includes('${size}'));
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        })()`);
        await sleep(400);

        const state = await evaluate(`(() => {
          const mainImg = document.querySelector('.aspect-\\\\[1\\\\/1\\\\] img');
          const priceEl = document.querySelector('.font-serif.text-3xl');
          const netWeightEl = Array.from(document.querySelectorAll('span')).find(s => s.innerText.includes('Net Weight:'));
          return {
            imgSrc: mainImg ? mainImg.src.replace('http://localhost:5173', '') : null,
            imgAlt: mainImg ? mainImg.alt : null,
            price: priceEl ? priceEl.innerText : null,
            netWeight: netWeightEl ? netWeightEl.innerText : null,
          };
        })()`);
        console.log(`  Size ${size}: click=${clickResult} -> image=${state.imgSrc} | price=${state.price} | netWeight=${state.netWeight}`);
      }
    }

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch(console.error);
