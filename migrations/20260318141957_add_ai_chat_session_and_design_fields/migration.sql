-- AlterTable
ALTER TABLE "BedDesignHistory" ADD COLUMN     "explanation" TEXT,
ADD COLUMN     "successionNotes" TEXT;

-- CreateTable
CREATE TABLE "AiChatSession" (
    "id" TEXT NOT NULL,
    "bedId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "season" "Season" NOT NULL DEFAULT 'SPRING',
    "messagesJson" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiChatSession_bedId_year_season_key" ON "AiChatSession"("bedId", "year", "season");

-- AddForeignKey
ALTER TABLE "AiChatSession" ADD CONSTRAINT "AiChatSession_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "GardenBed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
