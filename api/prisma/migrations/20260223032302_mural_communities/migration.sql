/*
  Warnings:

  - Added the required column `communityId` to the `MuralPost` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MuralPost" ADD COLUMN     "communityId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "MuralCommunity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "moderatorIds" TEXT[],
    "memberIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "MuralCommunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_moderators" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_moderators_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_members" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_members_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "MuralCommunity_id_key" ON "MuralCommunity"("id");

-- CreateIndex
CREATE UNIQUE INDEX "MuralCommunity_name_key" ON "MuralCommunity"("name");

-- CreateIndex
CREATE INDEX "_moderators_B_index" ON "_moderators"("B");

-- CreateIndex
CREATE INDEX "_members_B_index" ON "_members"("B");

-- AddForeignKey
ALTER TABLE "MuralCommunity" ADD CONSTRAINT "MuralCommunity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuralPost" ADD CONSTRAINT "MuralPost_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "MuralCommunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_moderators" ADD CONSTRAINT "_moderators_A_fkey" FOREIGN KEY ("A") REFERENCES "MuralCommunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_moderators" ADD CONSTRAINT "_moderators_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_members" ADD CONSTRAINT "_members_A_fkey" FOREIGN KEY ("A") REFERENCES "MuralCommunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_members" ADD CONSTRAINT "_members_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
