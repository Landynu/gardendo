-- CreateEnum
CREATE TYPE "PropertyRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "PermacultureZone" AS ENUM ('ZONE_0', 'ZONE_1', 'ZONE_2', 'ZONE_3', 'ZONE_4', 'ZONE_5');

-- CreateEnum
CREATE TYPE "Season" AS ENUM ('SPRING', 'SUMMER', 'FALL');

-- CreateEnum
CREATE TYPE "PlantCategory" AS ENUM ('VEGETABLE', 'FRUIT', 'TREE', 'SHRUB', 'HERB', 'COVER_CROP', 'FLOWER', 'GRASS');

-- CreateEnum
CREATE TYPE "PlantLifecycle" AS ENUM ('ANNUAL', 'BIENNIAL', 'PERENNIAL');

-- CreateEnum
CREATE TYPE "SunRequirement" AS ENUM ('FULL_SUN', 'PARTIAL_SUN', 'PARTIAL_SHADE', 'FULL_SHADE');

-- CreateEnum
CREATE TYPE "WaterNeed" AS ENUM ('LOW', 'MODERATE', 'HIGH');

-- CreateEnum
CREATE TYPE "SeasonType" AS ENUM ('COOL', 'WARM');

-- CreateEnum
CREATE TYPE "PermacultureLayer" AS ENUM ('CANOPY', 'UNDERSTORY', 'SHRUB', 'HERBACEOUS', 'GROUND_COVER', 'VINE', 'ROOT', 'FUNGAL');

-- CreateEnum
CREATE TYPE "PlantDataSource" AS ENUM ('SEED', 'OPENFARM', 'USER');

