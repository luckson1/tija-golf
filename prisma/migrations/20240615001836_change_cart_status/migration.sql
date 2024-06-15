/*
  Warnings:

  - The `status` column on the `Cart` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "auth"."Cart" DROP COLUMN "status",
ADD COLUMN     "status" "auth"."PaymentStatus" NOT NULL DEFAULT 'Pending';
