-- CreateTable
CREATE TABLE "PublishingAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "synopsis" TEXT NOT NULL,
    "sellingPoints" TEXT NOT NULL,
    "coverPrompt" TEXT NOT NULL,
    "coverSvg" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PublishingAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PublishingAsset_projectId_idx" ON "PublishingAsset"("projectId");
