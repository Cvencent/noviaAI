-- Add world-state projections and repair-plan override tracking.
ALTER TABLE "RepairPlan" ADD COLUMN "overrideReason" TEXT;

CREATE TABLE "WorldStateFact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "commitId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'FACT',
    "value" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorldStateFact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorldStateFact_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorldStateFact_commitId_fkey" FOREIGN KEY ("commitId") REFERENCES "ChapterCommit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "WorldStateFact_projectId_idx" ON "WorldStateFact"("projectId");
CREATE INDEX "WorldStateFact_chapterId_idx" ON "WorldStateFact"("chapterId");
CREATE INDEX "WorldStateFact_commitId_idx" ON "WorldStateFact"("commitId");
CREATE INDEX "WorldStateFact_key_idx" ON "WorldStateFact"("key");
CREATE INDEX "WorldStateFact_category_idx" ON "WorldStateFact"("category");
