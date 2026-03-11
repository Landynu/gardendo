-- CreateEnum
CREATE TYPE "BedShape" AS ENUM ('RECTANGLE', 'OVAL');

-- CreateEnum
CREATE TYPE "BedType" AS ENUM ('RAISED', 'IN_GROUND', 'CONTAINER');

-- AlterTable
ALTER TABLE "GardenBed" ADD COLUMN     "bedType" "BedType" NOT NULL DEFAULT 'IN_GROUND',
ADD COLUMN     "heightIn" INTEGER,
ADD COLUMN     "shape" "BedShape" NOT NULL DEFAULT 'RECTANGLE';
