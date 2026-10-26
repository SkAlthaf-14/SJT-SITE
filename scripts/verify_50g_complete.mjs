import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('Starting comprehensive verification of 50g variant...');
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9233',
    'about:blank',
  ]);

  await sleep(2000);

  try {
    const listRes = await fetch('http://127.0.0.1:9233/json');
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
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

    async function waitForCondition(fnExpr, timeoutMs = 8000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const res = await evaluate(fnExpr);
        if (res) return res;
        await sleep(200);
      }
      return null;
    }

    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');

    const products = [
      {
        id: 'araku-instant-coffee-powder',
        slug: 'araku-instant-coffee-powder',
        name: 'Araku Instant Coffee Powder',
        jar50: 'araku-instant-50g-jar.png',
        jar100: 'araku-instant-100g-jar.png',
        jar250: 'araku-instant-250g-jar.png',
        price50: '₹99',
        price100: '₹199',
        price250: '₹479',
      },
      {
        id: 'araku-special-blend-filter-coffee',
        slug: 'araku-special-blend-filter-coffee',
        name: 'Araku Special Blend Filter Coffee',
        jar50: 'araku-special-blend-50g-jar.png',
        jar100: 'araku-special-blend-100g-jar.png',
        jar250: 'araku-special-blend-250g-jar.png',
        price50: '₹69',
        price100: '₹149',
        price250: '₹329',
      },
      {
        id: 'araku-signature-coffee',
        slug: 'araku-signature-coffee',
        name: 'Araku Signature Coffee Powder',
        jar50: 'araku-signature-50g-jar.png',
        jar100: 'araku-signature-100g-jar.png',
        jar250: 'araku-signature-250g-jar.png',
        price50: '₹49',
        price100: '₹119',
        price250: '₹219',
      },
      {
        id: 'araku-premium-coffee',
        slug: 'araku-premium-coffee',
        name: 'Araku Premium Coffee Powder',
        jar50: 'araku-premium-50g-jar.png',
        jar100: 'araku-premium-100g-jar.png',
        jar250: 'araku-premium-250g-jar.png',
        price50: '₹49',
        price100: '₹109',
        price250: '₹199',
      },
    ];

    let overallSuccess = true;

    // First, warm up the page
    console.log('\nWarming up local dev server...');
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/' });
    await waitForCondition(`Boolean(document.querySelector('header'))`);
    await sleep(1000);

    console.log('\n===============================================================');
    console.log('TEST SUITE 1: PRODUCT DETAIL PAGE 50g / 100g / 250g VERIFICATION');
    console.log('===============================================================');
    for (const p of products) {
      console.log(`\nTesting PDP for: ${p.name}`);
      await sendCommand('Page.navigate', { url: `http://localhost:5173/#product/${p.slug}` });
      await waitForCondition(`Boolean(document.querySelector('.aspect-\\\\[1\\\\/1\\\\] img'))`);

      // Check default (100g)
      const defState = await evaluate(`(() => {
        const img = document.querySelector('.aspect-\\\\[1\\\\/1\\\\] img');
        const price = document.querySelector('.font-serif.text-3xl')?.innerText;
        return { src: img ? img.src : '', price };
      })()`);
      console.log(`  Initial (100g): img=${defState.src.split('/').pop()}, price=${defState.price}`);
      if (!defState.src.includes(p.jar100)) {
        console.error(`  ✗ Default 100g check failed for ${p.name}`);
        overallSuccess = false;
      }

      // Switch to 50g
      await evaluate(`(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn50 = btns.find(b => b.innerText.includes('50g') && b.innerText.includes('${p.price50}'));
        if (btn50) btn50.click();
      })()`);
      await sleep(350);

      const state50 = await evaluate(`(() => {
        const img = document.querySelector('.aspect-\\\\[1\\\\/1\\\\] img');
        const price = document.querySelector('.font-serif.text-3xl')?.innerText;
        const netWeight = Array.from(document.querySelectorAll('span')).find(s => s.innerText.includes('Net Weight:'))?.innerText;
        return { src: img ? img.src : '', price, netWeight };
      })()`);

      const has50Jar = state50.src.includes(p.jar50);
      const has50Price = state50.price && state50.price.includes(p.price50);
      const has50Label = state50.netWeight && state50.netWeight.includes('50g');

      if (has50Jar && has50Price && has50Label) {
        console.log(`  ✓ 50g variant PASSED: image=${p.jar50}, price=${p.price50}, label="${state50.netWeight}"`);
      } else {
        console.error(`  ✗ 50g variant FAILED: expected jar=${p.jar50}, price=${p.price50}; got jar=${state50.src}, price=${state50.price}, label=${state50.netWeight}`);
        overallSuccess = false;
      }

      // Switch to 250g to verify 250g is completely unchanged
      await evaluate(`(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn250 = btns.find(b => b.innerText.includes('250g') && b.innerText.includes('${p.price250}'));
        if (btn250) btn250.click();
      })()`);
      await sleep(350);

      const state250 = await evaluate(`(() => {
        const img = document.querySelector('.aspect-\\\\[1\\\\/1\\\\] img');
        const price = document.querySelector('.font-serif.text-3xl')?.innerText;
        return { src: img ? img.src : '', price };
      })()`);

      if (state250.src.includes(p.jar250) && state250.price?.includes(p.price250)) {
        console.log(`  ✓ 250g variant unchanged & verified: image=${p.jar250}, price=${p.price250}`);
      } else {
        console.error(`  ✗ 250g variant check failed for ${p.name}`);
        overallSuccess = false;
      }

      // Switch BACK to 50g
      await evaluate(`(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn50 = btns.find(b => b.innerText.includes('50g') && b.innerText.includes('${p.price50}'));
        if (btn50) btn50.click();
      })()`);
      await sleep(350);

      const state50Again = await evaluate(`(() => {
        const img = document.querySelector('.aspect-\\\\[1\\\\/1\\\\] img');
        return img ? img.src : '';
      })()`);

      if (state50Again.includes(p.jar50)) {
        console.log(`  ✓ Re-switching to 50g PASSED: image correctly stays ${p.jar50}`);
      } else {
        console.error(`  ✗ Re-switching to 50g failed for ${p.name}`);
        overallSuccess = false;
      }
    }

    console.log('\n===============================================================');
    console.log('TEST SUITE 2: SHOP PAGE PRODUCT CARD 50g SELECTION');
    console.log('===============================================================');
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/#shop' });
    await waitForCondition(`Boolean(document.querySelector('.group.relative.bg-white.rounded-3xl'))`);

    // Clear cart first
    await evaluate(`localStorage.removeItem('sjt_cart')`);

    for (const p of products) {
      console.log(`\nTesting ProductCard for: ${p.name}`);
      // Select 50g on card
      await evaluate(`(() => {
        const cards = Array.from(document.querySelectorAll('.group.relative.bg-white.rounded-3xl'));
        const card = cards.find(c => c.innerText.includes('${p.name}'));
        if (!card) return;
        const buttons = Array.from(card.querySelectorAll('button'));
        const btn50 = buttons.find(b => b.innerText.includes('50g') && b.innerText.includes('${p.price50}'));
        if (btn50) btn50.click();
      })()`);

      await sleep(400);

      // Verify card image & label after selecting 50g
      const cardState = await evaluate(`(() => {
        const cards = Array.from(document.querySelectorAll('.group.relative.bg-white.rounded-3xl'));
        const card = cards.find(c => c.innerText.includes('${p.name}'));
        if (!card) return null;
        const img = card.querySelector('img');
        const price = card.querySelector('.font-serif.text-xl, .font-serif.text-2xl')?.innerText;
        const label = card.innerText.includes('Glass Jar • 50g');
        return { src: img ? img.src : '', price, label };
      })()`);

      if (cardState && cardState.src.includes(p.jar50) && cardState.price?.includes(p.price50) && cardState.label) {
        console.log(`  ✓ ProductCard 50g selection PASSED: image=${p.jar50}, price=${cardState.price}, label="Glass Jar • 50g"`);
      } else {
        console.error(`  ✗ ProductCard 50g selection FAILED: ${JSON.stringify(cardState)}`);
        overallSuccess = false;
      }

      // Add to Cart from Card
      await evaluate(`(() => {
        const cards = Array.from(document.querySelectorAll('.group.relative.bg-white.rounded-3xl'));
        const card = cards.find(c => c.innerText.includes('${p.name}'));
        if (!card) return;
        const addBtn = Array.from(card.querySelectorAll('button')).find(b => b.innerText.includes('ADD') || b.querySelector('svg.lucide-shopping-bag'));
        if (addBtn) addBtn.click();
      })()`);

      await sleep(600);
    }

    console.log('\n===============================================================');
    console.log('TEST SUITE 3: CART DRAWER 50g VARIANT & IMAGE VERIFICATION');
    console.log('===============================================================');
    const drawerItems = await evaluate(`(() => {
      const drawer = document.querySelector('[role="dialog"][aria-label="Shopping Cart"]');
      if (!drawer) return [];
      const items = Array.from(drawer.querySelectorAll('.flex.gap-3\\\\.5'));
      return items.map(it => ({
        title: it.querySelector('h4')?.innerText,
        weight: it.innerText.toLowerCase().includes('50g') ? '50g' : 'other',
        imgSrc: it.querySelector('img')?.src || '',
      }));
    })()`);

    console.log(`Cart Drawer contains ${drawerItems.length} items:`);
    for (const item of drawerItems) {
      console.log(`  - ${item.title}: weight=${item.weight}, img=${item.imgSrc.split('/').pop()}`);
      if (!item.imgSrc.includes('-50g-jar.png') || item.weight !== '50g') {
        console.error(`  ✗ Drawer item failed 50g check: ${JSON.stringify(item)}`);
        overallSuccess = false;
      } else {
        console.log(`    ✓ 50g jar preserved in Cart Drawer`);
      }
    }

    console.log('\n===============================================================');
    console.log('TEST SUITE 4: CART PAGE 50g PERSISTENCE');
    console.log('===============================================================');
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/#cart' });
    await waitForCondition(`Boolean(document.querySelector('.divide-y > .py-6'))`);

    const cartPageItems = await evaluate(`(() => {
      const rows = Array.from(document.querySelectorAll('.divide-y > .py-6'));
      return rows.map(r => ({
        title: r.querySelector('h3')?.innerText,
        imgSrc: r.querySelector('img')?.src || '',
        weightText: r.innerText.includes('Pack Size: 50g'),
      }));
    })()`);

    console.log(`Cart Page contains ${cartPageItems.length} items:`);
    for (const item of cartPageItems) {
      console.log(`  - ${item.title}: img=${item.imgSrc.split('/').pop()}, weight=50g`);
      if (!item.imgSrc.includes('-50g-jar.png') || !item.weightText) {
        console.error(`  ✗ Cart Page item failed 50g check: ${JSON.stringify(item)}`);
        overallSuccess = false;
      } else {
        console.log(`    ✓ 50g jar and label verified on Cart Page`);
      }
    }

    console.log('\n===============================================================');
    console.log('TEST SUITE 5: CHECKOUT ORDER SUMMARY 50g PERSISTENCE');
    console.log('===============================================================');
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/#checkout' });
    await waitForCondition(`Boolean(document.querySelector('.max-h-60 > div'))`);

    const checkoutItems = await evaluate(`(() => {
      const rows = Array.from(document.querySelectorAll('.max-h-60 > div'));
      return rows.map(r => ({
        title: r.querySelector('h3')?.innerText,
        imgSrc: r.querySelector('img')?.src || '',
        text: r.innerText.replace(/\\n/g, ' '),
      }));
    })()`);

    console.log(`Checkout Order Summary contains ${checkoutItems.length} items:`);
    for (const item of checkoutItems) {
      console.log(`  - ${item.title}: img=${item.imgSrc.split('/').pop()}, text=${item.text}`);
      if (!item.imgSrc.includes('-50g-jar.png') || !item.text.includes('50g')) {
        console.error(`  ✗ Checkout item failed 50g check: ${JSON.stringify(item)}`);
        overallSuccess = false;
      } else {
        console.log(`    ✓ 50g jar and variant label verified on Checkout Page`);
      }
    }

    console.log('\n===============================================================');
    if (overallSuccess) {
      console.log('>>> ALL VERIFICATION SUITES PASSED! 50g VARIANT FIX IS 100% COMPLETE & VERIFIED <<<');
    } else {
      console.error('>>> FAILURES DETECTED! SEE LOGS ABOVE <<<');
    }
    console.log('===============================================================');

    ws.close();
  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    chrome.kill();
  }
}

run();
