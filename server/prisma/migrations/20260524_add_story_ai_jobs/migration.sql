-- CreateTable
CREATE TABLE "StoryAiJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "input" TEXT NOT NULL,
    "result" TEXT,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoryAiJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoryAiJob_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "StoryAiJob_projectId_idx" ON "StoryAiJob"("projectId");

-- CreateIndex
CREATE INDEX "StoryAiJob_chapterId_idx" ON "StoryAiJob"("chapterId");

-- CreateIndex
CREATE INDEX "StoryAiJob_status_idx" ON "StoryAiJob"("status");

-- CreateIndex
CREATE INDEX "StoryAiJob_type_idx" ON "StoryAiJob"("type");

-- CreateIndex
CREATE INDEX "StoryAiJob_createdAt_idx" ON "StoryAiJob"("createdAt");
