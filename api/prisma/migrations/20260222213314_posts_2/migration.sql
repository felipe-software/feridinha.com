-- DropForeignKey
ALTER TABLE "MuralPost" DROP CONSTRAINT "MuralPost_approvedById_fkey";

-- DropIndex
DROP INDEX "MuralPost_approvedById_key";

-- DropIndex
DROP INDEX "MuralPost_userId_key";

-- AlterTable
ALTER TABLE "MuralPost" ALTER COLUMN "approvedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "MuralPost" ADD CONSTRAINT "MuralPost_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
