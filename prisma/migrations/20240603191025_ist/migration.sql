-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateEnum
CREATE TYPE "auth"."HolesNumber" AS ENUM ('Nine', 'Eighteen');

-- CreateEnum
CREATE TYPE "auth"."aal_level" AS ENUM ('aal1', 'aal2', 'aal3');

-- CreateEnum
CREATE TYPE "auth"."code_challenge_method" AS ENUM ('s256', 'plain');

-- CreateEnum
CREATE TYPE "auth"."factor_status" AS ENUM ('unverified', 'verified');

-- CreateEnum
CREATE TYPE "auth"."factor_type" AS ENUM ('totp', 'webauthn');

-- CreateEnum
CREATE TYPE "auth"."DayOfWeek" AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');

-- CreateEnum
CREATE TYPE "auth"."Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "auth"."PaymentStatus" AS ENUM ('Pending', 'Completed', 'Failed', 'Refunded', 'Partial', 'Expired', 'Received', 'Rejected', 'Accepted');

-- CreateEnum
CREATE TYPE "auth"."BookingStatus" AS ENUM ('Pending', 'Completed', 'Failed', 'Refunded', 'Partial', 'Expired', 'Received', 'Rejected', 'Accepted');

-- CreateTable
CREATE TABLE "auth"."Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "kitPrice" INTEGER NOT NULL DEFAULT 1500,
    "teePrice" DOUBLE PRECISION NOT NULL DEFAULT 4500,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."HolesPrices" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "numberOfHoles" "auth"."HolesNumber" NOT NULL,
    "organizationId" TEXT,
    "listedEventId" TEXT,

    CONSTRAINT "HolesPrices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."KitPrices" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "organizationId" TEXT,
    "listedEventId" TEXT,

    CONSTRAINT "KitPrices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."OrganizationMember" (
    "usersId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("usersId","organizationId")
);

-- CreateTable
CREATE TABLE "auth"."Booking" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "classId" TEXT,
    "slug" TEXT,
    "tournamentId" TEXT,
    "bookingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usersId" TEXT NOT NULL,
    "teeId" TEXT,
    "status" "auth"."PaymentStatus" NOT NULL DEFAULT 'Pending',
    "bookingRef" SERIAL NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id","usersId")
);

-- CreateTable
CREATE TABLE "auth"."Cart" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usersId" TEXT NOT NULL,
    "slug" TEXT,
    "cartRef" SERIAL NOT NULL,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "auth"."BookingStatus" NOT NULL DEFAULT 'Pending',

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."ShoppingItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "src" TEXT NOT NULL,

    CONSTRAINT "ShoppingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."Tee" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "holes" TEXT NOT NULL DEFAULT '9 holes',
    "isExistingGame" TEXT NOT NULL DEFAULT 'No',
    "kit" TEXT NOT NULL DEFAULT 'No',

    CONSTRAINT "Tee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."EventMember" (
    "usersId" TEXT NOT NULL,
    "listedEventId" TEXT NOT NULL,

    CONSTRAINT "EventMember_pkey" PRIMARY KEY ("usersId","listedEventId")
);

-- CreateTable
CREATE TABLE "auth"."LikedEventMember" (
    "usersId" TEXT NOT NULL,
    "listedEventId" TEXT NOT NULL,

    CONSTRAINT "LikedEventMember_pkey" PRIMARY KEY ("usersId","listedEventId")
);

