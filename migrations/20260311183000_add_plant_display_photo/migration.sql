-- AlterTable
ALTER TABLE "Plant" ADD COLUMN     "displayPhotoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Plant_displayPhotoId_key" ON "Plant"("displayPhotoId");

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_displayPhotoId_fkey" FOREIGN KEY ("displayPhotoId") REFERENCES "Photo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
