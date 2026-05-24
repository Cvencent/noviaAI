-- CreateTable
CREATE TABLE "ProjectAiSuggestionJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "input" TEXT NOT NULL,
    "result" TEXT,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectAiSuggestionJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProjectAiSuggestionJob_projectId_idx" ON "ProjectAiSuggestionJob"("projectId");

-- CreateIndex
CREATE INDEX "ProjectAiSuggestionJob_status_idx" ON "ProjectAiSuggestionJob"("status");

-- CreateIndex
CREATE INDEX "ProjectAiSuggestionJob_createdAt_idx" ON "ProjectAiSuggestionJob"("createdAt");
