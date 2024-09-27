-- CreateEnum
CREATE TYPE "auth"."InvitationStatus" AS ENUM ('Pending', 'Accepted', 'Expired');

-- AlterTable
ALTER TABLE "auth"."Organization" ADD COLUMN     "openHours" TEXT[] DEFAULT ARRAY['07:00 am', '8:00 am', '9:00 am', '10:00 am', '11:00 am', '12:00 pm', '01:00 pm', '02:00 pm', '03:00 pm', '4:00 pm']::TEXT[];

-- AlterTable
ALTER TABLE "auth"."Profile" ADD COLUMN     "handicap" TEXT,
ADD COLUMN     "handicapId" TEXT,
ALTER COLUMN "image" SET DEFAULT 'https://res.cloudinary.com/dhciks96e/image/upload/v1708946800/vecteezy_profile-user-icon-isolated-on-white-background-vector-eps10__w5hsml.jpg';

-- CreateTable
CREATE TABLE "auth"."Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "auth"."InvitationStatus" NOT NULL DEFAULT 'Pending',

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);
