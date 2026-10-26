import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9228',
    'about:blank',
  ]);

  await sleep(1500);

  try {
    const listRes = await fetch('http://127.0.0.1:9228/json');
    const targets = await listRes.json();
    const ws = new WebSocket(targets[0].webSocketDebuggerUrl);

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

    console.log('--- TEST: ADD 50g TO CART FROM PRODUCT DETAIL PAGE ---');
    await sendCommand('Page.navigate', {
      url: 'http://localhost:5173/#product/araku-instant-coffee-powder',
    });
    await sleep(2000);

    // Click 50g button
    await evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn50 = btns.find(b => b.innerText.includes('50g') && b.innerText.includes('₹99'));
      if (btn50) btn50.click();
    })()`);
    await sleep(500);

    // Click Add to Cart
    const addResult = await evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.innerText.includes('ADD TO CART'));
      if (addBtn) {
        addBtn.click();
        return true;
      }
      return false;
    })()`);
    console.log('Clicked Add to Cart:', addResult);
    await sleep(1000);

    // Inspect CartDrawer
    const drawerState = await evaluate(`(() => {
      const drawer = document.querySelector('[role="dialog"][aria-label="Shopping Cart"]');
      if (!drawer) return { error: 'Drawer not found' };
      const imgs = Array.from(drawer.querySelectorAll('img')).map(i => ({ src: i.src, alt: i.alt }));
      const text = drawer.innerText;
      return { imgs, text: text.slice(0, 300) };
    })()`);
    console.log('Cart Drawer State:', drawerState);

    // Navigate to /#cart
    console.log('\n--- TEST: CART PAGE (/#cart) ---');
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/#cart' });
    await sleep(2000);

    const cartPageState = await evaluate(`(() => {
      const imgs = Array.from(document.querySelectorAll('img')).map(i => ({ src: i.src, alt: i.alt }));
      const items = Array.from(document.querySelectorAll('.py-6')).map(row => ({
        text: row.innerText.replace(/\\n/g, ' | '),
        imgSrc: row.querySelector('img')?.src
      }));
      return { items, imgs };
    })()`);
    console.log('Cart Page Items:', cartPageState.items);

    // Navigate to /#checkout
    console.log('\n--- TEST: CHECKOUT PAGE (/#checkout) ---');
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/#checkout' });
    await sleep(2000);

    const checkoutState = await evaluate(`(() => {
      const items = Array.from(document.querySelectorAll('.max-h-60 .flex.gap-2\\.5, .max-h-60 .flex.gap-3')).map(row => ({
        text: row.innerText.replace(/\\n/g, ' | '),
        imgSrc: row.querySelector('img')?.src
      }));
      return { items };
    })()`);
    console.log('Checkout Page Items:', checkoutState.items);

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch(console.error);
