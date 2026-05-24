-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "refKey" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "NotificationLog_userId_idx" ON "NotificationLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationLog_userId_type_refKey_key" ON "NotificationLog"("userId", "type", "refKey");
