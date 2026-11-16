import { Queue } from "bullmq";
import { Redis } from "ioredis";
import type { Pool } from "pg";
import { withNextOutboxEvent } from "@content-studio/db";
import { CONTENT_QUEUE_NAME } from "./constants.js";
export { CONTENT_QUEUE_NAME } from "./constants.js";
export { createStudioWorker } from "./worker.js";
export type { JobHandler, WorkEnvelope } from "./worker.js";

export function createQueueConnection(redisUrl: string) {
  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
  });
  const queue = new Queue(CONTENT_QUEUE_NAME, { connection, defaultJobOptions: { removeOnComplete: false, removeOnFail: false, attempts: 3, backoff: { type: "exponential", delay: 1_000 } } });
  return { connection, queue };
}

/** Publishes only committed outbox envelopes; event UUID is the broker idempotency key. */
export async function dispatchOutboxOnce(pool: Pool, queue: Queue): Promise<boolean> {
  const result = await withNextOutboxEvent(pool, async (event) => {
    await queue.add(event.eventType, event.payload, { jobId: event.id, removeOnComplete: false, removeOnFail: false });
    return event.id;
  });
  return result !== null;
}

export async function runOutboxDispatcher(pool: Pool, queue: Queue, signal: AbortSignal, idleMs = 750): Promise<void> {
  while (!signal.aborted) {
    try {
      const dispatched = await dispatchOutboxOnce(pool, queue);
      if (!dispatched) await wait(idleMs, signal);
    } catch {
      // DB records retryAt/attempts. Keep logs free of queue payloads and connection details.
      await wait(idleMs, signal);
    }
  }
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const finish = () => { clearTimeout(timer); signal.removeEventListener("abort", finish); resolve(); };
    const timer = setTimeout(finish, ms);
    signal.addEventListener("abort", finish, { once: true });
  });
}
