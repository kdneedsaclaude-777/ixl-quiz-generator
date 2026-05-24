-- AlterTable
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "phoneVerified" DATETIME;

-- CreateTable
CREATE TABLE "PhoneVerification" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PhoneVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
