-- CreateTable
CREATE TABLE "StoryVectorIndex" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "embeddingJson" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoryVectorIndex_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "StoryVectorIndex_projectId_sourceType_sourceId_key" ON "StoryVectorIndex"("projectId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "StoryVectorIndex_projectId_idx" ON "StoryVectorIndex"("projectId");

-- CreateIndex
CREATE INDEX "StoryVectorIndex_sourceType_idx" ON "StoryVectorIndex"("sourceType");
