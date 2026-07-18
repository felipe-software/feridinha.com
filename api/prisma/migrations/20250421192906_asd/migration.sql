/*
  Warnings:

  - You are about to drop the column `reviewId` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_reviewId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "reviewId";
