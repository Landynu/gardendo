-- CreateTable
CREATE TABLE "SoilTest" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "ph" DOUBLE PRECISION,
    "nitrogen" DOUBLE PRECISION,
    "phosphorus" DOUBLE PRECISION,
    "potassium" DOUBLE PRECISION,
    "organicMatter" DOUBLE PRECISION,
    "texture" TEXT,
    "notes" TEXT,
    "bedId" TEXT,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SoilTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmendmentLog" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "amendment" TEXT NOT NULL,
    "quantityLbs" DOUBLE PRECISION,
    "areaSqFt" DOUBLE PRECISION,
    "notes" TEXT,
    "bedId" TEXT,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AmendmentLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SoilTest" ADD CONSTRAINT "SoilTest_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "GardenBed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoilTest" ADD CONSTRAINT "SoilTest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoilTest" ADD CONSTRAINT "SoilTest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmendmentLog" ADD CONSTRAINT "AmendmentLog_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "GardenBed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmendmentLog" ADD CONSTRAINT "AmendmentLog_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmendmentLog" ADD CONSTRAINT "AmendmentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
