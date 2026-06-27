-- CreateTable
CREATE TABLE "StudentClaimCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" INTEGER NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "claimedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentClaimCode_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentClaimCode_studentId_key" ON "StudentClaimCode"("studentId");

-- CreateIndex
CREATE INDEX "StudentClaimCode_codeHash_idx" ON "StudentClaimCode"("codeHash");
