-- Phase 1 of removing User.twitchId.
-- OAuthAccount is authoritative. Abort instead of guessing when legacy data is ambiguous.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "User" AS legacy_user
        JOIN "OAuthAccount" AS account
          ON account."provider" = 'TWITCH'::"OAuthProvider"
         AND account."providerAccountId" = legacy_user."twitchId"
        WHERE legacy_user."twitchId" IS NOT NULL
          AND account."userId" <> legacy_user."id"
    ) THEN
        RAISE EXCEPTION 'Ambiguous Twitch identity: provider account belongs to another user';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "User" AS legacy_user
        JOIN "OAuthAccount" AS account
          ON account."provider" = 'TWITCH'::"OAuthProvider"
         AND account."userId" = legacy_user."id"
        WHERE legacy_user."twitchId" IS NOT NULL
          AND account."providerAccountId" <> legacy_user."twitchId"
    ) THEN
        RAISE EXCEPTION 'Ambiguous Twitch identity: user has divergent legacy and OAuth accounts';
    END IF;
END $$;

INSERT INTO "OAuthAccount" ("provider", "providerAccountId", "userId", "createdAt", "lastLoginAt")
SELECT
    'TWITCH'::"OAuthProvider",
    legacy_user."twitchId",
    legacy_user."id",
    legacy_user."createdAt",
    legacy_user."updatedAt"
FROM "User" AS legacy_user
WHERE legacy_user."twitchId" IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM "OAuthAccount" AS account
      WHERE account."provider" = 'TWITCH'::"OAuthProvider"
        AND (
            account."providerAccountId" = legacy_user."twitchId"
            OR account."userId" = legacy_user."id"
        )
  );

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "User" AS legacy_user
        WHERE legacy_user."twitchId" IS NOT NULL
          AND NOT EXISTS (
              SELECT 1
              FROM "OAuthAccount" AS account
              WHERE account."provider" = 'TWITCH'::"OAuthProvider"
                AND account."providerAccountId" = legacy_user."twitchId"
                AND account."userId" = legacy_user."id"
          )
    ) THEN
        RAISE EXCEPTION 'OAuthAccount Twitch backfill verification failed';
    END IF;
END $$;
