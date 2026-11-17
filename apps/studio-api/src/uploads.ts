import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { AccessDeniedError } from "@content-studio/db";
import type { S3CompatiblePrivateStorage } from "@content-studio/storage";
import type { UploadAssetSummary, UploadService } from "./app.js";

/** Workspace authorization is derived from the project in PostgreSQL, never from request data. */
export function createPostgresUploadService(pool: Pool, storage: S3CompatiblePrivateStorage): UploadService {
  async function workspaceForProject(subject: string, projectId: string): Promise<string> {
    const result = await pool.query<{ workspaceId: string }>(
      'SELECT p."workspaceId" FROM "Project" p INNER JOIN "Membership" m ON m."workspaceId" = p."workspaceId" WHERE p."id" = $1 AND m."subject" = $2 LIMIT 1',
      [projectId, subject],
    );
    const workspaceId = result.rows[0]?.workspaceId;
    if (!workspaceId) throw new AccessDeniedError();
    return workspaceId;
  }

  return {
    async createIntent(input) {
      const workspaceId = await workspaceForProject(input.subject, input.projectId);
      return storage.createUploadIntent({ workspaceId, mime: input.mime, bytes: input.bytes });
    },

    async complete(input): Promise<UploadAssetSummary> {
      const workspaceId = await workspaceForProject(input.subject, input.projectId);
      const stored = await storage.completeUpload({
        workspaceId,
        intentId: input.intentId,
        expectedMime: input.mime,
        expectedBytes: input.bytes,
      });
      const id = randomUUID();
      const kind = input.mime.startsWith("image/") ? "image" : "audio";
      const client = await pool.connect();
      let transactionStarted = false;
      try {
        await client.query("BEGIN");
        transactionStarted = true;
        // Recheck membership in the same transaction as the asset and audit writes.
        const inserted = await client.query<{ id: string; projectId: string }>(
          'INSERT INTO "Asset" ("id", "workspaceId", "projectId", "kind", "storageKey", "sha256", "bytes", "mime", "metadata") SELECT $1, p."workspaceId", p."id", $4, $5, $6, $7, $8, $9::jsonb FROM "Project" p INNER JOIN "Membership" m ON m."workspaceId" = p."workspaceId" WHERE p."id" = $2 AND m."subject" = $3 ON CONFLICT ("workspaceId", "storageKey") DO UPDATE SET "sha256" = EXCLUDED."sha256", "bytes" = EXCLUDED."bytes", "mime" = EXCLUDED."mime" RETURNING "id", "projectId"',
          [id, input.projectId, input.subject, kind, stored.storageKey, stored.sha256, stored.bytes, stored.mime, JSON.stringify({ intentId: input.intentId })],
        );
        const persisted = inserted.rows[0];
        if (!persisted) throw new AccessDeniedError();
        await client.query(
          'INSERT INTO "AuditEvent" ("id", "workspaceId", "actor", "resource", "action", "metadata") VALUES ($1,$2,$3,$4,$5,$6::jsonb)',
          [randomUUID(), workspaceId, input.subject, persisted.id, "asset.uploaded", JSON.stringify({ projectId: persisted.projectId, sha256: stored.sha256, bytes: stored.bytes, mime: stored.mime })],
        );
        await client.query("COMMIT");
        transactionStarted = false;
        return {
          assetId: persisted.id,
          projectId: persisted.projectId,
          storageKey: stored.storageKey,
          sha256: stored.sha256,
          bytes: stored.bytes,
          mime: stored.mime,
        };
      } catch (error) {
        if (transactionStarted) await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    },

    async createDownloadUrl(input) {
      const found = await pool.query<{ workspaceId: string; storageKey: string }>(
        'SELECT a."workspaceId", a."storageKey" FROM "Asset" a INNER JOIN "Project" p ON p."id" = a."projectId" AND p."workspaceId" = a."workspaceId" INNER JOIN "Membership" m ON m."workspaceId" = a."workspaceId" WHERE a."id" = $1 AND p."id" = $2 AND m."subject" = $3 LIMIT 1',
        [input.assetId, input.projectId, input.subject],
      );
      const asset = found.rows[0];
      if (!asset) throw new AccessDeniedError();
      return {
        url: await storage.createDownloadUrl({ workspaceId: asset.workspaceId, storageKey: asset.storageKey, expiresInSeconds: 120 }),
        expiresInSeconds: 120,
      };
    },
  };
}
