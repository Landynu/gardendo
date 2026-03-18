/*
  Warnings:

  - Added the required column `propertyId` to the `HarvestLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "HarvestLog" DROP CONSTRAINT "HarvestLog_plantingId_fkey";

-- AlterTable
ALTER TABLE "HarvestLog" ADD COLUMN     "plantId" TEXT,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ALTER COLUMN "plantingId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "HarvestLog" ADD CONSTRAINT "HarvestLog_plantingId_fkey" FOREIGN KEY ("plantingId") REFERENCES "Planting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarvestLog" ADD CONSTRAINT "HarvestLog_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarvestLog" ADD CONSTRAINT "HarvestLog_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
