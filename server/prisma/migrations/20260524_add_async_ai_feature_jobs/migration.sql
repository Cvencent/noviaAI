-- CreateTable
CREATE TABLE "ProjectStoryAiJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "input" TEXT NOT NULL,
    "result" TEXT,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectStoryAiJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OutlineAiJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "input" TEXT NOT NULL,
    "result" TEXT,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OutlineAiJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProjectStoryAiJob_projectId_idx" ON "ProjectStoryAiJob"("projectId");

-- CreateIndex
CREATE INDEX "ProjectStoryAiJob_type_idx" ON "ProjectStoryAiJob"("type");

-- CreateIndex
CREATE INDEX "ProjectStoryAiJob_status_idx" ON "ProjectStoryAiJob"("status");

-- CreateIndex
CREATE INDEX "ProjectStoryAiJob_createdAt_idx" ON "ProjectStoryAiJob"("createdAt");

-- CreateIndex
CREATE INDEX "OutlineAiJob_projectId_idx" ON "OutlineAiJob"("projectId");

-- CreateIndex
CREATE INDEX "OutlineAiJob_status_idx" ON "OutlineAiJob"("status");

-- CreateIndex
CREATE INDEX "OutlineAiJob_createdAt_idx" ON "OutlineAiJob"("createdAt");
