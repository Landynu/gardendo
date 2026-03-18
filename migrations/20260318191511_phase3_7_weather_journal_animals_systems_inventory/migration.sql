-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AnimalType" ADD VALUE 'DUCK';
ALTER TYPE "AnimalType" ADD VALUE 'GOOSE';
ALTER TYPE "AnimalType" ADD VALUE 'TURKEY';
ALTER TYPE "AnimalType" ADD VALUE 'GOAT';
ALTER TYPE "AnimalType" ADD VALUE 'SHEEP';
ALTER TYPE "AnimalType" ADD VALUE 'PIG';
ALTER TYPE "AnimalType" ADD VALUE 'COW';
ALTER TYPE "AnimalType" ADD VALUE 'RABBIT';
ALTER TYPE "AnimalType" ADD VALUE 'BEE';
ALTER TYPE "AnimalType" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "journalEntryId" TEXT;

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "weatherNotes" TEXT,
    "mood" TEXT,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_propertyId_date_userId_key" ON "JournalEntry"("propertyId", "date", "userId");

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