-- CreateTable
CREATE TABLE "auth"."ListedEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT DEFAULT 'https://res.cloudinary.com/dhciks96e/image/upload/v1706864390/MicrosoftTeams-image_1_1_yzivon.png',
    "kitPrice" INTEGER NOT NULL DEFAULT 1500,
    "startDate" TIMESTAMP(3),
    "type" TEXT NOT NULL DEFAULT 'Tournament',

    CONSTRAINT "ListedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."PackageGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "listedEventId" TEXT NOT NULL,

    CONSTRAINT "PackageGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."Membership" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "usersId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "slug" TEXT,
    "feeAmount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentStatus" "auth"."PaymentStatus" NOT NULL DEFAULT 'Pending',

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."Package" (
    "id" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "listedEventId" TEXT NOT NULL,
    "packageGroupId" TEXT,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."Event" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "holes" TEXT NOT NULL DEFAULT '9 holes',
    "isExistingGame" TEXT NOT NULL DEFAULT 'No',
    "kit" TEXT NOT NULL DEFAULT 'No',
    "listedEventId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."Class" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "cohort" INTEGER NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."ClassSchedule" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "dayOfWeek" "auth"."DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "ClassSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."Tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."Profile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "usersId" TEXT NOT NULL,
    "gender" "auth"."Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "cohort" INTEGER NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'Beginner',
    "countryCode" TEXT NOT NULL DEFAULT '254',
    "memberNumber" SERIAL NOT NULL,
    "image" TEXT NOT NULL DEFAULT 'https://res.cloudinary.com/dhciks96e/image/upload/v1703149574/DALL_E_2023-12-21_12.05.54_-_A_realistic_headshot_of_a_30-year-old_Kenyan_man_with_a_friendly_and_confident_expression._He_s_wearing_a_golf_cap_and_a_polo_shirt_suggesting_his_in_mg0tge.png',

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."Payment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "auth"."PaymentStatus" NOT NULL DEFAULT 'Pending',
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT,
    "eventId" TEXT,
    "classId" TEXT,
    "tournamentId" TEXT,
    "organizationId" TEXT,
    "usersId" TEXT,
    "teeId" TEXT,
    "checkoutRequestID" TEXT,
    "invoiceNumber" TEXT,
    "listedEventId" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."WebhookJson" (
    "id" TEXT NOT NULL,
    "body" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookJson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."LeaderBoardPoint" (
    "id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "leaderBoardId" TEXT NOT NULL,
    "profileId" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "LeaderBoardPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."LeaderBoard" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."_MembershipToOrganization" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_id_key" ON "auth"."Booking"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_slug_key" ON "auth"."Booking"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingRef_key" ON "auth"."Booking"("bookingRef");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_slug_key" ON "auth"."Cart"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_profileId_key" ON "auth"."Membership"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_usersId_key" ON "auth"."Profile"("usersId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_bookingId_key" ON "auth"."Payment"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_invoiceNumber_key" ON "auth"."Payment"("invoiceNumber");

-- CreateIndex
CREATE INDEX "LeaderBoardPoint_id_idx" ON "auth"."LeaderBoardPoint"("id");

-- CreateIndex
CREATE INDEX "LeaderBoard_id_idx" ON "auth"."LeaderBoard"("id");

-- CreateIndex
CREATE UNIQUE INDEX "_MembershipToOrganization_AB_unique" ON "auth"."_MembershipToOrganization"("A", "B");

-- CreateIndex
CREATE INDEX "_MembershipToOrganization_B_index" ON "auth"."_MembershipToOrganization"("B");

-- AddForeignKey
ALTER TABLE "auth"."HolesPrices" ADD CONSTRAINT "HolesPrices_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."HolesPrices" ADD CONSTRAINT "HolesPrices_listedEventId_fkey" FOREIGN KEY ("listedEventId") REFERENCES "auth"."ListedEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."KitPrices" ADD CONSTRAINT "KitPrices_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."KitPrices" ADD CONSTRAINT "KitPrices_listedEventId_fkey" FOREIGN KEY ("listedEventId") REFERENCES "auth"."ListedEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Booking" ADD CONSTRAINT "Booking_classId_fkey" FOREIGN KEY ("classId") REFERENCES "auth"."Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Booking" ADD CONSTRAINT "Booking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "auth"."Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Booking" ADD CONSTRAINT "Booking_teeId_fkey" FOREIGN KEY ("teeId") REFERENCES "auth"."Tee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Booking" ADD CONSTRAINT "Booking_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "auth"."Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."ShoppingItem" ADD CONSTRAINT "ShoppingItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "auth"."Cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Tee" ADD CONSTRAINT "Tee_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."EventMember" ADD CONSTRAINT "EventMember_listedEventId_fkey" FOREIGN KEY ("listedEventId") REFERENCES "auth"."ListedEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."LikedEventMember" ADD CONSTRAINT "LikedEventMember_listedEventId_fkey" FOREIGN KEY ("listedEventId") REFERENCES "auth"."ListedEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."PackageGroup" ADD CONSTRAINT "PackageGroup_listedEventId_fkey" FOREIGN KEY ("listedEventId") REFERENCES "auth"."ListedEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Membership" ADD CONSTRAINT "Membership_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "auth"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Package" ADD CONSTRAINT "Package_packageGroupId_fkey" FOREIGN KEY ("packageGroupId") REFERENCES "auth"."PackageGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Package" ADD CONSTRAINT "Package_listedEventId_fkey" FOREIGN KEY ("listedEventId") REFERENCES "auth"."ListedEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Event" ADD CONSTRAINT "Event_listedEventId_fkey" FOREIGN KEY ("listedEventId") REFERENCES "auth"."ListedEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Event" ADD CONSTRAINT "Event_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "auth"."Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Class" ADD CONSTRAINT "Class_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."ClassSchedule" ADD CONSTRAINT "ClassSchedule_classId_fkey" FOREIGN KEY ("classId") REFERENCES "auth"."Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Tournament" ADD CONSTRAINT "Tournament_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "auth"."Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Payment" ADD CONSTRAINT "Payment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "auth"."Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Payment" ADD CONSTRAINT "Payment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "auth"."Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Payment" ADD CONSTRAINT "Payment_listedEventId_fkey" FOREIGN KEY ("listedEventId") REFERENCES "auth"."ListedEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Payment" ADD CONSTRAINT "Payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Payment" ADD CONSTRAINT "Payment_teeId_fkey" FOREIGN KEY ("teeId") REFERENCES "auth"."Tee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Payment" ADD CONSTRAINT "Payment_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "auth"."Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."LeaderBoardPoint" ADD CONSTRAINT "LeaderBoardPoint_leaderBoardId_fkey" FOREIGN KEY ("leaderBoardId") REFERENCES "auth"."LeaderBoard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."LeaderBoardPoint" ADD CONSTRAINT "LeaderBoardPoint_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "auth"."Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."_MembershipToOrganization" ADD CONSTRAINT "_MembershipToOrganization_A_fkey" FOREIGN KEY ("A") REFERENCES "auth"."Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."_MembershipToOrganization" ADD CONSTRAINT "_MembershipToOrganization_B_fkey" FOREIGN KEY ("B") REFERENCES "auth"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
