-- CreateEnum
CREATE TYPE "MuralPostType" AS ENUM ('REDDIT', 'INSTAGRAM', 'TWITTER', 'FERIDINHA');

-- CreateTable
CREATE TABLE "MuralPost" (
    "id" TEXT NOT NULL,
    "bareContent" TEXT NOT NULL,
    "processedContent" TEXT,
    "contentType" "MuralPostType" NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aprovedAt" TIMESTAMP(3),
    "approvedById" TEXT NOT NULL,
    "notApprovedReason" TEXT,

    CONSTRAINT "MuralPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MuralPost_id_key" ON "MuralPost"("id");

-- CreateIndex
CREATE UNIQUE INDEX "MuralPost_userId_key" ON "MuralPost"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MuralPost_approvedById_key" ON "MuralPost"("approvedById");

-- AddForeignKey
ALTER TABLE "MuralPost" ADD CONSTRAINT "MuralPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuralPost" ADD CONSTRAINT "MuralPost_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
