import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testLiveSite() {
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
      url: `https://sjtfarms.com/#product/araku-instant-coffee-powder`,
    });
    await sleep(4000);

    const title = await evaluate(`document.title`);
    console.log('Title on live site:', title);

    const images = await evaluate(`(() => {
      return Array.from(document.querySelectorAll('main img')).map(img => ({
        alt: img.alt,
        src: img.src
      }));
    })()`);
    console.log('Main images on live site before click:', images);

    // Find and click the 50g button
    const clickResult = await evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn50 = btns.find(b => b.innerText.includes('50g'));
      if (btn50) {
        btn50.click();
        return 'clicked: ' + btn50.innerText.replace(/\\s+/g, ' ');
      }
      return '50g button not found';
    })()`);
    console.log('Click result:', clickResult);

    await sleep(1500);

    const imagesAfter = await evaluate(`(() => {
      return Array.from(document.querySelectorAll('main img')).map(img => ({
        alt: img.alt,
        src: img.src
      }));
    })()`);
    console.log('Main images on live site after click:', imagesAfter);

    ws.close();
  } finally {
    chrome.kill();
  }
}

testLiveSite().catch(console.error);
