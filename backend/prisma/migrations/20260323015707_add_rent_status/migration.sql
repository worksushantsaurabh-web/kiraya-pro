-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "landlordId" TEXT NOT NULL,
    "userId" TEXT,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "rentAmount" REAL NOT NULL,
    "deposit" REAL,
    "leaseStart" DATETIME NOT NULL,
    "leaseEnd" DATETIME,
    "hometown" TEXT,
    "idProofUrl" TEXT,
    "rentDay" INTEGER NOT NULL DEFAULT 1,
    "rentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tenant_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tenant_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tenant" ("createdAt", "deposit", "email", "hometown", "id", "idProofUrl", "isActive", "landlordId", "leaseEnd", "leaseStart", "name", "phone", "propertyId", "rentAmount", "rentDay", "updatedAt", "userId") SELECT "createdAt", "deposit", "email", "hometown", "id", "idProofUrl", "isActive", "landlordId", "leaseEnd", "leaseStart", "name", "phone", "propertyId", "rentAmount", "rentDay", "updatedAt", "userId" FROM "Tenant";
DROP TABLE "Tenant";
ALTER TABLE "new_Tenant" RENAME TO "Tenant";
CREATE UNIQUE INDEX "Tenant_userId_key" ON "Tenant"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
