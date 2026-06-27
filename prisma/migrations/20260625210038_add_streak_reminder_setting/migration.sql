-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NotificationSettings" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "emailEveryQuiz" BOOLEAN NOT NULL DEFAULT false,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "alertBelowScorePct" INTEGER DEFAULT 60,
    "alertNoPracticeDays" INTEGER DEFAULT 7,
    "streakReminder" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "NotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_NotificationSettings" ("alertBelowScorePct", "alertNoPracticeDays", "emailEveryQuiz", "userId", "weeklyDigest") SELECT "alertBelowScorePct", "alertNoPracticeDays", "emailEveryQuiz", "userId", "weeklyDigest" FROM "NotificationSettings";
DROP TABLE "NotificationSettings";
ALTER TABLE "new_NotificationSettings" RENAME TO "NotificationSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
