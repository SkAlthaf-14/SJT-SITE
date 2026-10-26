import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTest() {
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

    await sendCommand('Page.navigate', {
      url: `http://localhost:5173/#shop`,
    });
    await sleep(2000);

    // Click 50g on first card
    await evaluate(`(() => {
      const firstCard = document.querySelector('.group.relative.bg-white.rounded-3xl');
      const btn50 = Array.from(firstCard.querySelectorAll('button')).find(b => b.innerText.includes('50g'));
      if (btn50) btn50.click();
    })()`);

    await sleep(600);

    const firstCardAfter = await evaluate(`(() => {
      const firstCard = document.querySelector('.group.relative.bg-white.rounded-3xl');
      const img = firstCard.querySelector('img[loading="lazy"]');
      const price = firstCard.querySelector('.font-serif.text-xl, .font-serif.text-2xl')?.innerText;
      return {
        src: img?.src,
        alt: img?.alt,
        price
      };
    })()`);

    console.log('First card after clicking 50g (with wait):', firstCardAfter);

    ws.close();
  } finally {
    chrome.kill();
  }
}

runTest().catch(console.error);
