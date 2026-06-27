-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'parent',
    "orgId" TEXT,
    "emailVerified" DATETIME,
    "phone" TEXT,
    "phoneVerified" DATETIME,
    "suspendedAt" DATETIME,
    "deletedAt" DATETIME,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "currentPeriodEnd" DATETIME,
    CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "darkMode", "deletedAt", "email", "emailVerified", "id", "lastLoginAt", "name", "orgId", "passwordHash", "phone", "phoneVerified", "role", "suspendedAt") SELECT "createdAt", "darkMode", "deletedAt", "email", "emailVerified", "id", "lastLoginAt", "name", "orgId", "passwordHash", "phone", "phoneVerified", "role", "suspendedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
CREATE INDEX "User_orgId_idx" ON "User"("orgId");
CREATE INDEX "User_role_idx" ON "User"("role");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
