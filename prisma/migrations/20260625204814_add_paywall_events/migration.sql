-- CreateTable
CREATE TABLE "PaywallEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "PaywallEvent_reason_createdAt_idx" ON "PaywallEvent"("reason", "createdAt");

-- CreateIndex
CREATE INDEX "PaywallEvent_userId_idx" ON "PaywallEvent"("userId");
