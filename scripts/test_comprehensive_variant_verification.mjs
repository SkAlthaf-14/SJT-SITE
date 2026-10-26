import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('Launching headless Chrome for comprehensive testing...');
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9230',
    'about:blank',
  ]);

  await sleep(2000);

  try {
    const listRes = await fetch('http://127.0.0.1:9230/json');
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

    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');

    const products = [
      {
        slug: 'araku-instant-coffee-powder',
        name: 'Araku Instant Coffee Powder',
        variants: {
          '50g': { img: 'araku-instant-50g-jar.png', price: '₹99' },
          '100g': { img: 'araku-instant-100g-jar.png', price: '₹199' },
          '250g': { img: 'araku-instant-250g-jar.png', price: '₹479' },
        },
      },
      {
        slug: 'araku-special-blend-filter-coffee',
        name: 'Araku Special Blend Filter Coffee',
        variants: {
          '50g': { img: 'araku-special-blend-50g-jar.png', price: '₹69' },
          '100g': { img: 'araku-special-blend-100g-jar.png', price: '₹149' },
          '250g': { img: 'araku-special-blend-250g-jar.png', price: '₹329' },
        },
      },
      {
        slug: 'araku-signature-coffee',
        name: 'Araku Signature Coffee Powder',
        variants: {
          '50g': { img: 'araku-signature-50g-jar.png', price: '₹49' },
          '100g': { img: 'araku-signature-100g-jar.png', price: '₹119' },
          '250g': { img: 'araku-signature-250g-jar.png', price: '₹219' },
        },
      },
      {
        slug: 'araku-premium-coffee',
        name: 'Araku Premium Coffee Powder',
        variants: {
          '50g': { img: 'araku-premium-50g-jar.png', price: '₹49' },
          '100g': { img: 'araku-premium-100g-jar.png', price: '₹109' },
          '250g': { img: 'araku-premium-250g-jar.png', price: '₹199' },
        },
      },
    ];

    let allTestsPassed = true;

    console.log('===============================================================');
    console.log('TEST SUITE 1: PRODUCT DETAIL PAGE VARIANT SWITCHING (DESKTOP)');
    console.log('===============================================================');

    for (const p of products) {
      console.log(`\nTesting Product: ${p.name} (/#product/${p.slug})`);
      await sendCommand('Page.navigate', {
        url: `http://localhost:5173/#product/${p.slug}`,
      });
      await sleep(1500);

      // Repeated switching test: 100g -> 50g -> 250g -> 50g -> 100g
      const sequence = ['100g', '50g', '250g', '50g', '100g'];
      for (const size of sequence) {
        const expected = p.variants[size];
        await evaluate(`(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const btn = btns.find(b => b.innerText.includes('${size}') && b.innerText.includes('${expected.price}'));
          if (btn) btn.click();
        })()`);
        await sleep(350);

        const state = await evaluate(`(() => {
          const img = document.querySelector('.aspect-\\\\[1\\\\/1\\\\] img');
          const price = document.querySelector('.font-serif.text-3xl')?.innerText;
          const netWeight = Array.from(document.querySelectorAll('span')).find(s => s.innerText.includes('Net Weight:'))?.innerText;
          return {
            imgSrc: img ? img.src : null,
            price,
            netWeight,
          };
        })()`);

        const imgMatches = state.imgSrc && state.imgSrc.includes(expected.img);
        const priceMatches = state.price && state.price.includes(expected.price);
        const netWeightMatches = state.netWeight && state.netWeight.includes(size);

        if (imgMatches && priceMatches && netWeightMatches) {
          console.log(`  ✓ Variant ${size}: image matches (${expected.img}), price matches (${expected.price}), netWeight matches`);
        } else {
          allTestsPassed = false;
          console.error(`  ✗ FAILED Variant ${size}: expected ${expected.img} & ${expected.price}, got img=${state.imgSrc}, price=${state.price}, netWeight=${state.netWeight}`);
        }
      }
    }

    console.log('\n===============================================================');
    console.log('TEST SUITE 2: CART DRAWER, CART PAGE & CHECKOUT PERSISTENCE');
    console.log('===============================================================');

    // Clear cart first
    await evaluate(`localStorage.removeItem('sjt_cart')`);

    for (const p of products) {
      console.log(`\nTesting Cart Add for 50g: ${p.name}`);
      await sendCommand('Page.navigate', {
        url: `http://localhost:5173/#product/${p.slug}`,
      });
      await sleep(1500);

      // Select 50g
      const exp50 = p.variants['50g'];
      await evaluate(`(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.innerText.includes('50g') && b.innerText.includes('${exp50.price}'));
        if (btn) btn.click();
      })()`);
      await sleep(400);

      // Click ADD TO CART
      await evaluate(`(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const addBtn = btns.find(b => b.innerText.includes('ADD TO CART') || b.innerText.includes('Added to Cart'));
        if (addBtn) addBtn.click();
      })()`);
      await sleep(800);

      // Check Cart Drawer
      const drawerItem = await evaluate(`(() => {
        const drawer = document.querySelector('[role="dialog"][aria-label="Shopping Cart"]');
        if (!drawer) return null;
        const items = Array.from(drawer.querySelectorAll('.flex.gap-3\\\\.5'));
        const lastItem = items[items.length - 1];
        if (!lastItem) return null;
        return {
          imgSrc: lastItem.querySelector('img')?.src,
          title: lastItem.querySelector('h4')?.innerText,
          weightText: lastItem.innerText,
        };
      })()`);

      if (drawerItem && drawerItem.imgSrc && drawerItem.imgSrc.includes(exp50.img)) {
        console.log(`  ✓ Cart Drawer: 50g variant correctly displays ${exp50.img}`);
      } else {
        allTestsPassed = false;
        console.error(`  ✗ Cart Drawer FAILED: expected ${exp50.img}, got ${drawerItem?.imgSrc}`);
      }
    }

    // Now inspect Cart Page
    console.log('\nNavigating to Cart Page (/#cart)...');
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/#cart' });
    await sleep(1500);

    const cartPageItems = await evaluate(`(() => {
      const rows = Array.from(document.querySelectorAll('.divide-y > .py-6'));
      return rows.map(r => ({
        title: r.querySelector('h3')?.innerText,
        imgSrc: r.querySelector('img')?.src,
        text: r.innerText.replace(/\\n/g, ' | '),
      }));
    })()`);

    console.log(`Found ${cartPageItems.length} items on Cart Page:`);
    for (const item of cartPageItems) {
      console.log(`  - Item: "${item.title}" | Img: ${item.imgSrc?.split('/').pop()} | Text: ${item.text.slice(0, 70)}...`);
      const is50g = item.text.includes('50g');
      const has50gJar = item.imgSrc && item.imgSrc.includes('-50g-jar.png');
      if (is50g && !has50gJar) {
        allTestsPassed = false;
        console.error(`    ✗ Cart Page item has 50g weight but wrong image: ${item.imgSrc}`);
      } else if (is50g && has50gJar) {
        console.log(`    ✓ Verified Cart Page 50g item displays matching jar`);
      }
    }

    // Now inspect Checkout Page
    console.log('\nNavigating to Checkout Page (/#checkout)...');
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/#checkout' });
    await sleep(1500);

    const checkoutItems = await evaluate(`(() => {
      const rows = Array.from(document.querySelectorAll('.max-h-60 > div'));
      return rows.map(r => ({
        title: r.querySelector('h3')?.innerText,
        imgSrc: r.querySelector('img')?.src,
        text: r.innerText.replace(/\\n/g, ' | '),
      }));
    })()`);

    console.log(`Found ${checkoutItems.length} items in Checkout Order Summary:`);
    for (const item of checkoutItems) {
      console.log(`  - Item: "${item.title}" | Img: ${item.imgSrc?.split('/').pop()} | Details: ${item.text}`);
      const is50g = item.text.includes('50g');
      const has50gJar = item.imgSrc && item.imgSrc.includes('-50g-jar.png');
      if (is50g && !has50gJar) {
        allTestsPassed = false;
        console.error(`    ✗ Checkout Order Summary has 50g weight but wrong image: ${item.imgSrc}`);
      } else if (is50g && has50gJar) {
        console.log(`    ✓ Verified Checkout Order Summary 50g item displays matching jar`);
      }
    }

    console.log('\n===============================================================');
    console.log('TEST SUITE 3: MOBILE RESPONSIVE LAYOUT (390x844)');
    console.log('===============================================================');

    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
    });

    for (const p of products) {
      console.log(`\nTesting Mobile Viewport: ${p.name}`);
      await sendCommand('Page.navigate', {
        url: `http://localhost:5173/#product/${p.slug}`,
      });
      await sleep(1500);

      for (const size of ['50g', '100g', '250g']) {
        const expected = p.variants[size];
        await evaluate(`(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const btn = btns.find(b => b.innerText.includes('${size}') && b.innerText.includes('${expected.price}'));
          if (btn) btn.click();
        })()`);
        await sleep(300);

        const state = await evaluate(`(() => {
          const img = document.querySelector('.aspect-\\\\[1\\\\/1\\\\] img');
          const price = document.querySelector('.font-serif.text-3xl')?.innerText;
          return {
            imgSrc: img ? img.src : null,
            price,
          };
        })()`);

        const imgMatches = state.imgSrc && state.imgSrc.includes(expected.img);
        const priceMatches = state.price && state.price.includes(expected.price);

        if (imgMatches && priceMatches) {
          console.log(`  ✓ Mobile ${size}: image=${expected.img}, price=${expected.price}`);
        } else {
          allTestsPassed = false;
          console.error(`  ✗ Mobile FAILED ${size}: expected ${expected.img}, got ${state.imgSrc}`);
        }
      }
    }

    console.log('\n===============================================================');
    if (allTestsPassed) {
      console.log('ALL TESTS PASSED WITH 100% SUCCESS! NO REGRESSIONS.');
    } else {
      console.error('SOME TESTS FAILED! CHECK OUTPUT ABOVE.');
    }
    console.log('===============================================================');

    ws.close();
  } catch (err) {
    console.error('Error during testing:', err);
  } finally {
    chrome.kill();
  }
}

run();
