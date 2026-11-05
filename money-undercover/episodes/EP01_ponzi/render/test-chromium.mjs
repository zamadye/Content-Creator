import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
const execPath = await chromium.executablePath();
console.log('exec:', execPath);
const browser = await puppeteer.launch({
  executablePath: execPath,
  args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
  headless: 'shell',
  defaultViewport: { width: 640, height: 360 },
});
const page = await browser.newPage();
await page.setContent('<h1 style="color:#F2A900;background:#101A2B;font-family:sans-serif">Chromium OK</h1>');
await page.screenshot({ path: 'chromium-test.png' });
console.log('screenshot OK, version:', await browser.version());
await browser.close();
