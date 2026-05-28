-- AlterTable: Add missing columns to UsageLog
ALTER TABLE "UsageLog" ADD COLUMN "model" TEXT;
ALTER TABLE "UsageLog" ADD COLUMN "promptTokens" INTEGER;
ALTER TABLE "UsageLog" ADD COLUMN "completionTokens" INTEGER;
ALTER TABLE "UsageLog" ADD COLUMN "duration" INTEGER;

-- CreateIndex
CREATE INDEX "UsageLog_createdAt_idx" ON "UsageLog"("createdAt");
CREATE INDEX "UsageLog_model_idx" ON "UsageLog"("model");

-- CreateTable
CREATE TABLE "LogRetentionSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LogRetentionSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "LogRetentionSetting_userId_key" ON "LogRetentionSetting"("userId");
