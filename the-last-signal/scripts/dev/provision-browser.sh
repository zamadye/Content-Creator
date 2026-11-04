#!/usr/bin/env bash
# Provision Chromium + shared libraries untuk environment tanpa browser sistem
# (sandbox/CI minimal). Tidak dipakai di server yang sudah punya chromium.
#
#   bash scripts/dev/provision-browser.sh
#   export LD_LIBRARY_PATH=/tmp/chromelibs
#   export REMOTION_BROWSER_EXECUTABLE=/tmp/chromium
#
# Chromium diambil dari paket npm @sparticuz/chromium (binary Lambda build),
# library NSS diambil dari paket Lambda lain. Trik ini hanya untuk environment
# yang tidak punya akses ke storage.googleapis.com (unduhan Chrome Remotion).
set -euo pipefail

WORK=$(mktemp -d)
LIBS=/tmp/chromelibs
mkdir -p "$LIBS"

echo "▶ chromium (sparticuz)"
cd "$WORK"
npm pack @sparticuz/chromium@153 --silent >/dev/null
tar xzf sparticuz-chromium-153.0.0.tgz package/bin/chromium.br
node -e "
const fs=require('fs'),z=require('zlib');
fs.writeFileSync('/tmp/chromium', z.brotliDecompressSync(fs.readFileSync('package/bin/chromium.br')));
fs.chmodSync('/tmp/chromium', 0o755);
"

echo "▶ library NSS (chrome-aws-lambda al2)"
npm pack chrome-aws-lambda@10.1.0 --silent >/dev/null
tar xzf chrome-aws-lambda-10.1.0.tgz package/bin/aws.tar.br
node -e "
const fs=require('fs'),z=require('zlib');
fs.writeFileSync('aws.tar', z.brotliDecompressSync(fs.readFileSync('package/bin/aws.tar.br')));
"
mkdir -p awslib && tar xf aws.tar -C awslib
cp awslib/lib/libnss3.so awslib/lib/libnssutil3.so awslib/lib/libsoftokn3.so \
   awslib/lib/libsqlite3.so.0 awslib/lib/libexpat.so.1 awslib/lib/libuuid.so.1 "$LIBS"/

echo "▶ libnspr4 (dari paket nss)"
npm pack @achingbrain/nss@0.0.1 --silent >/dev/null
tar xzf achingbrain-nss-0.0.1.tgz package/linux/libnspr4.so package/linux/libplc4.so package/linux/libplds4.so
cp package/linux/libnspr4.so package/linux/libplc4.so package/linux/libplds4.so "$LIBS"/

echo "▶ verifikasi"
LD_LIBRARY_PATH="$LIBS" /tmp/chromium --version

rm -rf "$WORK"
echo
echo "Selesai. Jalankan render dengan:"
echo "  LD_LIBRARY_PATH=$LIBS REMOTION_BROWSER_EXECUTABLE=/tmp/chromium pnpm render"
