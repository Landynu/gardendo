-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "aiSystemPrompt" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aiApiKey" TEXT;

-- CreateTable
CREATE TABLE "BedDesignHistory" (
    "id" TEXT NOT NULL,
    "bedId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "season" "Season" NOT NULL DEFAULT 'SPRING',
    "layoutJson" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BedDesignHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BedDesignHistory" ADD CONSTRAINT "BedDesignHistory_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "GardenBed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
