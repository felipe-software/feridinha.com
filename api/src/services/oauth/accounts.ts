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

const touchAccount = (provider: OAuthProvider, profile: OAuthProfile) =>
    database.$transaction(async (tx) => {
        const account = await tx.oAuthAccount.update({
            where: accountWhere(provider, profile.providerAccountId),
            data: {
                displayName: profile.displayName,
                profileImage: profile.profileImage,
                lastLoginAt: new Date(),
            },
            include: { user: true },
        });
        if (account.user.primaryOAuthProvider !== provider) return account.user;

        return tx.user.update({
            where: { id: account.userId },
            data: {
                name: profile.displayName,
                profileImage: profile.profileImage,
            },
        });
    });

const recoverConcurrentAccount = async (provider: OAuthProvider, profile: OAuthProfile, error: unknown) => {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    const account = await findAccountUser(provider, profile.providerAccountId);
    if (!account) throw error;
    return touchAccount(provider, profile);
};

export const findOrCreateOAuthUser = async (provider: OAuthProvider, profile: OAuthProfile) => {
    const existing = await findAccountUser(provider, profile.providerAccountId);
    if (existing) return touchAccount(provider, profile);

    try {
        return await database.user.create({
            data: {
                name: profile.displayName,
                profileImage: profile.profileImage,
                primaryOAuthProvider: provider,
                color: profile.color,
                oauthAccounts: {
                    create: {
                        provider,
                        providerAccountId: profile.providerAccountId,
                        displayName: profile.displayName,
                        profileImage: profile.profileImage,
                        lastLoginAt: new Date(),
                    },
                },
            },
        });
    } catch (error) {
        return recoverConcurrentAccount(provider, profile, error);
    }
};
