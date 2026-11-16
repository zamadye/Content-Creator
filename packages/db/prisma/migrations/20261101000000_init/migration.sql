CREATE TABLE "Workspace" (
  "id" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Membership" (
  "id" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "subject" VARCHAR(255) NOT NULL,
  "role" VARCHAR(20) NOT NULL DEFAULT 'owner',
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Membership_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Membership_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Membership_workspaceId_subject_key" ON "Membership"("workspaceId", "subject");
CREATE INDEX "Membership_subject_idx" ON "Membership"("subject");

CREATE TABLE "Project" (
  "id" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "currentRevisionId" UUID,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Project_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Project_workspaceId_id_key" ON "Project"("workspaceId", "id");
CREATE INDEX "Project_workspaceId_updatedAt_idx" ON "Project"("workspaceId", "updatedAt");

CREATE TABLE "ProjectRevision" (
  "id" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "parentId" UUID,
  "schemaVersion" VARCHAR(20) NOT NULL,
  "revision" INTEGER NOT NULL,
  "etag" VARCHAR(80) NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectRevision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProjectRevision_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProjectRevision_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProjectRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ProjectRevision_projectId_id_key" ON "ProjectRevision"("projectId", "id");
CREATE UNIQUE INDEX "ProjectRevision_projectId_revision_key" ON "ProjectRevision"("projectId", "revision");
CREATE INDEX "ProjectRevision_projectId_createdAt_idx" ON "ProjectRevision"("projectId", "createdAt");
ALTER TABLE "Project" ADD CONSTRAINT "Project_currentRevisionId_fkey" FOREIGN KEY ("currentRevisionId") REFERENCES "ProjectRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Asset" (
  "id" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "kind" VARCHAR(40) NOT NULL,
  "storageKey" VARCHAR(512) NOT NULL,
  "sha256" CHAR(64) NOT NULL,
  "bytes" BIGINT NOT NULL,
  "mime" VARCHAR(127) NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Asset_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Asset_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Asset_workspaceId_storageKey_key" ON "Asset"("workspaceId", "storageKey");
CREATE INDEX "Asset_workspaceId_sha256_idx" ON "Asset"("workspaceId", "sha256");

CREATE TABLE "Job" (
  "id" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "operation" VARCHAR(80) NOT NULL,
  "idempotencyKey" VARCHAR(160) NOT NULL,
  "state" VARCHAR(20) NOT NULL DEFAULT 'queued',
  "stage" VARCHAR(80) NOT NULL DEFAULT 'queued',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "leaseExpiresAt" TIMESTAMPTZ(6),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "Job_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Job_state_check" CHECK ("state" IN ('queued','running','succeeded','failed','cancelled')),
  CONSTRAINT "Job_progress_check" CHECK ("progress" BETWEEN 0 AND 100),
  CONSTRAINT "Job_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Job_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Job_workspaceId_operation_idempotencyKey_key" ON "Job"("workspaceId", "operation", "idempotencyKey");
CREATE INDEX "Job_state_leaseExpiresAt_idx" ON "Job"("state", "leaseExpiresAt");
CREATE INDEX "Job_projectId_createdAt_idx" ON "Job"("projectId", "createdAt");

CREATE TABLE "JobAttempt" (
  "id" UUID NOT NULL,
  "jobId" UUID NOT NULL,
  "attempt" INTEGER NOT NULL,
  "state" VARCHAR(20) NOT NULL,
  "startedAt" TIMESTAMPTZ(6),
  "endedAt" TIMESTAMPTZ(6),
  "errorCode" VARCHAR(80),
  CONSTRAINT "JobAttempt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "JobAttempt_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "JobAttempt_jobId_attempt_key" ON "JobAttempt"("jobId", "attempt");

CREATE TABLE "OutboxEvent" (
  "id" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "eventType" VARCHAR(100) NOT NULL,
  "aggregateId" UUID NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMPTZ(6),
  "retryAt" TIMESTAMPTZ(6),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OutboxEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "OutboxEvent_publishedAt_retryAt_createdAt_idx" ON "OutboxEvent"("publishedAt", "retryAt", "createdAt");

CREATE TABLE "AuditEvent" (
  "id" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "actor" VARCHAR(255) NOT NULL,
  "resource" VARCHAR(120) NOT NULL,
  "action" VARCHAR(80) NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuditEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "AuditEvent_workspaceId_createdAt_idx" ON "AuditEvent"("workspaceId", "createdAt");
