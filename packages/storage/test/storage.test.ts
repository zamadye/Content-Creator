import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalPrivateStorage } from "../src/index.js";

const workspace = "11111111-1111-4111-8111-111111111111";

test("local storage writes immutable workspace-scoped content-addressed blobs", async () => {
  const root = await mkdtemp(join(tmpdir(), "studio-storage-"));
  try {
    const storage = new LocalPrivateStorage(root, 32);
    const input = Buffer.from("synthetic audio bytes");
    const stored = await storage.put({ workspaceId: workspace, bytes: input, mime: "audio/wav" });
    assert.equal(stored.bytes, input.byteLength);
    assert.match(stored.sha256, /^[a-f0-9]{64}$/);
    assert.equal((await storage.get({ workspaceId: workspace, storageKey: stored.storageKey })).toString(), input.toString());
    assert.deepEqual(await readFile(join(root, stored.storageKey)), input);
    await assert.rejects(storage.get({ workspaceId: "22222222-2222-4222-8222-222222222222", storageKey: stored.storageKey }));
    await storage.remove({ workspaceId: workspace, storageKey: stored.storageKey });
    await assert.rejects(storage.get({ workspaceId: workspace, storageKey: stored.storageKey }));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("local storage rejects path traversal, unsupported MIME, invalid workspace, and oversized bytes", async () => {
  const root = await mkdtemp(join(tmpdir(), "studio-storage-"));
  try {
    const storage = new LocalPrivateStorage(root, 4);
    await assert.rejects(storage.put({ workspaceId: workspace, bytes: Buffer.from("12345"), mime: "audio/wav" }), /limit/);
    await assert.rejects(storage.put({ workspaceId: workspace, bytes: Buffer.from("x"), mime: "text/html" }), /MIME/);
    await assert.rejects(storage.put({ workspaceId: "../../etc", bytes: Buffer.from("x"), mime: "audio/wav" }), /UUID/);
    await assert.rejects(storage.get({ workspaceId: workspace, storageKey: `${workspace}/../etc/passwd` }), /key/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("local storage refuses a workspace directory symlink escaping the configured root", async () => {
  const root = await mkdtemp(join(tmpdir(), "studio-storage-root-"));
  const outside = await mkdtemp(join(tmpdir(), "studio-storage-outside-"));
  try {
    await symlink(outside, join(root, workspace), "dir");
    const storage = new LocalPrivateStorage(root, 32);
    await assert.rejects(storage.put({ workspaceId: workspace, bytes: Buffer.from("x"), mime: "audio/wav" }), /escaped/);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});
