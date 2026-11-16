import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import type { JobState } from "@content-studio/domain";

export type JobRecord = {
  id: string;
  projectId: string;
  operation: string;
  state: JobState;
  stage: string;
  progress: number;
  createdAt: string;
};

export async function enqueueJob(pool: Pool, input: {
  subject: string;
  projectId: string;
  operation: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
}): Promise<{ job: JobRecord; created: boolean }> {
  const client = await pool.connect();
  let transactionStarted = false;
  try {
    await client.query("BEGIN");
    transactionStarted = true;
    const membership = await client.query<{ workspaceId: string }>(
      'SELECT p."workspaceId" FROM "Project" p INNER JOIN "Membership" m ON m."workspaceId" = p."workspaceId" WHERE p."id" = $1 AND m."subject" = $2 LIMIT 1 FOR SHARE OF p, m',
      [input.projectId, input.subject],
    );
    const workspaceId = membership.rows[0]?.workspaceId;
    if (!workspaceId) throw new Error("RESOURCE_NOT_FOUND");

    const id = randomUUID();
    const inserted = await client.query<JobRecord>(
      'INSERT INTO "Job" ("id", "workspaceId", "projectId", "operation", "idempotencyKey", "state", "stage", "progress", "updatedAt") VALUES ($1,$2,$3,$4,$5,\'queued\',\'queued\',0,CURRENT_TIMESTAMP) ON CONFLICT ("workspaceId", "operation", "idempotencyKey") DO NOTHING RETURNING "id", "projectId", "operation", "state", "stage", "progress", "createdAt"',
      [id, workspaceId, input.projectId, input.operation, input.idempotencyKey],
    );
    if (inserted.rows[0]) {
      await client.query(
        'INSERT INTO "OutboxEvent" ("id", "workspaceId", "eventType", "aggregateId", "payload") VALUES ($1,$2,$3,$4,$5::jsonb)',
        [randomUUID(), workspaceId, "job.queued", id, JSON.stringify({ jobId: id, operation: input.operation, payload: input.payload })],
      );
      const job = inserted.rows[0];
      await client.query("COMMIT");
      transactionStarted = false;
      return { job: { ...job, createdAt: new Date(job.createdAt).toISOString() }, created: true };
    }

    const existing = await client.query<JobRecord>(
      'SELECT "id", "projectId", "operation", "state", "stage", "progress", "createdAt" FROM "Job" WHERE "workspaceId" = $1 AND "operation" = $2 AND "idempotencyKey" = $3',
      [workspaceId, input.operation, input.idempotencyKey],
    );
    const job = existing.rows[0];
    if (!job) throw new Error("IDEMPOTENCY_LOOKUP_FAILED");
    await client.query("COMMIT");
    transactionStarted = false;
    return { job: { ...job, createdAt: new Date(job.createdAt).toISOString() }, created: false };
  } catch (error) {
    if (transactionStarted) await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function cancelJob(pool: Pool, input: { subject: string; jobId: string }): Promise<boolean> {
  const result = await pool.query(
    'UPDATE "Job" AS j SET "state" = \'cancelled\', "stage" = \'cancelled\', "leaseExpiresAt" = NULL, "updatedAt" = CURRENT_TIMESTAMP WHERE j."id" = $1 AND j."state" IN (\'queued\',\'running\') AND EXISTS (SELECT 1 FROM "Membership" m WHERE m."workspaceId" = j."workspaceId" AND m."subject" = $2) RETURNING j."id"',
    [input.jobId, input.subject],
  );
  return result.rowCount === 1;
}

export type OutboxEnvelope = { id: string; eventType: string; payload: Record<string, unknown> };

/** Claims one event using SKIP LOCKED; caller publishes idempotently before marking published. */
export async function withNextOutboxEvent<T>(pool: Pool, publish: (event: OutboxEnvelope) => Promise<T>): Promise<T | null> {
  const client = await pool.connect();
  let locked: OutboxEnvelope | undefined;
  try {
    await client.query("BEGIN");
    const selected = await client.query<OutboxEnvelope>(
      'SELECT "id", "eventType", "payload" FROM "OutboxEvent" WHERE "publishedAt" IS NULL AND ("retryAt" IS NULL OR "retryAt" <= CURRENT_TIMESTAMP) ORDER BY "createdAt" LIMIT 1 FOR UPDATE SKIP LOCKED',
    );
    locked = selected.rows[0];
    if (!locked) {
      await client.query("COMMIT");
      return null;
    }
    const result = await publish(locked);
    await client.query('UPDATE "OutboxEvent" SET "publishedAt" = CURRENT_TIMESTAMP, "attempts" = "attempts" + 1 WHERE "id" = $1', [locked.id]);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    if (locked) {
      await client.query(
        'UPDATE "OutboxEvent" SET "attempts" = "attempts" + 1, "retryAt" = CURRENT_TIMESTAMP + INTERVAL \'10 seconds\' WHERE "id" = $1 AND "publishedAt" IS NULL',
        [locked.id],
      ).catch(() => undefined);
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function updateJobState(client: Pool | PoolClient, jobId: string, state: JobState, stage: string, progress: number): Promise<void> {
  await client.query(
    'UPDATE "Job" SET "state" = $2, "stage" = $3, "progress" = $4, "updatedAt" = CURRENT_TIMESTAMP, "leaseExpiresAt" = CASE WHEN $2 = \'running\' THEN CURRENT_TIMESTAMP + INTERVAL \'30 seconds\' ELSE NULL END WHERE "id" = $1',
    [jobId, state, stage, progress],
  );
}
