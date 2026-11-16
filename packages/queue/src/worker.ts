import { randomUUID } from "node:crypto";
import { Worker, type Job } from "bullmq";
import type { Pool } from "pg";
import { updateJobState } from "@content-studio/db";
import { CONTENT_QUEUE_NAME } from "./constants.js";

export type WorkEnvelope = { jobId: string; operation: string; payload: Record<string, unknown> };
export type JobHandler = (payload: Record<string, unknown>, signal: AbortSignal) => Promise<void>;

function parseEnvelope(data: unknown): WorkEnvelope {
  if (!data || typeof data !== "object") throw new Error("INVALID_JOB_ENVELOPE");
  const value = data as Record<string, unknown>;
  if (typeof value.jobId !== "string" || typeof value.operation !== "string" || !value.payload || typeof value.payload !== "object" || Array.isArray(value.payload)) {
    throw new Error("INVALID_JOB_ENVELOPE");
  }
  return { jobId: value.jobId, operation: value.operation, payload: value.payload as Record<string, unknown> };
}

export function createStudioWorker(input: {
  connection: unknown;
  pool: Pool;
  handlers: Record<string, JobHandler>;
  concurrency?: number;
}) {
  return new Worker(CONTENT_QUEUE_NAME, async (queueJob: Job) => {
    const envelope = parseEnvelope(queueJob.data);
    const handler = input.handlers[envelope.operation];

    const existing = await input.pool.query<{ state: string }>('SELECT "state" FROM "Job" WHERE "id" = $1', [envelope.jobId]);
    let state = existing.rows[0]?.state;
    if (!state) throw new Error("JOB_NOT_FOUND");
    if (state === "cancelled" || state === "succeeded") return;
    if (state === "failed") {
      await updateJobState(input.pool, envelope.jobId, "queued", "retry_queued", 0);
      state = "queued";
    }
    if (state !== "queued" && state !== "running") throw new Error("JOB_STATE_CONFLICT");
    const started = await input.pool.query(
      'UPDATE "Job" SET "state" = \'running\', "stage" = \'starting\', "progress" = 0, "updatedAt" = CURRENT_TIMESTAMP, "leaseExpiresAt" = CURRENT_TIMESTAMP + INTERVAL \'30 seconds\' WHERE "id" = $1 AND ("state" = \'queued\' OR ("state" = \'running\' AND "leaseExpiresAt" < CURRENT_TIMESTAMP)) RETURNING "id"',
      [envelope.jobId],
    );
    if (started.rowCount !== 1) return;

    const attemptResult = await input.pool.query<{ attempt: number }>(
      'SELECT COALESCE(MAX("attempt"), 0) + 1 AS "attempt" FROM "JobAttempt" WHERE "jobId" = $1',
      [envelope.jobId],
    );
    const attempt = attemptResult.rows[0]!.attempt;
    const attemptId = randomUUID();
    await input.pool.query(
      'INSERT INTO "JobAttempt" ("id", "jobId", "attempt", "state", "startedAt") VALUES ($1,$2,$3,\'running\',CURRENT_TIMESTAMP)',
      [attemptId, envelope.jobId, attempt],
    );

    const controller = new AbortController();
    let pollBusy = false;
    const monitor = setInterval(() => {
      if (pollBusy) return;
      pollBusy = true;
      void input.pool.query<{ state: string }>(
        'SELECT "state" FROM "Job" WHERE "id" = $1', [envelope.jobId],
      ).then(({ rows }) => {
        if (!rows[0] || rows[0].state === "cancelled") controller.abort(new Error("JOB_CANCELLED"));
        else return input.pool.query('UPDATE "Job" SET "leaseExpiresAt" = CURRENT_TIMESTAMP + INTERVAL \'30 seconds\' WHERE "id" = $1 AND "state" = \'running\'', [envelope.jobId]);
      }).catch(() => controller.abort(new Error("JOB_HEARTBEAT_FAILED"))).finally(() => { pollBusy = false; });
    }, 5_000);
    monitor.unref();

    try {
      if (!handler) throw new Error("UNSUPPORTED_JOB_OPERATION");
      await handler(envelope.payload, controller.signal);
      if (controller.signal.aborted) throw controller.signal.reason ?? new Error("JOB_CANCELLED");
      const completed = await input.pool.query(
        'UPDATE "Job" SET "state" = \'succeeded\', "stage" = \'complete\', "progress" = 100, "updatedAt" = CURRENT_TIMESTAMP, "leaseExpiresAt" = NULL WHERE "id" = $1 AND "state" = \'running\' RETURNING "id"',
        [envelope.jobId],
      );
      if (completed.rowCount !== 1) {
        const current = await input.pool.query<{ state: string }>('SELECT "state" FROM "Job" WHERE "id" = $1', [envelope.jobId]);
        if (current.rows[0]?.state !== "cancelled") throw new Error("JOB_STATE_CONFLICT");
        await input.pool.query('UPDATE "JobAttempt" SET "state" = \'cancelled\', "endedAt" = CURRENT_TIMESTAMP, "errorCode" = \'CANCELLED\' WHERE "id" = $1', [attemptId]);
        return;
      }
      await input.pool.query('UPDATE "JobAttempt" SET "state" = \'succeeded\', "endedAt" = CURRENT_TIMESTAMP WHERE "id" = $1', [attemptId]);
    } catch (error) {
      const cancelled = controller.signal.aborted || (error instanceof Error && error.message === "JOB_CANCELLED");
      await updateJobState(input.pool, envelope.jobId, cancelled ? "cancelled" : "failed", cancelled ? "cancelled" : "failed", 0);
      await input.pool.query(
        'UPDATE "JobAttempt" SET "state" = $2, "endedAt" = CURRENT_TIMESTAMP, "errorCode" = $3 WHERE "id" = $1',
        [attemptId, cancelled ? "cancelled" : "failed", cancelled ? "CANCELLED" : "HANDLER_FAILED"],
      );
      if (!cancelled) throw error;
    } finally {
      clearInterval(monitor);
    }
  }, {
    connection: input.connection as never,
    concurrency: input.concurrency ?? 1,
  });
}
