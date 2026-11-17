import test from "node:test";
import assert from "node:assert/strict";
import type { Pool } from "pg";
import { AccessDeniedError } from "@content-studio/db";
import type { S3CompatiblePrivateStorage } from "@content-studio/storage";
import { createPostgresUploadService } from "../src/uploads.js";

const projectId = "33333333-3333-4333-8333-333333333333";
const workspaceId = "11111111-1111-4111-8111-111111111111";
const subject = "https://identity.example.test|owner-sub";
const object = {
  intentId: "77777777-7777-4777-8777-777777777777",
  storageKey: `${workspaceId}/ab/${"ab".repeat(32)}`,
  sha256: "ab".repeat(32), bytes: 128, mime: "audio/wav",
};

test("upload service scopes signed intents and persisted assets through project membership", async () => {
  const statements: Array<{ sql: string; values?: unknown[] }> = [];
  const pool = {
    async query(sql: string, values?: unknown[]) {
      statements.push({ sql, values });
      if (sql.includes("SELECT p.\"workspaceId\"")) return { rows: [{ workspaceId }], rowCount: 1 };
      if (sql.includes("SELECT a.\"workspaceId\"")) return { rows: [{ workspaceId, storageKey: object.storageKey }], rowCount: 1 };
      if (sql.includes("INSERT INTO \"Asset\"")) return { rows: [{ id: "88888888-8888-4888-8888-888888888888", projectId }], rowCount: 1 };
      throw new Error("unexpected SQL");
    },
  } as unknown as Pool;
  const storageCalls: Array<{ method: string; input: Record<string, unknown> }> = [];
  const storage = {
    async createUploadIntent(input: Record<string, unknown>) {
      storageCalls.push({ method: "intent", input });
      return { intentId: object.intentId, uploadUrl: "https://storage.example.test/signed", mime: "audio/wav", maxBytes: 1024, expiresInSeconds: 300 };
    },
    async completeUpload(input: Record<string, unknown>) {
      storageCalls.push({ method: "complete", input });
      return object;
    },
    async createDownloadUrl(input: Record<string, unknown>) {
      storageCalls.push({ method: "download", input });
      return "https://storage.example.test/download";
    },
  } as unknown as S3CompatiblePrivateStorage;
  const service = createPostgresUploadService(pool, storage);
  const intent = await service.createIntent({ subject, projectId, mime: "audio/wav", bytes: object.bytes });
  assert.equal(intent.intentId, object.intentId);
  const asset = await service.complete({ subject, projectId, intentId: object.intentId, mime: object.mime, bytes: object.bytes });
  assert.equal(asset.projectId, projectId);
  assert.equal(asset.storageKey, object.storageKey);
  const download = await service.createDownloadUrl({ subject, projectId, assetId: asset.assetId });
  assert.equal(download.expiresInSeconds, 120);
  assert.deepEqual(storageCalls.map((call) => call.method), ["intent", "complete", "download"]);
  assert.equal(storageCalls[0]!.input.workspaceId, workspaceId);
  assert.equal(storageCalls[2]!.input.storageKey, object.storageKey);
  assert.deepEqual(statements[0]!.values, [projectId, subject]);
  assert.deepEqual(statements[2]!.values?.slice(1, 4), [projectId, subject, "audio"]);
});

test("upload service conceals projects outside the caller workspace before contacting storage", async () => {
  let storageCalled = false;
  const pool = { query: async () => ({ rows: [], rowCount: 0 }) } as unknown as Pool;
  const storage = {
    async createUploadIntent() { storageCalled = true; throw new Error("must not sign"); },
    async completeUpload() { storageCalled = true; throw new Error("must not read"); },
  } as unknown as S3CompatiblePrivateStorage;
  const service = createPostgresUploadService(pool, storage);
  await assert.rejects(service.createIntent({ subject, projectId, mime: "audio/wav", bytes: 1 }), AccessDeniedError);
  await assert.rejects(service.complete({ subject, projectId, intentId: object.intentId, mime: "audio/wav", bytes: 1 }), AccessDeniedError);
  assert.equal(storageCalled, false);
});
