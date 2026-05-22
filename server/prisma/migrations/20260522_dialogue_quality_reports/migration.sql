-- CreateTable
CREATE TABLE "DialogueQualityReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PASS',
    "summary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DialogueQualityReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DialogueQualityReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DialogueSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DialogueQualityIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'NORMAL',
    "message" TEXT NOT NULL,
    "speaker" TEXT,
    "evidence" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DialogueQualityIssue_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "DialogueQualityReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DialogueQualityReport_projectId_idx" ON "DialogueQualityReport"("projectId");
CREATE INDEX "DialogueQualityReport_sessionId_idx" ON "DialogueQualityReport"("sessionId");
CREATE INDEX "DialogueQualityReport_status_idx" ON "DialogueQualityReport"("status");
CREATE INDEX "DialogueQualityIssue_reportId_idx" ON "DialogueQualityIssue"("reportId");
CREATE INDEX "DialogueQualityIssue_category_idx" ON "DialogueQualityIssue"("category");
CREATE INDEX "DialogueQualityIssue_severity_idx" ON "DialogueQualityIssue"("severity");
