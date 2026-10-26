import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9225',
    'about:blank',
  ]);

  await sleep(1500);

  try {
    const listRes = await fetch('http://127.0.0.1:9225/json');
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('BROWSER CONSOLE:', msg.params.type, msg.params.args.map(a => a.value || a.description));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('BROWSER EXCEPTION:', msg.params.exceptionDetails);
      }
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

    console.log('Navigating to http://localhost:5173/#product/araku-instant-coffee-powder ...');
    await sendCommand('Page.navigate', {
      url: 'http://localhost:5173/#product/araku-instant-coffee-powder',
    });
    await sleep(2000);

    const step1 = await evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('50g'));
      return btns.map(b => ({
        text: b.innerText,
        className: b.className,
        outerHTML: b.outerHTML
      }));
    })()`);
    console.log('50g buttons found before click:', step1);

    // Click 50g button
    const clickAction = await evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn50 = btns.find(b => b.innerText.includes('50g') && b.innerText.includes('₹99'));
      if (!btn50) return { error: 'No 50g ₹99 button found' };
      btn50.click();
      return { clicked: true, hashNow: window.location.hash };
    })()`);
    console.log('Click action result:', clickAction);

    await sleep(100);
    const immediate = await evaluate(`(() => {
      const mainImg = document.querySelector('.aspect-\\\\[1\\\\/1\\\\] img');
      const netWeightEl = Array.from(document.querySelectorAll('span')).find(s => s.innerText.includes('Net Weight:'));
      return {
        hash: window.location.hash,
        imgSrc: mainImg?.src,
        netWeight: netWeightEl?.innerText
      };
    })()`);
    console.log('Immediately after click (100ms):', immediate);

    await sleep(1000);
    const after1s = await evaluate(`(() => {
      const mainImg = document.querySelector('.aspect-\\\\[1\\\\/1\\\\] img');
      const netWeightEl = Array.from(document.querySelectorAll('span')).find(s => s.innerText.includes('Net Weight:'));
      return {
        hash: window.location.hash,
        imgSrc: mainImg?.src,
        netWeight: netWeightEl?.innerText
      };
    })()`);
    console.log('After 1000ms:', after1s);

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch(console.error);
