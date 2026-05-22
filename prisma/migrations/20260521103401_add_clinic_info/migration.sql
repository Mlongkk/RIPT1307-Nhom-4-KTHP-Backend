-- CreateTable
CREATE TABLE "ClinicInfo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "district" TEXT,
    "country" TEXT,
    "website" TEXT,
    "description" TEXT,
    "logo_url" TEXT,
    "opening_hour" TEXT,
    "closing_hour" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicInfo_pkey" PRIMARY KEY ("id")
);
