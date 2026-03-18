-- AlterTable
ALTER TABLE "Plant" ADD COLUMN     "familyId" TEXT;

-- CreateTable
CREATE TABLE "PlantFamily" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "commonName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantFamily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlantFamily_name_key" ON "PlantFamily"("name");

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "PlantFamily"("id") ON DELETE SET NULL ON UPDATE CASCADE;
