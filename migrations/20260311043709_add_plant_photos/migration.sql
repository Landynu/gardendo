-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "plantId" TEXT;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
