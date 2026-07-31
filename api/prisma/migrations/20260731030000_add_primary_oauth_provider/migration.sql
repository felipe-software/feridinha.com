ALTER TABLE "User" ADD COLUMN "primaryOAuthProvider" "OAuthProvider";

-- Only infer a primary provider when its stored OAuth profile is an exact,
-- unambiguous match for the user's current public profile.
UPDATE "User" AS users
SET "primaryOAuthProvider" = account."provider"
FROM "OAuthAccount" AS account
WHERE account."userId" = users."id"
  AND account."displayName" = users."name"
  AND account."profileImage" = users."profileImage"
  AND NOT EXISTS (
    SELECT 1
    FROM "OAuthAccount" AS other
    WHERE other."userId" = users."id"
      AND other."displayName" = users."name"
      AND other."profileImage" = users."profileImage"
      AND (
        other."provider" <> account."provider"
        OR other."providerAccountId" <> account."providerAccountId"
      )
  );
