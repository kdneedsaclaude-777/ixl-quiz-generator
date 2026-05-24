-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'parent',
    "emailVerified" DATETIME,
    "suspendedAt" DATETIME,
    "deletedAt" DATETIME,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ParentalSettings" (
    "studentId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "maxQuizzesPerDay" INTEGER,
    "windowStart" TEXT,
    "windowEnd" TEXT,
    "lockedTopicGroupIds" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ParentalSettings_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "emailEveryQuiz" BOOLEAN NOT NULL DEFAULT false,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "alertBelowScorePct" INTEGER DEFAULT 60,
    "alertNoPracticeDays" INTEGER DEFAULT 7,
    CONSTRAINT "NotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Badge" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "StudentBadge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" INTEGER NOT NULL,
    "badgeCode" TEXT NOT NULL,
    "earnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "context" TEXT,
    CONSTRAINT "StudentBadge_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentBadge_badgeCode_fkey" FOREIGN KEY ("badgeCode") REFERENCES "Badge" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "XPLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "XPLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "value" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Question" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quizId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "questionType" TEXT NOT NULL,
    "questionStyle" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "answerOptionsJson" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "displayLabel" TEXT NOT NULL,
    "learningObjective" TEXT NOT NULL,
    "conceptTagsJson" TEXT NOT NULL,
    "explanationJson" TEXT NOT NULL,
    "needsVisual" BOOLEAN NOT NULL DEFAULT false,
    "visualNote" TEXT,
    "visualSvg" TEXT,
    "toneGrade" INTEGER NOT NULL,
    "estimatedComplexity" TEXT NOT NULL,
    "weakSkillTargeted" BOOLEAN NOT NULL DEFAULT false,
    "remediationFlag" BOOLEAN NOT NULL DEFAULT false,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Question_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Question_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Question" ("answerOptionsJson", "conceptTagsJson", "correctAnswer", "difficulty", "displayLabel", "estimatedComplexity", "explanationJson", "id", "learningObjective", "needsVisual", "position", "questionStyle", "questionText", "questionType", "quizId", "remediationFlag", "skillId", "toneGrade", "visualNote", "visualSvg", "weakSkillTargeted") SELECT "answerOptionsJson", "conceptTagsJson", "correctAnswer", "difficulty", "displayLabel", "estimatedComplexity", "explanationJson", "id", "learningObjective", "needsVisual", "position", "questionStyle", "questionText", "questionType", "quizId", "remediationFlag", "skillId", "toneGrade", "visualNote", "visualSvg", "weakSkillTargeted" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
CREATE TABLE "new_Quiz" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "score" REAL,
    "difficulty" INTEGER NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "Quiz_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Quiz" ("completedAt", "createdAt", "difficulty", "id", "score", "status", "studentId") SELECT "completedAt", "createdAt", "difficulty", "id", "score", "status", "studentId" FROM "Quiz";
DROP TABLE "Quiz";
ALTER TABLE "new_Quiz" RENAME TO "Quiz";
CREATE TABLE "new_Skill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "topicGroupId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Skill_topicGroupId_fkey" FOREIGN KEY ("topicGroupId") REFERENCES "TopicGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Skill" ("code", "id", "name", "number", "topicGroupId") SELECT "code", "id", "name", "number", "topicGroupId" FROM "Skill";
DROP TABLE "Skill";
ALTER TABLE "new_Skill" RENAME TO "Skill";
CREATE UNIQUE INDEX "Skill_topicGroupId_number_key" ON "Skill"("topicGroupId", "number");
CREATE TABLE "new_Student" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "currentDifficulty" INTEGER NOT NULL DEFAULT 1,
    "tutorApproved" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Student_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("createdAt", "currentDifficulty", "grade", "id", "name", "tutorApproved") SELECT "createdAt", "currentDifficulty", "grade", "id", "name", "tutorApproved" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE TABLE "new_TopicGroup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gradeLevel" INTEGER NOT NULL,
    "letter" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_TopicGroup" ("gradeLevel", "id", "letter", "name") SELECT "gradeLevel", "id", "letter", "name" FROM "TopicGroup";
DROP TABLE "TopicGroup";
ALTER TABLE "new_TopicGroup" RENAME TO "TopicGroup";
CREATE UNIQUE INDEX "TopicGroup_gradeLevel_letter_key" ON "TopicGroup"("gradeLevel", "letter");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentBadge_studentId_badgeCode_key" ON "StudentBadge"("studentId", "badgeCode");

-- CreateIndex
CREATE INDEX "XPLog_studentId_idx" ON "XPLog"("studentId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
