// Unpack browser + Linux libs from the npm package (no browser download) and put
// every shared library where Chromium actually looks for it.
//
//   npm ci && npm run extract:chromium && npm run verify:chromium
//
// Chromium resolves ANGLE/SwiftShader through its own module directory, not just
// LD_LIBRARY_PATH — so libEGL/libGLESv2/libvk_swiftshader/libvulkan must sit
// *next to the binary*. Tanpa itu `getContext('webgl2')` mengembalikan null.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const {pipeline} = require('node:stream/promises');
const {spawnSync} = require('node:child_process');

const SWIFTSHADER_LIBS = ['libEGL.so', 'libGLESv2.so', 'libvk_swiftshader.so', 'libvulkan.so.1', 'vk_swiftshader_icd.json'];

async function main() {
  const root = path.resolve(__dirname, '..');
  const source = path.join(root, 'node_modules/@sparticuz/chromium/bin');
  const dest = path.resolve(root, '../.studio-tools');
  await fs.promises.mkdir(dest, {recursive: true});

  async function unbrotli(input, output) {
    await pipeline(fs.createReadStream(path.join(source, input)), zlib.createBrotliDecompress(), fs.createWriteStream(output));
  }

  const browser = path.join(dest, 'chromium');
  if (!fs.existsSync(browser) || fs.statSync(browser).size < 1024) {
    await unbrotli('chromium.br', browser);
  }
  await fs.promises.chmod(browser, 0o755);  // selalu: salinan/restore bisa menghilangkan bit-x

  for (const [name, subdir] of [['al2023.tar.br', 'al2023'], ['swiftshader.tar.br', 'swiftshader'], ['fonts.tar.br', 'fonts']]) {
    const target = path.join(dest, subdir);
    if (fs.existsSync(target) && fs.readdirSync(target).length) continue;
    await fs.promises.mkdir(target, {recursive: true});
    const tar = path.join(dest, name.replace(/\.br$/, ''));
    await unbrotli(name, tar);
    const result = spawnSync('tar', ['-xf', tar, '-C', target], {stdio: 'inherit'});
    if (result.status !== 0) throw new Error(`tar failed: ${name}`);
    await fs.promises.unlink(tar);
  }

  // Inti perbaikannya: taruh lib SwiftShader di samping binary (dan di al2023/lib).
  const swDir = path.join(dest, 'swiftshader');
  let placed = 0;
  for (const name of SWIFTSHADER_LIBS) {
    const src = path.join(swDir, name);
    if (!fs.existsSync(src)) continue;
    for (const dir of [dest, path.join(dest, 'al2023', 'lib'), path.join(dest, 'al2023', 'swiftshader')]) {
      await fs.promises.mkdir(dir, {recursive: true});
      await fs.promises.copyFile(src, path.join(dir, name));
      if (name.endsWith('.so') || name.endsWith('.so.1')) await fs.promises.chmod(path.join(dir, name), 0o755);
      placed += 1;
    }
  }

  console.log(`Chromium: ${browser}`);
  console.log(`SwiftShader: ${placed} file ditempatkan di ${dest}, al2023/lib, al2023/swiftshader`);
  console.log(`LD_LIBRARY_PATH=${dest}:${dest}/al2023/lib:${dest}/swiftshader`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
