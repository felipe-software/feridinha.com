-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('TWITCH', 'GOOGLE', 'DISCORD');

-- CreateTable
CREATE TABLE "OAuthAccount" (
    "provider" "OAuthProvider" NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("provider", "providerAccountId")
);

-- Backfill every existing Twitch identity before allowing provider-less users.
INSERT INTO "OAuthAccount" ("provider", "providerAccountId", "userId", "createdAt", "lastLoginAt")
SELECT 'TWITCH'::"OAuthProvider", "twitchId", "id", "createdAt", "updatedAt"
FROM "User"
WHERE "twitchId" IS NOT NULL;

DO $$
BEGIN
    IF (
        SELECT COUNT(*) FROM "User" WHERE "twitchId" IS NOT NULL
    ) <> (
        SELECT COUNT(*) FROM "OAuthAccount" WHERE "provider" = 'TWITCH'
    ) THEN
        RAISE EXCEPTION 'OAuthAccount Twitch backfill count mismatch';
    END IF;
END $$;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "twitchId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_userId_provider_key" ON "OAuthAccount"("userId", "provider");

-- CreateIndex
CREATE INDEX "OAuthAccount_userId_idx" ON "OAuthAccount"("userId");

-- AddForeignKey
ALTER TABLE "OAuthAccount"
ADD CONSTRAINT "OAuthAccount_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
