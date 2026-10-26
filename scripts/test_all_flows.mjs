import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9226',
    'about:blank',
  ]);

  await sleep(1500);

  try {
    const listRes = await fetch('http://127.0.0.1:9226/json');
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

    console.log('=== TEST 1: HOME PAGE HERO CAROUSEL ===');
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2000);

    // Test Hero product slides (slide 1 to 4)
    for (let slideIdx = 1; slideIdx <= 4; slideIdx++) {
      await evaluate(`(() => {
        const pills = Array.from(document.querySelectorAll('button')).filter(b => b.hasAttribute('aria-label') && b.getAttribute('aria-label').includes('Go to slide ${slideIdx + 1}'));
        if (pills[0]) pills[0].click();
      })()`);
      await sleep(600);

      const slideInfo = await evaluate(`(() => {
        // Find visible slide
        const visibleSlide = Array.from(document.querySelectorAll('.absolute.inset-0')).find(el => el.classList.contains('opacity-100'));
        if (!visibleSlide) return null;
        const title = visibleSlide.querySelector('h2')?.innerText;
        const img = visibleSlide.querySelector('img[alt*="Glass Jar"]');
        return { title, imgSrc: img?.src };
      })()`);
      console.log(`Hero Slide ${slideIdx}:`, slideInfo);

      // Click 50g on this slide
      await evaluate(`(() => {
        const visibleSlide = Array.from(document.querySelectorAll('.absolute.inset-0')).find(el => el.classList.contains('opacity-100'));
        if (visibleSlide) {
          const btn50 = Array.from(visibleSlide.querySelectorAll('button')).find(b => b.innerText.includes('50g'));
          if (btn50) btn50.click();
        }
      })()`);
      await sleep(400);

      const slideAfter50g = await evaluate(`(() => {
        const visibleSlide = Array.from(document.querySelectorAll('.absolute.inset-0')).find(el => el.classList.contains('opacity-100'));
        if (!visibleSlide) return null;
        const img = visibleSlide.querySelector('img[alt*="Glass Jar"]');
        const price = visibleSlide.querySelector('.font-serif.text-3xl')?.innerText;
        return { imgSrc: img?.src, price };
      })()`);
      console.log(`  After clicking 50g:`, slideAfter50g);
    }

    console.log('\n=== TEST 2: HOME PAGE FEATURED COLLECTION CARDS ===');
    const featuredCards = await evaluate(`(() => {
      const cards = Array.from(document.querySelectorAll('#coffee-collection-section .group.relative.bg-white'));
      const results = [];
      for (const card of cards) {
        const title = card.querySelector('h3')?.innerText;
        const img = card.querySelector('.relative.w-full.min-h-\\\\[200px\\\\] img');
        const initialSrc = img?.src;
        const btn50 = Array.from(card.querySelectorAll('button')).find(b => b.innerText.includes('50g'));
        if (btn50) btn50.click();
        const src50 = img?.src;
        const price50 = card.querySelector('.font-serif.text-xl, .font-serif.text-2xl')?.innerText;
        results.push({ title, initialSrc: initialSrc?.replace('http://localhost:5173', ''), src50: src50?.replace('http://localhost:5173', ''), price50 });
      }
      return results;
    })()`);
    console.log('Featured Cards 50g test:', featuredCards);

    console.log('\n=== TEST 3: SIGNATURE PRODUCT SECTION ON HOME PAGE ===');
    const sigProductTest = await evaluate(`(() => {
      const section = Array.from(document.querySelectorAll('section')).find(s => s.innerText.includes('SJT Signature Coffee Powder'));
      if (!section) return null;
      const img = section.querySelector('img');
      const initialSrc = img?.src;
      const btn50 = Array.from(section.querySelectorAll('button')).find(b => b.innerText.trim() === '50g');
      if (btn50) btn50.click();
      const src50 = img?.src;
      const price50 = section.querySelector('.font-serif.text-3xl')?.innerText;
      return { initialSrc: initialSrc?.replace('http://localhost:5173', ''), src50: src50?.replace('http://localhost:5173', ''), price50 };
    })()`);
    console.log('Signature Product section 50g test:', sigProductTest);

    console.log('\n=== TEST 4: CART DRAWER ADDING 50g ===');
    // Click Add to Cart on the 50g Signature Product
    await evaluate(`(() => {
      const section = Array.from(document.querySelectorAll('section')).find(s => s.innerText.includes('SJT Signature Coffee Powder'));
      if (section) {
        const addBtn = Array.from(section.querySelectorAll('button')).find(b => b.innerText.includes('ADD TO CART'));
        if (addBtn) addBtn.click();
      }
    })()`);
    await sleep(800);

    const cartDrawerItems = await evaluate(`(() => {
      const drawer = document.querySelector('[role="dialog"][aria-label="Shopping Cart"]');
      if (!drawer) return null;
      const items = Array.from(drawer.querySelectorAll('.flex.gap-3\\.5.p-3\\.5')).map(el => {
        const title = el.querySelector('h4')?.innerText;
        const weight = el.querySelector('.text-\\\\[11px\\\\]')?.innerText;
        const price = el.querySelector('.font-serif.font-bold')?.innerText;
        const img = el.querySelector('img');
        return { title, weight, price, imgSrc: img?.src?.replace('http://localhost:5173', '') };
      });
      return items;
    })()`);
    console.log('Cart Drawer Items after adding 50g:', cartDrawerItems);

    console.log('\n=== TEST 5: CHECKOUT PAGE SUMMARY WITH 50g ===');
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/#checkout' });
    await sleep(2000);

    const checkoutSummary = await evaluate(`(() => {
      const summaryItems = Array.from(document.querySelectorAll('.max-h-60 .flex.gap-2\\.5')).map(el => {
        const title = el.querySelector('h3')?.innerText;
        const weight = el.querySelector('span')?.innerText;
        const img = el.querySelector('img');
        return { title, weight, imgSrc: img?.src?.replace('http://localhost:5173', '') };
      });
      return summaryItems;
    })()`);
    console.log('Checkout page order summary items:', checkoutSummary);

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch(console.error);
