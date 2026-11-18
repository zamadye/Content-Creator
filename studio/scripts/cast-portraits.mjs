// With the studio preview running, rebuild the portrait cards from its GLB inspector.
// node scripts/cast-portraits.mjs http://localhost:4173/ [asset-id ...]
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer-core';
import {listAssets} from '../src/studio/library.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const tools = path.resolve(root, '../.studio-tools');
const [url = 'http://localhost:4173/', ...ids] = process.argv.slice(2);
const cast = listAssets({rigged: true}).filter((a) => (ids.length ? ids.includes(a.id) : !a.variantOf));
const browser = await puppeteer.launch({
  executablePath: path.join(tools, 'chromium'),
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
  env: {
    ...process.env,
    LD_LIBRARY_PATH: [tools, tools + '/al2023/lib', tools + '/swiftshader', process.env.LD_LIBRARY_PATH]
      .filter(Boolean)
      .join(':'),
  },
});
try {
  const page = await browser.newPage();
  await page.setViewport({width: 1080, height: 850});
  for (const actor of cast) {
    await page.goto(new URL('#karakter/' + actor.id, url).href);
    await page.waitForFunction(
      (id) =>
        document.querySelector('.cast-notes code')?.textContent === id &&
        document.querySelector('select[aria-label=Klip]')?.disabled === false,
      {},
      actor.id,
    );
    await page.$$eval('.model-buttons button', (buttons) =>
      buttons.find((b) => b.textContent === 'Wajah').click(),
    );
    await page.waitForFunction(() =>
      [...document.querySelectorAll('.model-buttons button')].some(
        (b) => b.textContent === 'Wajah' && b.getAttribute('aria-pressed') === 'true',
      ),
    );
    const frame = await (await page.$('.model-stage canvas')).screenshot({encoding: 'base64'});
    if (process.env.PORTRAIT_PROOFS) {
      await fs.writeFile(path.join(process.env.PORTRAIT_PROOFS, actor.id + '.png'), Buffer.from(frame, 'base64'));
    }
    if (actor.variantOf) continue;
    // Use the visible top of the head so a toddler and an adult fill similar cards.
    const portrait = await page.evaluate(async (frame) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + frame;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const {data} = ctx.getImageData(0, 0, img.width, img.height);
      let top = 0;
      for (; top < img.height / 2; top++) {
        let count = 0;
        for (let x = Math.round(img.width * 0.4); x < img.width * 0.6; x++) {
          const p = 4 * (top * img.width + x);
          if (Math.abs(data[p] - data[0]) + Math.abs(data[p + 1] - data[1]) + Math.abs(data[p + 2] - data[2]) > 70)
            count++;
        }
        if (count > 4) break;
      }
      const side = Math.min(img.height, Math.max(img.height * 0.44, (img.height * 0.5 - top) * 2.6));
      canvas.width = canvas.height = 320;
      ctx.drawImage(
        img,
        (img.width - side) / 2,
        Math.min(img.height - side, Math.max(0, top - side * 0.07)),
        side,
        side,
        0,
        0,
        320,
        320,
      );
      return canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
    }, frame);
    await fs.writeFile(
      path.join(root, 'public', path.dirname(actor.uri), 'portrait.jpg'),
      Buffer.from(portrait, 'base64'),
    );
    console.log(actor.id);
  }
} finally {
  await browser.close();
}
