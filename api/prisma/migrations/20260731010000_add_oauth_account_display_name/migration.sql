ALTER TABLE "OAuthAccount" ADD COLUMN "displayName" TEXT;

-- User.name came from the provider that originally created the user. Backfill
-- it only when that original identity is unambiguous (the sole earliest row).
UPDATE "OAuthAccount" AS account
SET "displayName" = users."name"
FROM "User" AS users
WHERE account."userId" = users."id"
  AND NOT EXISTS (
    SELECT 1
    FROM "OAuthAccount" AS other
    WHERE other."userId" = account."userId"
      AND (
        other."createdAt" < account."createdAt"
        OR (
          other."createdAt" = account."createdAt"
          AND (
            other."provider" <> account."provider"
            OR other."providerAccountId" <> account."providerAccountId"
          )
        )
      )
  );
