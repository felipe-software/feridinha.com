/*
  Warnings:

  - The primary key for the `Upload` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `deletedAt` on the `Upload` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Upload` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[deleteCode]` on the table `Upload` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deleteCode` to the `Upload` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deleteCodeVersion` to the `Upload` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DeleteCodeVersion" AS ENUM ('LEGACY', 'NEW');

-- DropIndex
DROP INDEX "Upload_id_key";

-- AlterTable
ALTER TABLE "Upload" DROP CONSTRAINT "Upload_pkey",
DROP COLUMN "deletedAt",
DROP COLUMN "id",
ADD COLUMN     "deleteAt" TIMESTAMP(3),
ADD COLUMN     "deleteCode" TEXT NOT NULL,
ADD COLUMN     "deleteCodeVersion" "DeleteCodeVersion" NOT NULL,
ADD CONSTRAINT "Upload_pkey" PRIMARY KEY ("name");

-- CreateIndex
CREATE UNIQUE INDEX "Upload_deleteCode_key" ON "Upload"("deleteCode");
