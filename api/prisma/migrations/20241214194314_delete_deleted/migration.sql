/*
  Warnings:

  - You are about to drop the column `deleteAt` on the `Upload` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Upload" DROP COLUMN "deleteAt",
ADD COLUMN     "deletedAt" TIMESTAMP(3);
