// Utilitas GLB untuk skrip Node: pisahkan chunk JSON/BIN dan buang tekstur
// supaya GLTFLoader bisa mem-parse tanpa DOM (createImageBitmap/self).
export function splitGlb(buf) {
  const buf2 = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  let off = 12;
  let json = null;
  let bin = null;
  while (off < buf2.length) {
    const len = buf2.readUInt32LE(off);
    const type = buf2.readUInt32LE(off + 4);
    off += 8;
    const chunk = buf2.subarray(off, off + len);
    if (type === 0x4e4f534a) json = JSON.parse(chunk.toString('utf8').replace(/\0+$/, '').trimEnd());
    else if (type === 0x004e4942) bin = chunk;
    off += len;
  }
  return {json, bin};
}

export function buildGlb(json, bin) {
  const texKeys = [
    'baseColorTexture',
    'metallicRoughnessTexture',
    'normalTexture',
    'occlusionTexture',
    'emissiveTexture',
    'sheenColorTexture',
    'specularTexture',
  ];
  for (const m of json.materials ?? []) {
    for (const k of texKeys) {
      if (m[k]) delete m[k];
      if (m.pbrMetallicRoughness?.[k]) delete m.pbrMetallicRoughness[k];
    }
  }
  delete json.textures;
  delete json.images;
  delete json.samplers;
  const jsonBytes = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPad = Buffer.alloc((4 - (jsonBytes.length % 4)) % 4, 0x20);
  const jsonChunk = Buffer.concat([jsonBytes, jsonPad]);
  const binPad = Buffer.alloc((4 - ((bin?.length ?? 0) % 4)) % 4, 0);
  const binChunk = Buffer.concat([bin ?? Buffer.alloc(0), binPad]);
  const header = Buffer.alloc(12);
  const total = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(total, 8);
  const jh = Buffer.alloc(8);
  jh.writeUInt32LE(jsonChunk.length, 0);
  jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8);
  bh.writeUInt32LE(binChunk.length, 0);
  bh.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jh, jsonChunk, bh, binChunk]);
}
