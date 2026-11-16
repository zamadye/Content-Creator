#!/usr/bin/env node
// Bukti bahwa Chromium di sandbox ini benar-benar punya WebGL (SwiftShader/ANGLE).
//
//   npm run verify:chromium          # cetak renderer, gagal bila WebGL2 tidak ada
//   node scripts/qc-webgl.mjs --json # keluaran mesin
//
// Butuh `npm run extract:chromium` lebih dulu (node_modules tidak ikut snapshot).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tools = path.resolve(root, '..', '.studio-tools');
const exe = path.join(tools, 'chromium');
const json = process.argv.includes('--json');

if (!fs.existsSync(exe)) {
  console.error(`Chromium belum di-unpack: ${exe}\nJalankan: npm ci && npm run extract:chromium`);
  process.exit(2);
}

const {default: puppeteer} = await import('puppeteer-core');
const browser = await puppeteer.launch({
  executablePath: exe,
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--disable-gpu-driver-bug-workarounds',
  ],
  env: {...process.env, LD_LIBRARY_PATH: `${tools}:${tools}/al2023/lib:${tools}/swiftshader`},
});

try {
  const page = await browser.newPage();
  const info = await page.evaluate(() => {
    const probe = (kind) => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext(kind);
      if (!gl) return null;
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        version: gl.getParameter(gl.VERSION),
        renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '?',
        maxTexture: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxVertexUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
      };
    };
    const gl2 = probe('webgl2');
    // uji gambar sungguhan: satu segitiga merah di framebuffer 8x8
    let pixels = null;
    if (gl2) {
      const c = document.createElement('canvas');
      c.width = c.height = 8;
      const gl = c.getContext('webgl2', {preserveDrawingBuffer: true});
      gl.clearColor(0, 1, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const buf = new Uint8Array(4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      pixels = Array.from(buf);
    }
    return {gl2, gl1: probe('webgl'), pixels, ua: navigator.userAgent};
  });

  if (json) {
    console.log(JSON.stringify(info, null, 2));
  } else {
    console.log(`chromium ${info.ua.match(/Chrome\/[\d.]+/)?.[0] ?? '?'}`);
    if (info.gl2) {
      console.log(`WebGL2: ${info.gl2.version}`);
      console.log(`renderer: ${info.gl2.renderer}`);
      console.log(`maxTexture ${info.gl2.maxTexture} · maxVertexUniforms ${info.gl2.maxVertexUniforms}`);
      console.log(`readPixels 8×8: [${info.pixels.join(', ')}] ${info.pixels.join(',') === '0,255,0,255' ? '✓ warna terverifikasi' : '✗ warna salah'}`);
    } else {
      console.log('WebGL2: TIDAK ADA');
    }
  }
  const ok = info.gl2 && info.pixels?.join(',') === '0,255,0,255';
  process.exitCode = ok ? 0 : 1;
} finally {
  await browser.close();
}
