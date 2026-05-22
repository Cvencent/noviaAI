-- CreateTable
CREATE TABLE "StoryContract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT,
    "type" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'story-system/v1',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "payload" TEXT NOT NULL,
    "sourceTrace" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoryContract_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoryContract_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoryContextPack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "sections" TEXT NOT NULL,
    "totalTokenEstimate" INTEGER NOT NULL DEFAULT 0,
    "warnings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoryContextPack_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoryContextPack_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoryAgentRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'FULL_WRITE',
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "currentStep" TEXT NOT NULL DEFAULT 'CONTEXT',
    "instruction" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoryAgentRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoryAgentRun_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoryAgentStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "stepType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "input" TEXT,
    "output" TEXT,
    "error" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoryAgentStep_runId_fkey" FOREIGN KEY ("runId") REFERENCES "StoryAgentRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChapterCommit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "runId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "contentSnapshot" TEXT NOT NULL,
    "reviewResult" TEXT NOT NULL,
    "fulfillmentResult" TEXT NOT NULL,
    "extractionResult" TEXT NOT NULL,
    "acceptedEvents" TEXT,
    "stateDeltas" TEXT,
    "entityDeltas" TEXT,
    "summaryText" TEXT,
    "projectionStatus" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChapterCommit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChapterCommit_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChapterCommit_runId_fkey" FOREIGN KEY ("runId") REFERENCES "StoryAgentRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "StoryContract_projectId_chapterId_type_key" ON "StoryContract"("projectId", "chapterId", "type");

-- CreateIndex
CREATE INDEX "StoryContract_projectId_idx" ON "StoryContract"("projectId");
CREATE INDEX "StoryContract_chapterId_idx" ON "StoryContract"("chapterId");
CREATE INDEX "StoryContract_type_idx" ON "StoryContract"("type");
CREATE INDEX "StoryContextPack_projectId_idx" ON "StoryContextPack"("projectId");
CREATE INDEX "StoryContextPack_chapterId_idx" ON "StoryContextPack"("chapterId");
CREATE INDEX "StoryContextPack_status_idx" ON "StoryContextPack"("status");
CREATE INDEX "StoryAgentRun_projectId_idx" ON "StoryAgentRun"("projectId");
CREATE INDEX "StoryAgentRun_chapterId_idx" ON "StoryAgentRun"("chapterId");
CREATE INDEX "StoryAgentRun_status_idx" ON "StoryAgentRun"("status");
CREATE INDEX "StoryAgentStep_runId_idx" ON "StoryAgentStep"("runId");
CREATE INDEX "StoryAgentStep_stepType_idx" ON "StoryAgentStep"("stepType");
CREATE INDEX "StoryAgentStep_status_idx" ON "StoryAgentStep"("status");
CREATE INDEX "ChapterCommit_projectId_idx" ON "ChapterCommit"("projectId");
CREATE INDEX "ChapterCommit_chapterId_idx" ON "ChapterCommit"("chapterId");
CREATE INDEX "ChapterCommit_runId_idx" ON "ChapterCommit"("runId");
CREATE INDEX "ChapterCommit_status_idx" ON "ChapterCommit"("status");
