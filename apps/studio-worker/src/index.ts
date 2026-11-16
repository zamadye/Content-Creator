import { createPostgresPool } from "@content-studio/db";
import { createQueueConnection, createStudioWorker, runOutboxDispatcher } from "@content-studio/queue";
import { Redis } from "ioredis";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const pool = createPostgresPool(required("DATABASE_URL"));
const { connection: publisherConnection, queue } = createQueueConnection(required("REDIS_URL"));
const workerConnection = new Redis(required("REDIS_URL"), { maxRetriesPerRequest: null, enableReadyCheck: true });
const concurrency = Number(process.env.WORKER_CONCURRENCY ?? "1");
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new Error("WORKER_CONCURRENCY must be an integer from 1 to 4");

const worker = createStudioWorker({
  connection: workerConnection,
  pool,
  concurrency,
  handlers: {
    "system.health-check": async (_payload, signal) => {
      if (signal.aborted) throw new Error("JOB_CANCELLED");
      await pool.query("SELECT 1");
      if (signal.aborted) throw new Error("JOB_CANCELLED");
    },
  },
});

const controller = new AbortController();
const dispatcher = runOutboxDispatcher(pool, queue, controller.signal);
worker.on("failed", (job, error) => {
  // Deliberately omit job payload and connection details from process logs.
  console.error(JSON.stringify({ event: "worker.job.failed", jobId: job?.id, code: error.name }));
});
console.info(JSON.stringify({ event: "worker.ready", concurrency }));

let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  controller.abort();
  await worker.close();
  await dispatcher;
  await queue.close();
  await publisherConnection.quit();
  await workerConnection.quit();
  await pool.end();
}
process.on("SIGINT", () => { void shutdown().then(() => process.exit(0)); });
process.on("SIGTERM", () => { void shutdown().then(() => process.exit(0)); });
