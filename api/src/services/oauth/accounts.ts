import database from "@/services/database";
import type { OAuthProfile } from "@/services/oauth";
import { OAuthProvider, Prisma } from "@prisma/client";

const accountWhere = (provider: OAuthProvider, providerAccountId: string) => ({
    provider_providerAccountId: {
        provider,
        providerAccountId,
    },
});

const findAccountUser = (provider: OAuthProvider, providerAccountId: string) =>
    database.oAuthAccount.findUnique({
        where: accountWhere(provider, providerAccountId),
        include: { user: true },
    });

const touchAccount = async (provider: OAuthProvider, providerAccountId: string) => {
    const account = await database.oAuthAccount.update({
        where: accountWhere(provider, providerAccountId),
        data: { lastLoginAt: new Date() },
        include: { user: true },
    });
    return account.user;
};

const recoverConcurrentAccount = async (provider: OAuthProvider, providerAccountId: string, error: unknown) => {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    const account = await findAccountUser(provider, providerAccountId);
    if (!account) throw error;
    return touchAccount(provider, providerAccountId);
};

export const findOrCreateOAuthUser = async (provider: OAuthProvider, profile: OAuthProfile) => {
    const existing = await findAccountUser(provider, profile.providerAccountId);
    if (existing) return touchAccount(provider, profile.providerAccountId);

    if (provider === OAuthProvider.TWITCH) {
        const legacyUser = await database.user.findUnique({
            where: { twitchId: profile.providerAccountId },
        });
        if (legacyUser) {
            try {
                await database.oAuthAccount.create({
                    data: {
                        provider,
                        providerAccountId: profile.providerAccountId,
                        userId: legacyUser.id,
                        lastLoginAt: new Date(),
                    },
                });
                return legacyUser;
            } catch (error) {
                return recoverConcurrentAccount(provider, profile.providerAccountId, error);
            }
        }
    }

    try {
        return await database.user.create({
            data: {
                twitchId: provider === OAuthProvider.TWITCH ? profile.providerAccountId : null,
                name: profile.displayName,
                profileImage: profile.profileImage,
                color: profile.color,
                oauthAccounts: {
                    create: {
                        provider,
                        providerAccountId: profile.providerAccountId,
                        lastLoginAt: new Date(),
                    },
                },
            },
        });
    } catch (error) {
        return recoverConcurrentAccount(provider, profile.providerAccountId, error);
    }
};
