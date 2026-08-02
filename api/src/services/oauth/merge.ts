import logger from "@/config/logger";
import database from "@/services/database";
import { OAuthProvider, Prisma, UserRole } from "@prisma/client";

export type OAuthMergeErrorCode = "provider_conflict" | "stale";

export class OAuthMergeError extends Error {
    constructor(public readonly code: OAuthMergeErrorCode) {
        super(code);
        this.name = "OAuthMergeError";
    }
}

interface MergeOAuthUsersInput {
    targetUserId: string;
    sourceUserId: string;
    provider: OAuthProvider;
    providerAccountId: string;
    providerDisplayName: string;
    providerProfileImage: string;
}

const rolePriority: Record<UserRole, number> = {
    [UserRole.ANONYMOUS]: 0,
    [UserRole.USER]: 1,
    [UserRole.ADMIN]: 2,
};

const highestRole = (first: UserRole, second: UserRole) =>
    rolePriority[first] >= rolePriority[second] ? first : second;

const isSerializationFailure = (error: unknown) => {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
    if (error.code === "P2034") return true;
    const databaseCode = (error.meta as { code?: unknown } | undefined)?.code;
    return error.code === "P2010" && databaseCode === "40001";
};

const runMerge = async (
    tx: Prisma.TransactionClient,
    {
        targetUserId,
        sourceUserId,
        provider,
        providerAccountId,
        providerDisplayName,
        providerProfileImage,
    }: MergeOAuthUsersInput,
) => {
    await tx.$queryRaw(
        Prisma.sql`SELECT "id" FROM "User" WHERE "id" IN (${targetUserId}, ${sourceUserId}) ORDER BY "id" FOR UPDATE`,
    );
    await tx.$queryRaw(
        Prisma.sql`SELECT "provider", "providerAccountId" FROM "OAuthAccount" WHERE "userId" IN (${targetUserId}, ${sourceUserId}) ORDER BY "provider", "providerAccountId" FOR UPDATE`,
    );

    const identity = await tx.oAuthAccount.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
    });
    if (identity?.userId === targetUserId) {
        await tx.oAuthAccount.update({
            where: { provider_providerAccountId: { provider, providerAccountId } },
            data: { displayName: providerDisplayName, profileImage: providerProfileImage },
        });

        const target = await tx.user.findUnique({ where: { id: targetUserId } });
        if (!target) throw new OAuthMergeError("stale");
        if (target.primaryOAuthProvider === provider) {
            await tx.user.update({
                where: { id: targetUserId },
                data: {
                    name: providerDisplayName,
                    profileImage: providerProfileImage,
                },
            });
        }
        return { linkedAt: identity.createdAt, alreadyMerged: true };
    }
    if (!identity || identity.userId !== sourceUserId || targetUserId === sourceUserId) {
        throw new OAuthMergeError("stale");
    }

    const [target, source] = await Promise.all([
        tx.user.findUnique({ where: { id: targetUserId }, include: { oauthAccounts: true, review: true } }),
        tx.user.findUnique({ where: { id: sourceUserId }, include: { oauthAccounts: true, review: true } }),
    ]);
    if (!target || !source) throw new OAuthMergeError("stale");

    const targetProviders = new Set(target.oauthAccounts.map((account) => account.provider));
    const conflictingProviders = source.oauthAccounts
        .map((account) => account.provider)
        .filter((accountProvider) => targetProviders.has(accountProvider));
    if (conflictingProviders.length > 0) {
        logger.warn({
            msg: "OAuth user merge blocked by provider conflict",
            targetUserId,
            sourceUserId,
            providers: conflictingProviders,
        });
        throw new OAuthMergeError("provider_conflict");
    }

    await tx.oAuthAccount.update({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        data: { displayName: providerDisplayName, profileImage: providerProfileImage },
    });

    const transferCounts = {
        uploads: await tx.upload.count({ where: { userId: sourceUserId } }),
        albums: await tx.album.count({ where: { userId: sourceUserId } }),
        apiKeys: await tx.apiKey.count({ where: { userId: sourceUserId } }),
        oauthAccounts: source.oauthAccounts.length,
        posts: await tx.muralPost.count({ where: { userId: sourceUserId } }),
        votes: await tx.muralPostVote.count({ where: { userId: sourceUserId } }),
    };

    // Preserve the target user's review when both accounts have one.
    if (source.review) {
        if (target.review) {
            await tx.review.delete({ where: { id: source.review.id } });
        } else {
            await tx.review.update({ where: { id: source.review.id }, data: { userId: targetUserId } });
        }
    }

    // A duplicate vote has already contributed to the materialized post score.
    // Remove that contribution before keeping only the target user's vote.
    await tx.$executeRaw(
        Prisma.sql`
            UPDATE "MuralPost" AS post
            SET "upvotes" = post."upvotes" - duplicate."delta"
            FROM (
                SELECT source."postId",
                    SUM(CASE WHEN source."vote" = 'up' THEN 1 ELSE -1 END)::INTEGER AS "delta"
                FROM "MuralPostVote" AS source
                WHERE source."userId" = ${sourceUserId}
                  AND EXISTS (
                      SELECT 1 FROM "MuralPostVote" AS target
                      WHERE target."userId" = ${targetUserId}
                        AND target."postId" = source."postId"
                  )
                GROUP BY source."postId"
            ) AS duplicate
            WHERE post."id" = duplicate."postId"
        `,
    );
    await tx.$executeRaw(
        Prisma.sql`
            DELETE FROM "MuralPostVote" AS source
            USING "MuralPostVote" AS target
            WHERE source."userId" = ${sourceUserId}
              AND target."userId" = ${targetUserId}
              AND source."postId" = target."postId"
        `,
    );

    await tx.upload.updateMany({ where: { userId: sourceUserId }, data: { userId: targetUserId } });
    await tx.album.updateMany({ where: { userId: sourceUserId }, data: { userId: targetUserId } });
    await tx.apiKey.updateMany({ where: { userId: sourceUserId }, data: { userId: targetUserId } });
    await tx.muralPost.updateMany({ where: { userId: sourceUserId }, data: { userId: targetUserId } });
    await tx.muralPost.updateMany({ where: { approvedById: sourceUserId }, data: { approvedById: targetUserId } });
    await tx.muralPostVote.updateMany({ where: { userId: sourceUserId }, data: { userId: targetUserId } });
    await tx.muralCommunity.updateMany({ where: { createdById: sourceUserId }, data: { createdById: targetUserId } });

    await tx.$executeRaw(
        Prisma.sql`
            INSERT INTO "_AchievementToUser" ("A", "B")
            SELECT "A", ${targetUserId} FROM "_AchievementToUser" WHERE "B" = ${sourceUserId}
            ON CONFLICT DO NOTHING
        `,
    );
    await tx.$executeRaw(
        Prisma.sql`
            INSERT INTO "_moderators" ("A", "B")
            SELECT "A", ${targetUserId} FROM "_moderators" WHERE "B" = ${sourceUserId}
            ON CONFLICT DO NOTHING
        `,
    );
    await tx.$executeRaw(
        Prisma.sql`
            INSERT INTO "_members" ("A", "B")
            SELECT "A", ${targetUserId} FROM "_members" WHERE "B" = ${sourceUserId}
            ON CONFLICT DO NOTHING
        `,
    );

    // These arrays predate the Prisma relations, but may still contain user IDs.
    await tx.$executeRaw(
        Prisma.sql`
            UPDATE "Achievement" AS achievement
            SET "usersIds" = ARRAY(
                SELECT DISTINCT CASE WHEN value = ${sourceUserId} THEN ${targetUserId} ELSE value END
                FROM unnest(achievement."usersIds") AS value
            )
            WHERE ${sourceUserId} = ANY(achievement."usersIds")
        `,
    );
    await tx.$executeRaw(
        Prisma.sql`
            UPDATE "MuralCommunity" AS community
            SET "moderatorIds" = ARRAY(
                    SELECT DISTINCT CASE WHEN value = ${sourceUserId} THEN ${targetUserId} ELSE value END
                    FROM unnest(community."moderatorIds") AS value
                ),
                "memberIds" = ARRAY(
                    SELECT DISTINCT CASE WHEN value = ${sourceUserId} THEN ${targetUserId} ELSE value END
                    FROM unnest(community."memberIds") AS value
                )
            WHERE ${sourceUserId} = ANY(community."moderatorIds")
               OR ${sourceUserId} = ANY(community."memberIds")
        `,
    );

    await tx.oAuthAccount.updateMany({ where: { userId: sourceUserId }, data: { userId: targetUserId } });
    await tx.user.update({
        where: { id: targetUserId },
        data: {
            sessions: [...new Set([...target.sessions, ...source.sessions])],
            uploadCount: target.uploadCount + source.uploadCount,
            createdAt: target.createdAt < source.createdAt ? target.createdAt : source.createdAt,
            role: highestRole(target.role, source.role),
        },
    });
    await tx.user.delete({ where: { id: sourceUserId } });

    return { linkedAt: identity.createdAt, alreadyMerged: false, transferCounts };
};

export const mergeOAuthUsers = async (input: MergeOAuthUsersInput) => {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            const result = await database.$transaction((tx) => runMerge(tx, input), {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            });
            logger.info({
                msg: result.alreadyMerged ? "OAuth user merge already completed" : "OAuth users merged",
                targetUserId: input.targetUserId,
                sourceUserId: input.sourceUserId,
                provider: input.provider,
                transferCounts: "transferCounts" in result ? result.transferCounts : undefined,
            });
            return result;
        } catch (error) {
            if (!isSerializationFailure(error) || attempt === maxAttempts) throw error;
            logger.warn({
                msg: "Retrying OAuth user merge after serialization conflict",
                targetUserId: input.targetUserId,
                sourceUserId: input.sourceUserId,
                provider: input.provider,
                attempt,
            });
        }
    }
    throw new OAuthMergeError("stale");
};
