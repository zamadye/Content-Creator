import test from "node:test";
import assert from "node:assert/strict";
import { S3CompatiblePrivateStorage } from "../src/index.js";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const config = {
  bucket: "private-fixtures", region: "us-east-1", endpoint: "https://s3.example.test",
  accessKeyId: "synthetic-access", secretAccessKey: "synthetic-secret", maxBytes: 1024,
};

test("S3-compatible adapter signs scoped private upload/download operations and rejects invalid inputs", async () => {
  const signed: Array<{ command: unknown; expiresIn: number }> = [];
  const adapter = new S3CompatiblePrivateStorage(config, {
    client: { send: async () => ({}) } as never,
    signedUrl: async (_client, command, options) => {
      signed.push({ command, expiresIn: options!.expiresIn! });
      return "https://signed.example.test/private";
    },
  });
  const intent = await adapter.createUploadIntent({ workspaceId, mime: "audio/wav", bytes: 64 });
  assert.match(intent.intentId, /^[0-9a-f-]{36}$/i);
  assert.equal(intent.maxBytes, 1024);
  assert.equal(intent.expiresInSeconds, 300);
  assert.equal(signed[0]!.expiresIn, 300);
  const objectKey = `${workspaceId}/ab/${"ab".repeat(32)}`;
  assert.equal(await adapter.createDownloadUrl({ workspaceId, storageKey: objectKey }), "https://signed.example.test/private");
  assert.equal(signed[1]!.expiresIn, 120);
  await assert.rejects(adapter.createUploadIntent({ workspaceId, mime: "text/html", bytes: 1 }), /MIME/);
  await assert.rejects(adapter.createUploadIntent({ workspaceId, mime: "audio/wav", bytes: 1025 }), /limit/);
  await assert.rejects(adapter.createDownloadUrl({ workspaceId: "22222222-2222-4222-8222-222222222222", storageKey: objectKey }), /key/);
  await assert.rejects(adapter.createDownloadUrl({ workspaceId, storageKey: objectKey, expiresInSeconds: 301 }), /expiry/);
});

test("S3-compatible adapter requires private transport configuration", () => {
  assert.throws(() => new S3CompatiblePrivateStorage({ ...config, endpoint: "http://storage.example.test" }), /HTTPS/);
  assert.throws(() => new S3CompatiblePrivateStorage({ ...config, secretAccessKey: "" }), /incomplete/);
});
