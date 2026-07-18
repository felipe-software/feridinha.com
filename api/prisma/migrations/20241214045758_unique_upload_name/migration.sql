/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Upload` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Upload_name_key" ON "Upload"("name");
