-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "avatar" TEXT,
    "dailyGoal" INTEGER NOT NULL DEFAULT 1,
    "currentDifficulty" INTEGER NOT NULL DEFAULT 1,
    "tutorApproved" BOOLEAN NOT NULL DEFAULT true,
    "orgId" TEXT,
    "parentId" TEXT,
    "userId" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Student_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Student_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("avatar", "createdAt", "currentDifficulty", "grade", "id", "level", "name", "orgId", "parentId", "tutorApproved", "userId", "xp") SELECT "avatar", "createdAt", "currentDifficulty", "grade", "id", "level", "name", "orgId", "parentId", "tutorApproved", "userId", "xp" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");
CREATE INDEX "Student_orgId_idx" ON "Student"("orgId");
CREATE INDEX "Student_parentId_idx" ON "Student"("parentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
