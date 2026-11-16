import { createHash, randomUUID } from "node:crypto";
import { Pool } from "pg";

export function createPostgresPool(connectionString: string): Pool {
  return new Pool({ connectionString, max: 5, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000 });
}

export type ProjectSummary = {
  id: string;
  title: string;
  currentRevisionId: string | null;
  etag: string | null;
  createdAt: string;
  updatedAt: string;
};

export interface ProjectRepository {
  listProjects(subject: string): Promise<ProjectSummary[]>;
  createProject(subject: string, title: string): Promise<ProjectSummary>;
  updateProjectTitle(subject: string, projectId: string, title: string, ifMatch: string): Promise<ProjectSummary>;
}

export class AccessDeniedError extends Error {
  constructor() {
    super("RESOURCE_NOT_FOUND");
    this.name = "AccessDeniedError";
  }
}

export class RevisionConflictError extends Error {
  constructor() {
    super("REVISION_CONFLICT");
    this.name = "RevisionConflictError";
  }
}

/** Bootstrap must be called with an explicitly configured owner; never assigns the first visitor. */
export async function bootstrapOwnerWorkspace(pool: Pool, input: {
  workspaceId: string;
  workspaceName: string;
  ownerSubject: string;
}): Promise<void> {
  const client = await pool.connect();
  let transactionStarted = false;
  try {
    await client.query("BEGIN");
    transactionStarted = true;
    await client.query(
      'INSERT INTO "Workspace" ("id", "name") VALUES ($1, $2) ON CONFLICT ("id") DO NOTHING',
      [input.workspaceId, input.workspaceName],
    );
    await client.query(
      'INSERT INTO "Membership" ("id", "workspaceId", "subject", "role") VALUES ($1, $2, $3, \'owner\') ON CONFLICT ("workspaceId", "subject") DO NOTHING',
      [randomUUID(), input.workspaceId, input.ownerSubject],
    );
    await client.query("COMMIT");
    transactionStarted = false;
  } catch (error) {
    if (transactionStarted) await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export class PostgresProjectRepository implements ProjectRepository {
  constructor(private readonly pool: Pool) {}

  async listProjects(subject: string): Promise<ProjectSummary[]> {
    const result = await this.pool.query<ProjectSummary>(
      'SELECT p."id", p."title", p."currentRevisionId", r."etag", p."createdAt", p."updatedAt" FROM "Project" p INNER JOIN "Membership" m ON m."workspaceId" = p."workspaceId" LEFT JOIN "ProjectRevision" r ON r."id" = p."currentRevisionId" AND r."projectId" = p."id" WHERE m."subject" = $1 ORDER BY p."updatedAt" DESC LIMIT 200',
      [subject],
    );
    return result.rows.map((row) => ({ ...row, createdAt: new Date(row.createdAt).toISOString(), updatedAt: new Date(row.updatedAt).toISOString() }));
  }

  async createProject(subject: string, title: string): Promise<ProjectSummary> {
    const client = await this.pool.connect();
    let transactionStarted = false;
    try {
      await client.query("BEGIN");
      transactionStarted = true;
      const membership = await client.query<{ workspaceId: string }>(
        'SELECT "workspaceId" FROM "Membership" WHERE "subject" = $1 ORDER BY "createdAt" LIMIT 1 FOR SHARE',
        [subject],
      );
      const workspaceId = membership.rows[0]?.workspaceId;
      if (!workspaceId) throw new AccessDeniedError();

      const projectId = randomUUID();
      const revisionId = randomUUID();
      const snapshot = {
        schemaVersion: "1.0",
        projectId,
        revisionId,
        parentRevisionId: null,
        title,
        state: "empty-draft",
      };
      const etag = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
      const inserted = await client.query<ProjectSummary>(
        'INSERT INTO "Project" ("id", "workspaceId", "title", "updatedAt") VALUES ($1,$2,$3,CURRENT_TIMESTAMP) RETURNING "id", "title", "currentRevisionId", "createdAt", "updatedAt"',
        [projectId, workspaceId, title],
      );
      const row = inserted.rows[0]!;
      await client.query(
        'INSERT INTO "ProjectRevision" ("id", "projectId", "parentId", "schemaVersion", "revision", "etag", "snapshot") VALUES ($1,$2,NULL,\'1.0\',1,$3,$4::jsonb)',
        [revisionId, projectId, etag, JSON.stringify(snapshot)],
      );
      await client.query(
        'UPDATE "Project" SET "currentRevisionId" = $2, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1',
        [projectId, revisionId],
      );
      await client.query(
        'INSERT INTO "AuditEvent" ("id", "workspaceId", "actor", "resource", "action", "metadata") VALUES ($1,$2,$3,$4,$5,$6::jsonb)',
        [randomUUID(), workspaceId, subject, projectId, "project.created", JSON.stringify({ revisionId, etag })],
      );
      await client.query("COMMIT");
      transactionStarted = false;
      return {
        ...row,
        currentRevisionId: revisionId,
        etag,
        createdAt: new Date(row.createdAt).toISOString(),
        updatedAt: new Date(row.updatedAt).toISOString(),
      };
    } catch (error) {
      if (transactionStarted) await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateProjectTitle(subject: string, projectId: string, title: string, ifMatch: string): Promise<ProjectSummary> {
    const client = await this.pool.connect();
    let transactionStarted = false;
    try {
      await client.query("BEGIN");
      transactionStarted = true;
      const selected = await client.query<{
        workspaceId: string; currentRevisionId: string; revision: number; etag: string; snapshot: Record<string, unknown> | string; createdAt: Date;
      }>(
        'SELECT p."workspaceId", p."currentRevisionId", r."revision", r."etag", r."snapshot", p."createdAt" FROM "Project" p INNER JOIN "Membership" m ON m."workspaceId" = p."workspaceId" INNER JOIN "ProjectRevision" r ON r."id" = p."currentRevisionId" AND r."projectId" = p."id" WHERE p."id" = $1 AND m."subject" = $2 FOR UPDATE OF p, r',
        [projectId, subject],
      );
      const current = selected.rows[0];
      if (!current) throw new AccessDeniedError();
      if (current.etag !== ifMatch) throw new RevisionConflictError();
      const priorSnapshot = typeof current.snapshot === "string" ? JSON.parse(current.snapshot) as Record<string, unknown> : current.snapshot;
      const revisionId = randomUUID();
      const snapshot = { ...priorSnapshot, revisionId, parentRevisionId: current.currentRevisionId, title };
      const etag = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
      await client.query(
        'INSERT INTO "ProjectRevision" ("id", "projectId", "parentId", "schemaVersion", "revision", "etag", "snapshot") VALUES ($1,$2,$3,\'1.0\',$4,$5,$6::jsonb)',
        [revisionId, projectId, current.currentRevisionId, current.revision + 1, etag, JSON.stringify(snapshot)],
      );
      const updated = await client.query<{ updatedAt: Date }>(
        'UPDATE "Project" SET "title" = $2, "currentRevisionId" = $3, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1 RETURNING "updatedAt"',
        [projectId, title, revisionId],
      );
      await client.query(
        'INSERT INTO "AuditEvent" ("id", "workspaceId", "actor", "resource", "action", "metadata") VALUES ($1,$2,$3,$4,$5,$6::jsonb)',
        [randomUUID(), current.workspaceId, subject, projectId, "project.title.updated", JSON.stringify({ revisionId, etag })],
      );
      await client.query("COMMIT");
      transactionStarted = false;
      return { id: projectId, title, currentRevisionId: revisionId, etag, createdAt: new Date(current.createdAt).toISOString(), updatedAt: new Date(updated.rows[0]!.updatedAt).toISOString() };
    } catch (error) {
      if (transactionStarted) await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }
}
