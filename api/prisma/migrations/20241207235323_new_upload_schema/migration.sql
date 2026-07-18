/*
  Warnings:

  - You are about to drop the column `path` on the `Upload` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Upload" DROP CONSTRAINT "Upload_userId_fkey";

-- AlterTable
ALTER TABLE "Upload" DROP COLUMN "path",
ADD COLUMN     "accessDates" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[],
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "sessions" SET DEFAULT ARRAY[]::TEXT[];

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
