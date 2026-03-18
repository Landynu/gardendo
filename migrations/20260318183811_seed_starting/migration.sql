/*
  Warnings:

  - Added the required column `propertyId` to the `SeedInventory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SeedInventory" ADD COLUMN     "germinationRate" INTEGER,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "seedSource" TEXT,
ADD COLUMN     "storageLocation" TEXT;

-- CreateTable
CREATE TABLE "SeedStartLog" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "cellsStarted" INTEGER NOT NULL,
    "cellsSprouted" INTEGER,
    "sproutedDate" TEXT,
    "transplantedDate" TEXT,
    "medium" TEXT,
    "location" TEXT,
    "heatMat" BOOLEAN NOT NULL DEFAULT false,
    "lightHours" INTEGER,
    "notes" TEXT,
    "seedInventoryId" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeedStartLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SeedInventory" ADD CONSTRAINT "SeedInventory_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeedStartLog" ADD CONSTRAINT "SeedStartLog_seedInventoryId_fkey" FOREIGN KEY ("seedInventoryId") REFERENCES "SeedInventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeedStartLog" ADD CONSTRAINT "SeedStartLog_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeedStartLog" ADD CONSTRAINT "SeedStartLog_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeedStartLog" ADD CONSTRAINT "SeedStartLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
