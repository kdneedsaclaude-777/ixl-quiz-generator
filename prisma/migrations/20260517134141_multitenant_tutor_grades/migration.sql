-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TutorAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tutorId" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TutorAssignment_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TutorAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
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
INSERT INTO "new_Student" ("createdAt", "currentDifficulty", "grade", "id", "level", "name", "parentId", "tutorApproved", "xp") SELECT "createdAt", "currentDifficulty", "grade", "id", "level", "name", "parentId", "tutorApproved", "xp" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");
CREATE INDEX "Student_orgId_idx" ON "Student"("orgId");
CREATE INDEX "Student_parentId_idx" ON "Student"("parentId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'parent',
    "orgId" TEXT,
    "emailVerified" DATETIME,
    "suspendedAt" DATETIME,
    "deletedAt" DATETIME,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "darkMode", "deletedAt", "email", "emailVerified", "id", "lastLoginAt", "name", "passwordHash", "role", "suspendedAt") SELECT "createdAt", "darkMode", "deletedAt", "email", "emailVerified", "id", "lastLoginAt", "name", "passwordHash", "role", "suspendedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_orgId_idx" ON "User"("orgId");
CREATE INDEX "User_role_idx" ON "User"("role");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "TutorAssignment_studentId_idx" ON "TutorAssignment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "TutorAssignment_tutorId_studentId_key" ON "TutorAssignment"("tutorId", "studentId");
