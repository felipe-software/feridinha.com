-- DropForeignKey
ALTER TABLE "MuralCommunity" DROP CONSTRAINT "MuralCommunity_createdById_fkey";

-- AlterTable
ALTER TABLE "MuralCommunity" ALTER COLUMN "createdById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "MuralCommunity" ADD CONSTRAINT "MuralCommunity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
