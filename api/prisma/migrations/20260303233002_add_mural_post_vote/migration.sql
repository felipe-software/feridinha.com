-- CreateTable
CREATE TABLE "MuralPostVote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "vote" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MuralPostVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MuralPostVote_id_key" ON "MuralPostVote"("id");

-- CreateIndex
CREATE UNIQUE INDEX "MuralPostVote_userId_postId_key" ON "MuralPostVote"("userId", "postId");

-- AddForeignKey
ALTER TABLE "MuralPostVote" ADD CONSTRAINT "MuralPostVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuralPostVote" ADD CONSTRAINT "MuralPostVote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "MuralPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
