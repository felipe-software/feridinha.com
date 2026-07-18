/*
  Warnings:

  - The values [REDDIT,INSTAGRAM,TWITTER,FERIDINHA,TIKTOK] on the enum `MuralPostType` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `contentOrigin` to the `MuralPost` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MuralPostOrigin" AS ENUM ('REDDIT', 'INSTAGRAM', 'TWITTER', 'TIKTOK', 'FERIDINHA');

-- AlterEnum
BEGIN;
CREATE TYPE "MuralPostType_new" AS ENUM ('VIDEO', 'IMAGE');
ALTER TABLE "MuralPost" ALTER COLUMN "contentType" TYPE "MuralPostType_new" USING ("contentType"::text::"MuralPostType_new");
ALTER TYPE "MuralPostType" RENAME TO "MuralPostType_old";
ALTER TYPE "MuralPostType_new" RENAME TO "MuralPostType";
DROP TYPE "public"."MuralPostType_old";
COMMIT;

-- AlterTable
ALTER TABLE "MuralPost" ADD COLUMN     "contentOrigin" "MuralPostOrigin" NOT NULL;
