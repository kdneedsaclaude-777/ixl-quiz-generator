-- CreateTable
CREATE TABLE "VideoResource" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subject" TEXT NOT NULL,
    "gradeMin" INTEGER NOT NULL,
    "gradeMax" INTEGER NOT NULL,
    "topicGroupLetter" TEXT NOT NULL,
    "skillCode" TEXT,
    "title" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "qualityScore" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "VideoResource_subject_gradeMin_gradeMax_idx" ON "VideoResource"("subject", "gradeMin", "gradeMax");

-- CreateIndex
CREATE INDEX "VideoResource_topicGroupLetter_idx" ON "VideoResource"("topicGroupLetter");
