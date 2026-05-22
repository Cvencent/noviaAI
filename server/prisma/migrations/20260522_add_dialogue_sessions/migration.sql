-- CreateTable
CREATE TABLE "DialogueSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "conflict" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "mood" TEXT,
    "allowSecretReveal" BOOLEAN NOT NULL DEFAULT false,
    "length" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "characterIds" TEXT NOT NULL,
    "currentTurn" INTEGER NOT NULL DEFAULT 0,
    "lastInstruction" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DialogueSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DialogueMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "speaker" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'DIALOGUE',
    "order" INTEGER NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DialogueMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DialogueSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DialogueSession_projectId_idx" ON "DialogueSession"("projectId");

-- CreateIndex
CREATE INDEX "DialogueSession_chapterId_idx" ON "DialogueSession"("chapterId");

-- CreateIndex
CREATE INDEX "DialogueSession_status_idx" ON "DialogueSession"("status");

-- CreateIndex
CREATE INDEX "DialogueMessage_sessionId_idx" ON "DialogueMessage"("sessionId");

-- CreateIndex
CREATE INDEX "DialogueMessage_order_idx" ON "DialogueMessage"("order");
