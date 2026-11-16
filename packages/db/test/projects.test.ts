import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import type { Pool } from "pg";
import { AccessDeniedError, PostgresProjectRepository } from "../src/projects.js";

function fakePool(hasMembership = true) {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const projectId = "77777777-7777-4777-8777-777777777777";
  const revisionId = "88888888-8888-4888-8888-888888888888";
  const client = {
    async query(sql: string, values: unknown[] = []) {
      calls.push({ sql, values });
      if (sql.includes('SELECT "workspaceId" FROM "Membership"')) return { rows: hasMembership ? [{ workspaceId: "99999999-9999-4999-8999-999999999999" }] : [], rowCount: hasMembership ? 1 : 0 };
      if (sql.includes('INSERT INTO "Project"')) return { rows: [{ id: projectId, title: values[2], currentRevisionId: null, createdAt: new Date("2026-11-01T00:00:00Z"), updatedAt: new Date("2026-11-01T00:00:00Z") }], rowCount: 1 };
      if (sql.includes('INSERT INTO "ProjectRevision"')) return { rows: [{ id: revisionId }], rowCount: 1 };
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const pool = { connect: async () => client } as unknown as Pool;
  return { pool, calls, projectId, revisionId };
}

test("project creation persists a versioned initial revision and audit atomically with a content hash ETag", async () => {
  const { pool, calls, projectId, revisionId } = fakePool();
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
