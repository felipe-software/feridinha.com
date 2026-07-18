/*
  Warnings:

  - Added the required column `hiddenDescription` to the `Achievement` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Achievement` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Achievement" ADD COLUMN     "hiddenDescription" TEXT NOT NULL,
ALTER COLUMN "description" SET NOT NULL;
