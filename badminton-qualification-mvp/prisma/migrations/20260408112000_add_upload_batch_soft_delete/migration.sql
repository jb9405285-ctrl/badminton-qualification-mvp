-- AlterTable
ALTER TABLE "UploadBatch" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UploadBatch" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "UploadBatch" ADD COLUMN "deletedById" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UploadBatch" ADD COLUMN "archivedAt" DATETIME;
ALTER TABLE "UploadBatch" ADD COLUMN "archivedById" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "BatchAuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "batchId" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "detailJson" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BatchAuditLog_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "UploadBatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "BatchAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UploadBatch_isDeleted_createdAt_idx" ON "UploadBatch"("isDeleted", "createdAt");
CREATE INDEX "UploadBatch_archivedAt_idx" ON "UploadBatch"("archivedAt");
CREATE INDEX "UploadBatch_deletedAt_idx" ON "UploadBatch"("deletedAt");
CREATE INDEX "BatchAuditLog_batchId_createdAt_idx" ON "BatchAuditLog"("batchId", "createdAt");
CREATE INDEX "BatchAuditLog_actorId_createdAt_idx" ON "BatchAuditLog"("actorId", "createdAt");
CREATE INDEX "BatchAuditLog_action_createdAt_idx" ON "BatchAuditLog"("action", "createdAt");
