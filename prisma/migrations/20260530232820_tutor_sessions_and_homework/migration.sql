-- CreateTable
CREATE TABLE "TutorSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tutorId" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "scheduledAt" DATETIME NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "focus" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TutorSession_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TutorSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HomeworkAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tutorId" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "assignedSkillIds" TEXT NOT NULL DEFAULT '[]',
    "dueAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HomeworkAssignment_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HomeworkAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TutorSession_studentId_idx" ON "TutorSession"("studentId");

-- CreateIndex
CREATE INDEX "TutorSession_tutorId_idx" ON "TutorSession"("tutorId");

-- CreateIndex
CREATE INDEX "TutorSession_scheduledAt_idx" ON "TutorSession"("scheduledAt");

-- CreateIndex
CREATE INDEX "HomeworkAssignment_studentId_status_idx" ON "HomeworkAssignment"("studentId", "status");

-- CreateIndex
CREATE INDEX "HomeworkAssignment_tutorId_idx" ON "HomeworkAssignment"("tutorId");
