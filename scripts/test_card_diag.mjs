import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9227',
    'about:blank',
  ]);

  await sleep(1500);

  try {
    const listRes = await fetch('http://127.0.0.1:9227/json');
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

    await sendCommand('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2000);

    const cardDiag = await evaluate(`(() => {
      const cards = Array.from(document.querySelectorAll('#coffee-collection-section .group.relative.bg-white'));
      const c = cards[0];
      const title = c.querySelector('h3')?.innerText;
      const allButtons = Array.from(c.querySelectorAll('button')).map(b => ({
        text: b.innerText,
        className: b.className
      }));
      const imgBefore = c.querySelector('.relative.w-full.min-h-\\\\[200px\\\\] img')?.src;
      
      const btn50 = Array.from(c.querySelectorAll('button')).find(b => b.innerText.includes('50g'));
      let clicked = false;
      if (btn50) {
        btn50.click();
        clicked = true;
      }
      return { title, allButtons, imgBefore, clicked };
    })()`);
    console.log('Diagnosis before sleep:', cardDiag);

    await sleep(500);

    const cardAfter = await evaluate(`(() => {
      const cards = Array.from(document.querySelectorAll('#coffee-collection-section .group.relative.bg-white'));
      const c = cards[0];
      const imgAfter = c.querySelector('.relative.w-full.min-h-\\\\[200px\\\\] img')?.src;
      const priceAfter = c.querySelector('.font-serif.text-xl, .font-serif.text-2xl')?.innerText;
      const activeBtn = Array.from(c.querySelectorAll('button')).find(b => b.className.includes('ring-2'))?.innerText;
      return { imgAfter, priceAfter, activeBtn };
    })()`);
    console.log('Diagnosis after 500ms:', cardAfter);

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch(console.error);
