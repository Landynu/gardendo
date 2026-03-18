-- CreateTable
CREATE TABLE "PropertyInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "invitedByUserId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "PropertyRole" NOT NULL DEFAULT 'MEMBER',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PropertyInvitation_token_key" ON "PropertyInvitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyInvitation_email_propertyId_key" ON "PropertyInvitation"("email", "propertyId");

-- AddForeignKey
ALTER TABLE "PropertyInvitation" ADD CONSTRAINT "PropertyInvitation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyInvitation" ADD CONSTRAINT "PropertyInvitation_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
