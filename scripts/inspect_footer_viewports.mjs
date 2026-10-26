import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('--- STARTING LOCAL PREVIEW SERVER ---');
  const previewProcess = spawn('npm', ['run', 'preview', '--', '--port', '4179'], {
    cwd: projectRoot,
    shell: true,
  });

  // Wait for preview server to start
  await sleep(3000);

  console.log('--- LAUNCHING HEADLESS CHROME FOR VIEWPORT INSPECTION ---');
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9227',
    'about:blank',
  ]);

  await sleep(2000);

  let ws;
  try {
    const listRes = await fetch('http://127.0.0.1:9227/json');
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');
    ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

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

    console.log('\n--- 1. DESKTOP VIEWPORT TEST (1280 x 800) ---');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await sendCommand('Page.navigate', { url: 'http://localhost:4179/' });
    await sleep(2500);

    const desktopFooterCheck = await evaluate(`(() => {
      const footer = document.querySelector('footer');
      if (!footer) return { found: false, error: 'No footer element' };

      const instaLink = footer.querySelector('a[href*="instagram.com"]');
      if (!instaLink) return { found: false, error: 'No Instagram link in footer' };

      const rect = instaLink.getBoundingClientRect();
      const style = window.getComputedStyle(instaLink);
      const svg = instaLink.querySelector('svg');
      const svgRect = svg ? svg.getBoundingClientRect() : null;

      const heading = footer.querySelector('.text-\\\\[11px\\\\].font-bold');

      return {
        found: true,
        href: instaLink.href,
        target: instaLink.target,
        rel: instaLink.rel,
        ariaLabel: instaLink.getAttribute('aria-label'),
        title: instaLink.title,
        headingText: heading ? heading.innerText : null,
        dimensions: {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          top: Math.round(rect.top),
          left: Math.round(rect.left),
        },
        isVisible: rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden',
        svgPresent: !!svg,
        svgDimensions: svgRect ? { width: Math.round(svgRect.width), height: Math.round(svgRect.height) } : null,
      };
    })()`);

    console.log('Desktop Footer Inspection Result:');
    console.log(JSON.stringify(desktopFooterCheck, null, 2));

    // Capture desktop footer screenshot
    const desktopScreenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      path.join(projectRoot, 'scripts', 'desktop_footer_screenshot.png'),
      Buffer.from(desktopScreenshot.data, 'base64')
    );
    console.log('[OK] Saved desktop screenshot to scripts/desktop_footer_screenshot.png');

    console.log('\n--- 2. MOBILE VIEWPORT TEST (375 x 667, iPhone SE / Standard Mobile) ---');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      mobile: true,
    });

    await sendCommand('Page.navigate', { url: 'http://localhost:4179/' });
    await sleep(2000);

    // Scroll to footer
    await evaluate(`window.scrollTo(0, document.body.scrollHeight)`);
    await sleep(500);

    const mobileFooterCheck = await evaluate(`(() => {
      const footer = document.querySelector('footer');
      if (!footer) return { found: false, error: 'No footer element' };

      const instaLink = footer.querySelector('a[href*="instagram.com"]');
      if (!instaLink) return { found: false, error: 'No Instagram link in footer' };

      const rect = instaLink.getBoundingClientRect();
      const style = window.getComputedStyle(instaLink);
      const svg = instaLink.querySelector('svg');
      const svgRect = svg ? svg.getBoundingClientRect() : null;

      return {
        found: true,
        href: instaLink.href,
        target: instaLink.target,
        rel: instaLink.rel,
        ariaLabel: instaLink.getAttribute('aria-label'),
        dimensions: {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          top: Math.round(rect.top),
          left: Math.round(rect.left),
        },
        isVisible: rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden',
        svgPresent: !!svg,
        svgDimensions: svgRect ? { width: Math.round(svgRect.width), height: Math.round(svgRect.height) } : null,
        touchTargetAdequate: rect.width >= 36 && rect.height >= 36,
      };
    })()`);

    console.log('Mobile Footer Inspection Result:');
    console.log(JSON.stringify(mobileFooterCheck, null, 2));

    // Capture mobile footer screenshot
    const mobileScreenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      path.join(projectRoot, 'scripts', 'mobile_footer_screenshot.png'),
      Buffer.from(mobileScreenshot.data, 'base64')
    );
    console.log('[OK] Saved mobile screenshot to scripts/mobile_footer_screenshot.png');

    console.log('\n--- 3. CONTACT PAGE INSPECTION ---');
    // Navigate to Contact Page
    await evaluate(`(() => {
      const contactBtns = Array.from(document.querySelectorAll('button, a'));
      const contactLink = contactBtns.find(b => b.innerText.includes('Contact Concierge') || b.innerText.includes('Contact'));
      if (contactLink) contactLink.click();
    })()`);
    await sleep(1500);

    const contactInstagramCheck = await evaluate(`(() => {
      const instaLink = document.querySelector('a[href*="instagram.com"]');
      if (!instaLink) return { found: false };

      const rect = instaLink.getBoundingClientRect();
      return {
        found: true,
        href: instaLink.href,
        target: instaLink.target,
        rel: instaLink.rel,
        text: instaLink.innerText,
        ariaLabel: instaLink.getAttribute('aria-label'),
        dimensions: { width: Math.round(rect.width), height: Math.round(rect.height) },
      };
    })()`);

    console.log('Contact Page Instagram Channel Result:');
    console.log(JSON.stringify(contactInstagramCheck, null, 2));

    // Summary validation
    const success =
      desktopFooterCheck.found &&
      desktopFooterCheck.href === 'https://www.instagram.com/sjt.farms/' &&
      desktopFooterCheck.target === '_blank' &&
      desktopFooterCheck.rel.includes('noopener') &&
      desktopFooterCheck.rel.includes('noreferrer') &&
      mobileFooterCheck.found &&
      mobileFooterCheck.touchTargetAdequate;

    console.log('\n================================================================');
    if (success) {
      console.log('🎉 ALL DESKTOP & MOBILE FOOTER INSPECTIONS VERIFIED SUCCESSFULLY!');
    } else {
      console.log('⚠️ INSPECTION FAILED OR INCOMPLETE');
      process.exitCode = 1;
    }
    console.log('================================================================');
  } catch (err) {
    console.error('Inspection error:', err);
    process.exitCode = 1;
  } finally {
    try {
      chrome.kill('SIGKILL');
    } catch {}
    try {
      previewProcess.kill('SIGKILL');
    } catch {}
  }
}

run();