-- CreateEnum
CREATE TYPE "CompanionType" AS ENUM ('BENEFICIAL', 'HARMFUL', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('SEED_START_INDOOR', 'SEED_START_OUTDOOR', 'TRANSPLANT', 'HARVEST_START', 'HARVEST_END', 'PRUNING', 'FERTILIZE', 'COMPOST', 'ANIMAL_CARE', 'WATER_SYSTEM', 'MAINTENANCE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskRecurrence" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'SEASONAL', 'YEARLY');

-- CreateEnum
CREATE TYPE "AnimalType" AS ENUM ('CHICKEN');

-- CreateEnum
CREATE TYPE "WaterSourceType" AS ENUM ('RAINWATER', 'RIVER_PUMP', 'WELL', 'MUNICIPAL');

-- CreateEnum
CREATE TYPE "InventoryCategory" AS ENUM ('SEED', 'TOOL', 'AMENDMENT', 'FEED', 'SUPPLY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "acreage" DOUBLE PRECISION NOT NULL,
    "hardinessZone" TEXT NOT NULL DEFAULT '3B',
    "lastFrostDate" TEXT NOT NULL DEFAULT '05-21',
    "firstFrostDate" TEXT NOT NULL DEFAULT '09-12',
    "timezone" TEXT NOT NULL DEFAULT 'America/Regina',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyMember" (
    "id" TEXT NOT NULL,
    "role" "PropertyRole" NOT NULL DEFAULT 'MEMBER',
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permZone" "PermacultureZone" NOT NULL,
    "description" TEXT,
    "areaSqFt" DOUBLE PRECISION,
    "notes" TEXT,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GardenBed" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "widthFt" INTEGER NOT NULL,
    "lengthFt" INTEGER NOT NULL,
    "soilType" TEXT,
    "notes" TEXT,
    "zoneId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GardenBed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BedSquare" (
    "id" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "col" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "season" "Season" NOT NULL DEFAULT 'SPRING',
    "bedId" TEXT NOT NULL,
    "plantingId" TEXT,
    "notes" TEXT,

    CONSTRAINT "BedSquare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Planting" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "season" "Season" NOT NULL DEFAULT 'SPRING',
    "datePlanted" TEXT,
    "dateHarvested" TEXT,
    "notes" TEXT,
    "plantId" TEXT NOT NULL,
    "bedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Planting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scientificName" TEXT,
    "variety" TEXT,
    "category" "PlantCategory" NOT NULL,
    "lifecycle" "PlantLifecycle" NOT NULL,
    "hardinessZoneMin" TEXT,
    "hardinessZoneMax" TEXT,
    "sunRequirement" "SunRequirement",
    "waterNeed" "WaterNeed",
    "seasonType" "SeasonType",
    "daysToMaturity" INTEGER,
    "daysToGermination" INTEGER,
    "plantDepthInches" DOUBLE PRECISION,
    "spacingInches" DOUBLE PRECISION,
    "rowSpacingInches" DOUBLE PRECISION,
    "plantHeightInches" DOUBLE PRECISION,
    "startIndoorWeeks" INTEGER,
    "transplantWeeks" INTEGER,
    "directSowWeeks" INTEGER,
    "harvestRelativeWeeks" INTEGER,
    "plantsPerSqFt" INTEGER,
    "sqftColor" TEXT,
    "permLayer" "PermacultureLayer",
    "isNitrogenFixer" BOOLEAN NOT NULL DEFAULT false,
    "isDynamicAccumulator" BOOLEAN NOT NULL DEFAULT false,
    "isEdible" BOOLEAN NOT NULL DEFAULT true,
    "isMedicinal" BOOLEAN NOT NULL DEFAULT false,
    "attractsPollinators" BOOLEAN NOT NULL DEFAULT false,
    "deerResistant" BOOLEAN NOT NULL DEFAULT false,
    "dataSource" "PlantDataSource" NOT NULL DEFAULT 'SEED',
    "isUserEdited" BOOLEAN NOT NULL DEFAULT false,
    "openFarmSlug" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "notes" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanionPlant" (
    "id" TEXT NOT NULL,
    "type" "CompanionType" NOT NULL,
    "notes" TEXT,
    "plantAId" TEXT NOT NULL,
    "plantBId" TEXT NOT NULL,

    CONSTRAINT "CompanionPlant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" "CalendarEventType" NOT NULL,
    "date" TEXT NOT NULL,
    "endDate" TEXT,
    "allDay" BOOLEAN NOT NULL DEFAULT true,
    "autoGenerated" BOOLEAN NOT NULL DEFAULT false,
    "generationKey" TEXT,
    "isUserEdited" BOOLEAN NOT NULL DEFAULT false,
    "propertyId" TEXT NOT NULL,
    "plantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TEXT,
    "completedAt" TIMESTAMP(3),
    "recurrence" "TaskRecurrence" NOT NULL DEFAULT 'NONE',
    "notes" TEXT,
    "generationKey" TEXT,
    "isUserEdited" BOOLEAN NOT NULL DEFAULT false,
    "assigneeId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "calendarEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimalGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "animalType" "AnimalType" NOT NULL,
    "notes" TEXT,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnimalGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Animal" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "breed" TEXT,
    "dateOfBirth" TEXT,
    "dateAcquired" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimalHealthRecord" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "treatment" TEXT,
    "notes" TEXT,
    "animalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnimalHealthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EggLog" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "notes" TEXT,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EggLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterSystem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" "WaterSourceType" NOT NULL,
    "capacityGallons" DOUBLE PRECISION,
    "notes" TEXT,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaterSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterLog" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "levelGallons" DOUBLE PRECISION,
    "usageGallons" DOUBLE PRECISION,
    "notes" TEXT,
    "systemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaterLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompostBin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "capacityCuFt" DOUBLE PRECISION,
    "notes" TEXT,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompostBin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompostLog" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "tempFahrenheit" DOUBLE PRECISION,
    "notes" TEXT,
    "binId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompostLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeedInventory" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER,
    "unit" TEXT,
    "supplier" TEXT,
    "yearPurchased" INTEGER,
    "expiryYear" INTEGER,
    "lotNumber" TEXT,
    "notes" TEXT,
    "plantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeedInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "InventoryCategory" NOT NULL,
    "quantity" INTEGER,
    "unit" TEXT,
    "location" TEXT,
    "condition" TEXT,
    "notes" TEXT,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HarvestLog" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "quantityLbs" DOUBLE PRECISION,
    "notes" TEXT,
    "plantingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HarvestLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "caption" TEXT,
    "takenAt" TEXT,
    "propertyId" TEXT NOT NULL,
    "zoneId" TEXT,
    "bedId" TEXT,
    "taskId" TEXT,
    "animalId" TEXT,
    "harvestLogId" TEXT,
    "inventoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaSensor" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sensorType" TEXT NOT NULL,
    "unit" TEXT,
    "zoneId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HaSensor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaSensorReading" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "numericValue" DOUBLE PRECISION,
    "isRollup" BOOLEAN NOT NULL DEFAULT false,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sensorId" TEXT NOT NULL,

    CONSTRAINT "HaSensorReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auth" (
    "id" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Auth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthIdentity" (
    "providerName" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "providerData" TEXT NOT NULL DEFAULT '{}',
    "authId" TEXT NOT NULL,

    CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY ("providerName","providerUserId")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PropertyMember_userId_propertyId_key" ON "PropertyMember"("userId", "propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "BedSquare_bedId_row_col_year_season_key" ON "BedSquare"("bedId", "row", "col", "year", "season");

-- CreateIndex
CREATE UNIQUE INDEX "CompanionPlant_plantAId_plantBId_key" ON "CompanionPlant"("plantAId", "plantBId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_generationKey_key" ON "CalendarEvent"("generationKey");

-- CreateIndex
CREATE UNIQUE INDEX "Task_generationKey_key" ON "Task"("generationKey");

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_key_key" ON "AppSettings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "HaSensor_entityId_key" ON "HaSensor"("entityId");

-- CreateIndex
CREATE INDEX "HaSensorReading_sensorId_recordedAt_idx" ON "HaSensorReading"("sensorId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Auth_userId_key" ON "Auth"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_id_key" ON "Session"("id");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- AddForeignKey
ALTER TABLE "PropertyMember" ADD CONSTRAINT "PropertyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyMember" ADD CONSTRAINT "PropertyMember_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyZone" ADD CONSTRAINT "PropertyZone_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GardenBed" ADD CONSTRAINT "GardenBed_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "PropertyZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BedSquare" ADD CONSTRAINT "BedSquare_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "GardenBed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BedSquare" ADD CONSTRAINT "BedSquare_plantingId_fkey" FOREIGN KEY ("plantingId") REFERENCES "Planting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planting" ADD CONSTRAINT "Planting_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planting" ADD CONSTRAINT "Planting_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "GardenBed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanionPlant" ADD CONSTRAINT "CompanionPlant_plantAId_fkey" FOREIGN KEY ("plantAId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanionPlant" ADD CONSTRAINT "CompanionPlant_plantBId_fkey" FOREIGN KEY ("plantBId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "CalendarEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalGroup" ADD CONSTRAINT "AnimalGroup_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AnimalGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalHealthRecord" ADD CONSTRAINT "AnimalHealthRecord_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EggLog" ADD CONSTRAINT "EggLog_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AnimalGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterSystem" ADD CONSTRAINT "WaterSystem_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterLog" ADD CONSTRAINT "WaterLog_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "WaterSystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompostBin" ADD CONSTRAINT "CompostBin_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompostLog" ADD CONSTRAINT "CompostLog_binId_fkey" FOREIGN KEY ("binId") REFERENCES "CompostBin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeedInventory" ADD CONSTRAINT "SeedInventory_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarvestLog" ADD CONSTRAINT "HarvestLog_plantingId_fkey" FOREIGN KEY ("plantingId") REFERENCES "Planting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarvestLog" ADD CONSTRAINT "HarvestLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "PropertyZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "GardenBed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_harvestLogId_fkey" FOREIGN KEY ("harvestLogId") REFERENCES "HarvestLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaSensorReading" ADD CONSTRAINT "HaSensorReading_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "HaSensor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auth" ADD CONSTRAINT "Auth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthIdentity" ADD CONSTRAINT "AuthIdentity_authId_fkey" FOREIGN KEY ("authId") REFERENCES "Auth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Auth"("id") ON DELETE CASCADE ON UPDATE CASCADE;
