-- AlterTable
ALTER TABLE "ChapterCommit" ADD COLUMN "repairPlanId" TEXT;
ALTER TABLE "ChapterCommit" ADD COLUMN "blockingReasons" TEXT;

-- CreateTable
CREATE TABLE "ReviewReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "commitId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PASS',
    "summary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReviewReport_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReviewReport_commitId_fkey" FOREIGN KEY ("commitId") REFERENCES "ChapterCommit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'NORMAL',
    "blocking" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT NOT NULL,
    "evidence" TEXT,
    "suggestion" TEXT,
    "startOffset" INTEGER,
    "endOffset" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewIssue_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ReviewReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RepairPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "commitId" TEXT,
    "reportId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "steps" TEXT NOT NULL,
    "targetRanges" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RepairPlan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RepairPlan_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RepairPlan_commitId_fkey" FOREIGN KEY ("commitId") REFERENCES "ChapterCommit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RepairPlan_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ReviewReport" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoryEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "commitId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "payload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoryEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoryEvent_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoryEvent_commitId_fkey" FOREIGN KEY ("commitId") REFERENCES "ChapterCommit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CharacterState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "commitId" TEXT NOT NULL,
    "characterName" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CharacterState_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CharacterState_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CharacterState_commitId_fkey" FOREIGN KEY ("commitId") REFERENCES "ChapterCommit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OpenLoop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT,
    "commitId" TEXT,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "payload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OpenLoop_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OpenLoop_commitId_fkey" FOREIGN KEY ("commitId") REFERENCES "ChapterCommit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoryEntity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CONCEPT',
    "aliases" TEXT,
    "payload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoryEntity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EntityMention" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "chapterId" TEXT,
    "commitId" TEXT,
    "excerpt" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EntityMention_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "StoryEntity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EntityMention_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EntityMention_commitId_fkey" FOREIGN KEY ("commitId") REFERENCES "ChapterCommit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoryRelation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "fromEntityId" TEXT NOT NULL,
    "toEntityId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoryRelation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoryRelation_fromEntityId_fkey" FOREIGN KEY ("fromEntityId") REFERENCES "StoryEntity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoryRelation_toEntityId_fkey" FOREIGN KEY ("toEntityId") REFERENCES "StoryEntity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ChapterCommit_repairPlanId_idx" ON "ChapterCommit"("repairPlanId");
CREATE INDEX "ReviewReport_projectId_idx" ON "ReviewReport"("projectId");
CREATE INDEX "ReviewReport_chapterId_idx" ON "ReviewReport"("chapterId");
CREATE INDEX "ReviewReport_commitId_idx" ON "ReviewReport"("commitId");
CREATE INDEX "ReviewReport_status_idx" ON "ReviewReport"("status");
CREATE INDEX "ReviewIssue_reportId_idx" ON "ReviewIssue"("reportId");
CREATE INDEX "ReviewIssue_category_idx" ON "ReviewIssue"("category");
CREATE INDEX "ReviewIssue_blocking_idx" ON "ReviewIssue"("blocking");
CREATE UNIQUE INDEX "RepairPlan_commitId_key" ON "RepairPlan"("commitId");
CREATE INDEX "RepairPlan_projectId_idx" ON "RepairPlan"("projectId");
CREATE INDEX "RepairPlan_chapterId_idx" ON "RepairPlan"("chapterId");
CREATE INDEX "RepairPlan_reportId_idx" ON "RepairPlan"("reportId");
CREATE INDEX "RepairPlan_status_idx" ON "RepairPlan"("status");
CREATE INDEX "StoryEvent_projectId_idx" ON "StoryEvent"("projectId");
CREATE INDEX "StoryEvent_chapterId_idx" ON "StoryEvent"("chapterId");
CREATE INDEX "StoryEvent_commitId_idx" ON "StoryEvent"("commitId");
CREATE INDEX "StoryEvent_eventType_idx" ON "StoryEvent"("eventType");
CREATE INDEX "CharacterState_projectId_idx" ON "CharacterState"("projectId");
CREATE INDEX "CharacterState_chapterId_idx" ON "CharacterState"("chapterId");
CREATE INDEX "CharacterState_commitId_idx" ON "CharacterState"("commitId");
CREATE INDEX "CharacterState_characterName_idx" ON "CharacterState"("characterName");
CREATE UNIQUE INDEX "OpenLoop_projectId_key_key" ON "OpenLoop"("projectId", "key");
CREATE INDEX "OpenLoop_projectId_idx" ON "OpenLoop"("projectId");
CREATE INDEX "OpenLoop_chapterId_idx" ON "OpenLoop"("chapterId");
CREATE INDEX "OpenLoop_commitId_idx" ON "OpenLoop"("commitId");
CREATE INDEX "OpenLoop_status_idx" ON "OpenLoop"("status");
CREATE UNIQUE INDEX "StoryEntity_projectId_name_key" ON "StoryEntity"("projectId", "name");
CREATE INDEX "StoryEntity_projectId_idx" ON "StoryEntity"("projectId");
CREATE INDEX "StoryEntity_type_idx" ON "StoryEntity"("type");
CREATE INDEX "EntityMention_projectId_idx" ON "EntityMention"("projectId");
CREATE INDEX "EntityMention_entityId_idx" ON "EntityMention"("entityId");
CREATE INDEX "EntityMention_chapterId_idx" ON "EntityMention"("chapterId");
CREATE INDEX "EntityMention_commitId_idx" ON "EntityMention"("commitId");
CREATE UNIQUE INDEX "StoryRelation_projectId_fromEntityId_toEntityId_type_key" ON "StoryRelation"("projectId", "fromEntityId", "toEntityId", "type");
CREATE INDEX "StoryRelation_projectId_idx" ON "StoryRelation"("projectId");
CREATE INDEX "StoryRelation_fromEntityId_idx" ON "StoryRelation"("fromEntityId");
CREATE INDEX "StoryRelation_toEntityId_idx" ON "StoryRelation"("toEntityId");
CREATE INDEX "StoryRelation_type_idx" ON "StoryRelation"("type");
