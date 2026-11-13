// Extract browser and accompanying Linux libraries from the npm package, without a browser download.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const {pipeline} = require('node:stream/promises');
const {spawnSync} = require('node:child_process');
async function main() {
  const root = path.resolve(__dirname, '..');
  const source = path.join(root, 'node_modules/@sparticuz/chromium/bin');
  const dest = path.resolve(root, '../.jalan-pulang-tools');
  await fs.promises.mkdir(dest, {recursive:true});
  async function unbrotli(input, output) {
    await pipeline(fs.createReadStream(path.join(source,input)),zlib.createBrotliDecompress(),fs.createWriteStream(output));
  }
  const browser = path.join(dest, 'chromium');
  await unbrotli('chromium.br', browser);
  await fs.promises.chmod(browser, 0o755);
  for (const [name, subdir] of [['al2023.tar.br','al2023'], ['swiftshader.tar.br','swiftshader']]) {
    const tar = path.join(dest, name.replace(/\.br$/, ''));
    const target = path.join(dest, subdir);
    await fs.promises.mkdir(target, {recursive:true});
    await unbrotli(name, tar);
    const result = spawnSync('tar', ['-xf', tar, '-C', target], {stdio:'inherit'});
    if (result.status !== 0) throw new Error(`tar failed: ${name}`);
    await fs.promises.unlink(tar);
  }
  console.log(`Chromium: ${browser}\nSet LD_LIBRARY_PATH=${dest}/al2023/lib:${dest}/swiftshader`);
}
main().catch((e) => {console.error(e); process.exitCode = 1;});
