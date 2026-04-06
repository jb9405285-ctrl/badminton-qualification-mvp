-- CreateTable
CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'ADMIN',
  "lastLoginAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "token" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "organizerName" TEXT NOT NULL,
  "eventDate" DATETIME NOT NULL,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdById" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Athlete" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "externalKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "gender" TEXT,
  "region" TEXT,
  "organization" TEXT,
  "level" TEXT NOT NULL,
  "certificateNo" TEXT,
  "sport" TEXT NOT NULL DEFAULT '羽毛球',
  "certifiedAt" DATETIME,
  "sourceName" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "sourceType" TEXT NOT NULL DEFAULT 'mock',
  "dataStatus" TEXT NOT NULL DEFAULT '演示数据',
  "riskCategory" TEXT NOT NULL DEFAULT 'CLEAR',
  "providerKey" TEXT NOT NULL DEFAULT 'mock',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UploadBatch" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "originalFileName" TEXT NOT NULL,
  "storedFilePath" TEXT,
  "fileType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "detectedNameColumn" TEXT,
  "totalRows" INTEGER NOT NULL DEFAULT 0,
  "processedRows" INTEGER NOT NULL DEFAULT 0,
  "matchedRows" INTEGER NOT NULL DEFAULT 0,
  "riskRows" INTEGER NOT NULL DEFAULT 0,
  "unresolvedRows" INTEGER NOT NULL DEFAULT 0,
  "columnsJson" TEXT,
  "previewRowsJson" TEXT,
  "rawRowsJson" TEXT,
  "summaryJson" TEXT,
  "errorMessage" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "UploadBatch_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UploadBatch_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationRecord" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "batchId" TEXT,
  "athleteId" TEXT,
  "athleteNameInput" TEXT NOT NULL,
  "matchedAthleteName" TEXT,
  "matchedLevel" TEXT,
  "matchedGender" TEXT,
  "matchedRegion" TEXT,
  "matchedOrganization" TEXT,
  "matchedSourceName" TEXT,
  "status" TEXT NOT NULL,
  "riskCategory" TEXT NOT NULL,
  "isRisk" BOOLEAN NOT NULL DEFAULT false,
  "remark" TEXT,
  "rowIndex" INTEGER,
  "rowDataJson" TEXT,
  "queryTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "VerificationRecord_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "VerificationRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "UploadBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "VerificationRecord_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Event_eventDate_idx" ON "Event"("eventDate");
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Athlete_externalKey_key" ON "Athlete"("externalKey");
CREATE INDEX "Athlete_name_idx" ON "Athlete"("name");
CREATE INDEX "Athlete_level_idx" ON "Athlete"("level");

-- CreateIndex
CREATE INDEX "UploadBatch_eventId_createdAt_idx" ON "UploadBatch"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "VerificationRecord_eventId_createdAt_idx" ON "VerificationRecord"("eventId", "createdAt");
CREATE INDEX "VerificationRecord_batchId_idx" ON "VerificationRecord"("batchId");
CREATE INDEX "VerificationRecord_status_idx" ON "VerificationRecord"("status");
CREATE INDEX "VerificationRecord_athleteNameInput_idx" ON "VerificationRecord"("athleteNameInput");
