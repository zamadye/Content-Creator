import test from "node:test";
import assert from "node:assert/strict";
import { createApp, type UploadService } from "../src/app.js";
import { AccessDeniedError } from "@content-studio/db";

const key = Buffer.alloc(32, 9);
const origin = "http://localhost:3000";
const projectId = "33333333-3333-4333-8333-333333333333";
const intentId = "77777777-7777-4777-8777-777777777777";
const identity = { subject: "owner-sub", issuer: "https://identity.example.test" };

async function authenticatedApp(uploads: UploadService) {
  const app = await createApp({ sessionKey: key, allowedWebOrigin: origin, uploads });
  app.addHook("preHandler", async (request) => {
    (request.session as unknown as { set(key: string, value: unknown): void }).set("user", identity);
  });
  return app;
}

test("upload intent and completion require allowed origin and pass authenticated project scope", async () => {
  const calls: Array<{ action: string; input: Record<string, unknown> }> = [];
  const uploads: UploadService = {
    async createIntent(input) {
      calls.push({ action: "intent", input });
      return { intentId, uploadUrl: "https://storage.example.test/signed", mime: input.mime, maxBytes: 1024, expiresInSeconds: 300 };
    },
    async complete(input) {
      calls.push({ action: "complete", input });
      return { assetId: "88888888-8888-4888-8888-888888888888", projectId: input.projectId, storageKey: `${input.projectId}/ab/${"ab".repeat(32)}`, sha256: "ab".repeat(32), bytes: input.bytes, mime: input.mime };
    },
    async createDownloadUrl(input) {
      calls.push({ action: "download", input });
      return { url: "https://storage.example.test/download", expiresInSeconds: 120 };
    },
  };
  const app = await authenticatedApp(uploads);
  try {
    const intent = await app.inject({
      method: "POST", url: `/api/projects/${projectId}/uploads`, headers: { origin },
      payload: { mime: "audio/wav", bytes: 512 },
    });
    assert.equal(intent.statusCode, 201);
    assert.equal(intent.json().upload.intentId, intentId);
    assert.equal(intent.headers["cache-control"], "no-store");
    const completed = await app.inject({
      method: "POST", url: `/api/projects/${projectId}/uploads/${intentId}/complete`, headers: { origin },
      payload: { mime: "audio/wav", bytes: 512 },
    });
    assert.equal(completed.statusCode, 201);
    assert.equal(completed.json().asset.bytes, 512);
    const download = await app.inject({ method: "POST", url: `/api/projects/${projectId}/assets/88888888-8888-4888-8888-888888888888/download`, headers: { origin } });
    assert.equal(download.statusCode, 200);
    assert.equal(download.headers["cache-control"], "no-store");
    assert.equal(download.json().download.expiresInSeconds, 120);
    assert.deepEqual(calls.map(({ action }) => action), ["intent", "complete", "download"]);
    assert.equal(calls[0]!.input.subject, `${identity.issuer}|${identity.subject}`);
    assert.equal(calls[0]!.input.projectId, projectId);

    const csrf = await app.inject({ method: "POST", url: `/api/projects/${projectId}/uploads`, headers: { origin: "https://attacker.example" }, payload: { mime: "audio/wav", bytes: 1 } });
    assert.equal(csrf.statusCode, 403);
  } finally {
    await app.close();
  }
});

test("upload routes reject anonymous requests, unsafe MIME, oversized files and concealed ownership misses", async () => {
  const denied: UploadService = {
    async createIntent() { throw new AccessDeniedError(); },
    async complete() { throw new AccessDeniedError(); },
    async createDownloadUrl() { throw new AccessDeniedError(); },
  };
  const anonymous = await createApp({ sessionKey: key, allowedWebOrigin: origin, uploads: denied });
  try {
    const response = await anonymous.inject({ method: "POST", url: `/api/projects/${projectId}/uploads`, headers: { origin }, payload: { mime: "audio/wav", bytes: 1 } });
    assert.equal(response.statusCode, 401);
  } finally { await anonymous.close(); }

  const app = await authenticatedApp(denied);
  try {
    for (const payload of [
      { mime: "text/html", bytes: 1 },
      { mime: "audio/wav", bytes: 512 * 1024 * 1024 + 1 },
    ]) {
      const invalid = await app.inject({ method: "POST", url: `/api/projects/${projectId}/uploads`, headers: { origin }, payload });
      assert.equal(invalid.statusCode, 422);
    }
    const missing = await app.inject({ method: "POST", url: `/api/projects/${projectId}/uploads`, headers: { origin }, payload: { mime: "audio/wav", bytes: 1 } });
    assert.equal(missing.statusCode, 404);
    assert.equal(missing.json().error.code, "NOT_FOUND");
  } finally { await app.close(); }
});
