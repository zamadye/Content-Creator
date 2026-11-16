import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";

test("session is anonymous by default and identity headers do not authenticate", async () => {
  const app = await createApp({ sessionKey: Buffer.alloc(32, 7) });
  try {
    const response = await app.inject({ method: "GET", url: "/auth/session", headers: { "x-user-id": "forged", "x-workspace-id": "forged" } });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { authenticated: false });
  } finally {
    await app.close();
  }
});

test("readiness and login fail closed without configured OIDC", async () => {
  const app = await createApp({ sessionKey: Buffer.alloc(32, 7) });
  try {
    const readiness = await app.inject({ method: "GET", url: "/health/ready" });
    const login = await app.inject({ method: "GET", url: "/auth/login" });
    assert.equal(readiness.statusCode, 503);
    assert.equal(readiness.json().error.code, "OIDC_NOT_CONFIGURED");
    assert.equal(login.statusCode, 503);
  } finally {
    await app.close();
  }
});

test("session key length is enforced", async () => {
  await assert.rejects(createApp({ sessionKey: Buffer.alloc(16) }), /exactly 32 bytes/);
});
