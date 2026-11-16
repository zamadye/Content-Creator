import { randomUUID } from "node:crypto";
import { Pool } from "pg";

export function createPostgresPool(connectionString: string): Pool {
  return new Pool({ connectionString, max: 5, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000 });
}

export type ProjectSummary = {
  id: string;
  title: string;
  currentRevisionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export interface ProjectRepository {
  listProjects(subject: string): Promise<ProjectSummary[]>;
  createProject(subject: string, title: string): Promise<ProjectSummary>;
}

export class AccessDeniedError extends Error {
  constructor() {
    super("RESOURCE_NOT_FOUND");
    this.name = "AccessDeniedError";
  }
}

/** Bootstrap must be called with an explicitly configured owner; never assigns the first visitor. */
export async function bootstrapOwnerWorkspace(pool: Pool, input: {
  workspaceId: string;
  workspaceName: string;
  ownerSubject: string;
}): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      'INSERT INTO "Workspace" ("id", "name") VALUES ($1, $2) ON CONFLICT ("id") DO NOTHING',
      [input.workspaceId, input.workspaceName],
    );
    await client.query(
      'INSERT INTO "Membership" ("id", "workspaceId", "subject", "role") VALUES ($1, $2, $3, \'owner\') ON CONFLICT ("workspaceId", "subject") DO NOTHING',
      [randomUUID(), input.workspaceId, input.ownerSubject],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export class PostgresProjectRepository implements ProjectRepository {
  constructor(private readonly pool: Pool) {}

  async listProjects(subject: string): Promise<ProjectSummary[]> {
    const result = await this.pool.query<ProjectSummary>(
      'SELECT p."id", p."title", p."currentRevisionId", p."createdAt", p."updatedAt" FROM "Project" p INNER JOIN "Membership" m ON m."workspaceId" = p."workspaceId" WHERE m."subject" = $1 ORDER BY p."updatedAt" DESC LIMIT 200',
      [subject],
    );
    return result.rows.map((row) => ({ ...row, createdAt: new Date(row.createdAt).toISOString(), updatedAt: new Date(row.updatedAt).toISOString() }));
  }

  async createProject(subject: string, title: string): Promise<ProjectSummary> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const membership = await client.query<{ workspaceId: string }>(
        'SELECT "workspaceId" FROM "Membership" WHERE "subject" = $1 ORDER BY "createdAt" LIMIT 1 FOR SHARE',
        [subject],
      );
      const workspaceId = membership.rows[0]?.workspaceId;
      if (!workspaceId) throw new AccessDeniedError();
      const result = await client.query<ProjectSummary>(
        'INSERT INTO "Project" ("id", "workspaceId", "title", "updatedAt") VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING "id", "title", "currentRevisionId", "createdAt", "updatedAt"',
        [randomUUID(), workspaceId, title],
      );
      await client.query(
        'INSERT INTO "AuditEvent" ("id", "workspaceId", "actor", "resource", "action", "metadata") VALUES ($1, $2, $3, $4, $5, $6::jsonb)',
        [randomUUID(), workspaceId, subject, result.rows[0]!.id, "project.created", JSON.stringify({ title })],
      );
      await client.query("COMMIT");
      const row = result.rows[0]!;
      return { ...row, createdAt: new Date(row.createdAt).toISOString(), updatedAt: new Date(row.updatedAt).toISOString() };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
