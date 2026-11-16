import test from "node:test";
import assert from "node:assert/strict";
import type { Pool, PoolClient } from "pg";
import type { Queue, Job } from "bullmq";
import { dispatchOutboxOnce } from "../src/index.js";

function fakePool(events: Array<{ id: string; eventType: string; payload: Record<string, unknown> }>) {
  const calls: string[] = [];
  const client = {
    async query(sql: string) {
      calls.push(sql.trim().split(/\s+/).slice(0, 3).join(" "));
      if (sql.includes("SELECT \"id\", \"eventType\", \"payload\"")) return { rows: events.splice(0, 1), rowCount: 1 };
      return { rows: [], rowCount: 1 };
    },
    release() {},
  };
  const pool = { connect: async () => client } as unknown as Pool;
  return { pool, calls, client: client as unknown as PoolClient };
}

test("outbox publisher uses stable event id and marks only after successful broker add", async () => {
  const event = { id: "44444444-4444-4444-8444-444444444444", eventType: "job.queued", payload: { jobId: "job-1", operation: "fixture" } };
  const { pool, calls } = fakePool([event]);
  let publishedId = "";
  const queue = { add: async (_name: string, _data: unknown, options: { jobId: string }) => { publishedId = options.jobId; return undefined as unknown as Job; } } as unknown as Queue;
  assert.equal(await dispatchOutboxOnce(pool, queue), true);
  assert.equal(publishedId, event.id);
  assert.deepEqual(calls, ["BEGIN", "SELECT \"id\", \"eventType\",", "UPDATE \"OutboxEvent\" SET", "COMMIT"]);
});

test("empty outbox does no broker work", async () => {
  const { pool, calls } = fakePool([]);
  const queue = { add: async () => { throw new Error("must not publish"); } } as unknown as Queue;
  assert.equal(await dispatchOutboxOnce(pool, queue), false);
  assert.deepEqual(calls, ["BEGIN", "SELECT \"id\", \"eventType\",", "COMMIT"]);
});
