ALTER TABLE "Asset" ADD COLUMN "projectId" UUID NOT NULL;
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Asset_projectId_createdAt_idx" ON "Asset"("projectId", "createdAt");