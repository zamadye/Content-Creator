import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import type { Pool } from "pg";
import { AccessDeniedError, PostgresProjectRepository, RevisionConflictError } from "../src/projects.js";

function fakePool(hasMembership = true) {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const projectId = "77777777-7777-4777-8777-777777777777";
  const client = {
    async query(sql: string, values: unknown[] = []) {
      calls.push({ sql, values });
      if (sql.includes('SELECT "workspaceId" FROM "Membership"')) return { rows: hasMembership ? [{ workspaceId: "99999999-9999-4999-8999-999999999999" }] : [], rowCount: hasMembership ? 1 : 0 };
      if (sql.includes('INSERT INTO "Project"')) return { rows: [{ id: projectId, title: values[2], currentRevisionId: null, createdAt: new Date("2026-11-01T00:00:00Z"), updatedAt: new Date("2026-11-01T00:00:00Z") }], rowCount: 1 };
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const pool = { connect: async () => client } as unknown as Pool;
  return { pool, calls, projectId };
}

function fakeUpdatePool(currentEtag = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa") {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const client = {
    async query(sql: string, values: unknown[] = []) {
      calls.push({ sql, values });
      if (sql.includes('SELECT p."workspaceId"')) return { rows: [{ workspaceId: "99999999-9999-4999-8999-999999999999", currentRevisionId: "66666666-6666-4666-8666-666666666666", revision: 1, etag: currentEtag, snapshot: { schemaVersion: "1.0", projectId: "77777777-7777-4777-8777-777777777777", revisionId: "66666666-6666-4666-8666-666666666666", parentRevisionId: null, title: "Before", state: "empty-draft" }, createdAt: new Date("2026-11-01T00:00:00Z") }], rowCount: 1 };
      if (sql.includes('UPDATE "Project" SET')) return { rows: [{ updatedAt: new Date("2026-11-02T00:00:00Z") }], rowCount: 1 };
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  return { pool: { connect: async () => client } as unknown as Pool, calls };
}

test("project creation persists a versioned initial revision and audit atomically with a content hash ETag", async () => {
  const { pool, calls, projectId } = fakePool();
  const repository = new PostgresProjectRepository(pool);
  const created = await repository.createProject("https://issuer.example|owner", "Synthetic project");
  const revisionInsert = calls.find((call) => call.sql.includes('INSERT INTO "ProjectRevision"'))!;
  const snapshot = JSON.parse(String(revisionInsert.values[3])) as Record<string, unknown>;
  const expectedEtag = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
  assert.equal(created.id, projectId);
  assert.equal(created.currentRevisionId, revisionInsert.values[0]);
  assert.equal(created.etag, expectedEtag);
  assert.ok(calls.some((call) => call.sql.includes('INSERT INTO "AuditEvent"')));
  assert.equal(calls[0]?.sql, "BEGIN");
  assert.equal(calls.at(-1)?.sql, "COMMIT");
});

test("project creation denies a subject without workspace membership and rolls back", async () => {
  const { pool, calls } = fakePool(false);
  const repository = new PostgresProjectRepository(pool);
  await assert.rejects(repository.createProject("attacker", "No access"), AccessDeniedError);
  assert.equal(calls.at(-1)?.sql, "ROLLBACK");
  assert.equal(calls.some((call) => call.sql.includes('INSERT INTO "Project"')), false);
});

test("title update appends an immutable child revision and rejects stale ETags", async () => {
  const previousEtag = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const { pool, calls } = fakeUpdatePool(previousEtag);
  const repository = new PostgresProjectRepository(pool);
  const updated = await repository.updateProjectTitle("https://issuer.example|owner", "77777777-7777-4777-8777-777777777777", "After", previousEtag);
  const revisionInsert = calls.find((call) => call.sql.includes('INSERT INTO "ProjectRevision"'))!;
  const savedSnapshot = JSON.parse(String(revisionInsert.values[5])) as Record<string, unknown>;
  assert.equal(revisionInsert.values[2], "66666666-6666-4666-8666-666666666666");
  assert.equal(revisionInsert.values[3], 2);
  assert.equal(savedSnapshot.title, "After");
  assert.equal(updated.title, "After");
  assert.equal(updated.etag, createHash("sha256").update(JSON.stringify(savedSnapshot)).digest("hex"));
  assert.equal(calls.at(-1)?.sql, "COMMIT");

  const staleDb = fakeUpdatePool(previousEtag);
  const staleRepo = new PostgresProjectRepository(staleDb.pool);
  await assert.rejects(staleRepo.updateProjectTitle("owner", "77777777-7777-4777-8777-777777777777", "Stale", "0".repeat(64)), RevisionConflictError);
  assert.equal(staleDb.calls.at(-1)?.sql, "ROLLBACK");
  assert.equal(staleDb.calls.some((call) => call.sql.includes('INSERT INTO "ProjectRevision"')), false);
});
