-- CreateTable
CREATE TABLE "Student" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "currentDifficulty" INTEGER NOT NULL DEFAULT 1,
    "tutorApproved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TopicGroup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gradeLevel" INTEGER NOT NULL,
    "letter" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "topicGroupId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Skill_topicGroupId_fkey" FOREIGN KEY ("topicGroupId") REFERENCES "TopicGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudentTopicSelection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "topicGroupId" INTEGER NOT NULL,
    CONSTRAINT "StudentTopicSelection_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentTopicSelection_topicGroupId_fkey" FOREIGN KEY ("topicGroupId") REFERENCES "TopicGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "score" REAL,
    "difficulty" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "Quiz_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Question" (
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
    CONSTRAINT "Question_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Question_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "questionId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "selectedAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SkillProgress" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,
    "consecutiveCorrect" INTEGER NOT NULL DEFAULT 0,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "totalCorrect" INTEGER NOT NULL DEFAULT 0,
    "failedQuizzes" INTEGER NOT NULL DEFAULT 0,
    "remediationFlag" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SkillProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SkillProgress_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TopicGroup_gradeLevel_letter_key" ON "TopicGroup"("gradeLevel", "letter");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_topicGroupId_number_key" ON "Skill"("topicGroupId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "StudentTopicSelection_studentId_topicGroupId_key" ON "StudentTopicSelection"("studentId", "topicGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillProgress_studentId_skillId_key" ON "SkillProgress"("studentId", "skillId");
