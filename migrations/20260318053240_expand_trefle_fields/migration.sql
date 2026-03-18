-- AlterTable
ALTER TABLE "Plant" ADD COLUMN     "atmosphericHumidity" INTEGER,
ADD COLUMN     "flowerConspicuous" BOOLEAN,
ADD COLUMN     "fruitConspicuous" BOOLEAN,
ADD COLUMN     "fruitShape" TEXT,
ADD COLUMN     "growthForm" TEXT,
ADD COLUMN     "growthHabit" TEXT,
ADD COLUMN     "ligneousType" TEXT,
ADD COLUMN     "maxHeightCm" DOUBLE PRECISION,
ADD COLUMN     "minRootDepthCm" DOUBLE PRECISION,
ADD COLUMN     "seedPersistence" BOOLEAN,
ADD COLUMN     "shapeAndOrientation" TEXT,
ADD COLUMN     "toxicity" TEXT;
