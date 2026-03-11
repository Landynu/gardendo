/*
  Warnings:

  - The values [OPENFARM] on the enum `PlantDataSource` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `openFarmSlug` on the `Plant` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PlantDataSource_new" AS ENUM ('SEED', 'TREFLE', 'USER');
ALTER TABLE "Plant" ALTER COLUMN "dataSource" DROP DEFAULT;
ALTER TABLE "Plant" ALTER COLUMN "dataSource" TYPE "PlantDataSource_new" USING ("dataSource"::text::"PlantDataSource_new");
ALTER TYPE "PlantDataSource" RENAME TO "PlantDataSource_old";
ALTER TYPE "PlantDataSource_new" RENAME TO "PlantDataSource";
DROP TYPE "PlantDataSource_old";
ALTER TABLE "Plant" ALTER COLUMN "dataSource" SET DEFAULT 'SEED';
COMMIT;

-- AlterTable
ALTER TABLE "Plant" DROP COLUMN "openFarmSlug",
ADD COLUMN     "externalSlug" TEXT;
